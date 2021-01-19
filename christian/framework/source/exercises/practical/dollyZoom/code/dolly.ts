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
    vec2,
    vec3,
} from 'webgl-operate';

import { Controls } from '../../../../common/code/uiHelper';
import { ModelPass } from './modelPass';
import { Rotation } from './rotation';
import { clamp } from './clamp';
import { updateCamera } from './updateCamera';
export class DollyZoomRenderer extends Renderer {
    protected readonly _altered = Object.assign(new ChangeLookup(), {
        any: false,
        multiFrameNumber: false,
        frameSize: false,
        canvasSize: false,
        framePrecision: false,
        clearColor: false,
        debugTexture: false,
        model: false,
        camera: false
    });

    protected _fbo: Framebuffer;
    protected _modelPass: ModelPass;

    protected _camera: Camera;

    protected _rotation = { longitude: 0, latitude: 0 } as Rotation;
    protected _eventHandler: EventHandler;
    protected _startPoint: vec2;
    protected _navSensitivity: number;

    protected _controls: Controls;

    protected _models = [
        {
            name: 'Minecraft-Dorf',
            uri: 'models/common/village.glb',
            viewTarget: vec3.fromValues(-2.47382, 2.55654, -4.32813),
        },
        {
            name: 'Weihnachtsdorf',
            uri: 'models/common/xmasVillage.glb',
            viewTarget: vec3.fromValues(-1.49249, 1.55078, 3.05065),
        },
        {
            name: 'Wasserfall',
            uri: 'models/common/waterfall.glb',
            viewTarget: vec3.fromValues(12.4087, 1.54922, -11.9754),
        },
    ];
    protected _model = 0;

    protected _interpolateFactor = 0;
    protected _focalWidth = 0;
    protected _minDist = 0;
    protected _maxDist = 0;

    protected onMouseDown(events: Array<MouseEvent>): void {
        const event = events[events.length - 1];
        this._startPoint = this._eventHandler.offsets(event)[0];
    }

    protected onMouseMove(events: Array<MouseEvent>): void {
        if (this._startPoint === undefined) {
            return;
        }
        const event: MouseEvent = events[events.length - 1];
        const point = this._eventHandler.offsets(event)[0];

        const diff = vec2.subtract(vec2.create(), point, this._startPoint);
        vec2.scale(diff, diff, window.devicePixelRatio * this._navSensitivity);

        this._rotation.longitude -= diff[0];
        this._rotation.longitude = this._rotation.longitude % (Math.PI * 2);
        this._rotation.latitude -= diff[1];
        const hPi = Math.PI / 2;
        this._rotation.latitude = clamp(this._rotation.latitude, -hPi, hPi);

        this._altered.alter('camera');

        this._startPoint = point;
    }

    protected onMouseUp(): void {
        this._startPoint = undefined;
    }

    protected setupControls(): void {
        // controls
        this._controls = new Controls();

        // model selection
        const modelSelect = this._controls.createSelectListInput(
            'Modell', this._models.map((entry) => entry.name));
        modelSelect.addEventListener('change', () => {
            this._model = modelSelect.selectedIndex;
            this.loadAsset();
        });
        this._model = modelSelect.selectedIndex;

        // interpolation factor
        const interpolateInput = this._controls.createSliderInput(
            'Interpolationsfaktor', undefined, 0, undefined, 0, 1, 0.005);
        interpolateInput.addEventListener('input', () => {
            this._interpolateFactor = Number(interpolateInput.value);
            this._altered.alter('camera');
            this.invalidate();
        });
        this._interpolateFactor = Number(interpolateInput.value);

        // play/pause
        const playPause = this._controls.createActionButton('Play/Pause');
        const animInfo = {
            direction: 1,
            handle: undefined as number,
        };
        const step = (): void => {
            if (animInfo.direction === 1) {
                interpolateInput.stepUp();
            } else {
                interpolateInput.stepDown();
            }
        };
        const anim = (): void => {
            const oldPos = interpolateInput.value;
            step();
            const newPos = interpolateInput.value;
            if (oldPos === newPos) {
                animInfo.direction *= -1;
                step();
            }
            this._interpolateFactor = Number(interpolateInput.value);
            this._altered.alter('camera');
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

        // focal plane width
        const widthInput = this._controls.createSliderInput(
            'Größe des Fokusbereichs', undefined, 2, undefined, 0.5, 5, 0.05);
        widthInput.addEventListener('input', () => {
            this._focalWidth = Number(widthInput.value);
            this._altered.alter('camera');
            this.invalidate();
        });
        this._focalWidth = Number(widthInput.value);

        // minimum distance
        const minDistInput = this._controls.createSliderInput(
            'Minimalabstand', undefined, 1.0, undefined, 0.5, 10, 0.1);
        minDistInput.addEventListener('input', () => {
            this._minDist = Number(minDistInput.value);
            this._altered.alter('camera');
            this.invalidate();
        });
        this._minDist = Number(minDistInput.value);

        // maximum distance
        const maxDistInput = this._controls.createSliderInput(
            'Maximalabstand', undefined, 15, undefined, 10.5, 20, 0.1);
        maxDistInput.addEventListener('input', () => {
            this._maxDist = Number(maxDistInput.value);
            this._altered.alter('camera');
            this.invalidate();
        });
        this._maxDist = Number(maxDistInput.value);

        this._altered.alter('camera');
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
        invalidate: Invalidate,
        eventProvider: EventProvider
    ): boolean {
        this._fbo = new DefaultFramebuffer(this._context, 'DefaultFBO');
        this._fbo.initialize();

        // Create and configure camera.
        this._camera = new Camera();
        this._camera.near = 0.1;
        this._camera.far = 64.0;

        // Create and configure render pass
        this._modelPass = new ModelPass(context);
        this._modelPass.initialize();
        this._modelPass.camera = this._camera;
        this._modelPass.target = this._fbo;

        // Navigation
        this._eventHandler = new EventHandler(invalidate, eventProvider);
        this._eventHandler.pushMouseDownHandler(this.onMouseDown.bind(this));
        this._eventHandler.pushMouseMoveHandler(this.onMouseMove.bind(this));
        this._eventHandler.pushMouseUpHandler(this.onMouseUp.bind(this));
        this._eventHandler.pushMouseLeaveHandler(this.onMouseUp.bind(this));
        this._navSensitivity = 0.002;

        // Set up controls
        this.setupControls();

        this.loadAsset();

        return true;
    }

    /**
     * Clean up.
     */
    protected onUninitialize(): void {
        super.uninitialize();

        this._modelPass.uninitialize();
        this._fbo.uninitialize();
    }

    /**
     * This is invoked in order to check if rendering of a frame is required by
     * means of implementation specific evaluation (e.g., lazy non continuous
     * rendering). Regardless of the return value a new frame (preparation,
     * frame, swap) might be invoked anyway, e.g., when update is forced or
     * canvas or context properties have changed or the renderer was invalidated
     * @see{@link invalidate}.
     * Updates the AntiAliasingKernel.
     * @returns whether to redraw
     */
    protected onUpdate(): boolean {
        this._eventHandler.update();
        this._modelPass.update();

        return this._altered.any || this._camera.altered;
    }

    /**
     * This is invoked in order to prepare rendering of one or more frames,
     * regarding multi-frame rendering and camera-updates.
     */
    protected onPrepare(): void {
        if (this._altered.frameSize) {
            this._camera.viewport = [this._frameSize[0], this._frameSize[1]];
        }

        if (this._altered.canvasSize) {
            this._camera.aspect = this._canvasSize[0] / this._canvasSize[1];
        }

        if (this._altered.clearColor) {
            this._modelPass.clearColor = this._clearColor;
        }

        if (this._altered.camera || this._altered.model) {
            updateCamera(
                this._models[this._model].viewTarget,
                this._rotation,
                this._minDist,
                this._maxDist,
                this._interpolateFactor,
                this._focalWidth,
                this._camera
            );
        }

        this._modelPass.prepare();

        this._altered.reset();
        this._camera.altered = false;
    }

    /**
     * Renders a new frame.
     */
    protected onFrame(): void {
        this._modelPass.frame();
    }

    protected onSwap(): void {
    }

    /**
     * Load asset from URI specified by the HTML select
     */
    protected loadAsset(): void {
        const m = this._models[this._model];
        const loader = new GLTFLoader(this._context);
        loader.loadAsset(m.uri)
            .then(() => {
                this._modelPass.scene = loader.defaultScene;
                this._altered.alter('model');
                this.invalidate();
            });
    }

    protected onDiscarded(): void {
    }

    public get contextAttributes(): WebGLContextAttributes {
        return {
            alpha: false,
        };
    }
}
