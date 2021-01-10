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
    protected _uTextureA: WebGLUniformLocation;
    protected _uTextureB: WebGLUniformLocation;

    // webgl data
    protected _textureA: Texture2D;
    protected _textureB: Texture2D;

    // input data
    protected _imageA: Jimp;
    protected _imageB: Jimp;

    // update output only if needed
    protected _textureAChanged = false;
    protected _textureBChanged = false;

    // load image using jimp
    private loadTexture(path: string, cb: (result: Jimp) => void): void {
        // use Jimp library to load image, pass callback to handle result
        Jimp.read(path).then((img) => {
            // WebGL expects the texture to start in bottom-left corner
            img.flip(false, true);

            // resize image to fill canvas, cropping if necessary
            img.cover(this._canvas.clientWidth, this._canvas.clientHeight);

            // store the image
            cb(img);

            // make sure a new frame is calculated
            this.invalidate();
        });
    }

    private initTexture(): Texture2D {
        // create a new texture in the current rendering context
        const tex = new Texture2D(this._context);
        // initialize the texture as RGBA texture with the canvas' size
        tex.initialize(
            1, 1, this._gl.RGBA, this._gl.RGBA, this._gl.UNSIGNED_BYTE);
        // configure what happens when sampling outside the image
        tex.wrap(this._gl.MIRRORED_REPEAT, this._gl.MIRRORED_REPEAT);
        // configure how to interpolate between pixels
        tex.filter(this._gl.LINEAR, this._gl.LINEAR);

        return tex;
    }

    // send image to WebGL
    private updateImage(img: Jimp, tex: Texture2D): void {
        // make sure image fits into buffer
        tex.resize(img.getWidth(), img.getHeight());
        // send image to WebGL
        tex.data(img.bitmap.data);
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
        frag.initialize(require('./mix.frag'));

        // create program and initialize it with the prepared shaders
        this._shaderProgram = new Program(context);
        this._shaderProgram.initialize([vert, frag], false);

        // connect the quad's vertex locations to the shader attribute
        this._shaderProgram.attribute('a_vertex', this._quad.vertexLocation);
        this._shaderProgram.link();

        // fetch uniform locations, set used texture units
        this._shaderProgram.bind();
        this._uTextureA = this._shaderProgram.uniform('u_textureA');
        this._uTextureB = this._shaderProgram.uniform('u_textureB');
        this._gl.uniform1i(this._uTextureA, 0);
        this._gl.uniform1i(this._uTextureB, 1);
        this._shaderProgram.unbind();

        // init textures
        this._textureA = this.initTexture();
        this._textureB = this.initTexture();

        // load textures
        this.loadTexture(
            '../../../common/img/input/pumpkins.jpg',
            (img) => {
                this._imageA = img;
                this._textureAChanged = true;
            });
        this.loadTexture(
            '../../../common/img/input/platypus.png',
            (img) => {
                this._imageB = img;
                this._textureBChanged = true;
            });

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
        return this._textureAChanged || this._textureBChanged;
    }

    // prepare frame rendering
    protected onPrepare(): void {
        if (this._textureAChanged) {
            this.updateImage(this._imageA, this._textureA);
            this._textureAChanged = false;
        }
        if (this._textureBChanged) {
            this.updateImage(this._imageB, this._textureB);
            this._textureBChanged = false;
        }
    }

    protected onFrame(): void {
        // only render if both images are ready
        if(!this._imageA || !this._imageB) return;

        // set up render output to match canvas
        this._gl.viewport(0, 0, this._canvasSize[0], this._canvasSize[1]);

        // activate framebuffer for rendering
        this._framebuffer.bind();
        // reset framebuffer
        this._framebuffer.clear(
            this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT, true, false);

        // make textures available on texture units 0/1
        this._textureA.bind(this._gl.TEXTURE0);
        this._textureB.bind(this._gl.TEXTURE1);
        // activate shader program
        this._shaderProgram.bind();

        // activate, render and deactivate the screen-aligned quad
        this._quad.bind();
        this._quad.draw();
        this._quad.unbind();

        // deactivate shader program
        this._shaderProgram.unbind();
        // deactivate textures
        this._textureA.unbind(this._gl.TEXTURE0);
        this._textureB.unbind(this._gl.TEXTURE1);
    }
}
