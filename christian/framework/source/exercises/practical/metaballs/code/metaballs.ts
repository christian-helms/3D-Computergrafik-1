import {
    Context,
    DefaultFramebuffer,
    NdcFillingRectangle,
    Program,
    Renderer,
    Shader,
} from 'webgl-operate';

import { Controls } from '../../../../common/code/uiHelper';

export class MetaballsRenderer extends Renderer {
    // rectangle geometry, fitting to screen
    protected _quad: NdcFillingRectangle;

    // shader program
    protected _program: Program;

    // interactivity - control helper and data for selection menus
    protected _controls: Controls;

    // factor for rescaling all metaballs
    protected _radiusFactor: number;
    protected _uRadiusFactor: WebGLUniformLocation;

    // number of metaballs ;P
    protected _numberOfMetaballs = 10;
    // meatballs: 3 floats per metaball (x, y, radius)
    protected _metaballs: Float32Array;
    // movement directions
    // [0]: speed in x-direction - [1]: speed in y-direction
    protected _metaballDirections: number[][] = [];
    protected _uMetaballs: WebGLUniformLocation;

    // visualization mode
    protected _mode: number;
    protected _uMode: WebGLUniformLocation;
    protected _modes = [
        'Weiße Metaballs',
        // implement this to get 1 bonus point
        'Psychedelisch',
        // you can add more visualizations :)
    ];

    // max speed in canvas widths per second
    protected _maxSpeed = 0.3;
    // updates per second
    protected _updateRate = 120;

    protected _uResolution: WebGLUniformLocation;

    protected _defaultFBO: DefaultFramebuffer;

    /**
     * Helper functions for setting up the shader program.
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
        frag.replace('$NUMBER_OF_METABALLS', String(this._numberOfMetaballs));
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
     * Initializes and sets up buffer, rectangle geometry, controls and links
     * shaders with program.
     * @param context - valid context to create the object for.
     * @param identifier - meaningful name for identification of this instance.
     * @param mouseEventProvider - required for mouse interaction
     * @returns - whether initialization was successful
     */
    protected onInitialize(
        context: Context): boolean {

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
            require('./metaballs.frag'));

        // store uniform locations
        this._uRadiusFactor = this._program.uniform('u_radiusFactor');
        this._uResolution = this._program.uniform('u_resolution');
        this._uMetaballs = this._program.uniform('u_metaballs');
        this._uMode = this._program.uniform('u_mode');

        // initialize controls
        this._controls = new Controls();

        // create selection for visualization mode
        const modeInput = this._controls.createSelectListInput(
            'Modus', this._modes);
        // set first mode as default
        this._mode = modeInput.selectedIndex;

        // add change event listener to mode input element
        modeInput.addEventListener('change', (event: InputEvent) => {
            // get the index of the selected entry
            this._mode = (event.target as HTMLSelectElement).selectedIndex;
            // re-render the image
            this.invalidate(true);
        });

        // create radius factor input slider
        const radiusInput = this._controls.createSliderInput(
            'Radiusfaktor', undefined, 1.0, undefined, 0.0, 2.0, 0.001);
        // add event listener for radius input
        radiusInput.addEventListener('input', (event) => {
            // read input value
            this._radiusFactor = parseFloat(
                (event.target as HTMLInputElement).value);
            // make sure a new frame is calculated
            this.invalidate(true);
        });
        // set radius factor to value set in slider
        this._radiusFactor = parseFloat(radiusInput.value);

        // initialize metaballs list: 3 floats per metaball (x, y, radius)
        this._metaballs = new Float32Array(3 * this._numberOfMetaballs);
        for (let i = 0; i < this._numberOfMetaballs; i++) {
            // set random x [0.0, 1.0]
            this._metaballs[i * 3 + 0] = Math.random();
            // set random y [0.0, 1.0]
            this._metaballs[i * 3 + 1] = Math.random();
            // set radius relative to canvas width
            // 0.1 means the radius is 1/10 of the canvas width
            // aka the diameter is 1/5 of the canvas width
            // you can experiment here
            this._metaballs[i * 3 + 2] = 0.05;
            // set random movement directions
            this._metaballDirections[i] = [
                Math.random() * this._maxSpeed / this._updateRate,
                Math.random() * this._maxSpeed / this._updateRate];
        }

        // execute animation update in regular intervals
        setInterval(this.updateAnimation.bind(this), 1000 / this._updateRate);

        return true;
    }

    /**
     * Updates the position and direction of a metaball in one direction.
     * At 0.0 and 1.0 it will be reflected.
     * @param index - index of the metaball to update.
     * @param direction - direction to update (0 = x, 1 = y)
     */
    protected updateDirection(index: number, direction: number): void {
        // read the old position
        const oldValue = this._metaballs[index * 3 + direction];
        // calculate new position
        let newValue = oldValue + this._metaballDirections[index][direction];
        // reflect if new position is bigger then 1.0
        if (newValue >= 1) {
            newValue = 2 - newValue;
            this._metaballDirections[index][direction] *= -1;
        // reflect if new position is smaller then 0.0
        } else if (newValue <= 0) {
            newValue = -newValue;
            this._metaballDirections[index][direction] *= -1;
        }
        // set metaball position to new position
        this._metaballs[index * 3 + direction] = newValue;
    }


    /**
     * Updates the positions and directions of the metaballs
     */
    protected updateAnimation(): void {
        // for each metaball
        for (let i = 0; i < this._numberOfMetaballs; i++) {
            // update x
            this.updateDirection(i, 0);
            // update y
            this.updateDirection(i, 1);
        }
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
        gl.uniform1f(this._uRadiusFactor, this._radiusFactor);
        gl.uniform2f(
            this._uResolution,
            this._canvasSize[0],
            this._canvasSize[1]);
        gl.uniform3fv(this._uMetaballs, this._metaballs);
        gl.uniform1i(this._uMode, this._mode);

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
