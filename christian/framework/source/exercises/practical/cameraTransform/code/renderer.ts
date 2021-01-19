import {
    Camera,
    ChangeLookup,
    Context,
    DefaultFramebuffer,
    EventProvider,
    GLTFLoader,
    Invalidate,
    Renderer,
    mat4,
    vec3,
} from 'webgl-operate';

import {
    getAngleAdjustment,
    getLookAt,
    getPerspectiveTransform,
    getScaling
} from './transformation';

import { CameraGeometry } from './cameraGeometry';
import { Controls } from '../../../../common/code/uiHelper';
import { FrustumGeometry } from './frustumGeometry';
import { LinePass } from './linePass';
import { ModelPass } from './modelPass';
import { OriginGeometry } from './originGeometry';
import { ZoomNavigation } from '../../../../common/code/zoom';

const modes = [
    'Original',
    'LookAt',
    'Winkeländerung des Sichtvolumens',
    'Skalierung des Sichtvolumens',
    'Perspektivische Transformation',
    'Clipping'
];
export class CameraTransformRenderer extends Renderer {
    protected readonly _altered = Object.assign(new ChangeLookup(), {
        any: false,
        multiFrameNumber: false,
        frameSize: false,
        canvasSize: false,
        framePrecision: false,
        clearColor: false,
        debugTexture: false,
        model: false,
        mode: false
    });

    protected readonly _observedEye = vec3.fromValues(0, 1, 2);
    protected readonly _observedCenter = vec3.fromValues(0, 0, 0);
    protected readonly _observedUp = vec3.fromValues(0, 1, 0);
    protected readonly _observedAspect = 4 / 3;
    protected readonly _observedFovY = 75;
    protected readonly _observedNear = 1;
    protected readonly _observedFar = 3;

    protected readonly _frustumColor = vec3.fromValues(0.8, 0.8, 0.8);
    protected readonly _cameraColor = vec3.fromValues(0.2, 0.8, 0.2);
    protected readonly _originColor = vec3.fromValues(0.8, 0.0, 0.8);

    protected _context: Context;
    protected _gl: WebGL2RenderingContext;

    protected _fbo: DefaultFramebuffer;

    protected _frustumPass: LinePass;
    protected _cameraPass: LinePass;
    protected _originPass: LinePass;
    protected _modelPass: ModelPass;

    protected _observedCamera: Camera;
    protected _observerCamera: Camera;
    protected _navigation: ZoomNavigation;

    protected _controls: Controls;

    protected _mode: number;

    protected onInitialize(
        context: Context,
        callback: Invalidate,
        eventProvider: EventProvider
    ): boolean {
        this._context = context;
        this._gl = context.gl as WebGL2RenderingContext;

        let valid = true;

        this._fbo = new DefaultFramebuffer(context);
        valid &&= this._fbo.initialize();

        this._observedCamera = new Camera(
            this._observedEye,
            this._observedCenter,
            this._observedUp);
        this._observedCamera.aspect = this._observedAspect;
        this._observedCamera.fovy = this._observedFovY;
        this._observedCamera.near = this._observedNear;
        this._observedCamera.far = this._observedFar;

        this._observerCamera = new Camera(
            vec3.fromValues(1, 0, 0),
            vec3.fromValues(0, 0, 0),
            vec3.fromValues(0, 1, 0));
        this._observerCamera.near = 0.1;
        this._observerCamera.far = 100;

        this._navigation = new ZoomNavigation(
            callback,
            eventProvider,
            { default: 1.0, min: 0.12, max: 10.0 }
        );
        this._navigation.camera = this._observerCamera;
        this._navigation.updateZoomFromEye();

        this._frustumPass = new LinePass(context);
        valid &&= this._frustumPass.initialize(
            new FrustumGeometry(this._context), this._observedCamera);
        this._frustumPass.target = this._fbo;
        this._frustumPass.lineColor = this._frustumColor;

        this._cameraPass = new LinePass(context);
        valid &&= this._cameraPass.initialize(
            new CameraGeometry(this._context), this._observedCamera);
        this._cameraPass.target = this._fbo;
        this._cameraPass.lineColor = this._cameraColor;

        this._originPass = new LinePass(context);
        valid &&= this._originPass.initialize(
            new OriginGeometry(this._context), undefined);
        this._originPass.target = this._fbo;
        this._originPass.lineColor = this._originColor;
        this._originPass.observedTransform = mat4.create();

        this._modelPass = new ModelPass(this._context);
        this._modelPass.initialize();
        this._modelPass.camera = this._observerCamera;
        this._modelPass.target = this._fbo;
        this.loadAsset();

        this._controls = new Controls();

        const modeSelect = this._controls.createSelectListInput(
            'Anzeigemodus', modes);
        modeSelect.addEventListener('change', () => {
            this._mode = modeSelect.selectedIndex;
            this._altered.alter('mode');
            this.invalidate();
        });
        this._mode = modeSelect.selectedIndex;
        this._altered.alter('mode');

        return valid;
    }

    protected onUninitialize(): void {
        super.uninitialize();

        this._frustumPass.uninitialize();
        this._cameraPass.uninitialize();
        this._originPass.uninitialize();
        this._modelPass.uninitialize();
        this._fbo.uninitialize();
    }

    protected onDiscarded(): void { }

    protected onUpdate(): boolean {
        this._navigation.update();

        return this._altered.any ||
            this._frustumPass.altered ||
            this._cameraPass.altered ||
            this._originPass.altered;
    }

    protected onPrepare(): void {
        if (this._altered.frameSize) {
            this._observerCamera.viewport =
                [this._frameSize[0], this._frameSize[1]];
        }

        if (this._altered.canvasSize) {
            this._observerCamera.aspect =
                this._canvasSize[0] / this._canvasSize[1];
        }

        if (this._altered.clearColor) {
            this._fbo.clearColor(this._clearColor);
        }

        if (this._observerCamera.altered) {
            this._frustumPass.observerTransform =
                this._observerCamera.viewProjection;
            this._cameraPass.observerTransform =
                this._observerCamera.viewProjection;
            this._originPass.observerTransform =
                this._observerCamera.viewProjection;
        }

        if (this._altered.mode) {
            const m = mat4.create();
            if (this._mode >= 1)
                mat4.mul(m, getLookAt(this._observedCamera), m);
            if (this._mode >= 2)
                mat4.mul(m, getAngleAdjustment(this._observedCamera), m);
            if (this._mode >= 3)
                mat4.mul(m, getScaling(this._observedCamera), m);
            if (this._mode >= 4)
                mat4.mul(m, getPerspectiveTransform(this._observedCamera), m);

            this._frustumPass.observedTransform = m;
            this._cameraPass.observedTransform = m;
            this._modelPass.observedTransform = m;

            this._modelPass.enableClipping = this._mode >= 5;
        }

        this._frustumPass.prepare();
        this._cameraPass.prepare();
        this._originPass.prepare();
        this._modelPass.prepare();

        this._observedCamera.altered = false;
        this._observerCamera.altered = false;
    }

    protected onFrame(): void {
        this._fbo.clear(this._gl.COLOR_BUFFER_BIT);
        this._gl.viewport(0, 0, this._canvasSize[0], this._canvasSize[1]);
        this._originPass.frame();
        if (this._mode < 4)
            this._cameraPass.frame();
        this._frustumPass.frame();
        this._modelPass.frame();
    }

    protected onSwap(): void {
    }

    protected loadAsset(): void {
        const loader = new GLTFLoader(this._context);
        loader.loadAsset(
            'models/exercises/practical/cameraTransform/models/clippy.glb')
            .then(() => {
                this._modelPass.scene = loader.defaultScene;
                this._altered.alter('model');
                this.invalidate();
            });
    }

    public get contextAttributes(): WebGLContextAttributes {
        return {
            premultipliedAlpha: false
        };
    }
}
