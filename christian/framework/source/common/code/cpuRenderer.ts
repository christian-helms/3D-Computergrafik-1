import Jimp from 'jimp';

import { Renderer } from 'webgl-operate';

export class CpuRenderer extends Renderer {
    protected _canvas: HTMLCanvasElement;
    protected _context2d: CanvasRenderingContext2D;
    protected _image: HTMLImageElement;
    protected _imageSrc: string;
    protected _algorithm: (img: Jimp) => void;
    protected _pixelSize = 1;

    public isCpuRenderer = true;

    public constructor() {
        super();

        this._canvas = document
            .getElementById('webgl-canvas') as HTMLCanvasElement;
        this._context2d = this._canvas.getContext('2d');

        this._image = new Image(100, 100);

        this._image.onload = () => {
            this._canvas.width = this._canvas.clientWidth;
            this._canvas.height = this._canvas.clientHeight;
            this._context2d.fillRect(
                0, 0, this._canvas.width, this._canvas.height);
            this._context2d.imageSmoothingEnabled = false;
            this._context2d.drawImage(
                this._image, 0, 0);
        };

        window.addEventListener('resize', () => {
            this.reprocess();
        });

    }

    protected loadImage(src: string): void {
        this._imageSrc = src;
        this.process(src);
    }

    protected process(src: string): void {
        Jimp.read(src).then( (img) => {
            img.cover(
                this._canvas.clientWidth, this._canvas.clientHeight);
            const pixelSize = this._pixelSize > 1 ? this._pixelSize : 1;
            img.scale( 1 / pixelSize );

            this._algorithm(img);

            img.contain(
                this._canvas.clientWidth, this._canvas.clientHeight,
                undefined, Jimp.RESIZE_NEAREST_NEIGHBOR);
            img.getBase64(Jimp.MIME_PNG, (err, src) => {
                this._image.src = src;
            });
        });
    }

    protected reprocess(): void {
        this.process(this._imageSrc);
    }

    protected onInitialize(): boolean {
        return true;
    }

    protected onUninitialize(): void {
    }

    protected onUpdate(): boolean {
        return true;
    }

    protected onPrepare(): void {
    }

    protected onFrame(): void {
    }

    protected onDiscarded(): void {
    }
}
