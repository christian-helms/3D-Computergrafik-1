import { Controls } from '../../../../common/code/uiHelper';
import { CpuRenderer } from '../../../../common/code/cpuRenderer';

import Jimp from 'jimp';
import { TileCameraGenerator } from 'webgl-operate';

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
            'Pixelgröße', undefined, 2,
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

    protected toBWPicture(img: Jimp, fun: (pixel: any) => number): void {
        for (let x = 0; x < img.getWidth(); x++)
            for (let y = 0; y < img.getHeight(); y++) {
                const tmp = Jimp.intToRGBA(img.getPixelColor(x, y));
                const brightness = fun(tmp);
                const ncolor = Jimp.rgbaToInt(brightness,
                    brightness, brightness, 255);
                img.setPixelColor(ncolor, x, y);
            }
    }

    // Convert the image into a gray scale image
    // by averaging the color channels.
    protected averageGray(img: Jimp): void {
        this.toBWPicture(img, (pixel) => {
            return (pixel.r + pixel.g + pixel.b) / 3;
        });
    }

    // Convert the image into a gray scale image by weighting the color channels
    // to get image better representing human luminance perception.
    protected weightedGray(img: Jimp): void {
        this.toBWPicture(img, (pixel) => {
            return 0.2126 * pixel.r + 0.7152 * pixel.g + 0.0722 * pixel.b;
        });
    }

    // Convert the image into a black-and-white image by thresholding.
    // (You might want to convert it to a gray scale image first.)
    protected threshold(img: Jimp): void {
        this.weightedGray(img);
        this.toBWPicture(img, (pixel) => {
            return (pixel.r > 127) ? 255 : 0;
        });
    }

    // Convert the image into a black-and-white image with error diffusion
    // as described by Floyd and Steinberg.
    // (You might want to convert it to a gray scale image first.)
    protected floydSteinberg(img: Jimp): void {
        this.weightedGray(img);
        const brightnesses: number[] = [];
        for (let y = 0; y < img.getHeight(); y++)
            for (let x = 0; x < img.getWidth(); x++)
                brightnesses.push(Jimp.intToRGBA(
                    img.getPixelColor(x, y)).r);

        for (let y = 0; y < img.getHeight(); y++)
            for (let x = 0; x < img.getWidth(); x++) {
                const newpixel = (brightnesses[y * img.getWidth() + x] >
                    127) ? 255 : 0;
                const quanterror = brightnesses[y * img.getWidth() + x] -
                    newpixel;
                const ncolor = Jimp.rgbaToInt(newpixel,
                    newpixel, newpixel, 255);
                img.setPixelColor(ncolor, x, y);

                if (y + 1 < img.getHeight())
                    brightnesses[(y + 1) * img.getWidth() + x] +=
                        7 * quanterror / 16;
                if (x + 1 < img.getWidth())
                    brightnesses[y * img.getWidth() + x + 1] +=
                        5 * quanterror / 16;
                if (x + 1 < img.getWidth() && y + 1 < img.getHeight())
                    brightnesses[(y + 1) * img.getWidth() + (x + 1)] +=
                        quanterror / 16;
                if (x - 1 >= 0 && y + 1 < img.getHeight())
                    brightnesses[(y + 1) * img.getWidth() + x - 1] +=
                        3 * quanterror / 16;
            }
    }
}
