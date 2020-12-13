import {
    BlitPass,
    Context,
    DefaultFramebuffer,
    Framebuffer,
    Renderer,
    Texture2D,
} from 'webgl-operate';

import { CirclePass } from './circlePass';
import { Controls } from '../../../../common/code/uiHelper';
import { GraphPass } from './graphPass';

enum Mode {
    FansAndGraph = 'Dreiecksfächer und Graph',
    OnlyFans = 'Nur Dreiecksfächer',
    OnlyGraph = 'Nur Graph'
}

enum State {
    Setup,
    Warmup,
    Running
}

type Benchmark = {
    countId: number,
    resId: number,
    start: number,
    end: number,
    state: State,
    frameCount: number
}

export class PerformanceRenderer extends Renderer {
    // underlying WebGL context
    protected _gl: WebGLRenderingContext;

    // render passes
    protected _benchmarkPass: CirclePass;
    protected _graphPass: GraphPass;
    protected _blitPass: BlitPass;

    // interactivity - control helper
    protected _controls: Controls;

    // the framebuffers to render to and underlying textures
    protected _outputFBO: DefaultFramebuffer;
    protected _circleFBO: Framebuffer;
    protected _circleTex: Texture2D;
    protected _graphFBO: Framebuffer;
    protected _graphTex: Texture2D;

    // choose what should be shown
    protected _mode = Mode.FansAndGraph;

    // canvas resolution for visible rendering
    protected _viewRes = 2048;

    // === benchmark configuration ===
    // canvas resolutions for benchmark
    protected _resolutions = [
        256, 512
    ];
    // vertex counts for benchmark
    protected _vertexCounts = [
        3, 4, 5, 6, 7, 9, 11, 15, 20, 35
    ];
    // how many fans will be rendered each frame
    protected _instances = 1e3;
    // how many frames will be rendered before each actual benchmark run
    protected _warmup = 1e1;
    // how many frames will be rendered for each benchmark run
    protected _frames = 1e1;

    // for managing benchmarking configurations
    protected _queue: Benchmark[];
    protected _active: Benchmark;
    protected _done: Benchmark[] = [];

    protected onInitialize(context: Context): boolean {
        // store rendering context
        this._gl = context.gl as WebGLRenderingContext;

        // set up framebuffer for display
        this._outputFBO = new DefaultFramebuffer(context);
        this._outputFBO.initialize();
        this._outputFBO.clearColor([0, 0, 0, 1]);

        // prepare circle rendering
        this._circleTex = new Texture2D(this._context);
        this._circleTex.initialize(
            1, 1, this._gl.RGBA, this._gl.RGBA, this._gl.UNSIGNED_BYTE);
        this._circleFBO = new Framebuffer(context);
        this._circleFBO.initialize([
            [this._gl.COLOR_ATTACHMENT0, this._circleTex],
        ]);
        this._circleFBO.clearColor([0.2, 0.2, 0.2, 1]);
        this._benchmarkPass = new CirclePass(context);
        this._benchmarkPass.initialize();
        this._benchmarkPass.target = this._circleFBO;

        // prepare graph rendering
        this._graphTex = new Texture2D(this._context);
        this._graphTex.initialize(
            this._viewRes, this._viewRes,
            this._gl.RGBA, this._gl.RGBA, this._gl.UNSIGNED_BYTE);
        this._graphFBO = new Framebuffer(context);
        this._graphFBO.initialize([
            [this._gl.COLOR_ATTACHMENT0, this._graphTex],
        ]);
        this._graphFBO.clearColor([0.2, 0.2, 0.2, 1]);
        this._graphPass = new GraphPass(context);
        this._graphPass.initialize();
        this._graphPass.target = this._graphFBO;

        // prepare blit pass for copying results to output
        this._blitPass = new BlitPass(context);
        this._blitPass.initialize();
        this._blitPass.readBuffer = this._gl.COLOR_ATTACHMENT0;
        this._blitPass.filter = this._gl.LINEAR;
        this._blitPass.target = this._outputFBO;
        this._blitPass.drawBuffer = this._gl.BACK;

        // initialize controls
        this._controls = new Controls();

        // slider for manual vertex count configuration
        const vertexSlider = this._controls.createSliderInput(
            'Anzahl Vertices', undefined, 5, undefined, 3, 35);
        vertexSlider.addEventListener('input', () => {
            this._benchmarkPass.numOuterVertices = Number(vertexSlider.value);
            this._invalidate(true);
        });
        this._benchmarkPass.numOuterVertices = Number(vertexSlider.value);

        // button to run the benchmark
        const startButton = this._controls.createActionButton(
            'Benchmark starten');
        startButton.addEventListener('click', () => this.runBenchmark());

        // for changing the view mode
        const modeSelect = this._controls.createSelectListInput(
            'Anzeigemodus', Object.values(Mode));
        modeSelect.addEventListener('change', () => {
            this._mode = Object.values(Mode)
                .find((k) => k === modeSelect.value);
            this.invalidate(true);
        });

        return true;
    }

    /**
     * Starts the benchmark by generation a queue of configs.
     */
    protected runBenchmark(): void {
        console.log('staring benchmarks');
        console.log(
            'settings:',
            this._warmup, 'frames',
            this._frames, 'benchmark frames',
            this._instances, 'instances');

        this._queue = [];

        this._resolutions.forEach((r, ri) => {
            this._vertexCounts.forEach((c, ci) => {
                this._queue.push({
                    countId: ci,
                    resId: ri,
                    frameCount: 0,
                    start: 0,
                    end: 0,
                    state: State.Setup,
                });
            });
        });

        this._active = this._queue.shift();
        this._invalidate(true);
    }

    /**
     * Cleans up afterwards.
     */
    protected onUninitialize(): void {
        super.uninitialize();

        this._benchmarkPass.uninitialize();
        this._circleFBO.uninitialize();
        this._circleTex.uninitialize();

        this._graphPass.uninitialize();
        this._graphFBO.uninitialize();
        this._graphTex.uninitialize();

        this._outputFBO.uninitialize();
    }

    /**
     * Tells the framework if a new frame should be rendered.
     * As we only call invalidate when we need a new frame, just return true.
     */
    protected onUpdate(): boolean {
        return true;
    }

    /**
     * Prepares the passes for rendering.
     * If a benchmark is currently running, this is done externally.
     */
    protected onPrepare(): void {
        if(this._active) {
            return;
        }
        this._benchmarkPass.prepare();
        this._graphPass.prepare();
    }

    /**
     * Renders both the triangle fan and the graph to the screen.
     */
    protected onFrame(): void {
        // check if there is a benchmark running
        if(this._active) {
            this.benchmarkFrame();
            this.invalidate(true);

            if(!this._active) {
                console.log('all benchmarks done! summary:');
                console.log(
                    'w' + this._warmup +
                    ' f' + this._frames +
                    ' i' + this._instances + '\n' +
                    this._done.map((b) => {
                        return 'r' + this._resolutions[b.resId] +
                        ' v' + this._vertexCounts[b.countId] +
                        ' t' + (b.end-b.start);
                    }).join('\n')
                );
                this._done = [];
            }
            return;
        }

        // make sure output has proper resolution, is not some benchmark value
        this._circleTex.resize(this._viewRes, this._viewRes);
        this._benchmarkPass.target = this._circleFBO;
        // and only render one triangle fan, not thousands as in the benchmark
        this._benchmarkPass.instances = 1;
        this._benchmarkPass.frame();

        this._graphPass.target = this._graphFBO;
        this._graphPass.frame();
    }

    /**
     * Copies the intermediate buffers to the output buffer, based on mode.
     */
    protected show(): void {
        this._outputFBO.clear(
            this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);
        switch (this._mode) {
            case Mode.FansAndGraph:
                this.showBoth();
                break;
            case Mode.OnlyFans:
                this.showOne(this._circleFBO);
                break;
            case Mode.OnlyGraph:
                this.showOne(this._graphFBO);
                break;
            // no default
        }
    }

    /**
     * Frame callback while benchmark is running.
     */
    protected benchmarkFrame(): void {
        // fetch currently active benchmark config for easier use
        const b = this._active;

        switch (b.state) {
            case State.Setup: {
                // first, the config has to be applied
                const r = this._resolutions[b.resId];
                this._circleTex.resize(r, r);
                this._benchmarkPass.instances = this._instances;
                const c = this._vertexCounts[b.countId];
                this._benchmarkPass.numOuterVertices = c;
                this._benchmarkPass.prepare();
                console.log('starting warmup for res =', r, 'and c =', c);
                b.state = State.Warmup;
                break;
            }
            case State.Warmup: {
                // then, a specified number of frames is rendered to make sure
                // no one gets a cold start
                this._benchmarkPass.frame();
                if(b.frameCount++ >= this._warmup) {
                    // warmup done, reset counter and start timer
                    console.log('warmup finished, starting benchmark');
                    b.state = State.Running;
                    b.frameCount = 0;
                    b.start = performance.now();
                }
                break;
            }
            case State.Running: {
                // run the timed frames
                this._benchmarkPass.frame();
                if(b.frameCount++ >= this._frames) {
                    // benchmark for this config done, stop timer
                    b.end = performance.now();
                    const t = b.end - b.start;
                    console.log(
                        'finished in', t,
                        'ms, avg', t / this._frames, 'ms/frame');
                    // move current config to done list, activate next
                    this._done.push(b);
                    this._active = this._queue.shift();
                    // and send the values to the graph for immediate updates
                    this.updateGraph();
                }
                break;
            }
            // no default
        }
    }

    /**
     * Called by the framework when the output buffer should be updated.
     */
    protected onSwap(): void {
        this.show();
    }

    /**
     * Send new date to teh graph pass.
     */
    protected updateGraph(): void {
        // prepare output array
        const rl = this._resolutions.length;
        const cl = this._vertexCounts.length;
        const data = new Array<number>(rl * cl);
        data.fill(0);

        // fill array by looping over all currently finished configs
        this._done.forEach((d) => {
            data[d.resId * cl + d.countId] = (d.end - d.start) / this._frames;
        });

        // hand over data
        this._graphPass.samples = data;
        this._graphPass.samplePositions = this._vertexCounts;

        // render a new frame
        this._graphPass.prepare();
        this._graphPass.frame();
    }

    /**
     * Copies both the triangle fan and the graph to the output buffer.
     */
    protected showBoth(): void {
        // precalculate some position helper values
        const width = this._outputFBO.width;
        const centerX = width / 2;
        const height = this._outputFBO.height;
        const centerY = height / 2;
        const size = Math.min(width / 2, height);
        const halfSize = size / 2;

        // left section extends from the x center to the left,
        // from the y center in both directions
        this._blitPass.dstBounds = [
            centerX - size, centerY - halfSize,
            centerX, centerY + halfSize];
        this._blitPass.framebuffer = this._circleFBO;
        this._blitPass.frame();

        // right section extends from the x center to the right,
        // from the y center in both directions
        this._blitPass.dstBounds = [
            centerX, centerY - halfSize,
            centerX + size, centerY + halfSize];
        this._blitPass.framebuffer = this._graphFBO;
        this._blitPass.frame();
    }

    /**
     * Only copies the given buffer to the output.
     */
    protected showOne(fbo: Framebuffer): void {
        // precalculate some position helper values
        const width = this._outputFBO.width;
        const centerX = width / 2;
        const height = this._outputFBO.height;
        const centerY = height / 2;
        const size = Math.min(width, height);
        const halfSize = size / 2;

        // single section extends from the x center in both directions,
        // from the y center in both directions
        this._blitPass.dstBounds = [
            centerX - halfSize, centerY - halfSize,
            centerX + halfSize, centerY + halfSize];
        this._blitPass.framebuffer = fbo;
        this._blitPass.frame();
    }

    /**
     * Something bad happened and we lost the rendering context. Oops.
     */
    protected onDiscarded(): void { }

    /**
     * Make sure the output buffers has no automatic anti-aliasing,
     * or else we won't be able to copy into it.
     */
    public get contextAttributes(): WebGLContextAttributes {
        return {
            antialias: false
        };
    }
}
