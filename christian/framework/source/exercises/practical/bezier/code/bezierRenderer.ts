import {
    BezierCurve,
    Lookup,
    Model
} from './types';

import {
    Camera,
    ChangeLookup,
    Context,
    DefaultFramebuffer,
    EventHandler,
    EventProvider,
    Framebuffer,
    GLTFLoader,
    Invalidate,
    Renderer,
    vec3
} from 'webgl-operate';

import {
    prepareDistLookup,
    sampleEquiDist,
    sampleNaive
} from './bezier';

import { Controls } from '../../../../common/code/uiHelper';
import { ModelPass } from './modelPass';
import { PlotGeometry } from './plotGeometry';
import { PlotPass } from './plotPass';
import { ZoomNavigation } from '../../../../common/code/zoom';
import { randomBezier } from './random';

enum RenderMode {
    ThirdPerson = 'Übersicht',
    FirstPerson = 'Kamerafahrt',
}

enum SampleMode {
    Naive = 'Naiv',
    Equidistant = 'Gleicher Abstand',
}

export class BezierRenderer extends Renderer {
    protected readonly _altered = Object.assign(new ChangeLookup(), {
        any: false,
        multiFrameNumber: false,
        frameSize: false,
        canvasSize: false,
        framePrecision: false,
        clearColor: false,
        debugTexture: false,
        renderMode: false,
        sampleMode: false,
        animation: false,
        animationSpeed: false,
        curves: false
    });

    protected readonly _animFps = 120;
    protected readonly _lookupRes = 100;
    protected readonly _curveRes = 100;
    protected readonly _curveColor = vec3.fromValues(0.0, 0.0, 0.0);
    protected readonly _handleColor = vec3.fromValues(0.0, 0.0, 0.8);

    protected _context: Context;
    protected _gl: WebGL2RenderingContext;

    protected _fbo: Framebuffer;
    protected _modelPass: ModelPass;

    protected _camera: Camera;
    protected _navigation: ZoomNavigation;
    protected _eventHandler: EventHandler;

    protected _controls: Controls;

    protected _sampleMode: SampleMode;
    protected _renderMode: RenderMode;

    protected _models: Model[] = [
        require('../data/village.json'),
        require('../data/xmas.json'),
        require('../data/waterfall.json')
    ];
    protected _model = 0;

    protected _bezierGeom: PlotGeometry;
    protected _handleGeom: PlotGeometry;
    protected _linePass: PlotPass;
    protected _pointPass: PlotPass;

    protected _curves: BezierCurve[];
    protected _lookup: Lookup;

    protected _animProgress: number;
    protected _animProgressInput: HTMLInputElement;
    protected _animSpeed: number;
    protected _animSpeedAdjusted: number;

    /**
     * Calculates the position on the curve using the correct sampling function.
     * @param t Interpolation factor from 0 to 1.
     * @returns The calculated position.
     */
    protected getBezierPosition(t: number): vec3 {
        if (this._sampleMode === SampleMode.Naive) {
            return sampleNaive(this._curves, t);
        } else {
            return sampleEquiDist(this._curves, this._lookup, t);
        }
    }

    /**
     * Resets the camera when switching to third person.
     * @param bounds Bounding box of the important part of the scene.
     */
    protected resetCameraThirdPerson(): void {
        const { x, y, z } = this._models[this._model].bounds;
        const center = vec3.fromValues(
            (x[0] + x[1]) / 2, y[0] * 0.7 + y[1] * 0.3, (z[0] + z[1]) / 2);
        this._camera.center = center;
        const corner = vec3.fromValues(x[1], y[1], z[1]);
        const toCorner = vec3.sub(vec3.create(), corner, center);
        this._camera.eye =
            vec3.scaleAndAdd(vec3.create(), center, toCorner, 1.5);
        this._navigation.updateZoomFromEye();
        this._camera.up = vec3.fromValues(0, 1, 0);
    }

    /**
     * Updates the camera for first person view, following the bezier curves.
     */
    protected updateCameraFirstPerson(): void {
        this._camera.eye = this.getBezierPosition(this._animProgress);
        this._camera.center =
            this.getBezierPosition((this._animProgress + 0.01) % 1);
        this._camera.up = vec3.fromValues(0, 1, 0);
    }
    /**
     * Initializes and sets up rendering passes, loads a font face
     * and links shaders with program.
     * @param context - valid context to create the object for.
     * @param identifier - meaningful name for identification of this instance.
     * @param eventProvider - required for mouse interaction
     * @returns - whether initialization was successful
     */
    protected onInitialize(
        context: Context,
        callback: Invalidate,
        eventProvider: EventProvider
    ): boolean {
        this._context = context;
        this._gl = context.gl as WebGL2RenderingContext;

        this._fbo = new DefaultFramebuffer(this._context, 'DefaultFBO');
        this._fbo.initialize();

        this._camera = new Camera();

        this._modelPass = new ModelPass(context);
        this._modelPass.initialize();
        this._modelPass.camera = this._camera;
        this._modelPass.target = this._fbo;

        const vertexLocation = 0;

        this._bezierGeom = new PlotGeometry(context);
        this._bezierGeom.initialize(vertexLocation);

        this._handleGeom = new PlotGeometry(context);
        this._handleGeom.initialize(vertexLocation);

        this._linePass = new PlotPass(context);
        this._linePass.initialize(vertexLocation, require('./line.frag'));
        this._linePass.target = this._fbo;
        this._linePass.transform = this._camera.viewProjection;

        this._pointPass = new PlotPass(context);
        this._pointPass.initialize(vertexLocation, require('./point.frag'));
        this._pointPass.target = this._fbo;
        this._pointPass.transform = this._camera.viewProjection;

        this._navigation = new ZoomNavigation(
            callback,
            eventProvider,
            { default: 1.0, min: 0.12, max: 10.0 }
        );
        this._navigation.camera = this._camera;

        this.setupControls();

        return true;
    }

    /**
     * Adds all the controls next to the canvas.
     */
    protected setupControls(): void {
        // controls
        this._controls = new Controls();

        // model selection
        const modelSelectList = this._controls.createSelectListInput(
            'Szene', this._models.map((entry) => entry.name));
        modelSelectList.addEventListener('change', () => {
            this._model = modelSelectList.selectedIndex;
            this.loadAsset();
        });
        this._model = modelSelectList.selectedIndex;
        this.loadAsset();

        // sample mode
        const sampleModeInput = this._controls.createSelectListInput(
            'Sampling', [SampleMode.Naive, SampleMode.Equidistant]);
        sampleModeInput.addEventListener('change', () => {
            this._sampleMode = sampleModeInput.value as SampleMode;
            this._altered.alter('sampleMode');
            this.invalidate();
        });
        this._sampleMode = sampleModeInput.value as SampleMode;

        // camera mode
        const cameraModeInput = this._controls.createSelectListInput(
            'Perspektive', [RenderMode.ThirdPerson, RenderMode.FirstPerson]);
        cameraModeInput.addEventListener('change', () => {
            this._renderMode = cameraModeInput.value as RenderMode;
            if (this._renderMode === RenderMode.ThirdPerson) {
                this.resetCameraThirdPerson();
            } else {
                this.updateCameraFirstPerson();
            }
            this._altered.alter('renderMode');
            this.invalidate();
        });
        this._renderMode = cameraModeInput.value as RenderMode;

        // animation progress
        this._animProgressInput = this._controls.createSliderInput(
            'Animationsfortschritt', undefined, 0, undefined, 0, 1, 0.001);
        this._animProgressInput.addEventListener('input', () => {
            this._animProgress = Number(this._animProgressInput.value);
            this._altered.alter('animation');
            this.invalidate();
        });
        this._animProgress = Number(this._animProgressInput.value);

        // animation speed
        const animSpeedInput = this._controls.createSliderInput(
            'Geschwindigkeit', undefined, 5, undefined, 0, 15, 0.1);
        animSpeedInput.addEventListener('input', () => {
            this._animSpeed = Number(animSpeedInput.value);
            this._altered.alter('animationSpeed');
            this.invalidate();
        });
        this._animSpeed = Number(animSpeedInput.value);
        this._altered.alter('animationSpeed');

        // play/pause
        const playPause = this._controls.createActionButton('Play/Pause');
        const animInfo = {
            direction: 1,
            handle: undefined as number,
        };
        const anim = (): void => {
            this._animProgress += this._animSpeedAdjusted;
            this._animProgress %= 1;
            this._animProgressInput.value = this._animProgress.toString();
            this._altered.alter('animation');
            this.invalidate();
        };
        playPause.addEventListener('click', () => {
            if (animInfo.handle) {
                window.clearInterval(animInfo.handle);
                animInfo.handle = undefined;
            } else {
                animInfo.handle = window.setInterval(anim, 1000 / 60);
            }
        });

        // button for resetting curves
        const defaultBezierButton =
            this._controls.createActionButton('Standard-Kurven');
        defaultBezierButton.addEventListener('click', () => {
            this._curves = this._models[this._model].defaultCurves;
            this._altered.alter('curves');
            this.invalidate();
        });

        // button for randomizing curves
        const randomBezierButton =
            this._controls.createActionButton('Zufällige Kurven');
        randomBezierButton.addEventListener('click', () => {
            this._curves = randomBezier(
                this._models[this._model].bounds,
                Number(randomBezierCountInput.value));
            this._altered.alter('curves');
            this.invalidate();
        });

        // number of random curves generated
        const randomBezierCountInput = this._controls.createSliderInput(
            'Anzahl der generierten Handles',
            undefined, 3, undefined, 2, 10, 1);

        // fov
        const fovInput = this._controls.createSliderInput(
            'Kamera: field of view', undefined, 70, undefined, 10, 179, 1);
        fovInput.addEventListener('input', () => {
            this._camera.fovy = Number(fovInput.value);
            this.invalidate();
        });
        this._camera.fovy = Number(fovInput.value);
    }


    protected onUninitialize(): void {
        super.uninitialize();
    }

    protected onUpdate(): boolean {
        if (this._renderMode === RenderMode.ThirdPerson) {
            this._navigation.update();
        }

        if (this._altered.frameSize) {
            this._camera.viewport = [this._frameSize[0], this._frameSize[1]];
        }

        if (this._altered.canvasSize) {
            this._camera.aspect = this._canvasSize[0] / this._canvasSize[1];
        }

        if (this._altered.clearColor) {
            this._gl.clearColor(...this._clearColor);
        }

        if (this._altered.curves) {
            this._lookup = prepareDistLookup(this._curves, this._lookupRes);
        }

        if (this._altered.renderMode || this._altered.curves) {
            const planes = this._renderMode === RenderMode.FirstPerson ?
                this._models[this._model].fpPlanes :
                this._models[this._model].tpPlanes;
            this._camera.near = planes.near;
            this._camera.far = planes.far;
        }

        if (this._altered.sampleMode || this._altered.curves) {
            this._bezierGeom.positions = Array.from(
                { length: this._curveRes },
                (_, i) => this.getBezierPosition(i / (this._curveRes - 1))
            );
            this._handleGeom.positions = Array.from(
                { length: this._curves.length * 4 },
                (_, i) => this._curves[Math.floor(i / 4)][i % 4]
            );
        }

        if (this._altered.animationSpeed || this._altered.curves) {
            const lengthValid = this._lookup?.totalLength > 0;
            const length = lengthValid ? this._lookup.totalLength : 50;
            const roundTripTime = length / this._animSpeed;
            const frameTime = 1 / this._animFps;
            this._animSpeedAdjusted = frameTime / roundTripTime ?? 0;
        }

        if ((this._altered.animation || this._altered.sampleMode) &&
            this._renderMode === RenderMode.FirstPerson
        ) {
            this.updateCameraFirstPerson();
        }

        if (this._camera.altered) {
            this._linePass.transform = this._camera.viewProjection;
            this._pointPass.transform = this._camera.viewProjection;
        }

        this._modelPass.update();

        return this._altered.any || this._camera.altered;
    }

    protected onPrepare(): void {
        this._modelPass.prepare();
        this._linePass.prepare();
        this._pointPass.prepare();

        this._altered.reset();
        this._camera.altered = false;
    }

    protected onFrame(): void {
        this._fbo.clear(this._gl.COLOR_BUFFER_BIT);
        this._gl.viewport(0, 0, this._canvasSize[0], this._canvasSize[1]);

        this._modelPass.frame();

        if (this._renderMode === RenderMode.ThirdPerson) {
            this._linePass.frame(
                this._bezierGeom, this._curveColor, this._gl.LINE_LOOP);
            this._pointPass.frame(
                this._bezierGeom, this._curveColor, this._gl.POINTS);

            this._linePass.frame(
                this._handleGeom, this._handleColor, this._gl.LINES);
            this._pointPass.frame(
                this._handleGeom, this._handleColor, this._gl.POINTS);
        }
    }

    protected onDiscarded(): void { }

    /**
     * Load asset from URI specified by the HTML select
     */
    protected loadAsset(): void {
        const m = this._models[this._model];
        const loader = new GLTFLoader(this._context);
        loader.loadAsset(m.uri)
            .then(() => {
                this._modelPass.scene = loader.defaultScene;
                this._curves = m.defaultCurves;
                if (this._renderMode === RenderMode.ThirdPerson) {
                    this.resetCameraThirdPerson();
                }
                this._camera.near;
                this._altered.alter('curves');
                this.invalidate();
            });
    }

    public get contextAttributes(): WebGLContextAttributes {
        return {
            alpha: false,
        };
    }
}
