import {
    Context,
    Framebuffer,
    Initializable,
    NdcFillingRectangle,
    Program
} from 'webgl-operate';
import { setupShaderProgram } from './setupShaderProgram';

export class ExportPass extends Initializable {
    // webgl-operate context and underlying WebGL context
    protected _context: Context;
    protected _gl: WebGLRenderingContext;

    // the framebuffer to render to
    protected _target: Framebuffer;

    // rectangle geometry, fitting to screen
    protected _quad: NdcFillingRectangle;

    // shader program for generating LUT and uniform locations
    protected _program: Program;
    protected _uResolution: WebGLUniformLocation;

    // the requested LUT resolution
    protected _resolution: number;

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
     * Sets up geometry and shaders.
     */
    @Initializable.initialize()
    public initialize(): boolean {
        // initialize the screen filling quad
        this._quad = new NdcFillingRectangle(this._context);
        this._quad.initialize();

        // set up shader program
        this._program = setupShaderProgram(
            require('../../../../common/code/quad.vert'),
            require('./export.frag'),
            this._context,
            this._quad.vertexLocation);
        this._uResolution = this._program.uniform('u_resolution');

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

    /**
     * Uses the shader to render a identity LUT to the target framebuffer.
     * @param resolution LUT resolution
     */
    public frame(): void {
        // activate framebuffer for rendering
        this._target.bind();
        // reset framebuffer
        this._target.clear(
            this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT,
            false, false);

        // activate shader program
        this._program.bind();

        // configure LUT resolution uniform
        this._gl.uniform1f(this._uResolution, this._resolution);

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

    /**
     * Sets the resolution for the generated LUT.
     */
    public set resolution(resolution: number) {
        this._resolution = resolution;
    }
}
