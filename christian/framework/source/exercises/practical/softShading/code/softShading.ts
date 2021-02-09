import {
    Camera,
    Color,
    Context,
    DefaultFramebuffer,
    EventProvider,
    Invalidate,
    Navigation,
    Program,
    Renderer,
    Shader,
} from 'webgl-operate';

import {
    mat4,
    vec3
} from 'gl-matrix';

import { Controls } from '../../../../common/code/uiHelper';
import { HalfEdgeGeometry } from './halfEdgeGeometry';
import { ZoomNavigation } from '../../../../common/code/zoom';

export class SoftShadingRenderer extends Renderer {
    protected static readonly MIN_ANGLE = 0;
    protected static readonly MAX_ANGLE = 180;
    protected static readonly ANGLE_RESOLUTION = 1;
    protected static readonly DEFAULT_ANGLE = 30;

    protected _camera: Camera;
    protected _navigation: Navigation;

    protected _program: Program;
    protected _uEye: WebGLUniformLocation;
    protected _uViewProjection: WebGLUniformLocation;

    protected _lightDir: number[] = [1.0, 1.0, 0.97];
    protected _uLightDir: WebGLUniformLocation;

    protected _controls: Controls;
    protected _colorValue: number[];
    protected _uColor: WebGLUniformLocation;

    protected _defaultFBO: DefaultFramebuffer;

    protected _geometry: HalfEdgeGeometry;

    protected _thresholdAngle = (
        SoftShadingRenderer.DEFAULT_ANGLE / 180.0 * Math.PI
    );

    protected _models = [
        {
            name: 'Schraube',
            stl: require('../models/screw.stl').default as string,
        },
        {
            name: 'Würfel',
            stl: require('../models/cube.stl').default as string,
        },
        {
            name: 'Wirklich ein Würfel',
            stl: require('../models/real_cube.stl').default as string,
        },
    ];

    /**
     * Initializes and sets up buffer, cube geometry, camera and links shaders
     * with program.
     * @param context - valid context to create the object for.
     * @param identifier - meaningful name for identification of this instance.
     * @param eventProvider - required for mouse interaction
     * @returns - whether initialization was successful
     */
    protected onInitialize(
        context: Context,
        callback: Invalidate,
        eventProvider: EventProvider): boolean {

        this._defaultFBO = new DefaultFramebuffer(context, 'DefaultFBO');
        this._defaultFBO.initialize();
        this._defaultFBO.bind();

        const gl = context.gl;

        const geometry = new HalfEdgeGeometry(context);
        geometry.initialize();
        this._geometry = geometry;

        const vert = new Shader(context, gl.VERTEX_SHADER,
            'softShading.vert');
        vert.initialize(require('./softShading.vert'));
        const frag = new Shader(context, gl.FRAGMENT_SHADER,
            'softShading.frag');
        frag.initialize(require('./softShading.frag'));

        this._program = new Program(context, 'CubeProgram');
        this._program.initialize([vert, frag], false);

        this._program.attribute('a_vertex', geometry.vertexLocation);
        this._program.attribute('a_normal', geometry.normalLocation);
        this._program.link();
        this._program.bind();

        this._uEye = this._program.uniform('u_eye');
        this._uViewProjection = this._program.uniform('u_viewProjection');
        const identity = mat4.identity(mat4.create());
        gl.uniformMatrix4fv(
            this._program.uniform('u_model'), gl.FALSE, identity);
        this._uColor = this._program.uniform('u_color');
        this._uLightDir = this._program.uniform('u_lightDir');

        this._camera = new Camera();
        this._camera.center = vec3.fromValues(0.0, 0.0, 0.0);
        this._camera.up = vec3.fromValues(0.0, 1.0, 0.0);
        this._camera.eye = vec3.fromValues(-0.9, 1.0, 2.0);
        this._camera.near = 0.05;
        this._camera.far = 4.0;

        this._navigation = new ZoomNavigation(
            callback,
            eventProvider,
            { default: 4.0, min: 3.0, max: 6.0 }
        );
        this._navigation.camera = this._camera;

        gl.enable(gl.DEPTH_TEST);

        this._controls = new Controls();

        const modelInput = this._controls.createSelectListInput('Modell',
            this._models.map((model) => model.name));
        this._geometry.loadStl(this._models[modelInput.selectedIndex].stl);

        modelInput.addEventListener('change', (event: InputEvent) => {
            // get the index of the selected entry
            const idx = (event.target as HTMLSelectElement).selectedIndex;
            // set the algorithm to the newly selected one
            const stl = this._models[idx].stl;
            this._geometry.loadStl(stl);
            this._geometry.setTresholdAngle(this._thresholdAngle);
            // re-process the image
            this.invalidate(true);
        });

        const angleInput = this._controls.createSliderInput(
            'Winkel',
            undefined,
            SoftShadingRenderer.DEFAULT_ANGLE,
            '',
            SoftShadingRenderer.MIN_ANGLE,
            SoftShadingRenderer.MAX_ANGLE,
            SoftShadingRenderer.ANGLE_RESOLUTION);

        const angleInput2 = this._controls.createNumberInput(
            undefined,
            undefined,
            SoftShadingRenderer.DEFAULT_ANGLE,
            undefined,
            SoftShadingRenderer.MIN_ANGLE,
            SoftShadingRenderer.MAX_ANGLE,
            SoftShadingRenderer.ANGLE_RESOLUTION);

        angleInput.addEventListener('input', (event) => {
            const value = (event.target as HTMLInputElement).value;
            angleInput2.value = value;
            this._thresholdAngle = parseFloat(value) / 180.0 * Math.PI;
            this._geometry.setTresholdAngle(this._thresholdAngle);
            this.invalidate(true);
        });

        angleInput2.addEventListener('input', (event) => {
            const value = (event.target as HTMLInputElement).value;
            angleInput.value = value;
            this._thresholdAngle = parseFloat(value) / 180.0 * Math.PI;
            this._geometry.setTresholdAngle(this._thresholdAngle);
            this.invalidate(true);
        });

        this._geometry.setTresholdAngle(this._thresholdAngle);

        const colorPicker = this._controls.createColorInput('Farbe');
        colorPicker.value = '#505560';
        this._colorValue = Color.hex2rgba(colorPicker.value);

        colorPicker.addEventListener('input', (event: InputEvent) => {
            this._colorValue = Color.hex2rgba(
                (event.target as HTMLInputElement).value);
            this.invalidate(true);
        });

        return true;
    }

    /**
     * Uninitializes buffers, geometry and program.
     */
    protected onUninitialize(): void {
        super.uninitialize();

        this._geometry.uninitialize();
        this._program.uninitialize();

        this._defaultFBO.uninitialize();
    }

    /**
     * This is invoked in order to check if rendering of a frame is required by
     * means of implementation specific evaluation (e.g., lazy non continuous
     * rendering). Regardless of the return value a new frame (preparation,
     * frame, swap) might be invoked anyway, e.g., when update is forced or
     * canvas or context properties have changed or the renderer was
     * invalidated @see{@link invalidate}.
     * @returns whether to redraw
     */
    protected onUpdate(): boolean {
        this._navigation.update();

        return this._altered.any || this._camera.altered;
    }

    /**
     * This is invoked in order to prepare rendering of one or more frames,
     * regarding multi-frame rendering and camera-updates.
     */
    protected onPrepare(): void {
        if (this._altered.canvasSize) {
            this._camera.aspect = this._canvasSize[0] / this._canvasSize[1];
            this._camera.viewport = [this._canvasSize[0], this._canvasSize[1]];
        }

        if (this._altered.clearColor) {
            this._defaultFBO.clearColor(this._clearColor);
        }

        this._altered.reset();
        this._camera.altered = false;
    }

    protected onFrame(): void {
        const gl = this._context.gl;

        this._defaultFBO.bind();
        this._defaultFBO.clear(
            gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT, true, false);

        gl.viewport(0, 0, this._frameSize[0], this._frameSize[1]);

        this._program.bind();
        gl.uniformMatrix4fv(
            this._uViewProjection, gl.GL_FALSE, this._camera.viewProjection);
        gl.uniform3fv(this._uEye, this._camera.eye);

        gl.uniform4fv(this._uColor, this._colorValue);
        gl.uniform3fv(this._uLightDir, this._lightDir);

        this._geometry.bind();
        this._geometry.draw();
        this._geometry.unbind();

        this._program.unbind();
    }

    protected onSwap(): void { }

    protected onDiscarded(): void {
    }
}
