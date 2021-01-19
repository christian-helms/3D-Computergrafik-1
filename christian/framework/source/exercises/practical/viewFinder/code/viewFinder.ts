import {
    Camera,
    ChangeLookup,
    Context,
    DefaultFramebuffer,
    EventProvider,
    Invalidate,
    Program,
    Renderer,
    Shader,
    Texture2D,
    vec3,
} from 'webgl-operate';

import { Controls } from '../../../../common/code/uiHelper';
import { RectangleGeometry } from './rectangleGeometry';
import { ZoomNavigation } from '../../../../common/code/zoom';

export class ViewFinderRenderer extends Renderer {
    protected readonly _altered = Object.assign(new ChangeLookup(), {
        any: false,
        multiFrameNumber: false,
        frameSize: false,
        canvasSize: false,
        framePrecision: false,
        clearColor: false,
        debugTexture: false,
        geomResolution: false
    });
    // rectangle geometry, fitting to screen
    protected _quad: RectangleGeometry;

    protected _camera: Camera;
    protected _navigation: ZoomNavigation;
    protected _uViewProjection: WebGLUniformLocation;
    // shader program
    protected _program: Program;

    // interactivity - control helper and data for selection menus
    protected _controls: Controls;

    protected readonly imagePathPrefix = 'img/exercises/practical/viewFinder/';
    protected _images = [
        {
            name: 'Sanssouci 1',
            path: this.imagePathPrefix
                + 'img/sanssouci-potsdam-park-sanssouci.png'
        },
        {
            name: 'Sanssouci 2',
            path: this.imagePathPrefix
                + 'img/architektur-garten-terrasse-schloss.png'
        },
    ];

    protected _image: Texture2D;

    protected _defaultFBO: DefaultFramebuffer;

    protected _geometryResolution = 20;
    protected _uGeometryResolution: WebGLUniformLocation;

    protected _correctViewPosition: vec3 = [0, 0, 3];
    protected _uCorrectViewPosition: WebGLUniformLocation;

    /**
     * Helper functions for setting up the various shader programs.
     * @param context - rendering context to create the shaders in
     * @param vertexShader - source code for vertex shader
     * @param fragmentShader - source code for fragment shader
     */
    private setupProgram(
        context: Context,
        vertexShader: string,
        fragmentShader: string
    ): Program {
        // store gl object locally for easier access
        const gl = context.gl as WebGLRenderingContext;

        // create shaders from source and initialize
        const vert = new Shader(context, gl.VERTEX_SHADER);
        vert.initialize(vertexShader);
        const frag = new Shader(context, gl.FRAGMENT_SHADER);
        frag.initialize(fragmentShader);

        // create program and initialize it with the prepared shaders
        const program = new Program(context);
        program.initialize([vert, frag], false);

        // connect the quad's vertex locations to the shader attribute
        // program.attribute('a_vertex', this._quad.vertexLocation);
        program.link();

        // set up shader to use the first texture - needs to be active (bound)
        program.bind();
        gl.uniform1i(program.uniform('u_texture'), 0);
        program.unbind();

        return program;
    }

    /**
     * Initializes and sets up buffer, cube geometry, camera and links shaders
     * with program.
     * @param context - valid context to create the object for.
     * @returns - whether initialization was successful
     */
    protected onInitialize(
        context: Context,
        callback: Invalidate,
        eventProvider: EventProvider
    ): boolean {
        const gl = context.gl as WebGLRenderingContext;

        // set up framebuffer and activate it
        this._defaultFBO = new DefaultFramebuffer(context, 'DefaultFBO');
        this._defaultFBO.initialize();
        this._defaultFBO.clearColor([.19, .34, .86, 1.0]);
        this._defaultFBO.bind();

        // initialize the screen filling quad
        this._quad = new RectangleGeometry(context);
        this._quad.initialize(this._geometryResolution, 0);

        // prepare shader program
        this._program = this.setupProgram(
            context,
            require('./viewFinder.vert'),
            require('./viewFinder.frag'));

        // init camera and navigation
        this._camera = new Camera();

        this._navigation = new ZoomNavigation(
            callback, eventProvider,
            {
                default: 2.0, min: .1, max: 50
            });
        this._navigation.camera = this._camera;


        this._camera.center = vec3.fromValues(0.0, 0.0, 0.0);
        this._camera.up = vec3.fromValues(0.0, 1.0, 0.0);
        this._camera.eye = vec3.fromValues(
            this._correctViewPosition[0],
            this._correctViewPosition[1],
            -this._correctViewPosition[2]);
        this._camera.near = 0.01;
        this._camera.far = 10.0;

        this._navigation.updateZoomFromEye();

        this._image = new Texture2D(this._context);
        this._image.initialize(1, 1, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE);
        this._image.filter(gl.LINEAR, gl.LINEAR_MIPMAP_LINEAR);
        // this.setImage(0);

        // store uniform locations
        this._uGeometryResolution =
            this._program.uniform('u_geometryResolution');
        this._uViewProjection = this._program.uniform('u_viewProjection');
        this._uCorrectViewPosition =
            this._program.uniform('u_correctViewPosition');

        // initialize controls
        this._controls = new Controls();

        // TA: remove begin
        // create selection for the image
        const imageInput = this._controls.createSelectListInput(
            'Bild', this._images.map(element => {
                return element.name;
            }));
        // set first image as default
        this.setImage(imageInput.selectedIndex);

        // add change event listener to image input element
        imageInput.addEventListener('change', (event: InputEvent) => {
            // get the index of the selected entry
            const target = event.target as HTMLSelectElement;
            this.setImage(target.selectedIndex);
            // re-render the image
            this.invalidate(true);
        });

        const resetButton = this._controls.createActionButton(
            'Kamera zurücksetzen',
            'Setzt die Kamera auf u_correctViewPosition.'
        );
        resetButton.addEventListener('click', () => {
            this._camera.eye = this._correctViewPosition;
            this._camera.up = vec3.fromValues(0.0, 1.0, 0.0);
            this._navigation.updateZoomFromEye();
            this.invalidate();
        });

        const geomResolutionInput = this._controls.createSliderInput(
            'Auflösung der Geometrie',
            null,
            this._geometryResolution,
            'Das Bild soll auf n x n Rechtecke aufgeteilt werden.',
            1,
            50
        );
        geomResolutionInput.addEventListener('input', (event: InputEvent) => {
            const target = event.target as HTMLSelectElement;
            this._geometryResolution = parseInt(target.value);
            this._quad.geometryResolution = this._geometryResolution;
            this._altered.alter('geomResolution');
            this.invalidate();
        });

        return true;
    }

    protected setImage(index: number): void {
        const path = this._images[index].path;
        this._image.fetch(
            path
        ).then(() => {
            this._image.generateMipMap();
            this.invalidate(true);
        });
    }

    /**
     * Uninitializes buffers, geometry and program.
     */
    protected onUninitialize(): void {
        super.uninitialize();

        this._quad.uninitialize();
        this._program.uninitialize();
        this._image.uninitialize();

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

        this._altered.reset();
        this._camera.altered = false;
    }


    /**
     * This is invoked after both onUpdate and onPrepare and should be used to
     * do the actual rendering.
     */
    protected onFrame(): void {
        // store gl object locally for easier access
        const gl = this._context.gl as WebGL2RenderingContext;

        // activate framebuffer for rendering
        this._defaultFBO.bind();
        // reset framebuffer
        this._defaultFBO.clear(
            gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT, true, false);

        // set camera viewport to canvas size
        gl.viewport(0, 0, this._canvasSize[0], this._canvasSize[1]);

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.SAMPLE_ALPHA_TO_COVERAGE);

        // activate shader program
        this._program.bind();

        this._image.bind(gl.TEXTURE0);

        gl.uniform1f(this._uGeometryResolution, this._geometryResolution);
        gl.uniformMatrix4fv(
            this._uViewProjection, false, this._camera.viewProjection);
        gl.uniform3f(
            this._uCorrectViewPosition,
            this._correctViewPosition[0],
            this._correctViewPosition[1],
            this._correctViewPosition[2],
        );

        // activate, render and deactivate the screen-aligned quad
        this._quad.bind();
        this._quad.draw();
        this._quad.unbind();

        this._image.unbind();

        // deactivate shader program
        this._program.unbind();
    }

    protected onSwap(): void { }

    protected onDiscarded(): void {
    }
}
