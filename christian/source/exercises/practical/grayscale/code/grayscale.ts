import { Controls } from '../../../../common/code/uiHelper';
import { CpuRenderer } from '../../../../common/code/cpuRenderer';

import Jimp from 'jimp';

export class GrayscaleRenderer extends CpuRenderer {

    protected _controls: Controls;
    protected _algorithms = [
        { name: 'Original', function: this.original.bind(this) },
        { name: 'Grau: Durchschnitt', function: this.averageGray.bind(this) },
        { name: 'Grau: Gewichtet', function: this.weightedGray.bind(this) },
        { name: 'Schwellwert', function: this.threshold.bind(this) },
        { name: 'Floyd-Steinberg', function: this.floydSteinberg.bind(this) },
        // add more algorithms if you want :D
    ];

    public constructor() {
        super();

        // add controls to the web site
        this._controls = new Controls();

        // Create a select list input.
        // The second parameter is a string[] created from the algorithms[]
        const algorithmInput = this._controls.createSelectListInput(
            'Algorithmus',
            this._algorithms.map((e) => e.name));
        // set first algorithm as default
        this._algorithm = this._algorithms[0].function;

        // add change event listener to algorithm input element
        algorithmInput.addEventListener('change', (event: InputEvent) => {
            // get the index of the selected entry
            const idx = (event.target as HTMLSelectElement).selectedIndex;
            // set the algorithm to the newly selected one
            this._algorithm = this._algorithms[idx].function;
            // re-process the image
            this.reprocess();
        });

        // creat input to control the displayed pixel size
        const pixelSizeInput = this._controls.createNumberInput(
            'Pixelgröße', undefined, 1,
            'skaliert das Bild kleiner, um einzelne Pixel erkennbar zu machen',
            1);
        // read defaut pixel size from input element
        this._pixelSize = parseInt(pixelSizeInput.value, 10);

        // add change event listener to pixel size input element
        pixelSizeInput.addEventListener('change', (event: InputEvent) => {
            // read the new value and set the pixel size
            this._pixelSize = parseInt(
                (event.target as HTMLInputElement).value, 10);
            // re-process the image
            this.reprocess();
        });

        // create file input to allow testing of custom images
        const fileInput = this._controls.createFileInput(
            'Eingabebild', 'image/png, image/jpeg');

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
                this.loadImage(dataURL as string);
            };
            // start loading the image
            reader.readAsDataURL(file);
        });

        // add more inputs if you like :D

        // load the default image
        this.loadImage('img/input/platypus.png');
    }

    protected onDiscarded(): void {
    }

    // Keep the image as is.
    protected original(): void {
        // done
    }

    // Convert the image into a gray scale image
    // by averaging the color channels.
    protected averageGray(img: Jimp): void {
        // TODO: implement this function
        const num_pixels = img.getWidth() * img.getHeight();
        for (let i = 0; i < num_pixels; ++i) {
            let sum = 0;
            for (let j = 0; j < 3; ++j)
                sum += img.bitmap.data[4 * i + j];
            const avg = sum / 3.0;
            for (let j = 0; j < 3; ++j)
                img.bitmap.data[4 * i + j] = avg;
        }
    }

    // Convert the image into a gray scale image by weighting the color channels
    // to get image better representing human luminance perception.
    protected weightedGray(img: Jimp): void {
        // TODO: implement this function
        const weight = [0.2126, 0.7152, 0.0722];
        const num_pixels = img.getWidth() * img.getHeight();
        for (let i = 0; i < num_pixels; ++i) {
            let val = 0;
            for (let j = 0; j < 3; ++j)
                val += weight[j] * img.bitmap.data[4 * i + j];
            for (let j = 0; j < 3; ++j)
                img.bitmap.data[4 * i + j] = val;
        }
    }

    // Convert the image into a black-and-white image by thresholding.
    // (You might want to convert it to a gray scale image first.)
    protected threshold(img: Jimp): void {
        // TODO: implement this function
        this.weightedGray(img);
        const num_pixels = img.getWidth() * img.getHeight();
        const threshold = 127;
        for (let i = 0; i < num_pixels; ++i) {
            let val = 0;
            if (img.bitmap.data[4 * i] > threshold)
                val = 255;
            for (let j = 0; j < 3; ++j)
                img.bitmap.data[4 * i + j] = val;
        }
    }

    // Convert the image into a black-and-white image with error diffusion
    // as described by Floyd and Steinberg.
    // (You might want to convert it to a gray scale image first.)
    protected floydSteinberg(img: Jimp): void {
        this.weightedGray(img);
        const table: Array<Array<number>> = [[0, 1, 7, 16], [1, -1, 3, 16],
        [1, 0, 5, 16], [1, 1, 1, 16]];
        // TODO: implement this function
        const threshold = 127;
        const W = img.getWidth();
        const H = img.getHeight();
        for (let row = 0; row < H; ++row) {
            for (let col = 0; col < W; ++col) {
                const val = img.bitmap.data[4 * (row * W + col)];
                const color = (val > threshold ? 255 : 0);
                const error: number = val - color;
                for (let i = 0; i < 3; ++i)
                    img.bitmap.data[4 * (row * W + col) + i] = color;
                table.forEach(element => {
                    let i, j, n, d;
                    [i, j, n, d] = element;
                    if (0 <= row + i && row + i < H 
                        && 0 <= col + j && col + j < W)
                        img.bitmap.data[4 * ((row * W + i) + col + j)] 
                        += error * (n / d);
                });
            }
        }
    }
}
