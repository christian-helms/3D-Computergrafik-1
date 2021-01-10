import {
    Context,
    Framebuffer,
    Initializable,
    NdcFillingRectangle,
    Program,
    Texture2D
} from 'webgl-operate';
import { readFile } from './readFile';
import { setupShaderProgram } from './setupShaderProgram';

export class ApplyPass extends Initializable {
    // webgl-operate context and underlying WebGL context
    protected _context: Context;
    protected _gl: WebGLRenderingContext;

    // the framebuffer to render to
    protected _target: Framebuffer;

    // rectangle geometry, fitting to screen
    protected _quad: NdcFillingRectangle;

    // input textures
    protected _image: Texture2D;
    protected _lut: Texture2D;

    // shader program for generating LUT and uniform locations
    protected _program: Program;
    protected _uResolution: WebGLUniformLocation;

    // function to signal renderer to re-render
    protected _invalidate: () => void;

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
    public initialize(): boolean {
        // initialize the screen filling quad
        this._quad = new NdcFillingRectangle(this._context);
        this._quad.initialize();

        // set up shader program
        this._program = setupShaderProgram(
            require('../../../../common/code/quad.vert'),
            require('./apply.frag'),
            this._context,
            this._quad.vertexLocation);
        this._uResolution = this._program.uniform('u_resolution');

        // point program to texture units 0 and 1
        this._program.bind();
        this._gl.uniform1i(this._program.uniform('u_image'), 0);
        this._gl.uniform1i(this._program.uniform('u_lut'), 1);
        this._program.unbind();

        // set up textures
        this._image = new Texture2D(this._context);
        this._image.initialize(
            1, 1, this._gl.RGBA, this._gl.RGBA, this._gl.UNSIGNED_BYTE);
        this._lut = new Texture2D(this._context);
        this._lut.initialize(
            1, 1, this._gl.RGBA, this._gl.RGBA, this._gl.UNSIGNED_BYTE);

        return true;
    }

    /**
     * Cleans up afterwards.
     */
    @Initializable.uninitialize()
    public uninitialize(): void {
        this._program.uninitialize();
        this._quad.uninitialize();
        this._image.uninitialize();
        this._lut.uninitialize();
    }

    /**
     * Uses the shader to render a identity LUT to the target framebuffer.
     * @param resolution LUT resolution
     */
    public frame(): void {
        // make sure LUT texture has valid resolution
        const w = this._lut.width;
        const h = this._lut.height;
        if (w !== h * h) {
            console.log(`Invalid LUT resolution: ${w}x${h}`);
            return;
        }
        const resolution = h;

        // activate framebuffer for rendering
        this._target.bind();
        // reset framebuffer
        this._target.clear(
            this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT,
            false, false);

        // activate shader program
        this._program.bind();

        // configure LUT resolution uniform
        this._gl.uniform1f(this._uResolution, resolution);

        // enable textures on texture units 0 and 1
        this._image.bind(this._gl.TEXTURE0);
        this._lut.bind(this._gl.TEXTURE1);

        // activate, render and deactivate the screen-aligned quad
        this._quad.bind();
        this._quad.draw();
        this._quad.unbind();

        // disable textures 
        this._image.unbind();
        this._lut.unbind();

        // deactivate shader program
        this._program.unbind();

        // deactivate framebuffer
        this._target.unbind();
    }

    /**
     * Allows setting the input image, either as URL (load from server) or
     * file object (upload).
     */
    public set image(file: string | File) {
        if (typeof (file) === 'string') {
            this._image.fetch(file).then(this._invalidate);
        } else {
            readFile(file, (d) => this._image.fetch(d).then(this._invalidate));
        }
    }

    /**
     * Allows setting the LUT by passing a file object (upload).
     */
    public set lut(file: File) {
        readFile(file, (d) => {
            this._lut.fetch(d).then(this._invalidate);
        });
    }

    /**
     * Returns the texture object holding the LUT, e.g. for setting custom data.
     */
    public get lutObject(): Texture2D {
        return this._lut;
    }

    /**
     * Allows setting the framebuffer to render into.
     */
    public set target(fbo: Framebuffer) {
        this._target = fbo;
    }

    /**
     * Sets the callback for requesting a new frame, e.g. when loading an image.
     */
    public set invalidate(cb: () => void) {
        this._invalidate = cb;
    }
}