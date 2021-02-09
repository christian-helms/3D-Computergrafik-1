import {
    Camera,
    Color,
    Context,
    DefaultFramebuffer,
    EventProvider,
    Invalidate,
    Navigation,
    Renderer,
    vec3
} from 'webgl-operate';

import { Controls } from '../../../../common/code/uiHelper';
import { Heightmap } from './map';
import { HeightmapPass } from './heightmapPass';
import { ZoomNavigation } from '../../../../common/code/zoom';
export class HeightmapRenderer extends Renderer {
    protected _maps: Heightmap[] = require('./maps.json');

    protected _context: Context;
    protected _gl: WebGL2RenderingContext;

    protected _camera: Camera;
    protected _navigation: Navigation;
    protected _fbo: DefaultFramebuffer;
    protected _controls: Controls;

    protected _pass: HeightmapPass;

    protected onInitialize(
        context: Context,
        callback: Invalidate,
        eventProvider: EventProvider
    ): boolean {
        this._context = context;
        this._gl = context.gl as WebGL2RenderingContext;

        this._fbo = new DefaultFramebuffer(context);
        this._fbo.initialize();

        // init camera and navigation
        this._camera = new Camera();
        this._camera.center = vec3.fromValues(0.0, -0.2, 0.0);
        this._camera.up = vec3.fromValues(0.0, 1.0, 0.0);
        this._camera.eye = vec3.fromValues(0.5, 0.5, 1.0);
        this._camera.near = 0.1;
        this._camera.far = 8.0;

        this._navigation = new ZoomNavigation(
            callback, eventProvider, { default: 3.0, min: 3.0, max: 20.0 });
        this._navigation.camera = this._camera;

        this._pass = new HeightmapPass(context);
        this._pass.initialize();
        this._pass.camera = this._camera;
        this._pass.invalidate = this.invalidate.bind(this);

        this.setupControls();

        return true;
    }
    protected setupControls(): void {
        this._controls = new Controls();

        const createSlider = (
            label: string, value: number, min: number, max: number,
            step: number, cb: (v: number) => void
        ): HTMLInputElement => {
            const input = this._controls.createSliderInput(
                label, undefined, value, undefined, min, max, step);
            input.addEventListener('input', () => {
                cb(Number(input.value));
                this.invalidate();
            });
            cb(Number(input.value));
            return input;
        };

        const createColor = (
            label: string, value: string, cb: (v: vec3) => void
        ): HTMLInputElement => {
            const input = this._controls.createColorInput(label);
            input.value = value;
            input.addEventListener('change', () => {
                cb(Color.hex2rgba(input.value).slice(0, 3) as vec3);
                this.invalidate();
            });
            cb(Color.hex2rgba(input.value).slice(0, 3) as vec3);
            return input;
        };

        const createHeightColor = (
            id: number
        ): { color: HTMLInputElement, height: HTMLInputElement } => {
            const color = createColor(
                `Color ${id}`, '000000',
                (v: vec3) => this._pass.setHeightColor(id, v));
            const height = createSlider(
                `Color ${id} height`, 0, 0, 1, 0.01,
                (v: number) => this._pass.setHeightColorHeight(id, v));
            return { color, height };
        };

        const mapSelect = this._controls.createSelectListInput(
            'Terrain', this._maps.map((entry) => entry.name));
        const selectMap = (index: number): void => {
            const map = this._maps[index];
            this._pass.heightMap = map;
            colorInputs.forEach((c, i) => {
                c.height.value = map.heightColors[4 - i].height.toString();
                c.color.value = map.heightColors[4 - i].color;
            });
        };
        mapSelect.addEventListener('change', () => {
            selectMap(mapSelect.selectedIndex);
        });

        const terResInput = this._controls.createNumberInput(
            'Terrain resolution', undefined, 512, undefined, 2, 4096, 1);
        terResInput.addEventListener('change', () => {
            this._pass.terrainResolution = Number(terResInput.value);
            this.invalidate();
        });
        this._pass.terrainResolution = Number(terResInput.value);

        createSlider(
            'Height scale', 0.2, 0, 1, 0.01,
            (v) => this._pass.heightScale = v);
        createSlider(
            'Contour line count', 12, 1, 20, 1,
            (v) => this._pass.contourLineCount = v);
        createSlider(
            'Contour line opacity', 1, 0, 1, 0.01,
            (v) => this._pass.contourLineOpacity = v);

        const colorInputs = Array.from(
            { length: 5 },
            (_, i) => createHeightColor(4 - i)
        );

        selectMap(mapSelect.selectedIndex);
    }

    protected onUninitialize(): void {
        super.uninitialize();
        this._fbo.uninitialize();
        this._pass.uninitialize();
    }

    protected onUpdate(): boolean {
        this._navigation.update();

        return this._altered.any || this._camera.altered || this._pass.altered;
    }

    /**
     * This is invoked in order to prepare rendering of one or more frames,
     * regarding multi-frame rendering and camera-updates.
     */
    protected onPrepare(): void {
        if (this._altered.canvasSize) {
            this._camera.aspect = this._canvasSize[0] / this._canvasSize[1];
            this._camera.viewport = [this._canvasSize[0], this._canvasSize[1]];
        }

        if (this._altered.clearColor) {
            this._fbo.clearColor(this._clearColor);
        }

        this._pass.prepare();

        this._altered.reset();
        this._camera.altered = false;
    }

    protected onFrame(): void {
        this._fbo.bind();
        this._fbo.clear(
            this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT, true, false);

        this._gl.viewport(0, 0, this._frameSize[0], this._frameSize[1]);

        this._pass.frame();
    }

    protected onSwap(): void { }

    protected onDiscarded(): void { }
}
