import {
    Canvas,
    Initializable,
    Renderer,
} from 'webgl-operate';

export class ExerciseRunner extends Initializable {

    private _canvas: Canvas;
    private _renderer: Renderer;

    public initialize(element: string, renderer: Renderer): boolean {
        // just cast to any - if there are attributes, they've been added by
        // JavaScript code and are unsafe anyway
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const options = (renderer as any).contextAttributes ?? {};
        this._canvas = new Canvas(element, options);

        this._renderer = renderer;
        this._canvas.renderer = this._renderer;

        return true;
    }

    public uninitialize(): void {
        this._canvas.dispose();
        this._renderer.uninitialize();
    }

    public get canvas(): Canvas {
        return this._canvas;
    }

    public get renderer(): Renderer {
        return this._renderer;
    }
}
