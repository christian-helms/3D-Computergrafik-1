import {
    Context,
    DefaultFramebuffer,
    Program,
    Renderer,
} from 'webgl-operate';

import {
    Controls,
} from '../../../../common/code/uiHelper';

import Jimp from 'jimp';
import { RenderPass } from './renderPass';
import { blur } from './blur';
import { gpu } from './gpu';
import { laplace } from './laplace';
import { sharpen } from './sharpen';

interface Algorithm {
    name: string;
    cpu: () => void;
    gpu: Program;
}

export class CpuGpuRenderer extends Renderer {
    // WebGL context
    protected _context: Context;
    protected _canvas: HTMLElement;

    // interactivity - control helper and data for selection menus
    protected _controls: Controls;
    protected _images: Map<string, string> = new Map<string, string>([
        // ['Mike', 'img/assignment1/mike.jpg'],
        ['Schnabeltier', 'img/input/platypus.png'],
        ['Blume', 'img/input/flower.png'],
        ['Kürbisse', 'img/input/pumpkins.jpg'],
    ]);
    protected _algorithms: Array<Algorithm>;

    // image buffers
    protected _rawImage: Jimp;
    protected _inputImage: Uint8Array;
    protected _outputImage: Uint8Array;

    // image resolution for looping over buffers
    protected _imageWidth: number;
    protected _imageHeight: number;

    // indicating if inputs have changed, requiring recalculation
    protected _inputChanged: boolean;

    // currently selected cpu processing function
    protected _currentCpuFunction: () => void;

    // radius for blur effect
    protected _blurRadius = 5;

    // the framebuffer to render to
    protected _fbo: DefaultFramebuffer;

    // render pass handling all WebGL calls
    protected _renderPass: RenderPass;

    /**
     * Loads a texture from a path and sets it as the currently active texture.
     * @param path - the path to the texture to be loaded
     */
    private loadTexture(path: string): void {
        // use Jimp library to load image, pass callback to handle result
        Jimp.read(path).then((img) => {
            // store the image
            this._rawImage = img;
            // WebGL expects the texture to start in bottom-left corner
            this._rawImage.flip(false, true);
            // resize the image to the canvas' size
            this.resizeTexture();
        });
    }

    /**
     * Resizes the active texture based on the canvas size.
     */
    private resizeTexture(): void {
        // if the GPU texture isn't initialized, we'll do that first
        this._renderPass.initTexture();

        // copy image for resizing
        const img = new Jimp(this._rawImage);

        // resize image to fill canvas, cropping if necessary
        img.cover(this._canvasSize[0], this._canvasSize[1]);
        // strip out alpha channel
        const withoutAlpha = img.bitmap.data.filter((v, i) => i % 4 !== 3);
        // copy image to input and output image buffer
        this._inputImage = withoutAlpha;
        this._outputImage = new Uint8Array(withoutAlpha.length);
        // store width and height for looping over image
        this._imageWidth = img.bitmap.width;
        this._imageHeight = img.bitmap.height;

        // make sure a new frame is calculated
        this.invalidate(true);
        this._inputChanged = true;
    }

    /**
     * Initializes and sets up buffer, render pass and controls.
     * @param context - valid context to create the object for.
     * @returns - whether initialization was successful
     */
    protected onInitialize(context: Context): boolean {
        // store context
        this._context = context;
        this._canvas = document.getElementById('webgl-canvas');

        // set up framebuffer
        this._fbo = new DefaultFramebuffer(this._context);
        this._fbo.initialize();

        this._renderPass = new RenderPass(context);
        this._renderPass.initialize();
        this._renderPass.target = this._fbo;

        // the image may have a uneven number of bytes per line due to having
        // three bytes per pixel - make sure WebGL is set up to load textures
        // byte by byte
        this._context.gl.pixelStorei(this._context.gl.UNPACK_ALIGNMENT, 1);

        // all the different filter operations available
        this._algorithms = [{
            name: 'Original',
            cpu: gpu.bind(this),
            gpu: this._renderPass.cpu,
        }, {
            name: 'Sharpen - CPU',
            cpu: sharpen.bind(this),
            gpu: this._renderPass.cpu,
        }, {
            name: 'Sharpen - GPU',
            cpu: gpu.bind(this),
            gpu: this._renderPass.sharpen,
        }, {
            name: 'Blur - CPU',
            cpu: blur.bind(this),
            gpu: this._renderPass.cpu,
        }, {
            name: 'Blur - GPU',
            cpu: gpu.bind(this),
            gpu: this._renderPass.blur,
        }, {
            name: 'Laplace - CPU',
            cpu: laplace.bind(this),
            gpu: this._renderPass.cpu,
        }, {
            name: 'Laplace - GPU',
            cpu: gpu.bind(this),
            gpu: this._renderPass.laplace,
        }];

        // initialize controls
        this._controls = new Controls();

        // create selection for image source
        const imageControl = this._controls.createSelectListInput(
            'Eingabebild', Array.from(this._images.keys()));

        // add a callback to be called once a different image is selected
        imageControl.addEventListener('change', (event: InputEvent) => {
            // get selected image and load it
            this.loadTexture(this._images.get(
                (event.target as HTMLInputElement).value));
        });

        // create file input to allow testing of custom images
        const fileInput = this._controls.createFileInput(
            'Eigenes Eingabebild hochladen', 'image/png, image/jpeg');

        // add change event listener to file input element
        fileInput.addEventListener('change', (event: InputEvent) => {
            // get the first selected file
            const file = (event.target as HTMLInputElement).files[0];
            // if no file was selected: don't do anything
            if (!file) {
                return;
            }
            // create FileReader
            const reader = new FileReader();
            // define what should happen as soon as the image is fully loaded
            reader.onload = () => {
                // get the internal url referencing the image
                const dataURL = reader.result;
                // load (and process) the new image
                this.loadTexture(dataURL as string);
            };
            // start loading the image
            reader.readAsDataURL(file);
        });

        // create selection for mode
        const modeControl = this._controls.createSelectListInput(
            'Algorithmus', Array.from(this._algorithms, (a) => a.name),
        );

        // add a callback to be called once a different image is selected
        modeControl.addEventListener('change', (event: InputEvent) => {
            // get selected algorithm
            const algorithm = this._algorithms[
                (event.target as HTMLSelectElement).selectedIndex];
            // set current CPU and GPU function
            this._currentCpuFunction = algorithm.cpu;
            this._renderPass.active = algorithm.gpu;

            // make sure a new frame is calculated
            this.invalidate(true);
            this._inputChanged = true;
        });

        // create slider for blur radius
        const radiusControl = this._controls.createSliderInput(
            'Unschärferadius', undefined, 3, undefined, 0, 20, 1);

        // add a callback to be called when the slider is dragged
        radiusControl.addEventListener('input', (event: InputEvent) => {
            // update blur radius based on input
            this._blurRadius = Number((event.target as HTMLInputElement).value);

            // make sure a new frame is calculated
            this.invalidate(true);
            this._inputChanged = true;
        });

        // initially load the first texture and first algorithm
        this.loadTexture(this._images.get(imageControl.value));
        const algorithm = this._algorithms[modeControl.selectedIndex];
        this._currentCpuFunction = algorithm.cpu;
        this._renderPass.active = algorithm.gpu;

        return true;
    }

    /**
     * Uninitializes buffers, geometry and program.
     */
    protected onUninitialize(): void {
        super.uninitialize();

        this._renderPass.uninitialize();
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
        return this._altered.any || this._inputChanged;
    }

    /**
     * This is invoked in order to prepare rendering of one or more frames,
     * regarding multi-frame rendering and camera-updates.
     */
    protected onPrepare(): void {
        // if the canvas was resized, we'll have to resize the image too
        if (this._rawImage !== undefined &&
            (this._canvasSize[0] !== this._imageWidth ||
                this._canvasSize[1] !== this._imageHeight)
        ) {
            console.log(this._canvasSize[0], this._imageWidth);
            this.resizeTexture();
            this._inputChanged = true;
        }

        // if the input was changed, we'll have to recalculate
        if (this._inputChanged) {
            // call the CPU function to calculate the output image
            this._currentCpuFunction();

            // upload the output image to the GPU
            this._renderPass.updateImage(
                this._imageWidth, this._imageHeight, this._outputImage);

            // reset the change tracker
            this._inputChanged = false;
        }
    }

    /**
     * This is invoked after both onUpdate and onPrepare and should be used to
     * do the actual rendering.
     */
    protected onFrame(): void {
        // set camera viewport to canvas size
        this._context.gl.viewport(
            0, 0, this._canvasSize[0], this._canvasSize[1]);

        // request new frame from render pass
        this._renderPass.frame(
            this._imageWidth, this._imageHeight, this._blurRadius);
    }

    protected onSwap(): void { }

    protected onDiscarded(): void { }
}
