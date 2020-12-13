import {
    ChangeLookup,
    Context,
    Framebuffer,
    Initializable,
    Program,
    Shader
} from 'webgl-operate';
import { TriangleFanGeometry } from './triangleFanGeometry';

export class CirclePass extends Initializable {
    protected _altered = Object.assign(new ChangeLookup(), {
        any: false,
        numOuterVertices: false,
        radius: false,
    });

    // webgl-operate context and underlying WebGL context
    protected _context: Context;
    protected _gl: WebGLRenderingContext;

    // the framebuffer to render to
    protected _target: Framebuffer;

    // the triangle fan geometry
    protected _geom: TriangleFanGeometry;

    // shader program
    protected _program: Program;
    protected _uRadius: WebGLUniformLocation;

    // data
    protected _radius = 0.5;
    protected _numOuterVertices = 8;

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
        this._geom = new TriangleFanGeometry(this._context);
        this._geom.initialize();
        this._geom.build(this._numOuterVertices, this._radius);

        // prepare shaders
        const vert = new Shader(
            this._context, this._context.gl.VERTEX_SHADER);
        vert.initialize(require('./circle.vert'));
        const frag = new Shader(
            this._context, this._context.gl.FRAGMENT_SHADER);
        frag.initialize(require('./circle.frag'));

        // create program and initialize it with the prepared shaders
        this._program = new Program(this._context);
        this._program.initialize([vert, frag], false);

        // connect the quad's vertex locations to the shader attribute
        this._program.attribute('a_vertex', this._geom.aVertex);
        this._program.link();

        this._uRadius = this._program.uniform('u_radius');

        this._program.bind();
        this._gl.uniform1f(this._uRadius, this._radius);
        this._program.unbind();

        return true;
    }

    /**
     * Cleans up afterwards.
     */
    @Initializable.uninitialize()
    public uninitialize(): void {
        this._program.uninitialize();
        this._geom.uninitialize();
    }

    /**
     * Updates members to prepare for frame.
     */
    public prepare(): void {
        if (this._altered.numOuterVertices ||  this._altered.radius) {
            this._geom.build(
                this._numOuterVertices,
                this._radius);
        }

        if(this._altered.radius) {
            this._program.bind();
            this._gl.uniform1f(this._uRadius, this._radius);
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

        // activate shader program
        this._program.bind();

        // activate, render and deactivate the screen-aligned quad
        this._geom.bind();
        this._geom.draw();
        this._geom.unbind();

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

    /**
     * Checks if any settings have been altered and a new frame is needed.
     */
    public get altered(): boolean {
        return this._altered.any;
    }

    /**
     * Sets the number of outer vertices on the triangle fan.
     */
    public set numOuterVertices(num: number) {
        this._numOuterVertices = num;
        this._altered.alter('numOuterVertices');
    }

    /**
     * Sets how many triangle fans are drawn in each frame.
     * This is used by the benchmark to increase load.
     */
    public set instances(num: number) {
        this._geom.numInstances = num;
    }
}
