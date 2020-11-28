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

    // webgl data
    protected _texture: Texture2D;

    // input data
    protected _imageA: Jimp;
    protected _imageB: Jimp;

    // mixed image
    protected _mixed: Jimp;

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

    // initializes a WebGL texture
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

    // blends to images together
    private mixImages(): void {
        if(this._imageA.getWidth() !== this._imageB.getWidth() ||
            this._imageA.getHeight() !== this._imageB.getHeight()
        ) {
            console.log('different size!');
            return;
        }

        const width = this._imageA.getWidth();
        const height = this._imageA.getHeight();

        this._mixed = new Jimp(width, height);

        // helper function for mixing colors together
        const factor = 0.5;
        const mix = (a: number, b: number): number => {
            return a * factor + b * (1 - factor);
        };

        enum Mode {
            GetSet = 0,
            ArrayXY = 1,
            ArrayLinear = 2
        }
        // choose implementation
        const mode = 2;

        console.time('blend');
        switch (mode) {
            // slower implementation using getter and setter
            case Mode.GetSet: {
                for(let x = 0; x < width; x++) {
                    for(let y = 0; y < height; y++) {
                        const a = Jimp.intToRGBA(
                            this._imageA.getPixelColor(x, y));
                        const b = Jimp.intToRGBA(
                            this._imageB.getPixelColor(x, y));
        
                        const mixed = {
                            r: mix(a.r, b.r),
                            g: mix(a.g, b.g),
                            b: mix(a.b, b.b),
                            a: mix(a.a, b.a),
                        };
        
                        this._mixed.setPixelColor(
                            Jimp.rgbaToInt(mixed.r, mixed.g, mixed.b, mixed.a),
                            x, y);
                    }
                }
                break;
            }
            // faster implementation: access image buffer directly
            case Mode.ArrayXY: {
                for(let x = 0; x < width; x++) {
                    for(let y = 0; y < height; y++) {
                        const offset = (y * width + x) * 4;
                        this._mixed.bitmap.data[offset + 0] = mix(
                            this._imageA.bitmap.data[offset + 0],
                            this._imageB.bitmap.data[offset + 0]);
                        this._mixed.bitmap.data[offset + 1] = mix(
                            this._imageA.bitmap.data[offset + 1],
                            this._imageB.bitmap.data[offset + 1]);
                        this._mixed.bitmap.data[offset + 2] = mix(
                            this._imageA.bitmap.data[offset + 2],
                            this._imageB.bitmap.data[offset + 2]);
                        this._mixed.bitmap.data[offset + 3] = mix(
                            this._imageA.bitmap.data[offset + 3],
                            this._imageB.bitmap.data[offset + 3]);
                    }
                }
                break;
            }
            // simpler implementation for array access (and a bit faster)
            case Mode.ArrayLinear: {
                const length = width * height * 4;
                for(let i = 0; i < length; i++) {
                    this._mixed.bitmap.data[i] = mix(
                        this._imageA.bitmap.data[i],
                        this._imageB.bitmap.data[i]);
                }
                break;
            }
            default:
                break;
        }
        console.timeEnd('blend');

        this.updateImage(this._mixed, this._texture);
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
        frag.initialize(require('../../../../common/code/img.frag'));

        // create program and initialize it with the prepared shaders
        this._shaderProgram = new Program(context);
        this._shaderProgram.initialize([vert, frag], false);

        // connect the quad's vertex locations to the shader attribute
        this._shaderProgram.attribute('a_vertex', this._quad.vertexLocation);
        this._shaderProgram.link();

        // fetch uniform locations, set used texture unit
        this._shaderProgram.bind();
        this._uTexture = this._shaderProgram.uniform('u_texture');
        this._gl.uniform1i(this._uTexture, 0);
        this._shaderProgram.unbind();

        // init textures
        this._texture = this.initTexture();

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
            if(this._imageB !== undefined) this.mixImages();
            this._textureAChanged = false;
        }
        if (this._textureBChanged) {
            if(this._imageA !== undefined) this.mixImages();
            this._textureBChanged = false;
        }
    }

    protected onFrame(): void {
        // only render if image is ready
        if(!this._mixed) return;

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
