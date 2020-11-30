import {
    Context,
    DefaultFramebuffer,
    NdcFillingRectangle,
    Program,
    Renderer,
    Shader,
    Texture2D
} from 'webgl-operate';

import Jimp from 'jimp';

export class IntroRenderer extends Renderer {
    protected _context: Context;
    protected _gl: WebGL2RenderingContext;
    protected _canvas: HTMLElement;

    // output buffer
    protected _framebuffer: DefaultFramebuffer;

    // rectangle geometry, fitting to screen
    protected _quad: NdcFillingRectangle;

    // shader programs
    protected _shaderProgram: Program;

    // shader inputs
    protected _uTexture: WebGLUniformLocation;
    protected _uResolution: WebGLUniformLocation;

    // webgl data
    protected _texture: Texture2D;

    // input data
    protected _image: Jimp;

    // update output only if needed
    protected _textureChanged = false;

    // load image using jimp
    private loadTexture(path: string): void {
        // use Jimp library to load image, pass callback to handle result
        Jimp.read(path).then((img) => {
            // store the image
            this._image = img;

            // WebGL expects the texture to start in bottom-left corner
            this._image.flip(false, true);

            // resize image to fill canvas, cropping if necessary
            img.cover(this._canvas.clientWidth, this._canvas.clientHeight);

            // reduce resolution to see pixels
            const factor = 1 / 10;
            this._image.resize(
                this._image.getWidth() * factor,
                this._image.getHeight() * factor,
                Jimp.RESIZE_NEAREST_NEIGHBOR);

            // make sure a new frame is calculated
            this._textureChanged = true;
            this.invalidate();
        });
    }

    // set everything up
    protected onInitialize(context: Context): boolean {
        this._context = context;
        this._gl = context.gl;
        this._canvas = document.getElementById('webgl-canvas');

        // set up framebuffer and activate it
        this._framebuffer = new DefaultFramebuffer(context);
        this._framebuffer.initialize();
        this._framebuffer.bind();

        // initialize the screen filling quad
        this._quad = new NdcFillingRectangle(context);
        this._quad.initialize();

        // create shaders from source and initialize
        const vert = new Shader(context, this._gl.VERTEX_SHADER);
        vert.initialize(require('../../../../common/code/quad.vert'));
        const frag = new Shader(context, this._gl.FRAGMENT_SHADER);
        frag.initialize(require('./intro.frag'));

        // create program and initialize it with the prepared shaders
        this._shaderProgram = new Program(context);
        this._shaderProgram.initialize([vert, frag], false);

        // connect the quad's vertex locations to the shader attribute
        this._shaderProgram.attribute('a_vertex', this._quad.vertexLocation);
        this._shaderProgram.link();

        // fetch uniform locations
        this._shaderProgram.bind();
        this._uTexture = this._shaderProgram.uniform('u_texture');
        this._uResolution = this._shaderProgram.uniform('u_resolution');
        this._shaderProgram.unbind();

        // create a new texture in the current rendering context
        this._texture = new Texture2D(this._context);
        // initialize the texture as RGBA texture with the canvas' size
        this._texture.initialize(
            1, 1, this._gl.RGBA, this._gl.RGBA, this._gl.UNSIGNED_BYTE);
        // configure what happens when sampling outside the image
        this._texture.wrap(
            this._gl.MIRRORED_REPEAT, this._gl.MIRRORED_REPEAT);
        // configure how to interpolate between pixels (LINEAR/NEAREST)
        this._texture.filter(this._gl.NEAREST, this._gl.NEAREST);

        // load texture
        this.loadTexture('../../../common/img/input/platypus.png');

        return true;
    }

    // clean up
    protected onUninitialize(): void {
        super.uninitialize();

        this._shaderProgram.uninitialize();
        this._quad.uninitialize();
        this._framebuffer.uninitialize();
    }

    // context got discarded
    protected onDiscarded(): void {
        console.log('got discarded');
    }

    // tell framework if update is needed
    protected onUpdate(): boolean {
        return this._textureChanged;
    }

    // prepare frame rendering
    protected onPrepare(): void {
        if (this._textureChanged) {
            // make sure image fits into buffer
            this._texture.resize(
                this._image.getWidth(), this._image.getHeight());
            // send image to WebGL
            this._texture.data(this._image.bitmap.data);

            // enable shader for data update
            this._shaderProgram.bind();
            // use texture unit 0 for texturing
            this._gl.uniform1i(this._uTexture, 0);
            // update resolution
            this._gl.uniform2f(
                this._uResolution,
                this._image.getWidth(), this._image.getHeight());
            // diable shader again
            this._shaderProgram.bind();

            // reset the change tracker
            this._textureChanged = false;
        }
    }

    protected onFrame(): void {
        // set up render output to match canvas
        this._gl.viewport(0, 0, this._canvasSize[0], this._canvasSize[1]);

        // activate framebuffer for rendering
        this._framebuffer.bind();
        // reset framebuffer
        this._framebuffer.clear(
            this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT, true, false);

        // make texture available on texture unit 0
        this._texture.bind(this._gl.TEXTURE0);
        // activate shader program
        this._shaderProgram.bind();

        // activate, render and deactivate the screen-aligned quad
        this._quad.bind();
        this._quad.draw();
        this._quad.unbind();

        // deactivate shader program
        this._shaderProgram.unbind();
        // deactivate texture
        this._texture.unbind(this._gl.TEXTURE0);
    }
}
