import {
    Context,
    DefaultFramebuffer,
    NdcFillingRectangle,
    Program,
    Renderer,
    Shader,
} from 'webgl-operate';

import { Controls } from '../../../../common/code/uiHelper';

export class XmasTreeRenderer extends Renderer {
    // rectangle geometry, fitting to screen
    protected _quad: NdcFillingRectangle;

    // shader program
    protected _program: Program;

    // interactivity - control helper and data for selection menus
    protected _controls: Controls;

    // canvas widths per second
    protected _maxSpeed = 0.3;
    // updates per second
    protected _updateRate = 120;

    protected _uTime: WebGLUniformLocation;
    protected _time = 0;

    protected _uResolution: WebGLUniformLocation;
    protected _uTreeResolution: WebGLUniformLocation;
    protected _treeResolution = [5, 30];

    protected _defaultFBO: DefaultFramebuffer;

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
        program.attribute('a_vertex', this._quad.vertexLocation);
        program.link();

        // set up shader to use the first texture - needs to be active (bound)
        program.bind();
        gl.uniform1i(program.uniform('u_texture'), gl.TEXTURE0);
        program.unbind();

        return program;
    }

    /**
     * Initializes and sets up buffer, cube geometry, camera and links shaders
     * with program.
     * @param context - valid context to create the object for.
     * @returns - whether initialization was successful
     */
    protected onInitialize(context: Context): boolean {

        // set up framebuffer and activate it
        this._defaultFBO = new DefaultFramebuffer(context, 'DefaultFBO');
        this._defaultFBO.initialize();
        this._defaultFBO.bind();

        // initialize the screen filling quad
        this._quad = new NdcFillingRectangle(context);
        this._quad.initialize();

        // prepare shader program
        this._program = this.setupProgram(
            context,
            require('../../../../common/code/quad.vert'),
            require('./xmasTree.frag'));

        // store uniform locations
        this._uResolution = this._program.uniform('u_resolution');
        this._uTreeResolution = this._program.uniform('u_treeResolution');
        this._uTime = this._program.uniform('u_time');

        // initialize controls
        this._controls = new Controls();

        // execute animation update in regular intervals
        setInterval(this.updateAnimation.bind(this), 1000 / this._updateRate);

        return true;
    }

    /**
     * Updates the time
     */
    protected updateAnimation(): void {
        this._time += 1000 / this._updateRate;
        // console.log(this._time * 0.001);
        // make sure a new frame is calculated
        this.invalidate(true);
    }

    /**
     * Uninitializes buffers, geometry and program.
     */
    protected onUninitialize(): void {
        super.uninitialize();

        this._quad.uninitialize();
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
        return this._altered.any;
    }

    /**
     * This is invoked in order to prepare rendering of one or more frames,
     * regarding multi-frame rendering and camera-updates.
     */
    protected onPrepare(): void {
        if (this._altered.clearColor) {
            this._defaultFBO.clearColor(this._clearColor);
        }

        this._altered.reset();
    }


    /**
     * This is invoked after both onUpdate and onPrepare and should be used to
     * do the actual rendering.
     */
    protected onFrame(): void {
        // store gl object locally for easier access
        const gl = this._context.gl;

        // set camera viewport to canvas size
        gl.viewport(0, 0, this._canvasSize[0], this._canvasSize[1]);

        // activate framebuffer for rendering
        this._defaultFBO.bind();
        // reset framebuffer
        this._defaultFBO.clear(
            gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT, true, false);

        // activate shader program
        this._program.bind();

        // set uniforms (shader inputs)
        gl.uniform2f(
            this._uResolution,
            this._canvasSize[0],
            this._canvasSize[1]);
        gl.uniform2f(
            this._uTreeResolution,
            this._treeResolution[0],
            this._treeResolution[1]);
        gl.uniform1f(this._uTime, this._time);

        // activate, render and deactivate the screen-aligned quad
        this._quad.bind();
        this._quad.draw();
        this._quad.unbind();

        // deactivate shader program
        this._program.unbind();
    }

    protected onSwap(): void { }

    protected onDiscarded(): void {
    }
}
