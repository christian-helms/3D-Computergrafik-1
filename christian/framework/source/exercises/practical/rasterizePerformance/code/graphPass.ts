import {
    ChangeLookup,
    Context,
    Framebuffer,
    Initializable,
    NdcFillingRectangle,
    Program,
    Shader
} from 'webgl-operate';

export class GraphPass extends Initializable {
    protected _altered = Object.assign(new ChangeLookup(), {
        any: false,
        samples: false,
        samplePositions: false
    });

    // webgl-operate context and underlying WebGL context
    protected _context: Context;
    protected _gl: WebGLRenderingContext;

    // the framebuffer to render to
    protected _target: Framebuffer;

    // rectangle geometry, fitting to screen
    protected _quad: NdcFillingRectangle;

    // shader program
    protected _vertex: Shader;
    protected _fragment: Shader;
    protected _program: Program;

    // data
    protected _samples: number[] = [0];
    protected _samplePositions: number[] = [0];

    /**
     * Constructor. Stores the rendering context needed for operation.
     * @param context webgl-operate rendering context
     */
    public constructor(context: Context) {
        super();
        this._context = context;
        this._gl = context.gl;
    }

    /**
     * Sets up geometry, shaders and textures.
     */
    @Initializable.initialize()
    public initialize(): boolean {// initialize the screen filling quad
        this._quad = new NdcFillingRectangle(this._context);
        this._quad.initialize();

        // create vertex shader from source and initialize
        this._vertex = new Shader(this._context, this._gl.VERTEX_SHADER);
        this._vertex.initialize(require('../../../../common/code/quad.vert'));
        // don't initialize fragment shader yet, as it won't compile if the
        // measurement data isn't known
        this._fragment = new Shader(this._context, this._gl.FRAGMENT_SHADER);

        // create program - don't init, since fragment shader isn't initialized
        this._program = new Program(this._context);

        return true;
    }

    /**
     * Cleans up afterwards.
     */
    @Initializable.uninitialize()
    public uninitialize(): void {
        this._program.uninitialize();
        this._quad.uninitialize();
    }

    public prepare(): void {
        if (this._altered.samples) {
            this._fragment.replace(
                '$NUM_SERIES_TIMES_SAMPLES$', this._samples.length.toString());
        }
        if (this._altered.samplePositions) {
            this._fragment.replace(
                '$NUM_SAMPLES$', this._samplePositions.length.toString());
        }
        if (this._altered.samples || this._altered.samplePositions) {
            this._fragment.replace(
                '$NUM_SERIES$',
                (this._samples.length /
                    this._samplePositions.length).toString());

            if (this._fragment.initialized) {
                this._fragment.compile();
                this._program.link();
            } else {
                this._fragment.initialize(require('./graph.frag'));
                this._program.initialize([this._vertex, this._fragment], false);
                this._program.attribute('a_vertex', this._quad.vertexLocation);
                this._program.link();
            }

            this._program.bind();
            this._gl.uniform1fv(
                this._program.uniform('u_samples'),
                this._samples);
            this._gl.uniform1fv(
                this._program.uniform('u_samplePositions'),
                this._samplePositions);
            this._gl.uniform1f(
                this._program.uniform('u_minSamplePos'),
                Math.min(...this._samplePositions));
            this._gl.uniform1f(
                this._program.uniform('u_maxSamplePos'),
                Math.max(...this._samplePositions));
            this._gl.uniform1f(
                this._program.uniform('u_maxSample'),
                Math.max(...this._samples));
            this._program.unbind();
        }
        this._altered.reset();
    }

    /**
     * Uses the shader to render a identity LUT to the target framebuffer.
     * @param resolution LUT resolution
     */
    public frame(): void {
        this._gl.viewport(0, 0, this._target.width, this._target.height);

        // activate framebuffer for rendering
        this._target.bind();
        // reset framebuffer
        this._target.clear(
            this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT,
            false, false);

        // no data yet - no need to render anything
        if (!this._program.initialized) {
            this._target.unbind();
            return;
        }

        // activate shader program
        this._program.bind();

        // activate, render and deactivate the screen-aligned quad
        this._quad.bind();
        this._quad.draw();
        this._quad.unbind();

        // deactivate shader program
        this._program.unbind();

        // deactivate framebuffer
        this._target.unbind();
    }

    /**
     * Allows setting the framebuffer to render into.
     */
    public set target(fbo: Framebuffer) {
        this._target = fbo;
    }

    public get altered(): boolean {
        return this._altered.any;
    }

    public set samples(a: number[]) {
        this._samples = a;
        this._altered.alter('samples');
    }

    public set samplePositions(a: number[]) {
        this._samplePositions = a;
        this._altered.alter('samplePositions');
    }
}
