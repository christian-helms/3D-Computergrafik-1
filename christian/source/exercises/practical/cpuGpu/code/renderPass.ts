import {
    Context,
    DefaultFramebuffer,
    Initializable,
    NdcFillingRectangle,
    Program,
    Shader,
    Texture2D
} from 'webgl-operate';

export class RenderPass extends Initializable {
    // webgl-operate context and underlying WebGL context
    protected _context: Context;
    protected _gl: WebGLRenderingContext;

    // the framebuffer to render to
    protected _target: DefaultFramebuffer;

    // gpu texture handle
    protected _texture: Texture2D;

    // rectangle geometry, fitting to screen
    protected _quad: NdcFillingRectangle;

    // shader programs
    protected _cpu: Program;
    protected _sharpen: Program;
    protected _blur: Program;
    protected _laplace: Program;

    // currently selected shader program
    protected _active: Program;

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
     * Helper functions for setting up the various shader programs.
     * @param context - rendering context to create the shaders in
     * @param vertexShader - source code for vertex shader
     * @param fragmentShader - source code for fragment shader
     */
    private setupProgram(
        vertexShader: string, fragmentShader: string
    ): Program {
        // create shaders from source and initialize
        const vert = new Shader(this._context, this._gl.VERTEX_SHADER);
        vert.initialize(vertexShader);
        const frag = new Shader(this._context, this._gl.FRAGMENT_SHADER);
        frag.initialize(fragmentShader);

        // create program and initialize it with the prepared shaders
        const program = new Program(this._context);
        program.initialize([vert, frag], false);

        // connect the quad's vertex locations to the shader attribute
        program.attribute('a_vertex', this._quad.vertexLocation);
        program.link();

        // set up shader to use the first texture - needs to be active (bound)
        program.bind();
        this._gl.uniform1i(program.uniform('u_texture'), 0);
        program.unbind();

        return program;
    }

    @Initializable.initialize()
    public initialize(): boolean {
        // initialize the screen filling quad
        this._quad = new NdcFillingRectangle(this._context);
        this._quad.initialize();

        // prepare shader program for use with CPU effects
        this._cpu = this.setupProgram(
            require('../../../../common/code/quad.vert'),
            require('../../../../common/code/img.frag'));

        // prepare GPU sharpen shader program
        this._sharpen = this.setupProgram(
            require('../../../../common/code/quad.vert'),
            require('./sharpen.frag'));

        // prepare GPU blur shader program
        this._blur = this.setupProgram(
            require('../../../../common/code/quad.vert'),
            require('./blur.frag'));

        // prepare GPU laplace shader program
        this._laplace = this.setupProgram(
            require('../../../../common/code/quad.vert'),
            require('./laplace.frag'));

        return true;
    }

    @Initializable.uninitialize()
    public uninitialize(): void {
        this._quad.uninitialize();

        this._cpu.uninitialize();
        this._blur.uninitialize();
        this._sharpen.uninitialize();
        this._laplace.uninitialize();

        this._target.uninitialize();
    }

    public initTexture(): void {
        if (this._texture === undefined) {
            // create a new texture in the current rendering context
            this._texture = new Texture2D(this._context, 'Texture');
            // initialize the texture as RGB texture with the canvas' size
            this._texture.initialize(
                1, 1,
                this._gl.RGB, this._gl.RGB, this._gl.UNSIGNED_BYTE);
            // configure what happens when sampling outside the image
            this._texture.wrap(
                this._gl.MIRRORED_REPEAT, this._gl.MIRRORED_REPEAT);
            // configure how to interpolate between pixels
            this._texture.filter(
                this._gl.LINEAR, this._gl.LINEAR_MIPMAP_LINEAR);
        }
    }

    public updateImage(width: number, height: number, data: Uint8Array): void {
        this._texture.resize(width, height);
        this._texture.data(data);
    }

    public frame(
        imageWidth: number, imageHeight: number, blurRadius: number
    ): void {
        // no need to render if texture isn't ready
        if (this._texture === undefined) return;

        // activate framebuffer for rendering
        this._target.bind();
        // reset framebuffer
        this._target.clear(
            this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT, true, false);

        // activate texture
        this._texture.bind(this._gl.TEXTURE0);

        // activate shader program
        this._active.bind();

        // if the shader program uses the resolution, set it
        const resolutionUniform = this._active.uniform('u_resolution');
        if (resolutionUniform !== undefined) {
            this._gl.uniform2f(resolutionUniform, imageWidth, imageHeight);
        }

        // if the shader program uses the blur radius, set it
        const radiusUniform = this._active.uniform('u_radius');
        if (radiusUniform !== undefined) {
            this._gl.uniform1f(radiusUniform, blurRadius);
        }

        // activate, render and deactivate the screen-aligned quad
        this._quad.bind();
        this._quad.draw();
        this._quad.unbind();

        // deactivate shader program
        this._active.unbind();
        // deactivate texture
        this._texture.unbind(this._gl.TEXTURE0);
    }

    public set target(target: DefaultFramebuffer) {
        this._target = target;
    }

    public get cpu(): Program {
        return this._cpu;
    }

    public get blur(): Program {
        return this._blur;
    }

    public get sharpen(): Program {
        return this._sharpen;
    }

    public get laplace(): Program {
        return this._laplace;
    }

    public set active(active: Program) {
        this._active = active;
    }
}