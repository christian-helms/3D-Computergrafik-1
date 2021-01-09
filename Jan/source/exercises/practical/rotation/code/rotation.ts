import {
    Angle,
    RollPitchYaw,
    StartEnd,
    StartEndAngles
} from './angles';

import {
    Camera,
    ChangeLookup,
    DefaultFramebuffer,
    GLTFLoader,
    Renderer,
    mat4,
    vec3,
} from 'webgl-operate';

import { Controls } from '../../../../common/code/uiHelper';
import { ModelPass } from './modelPass';
import { interpolateEuler } from './interpolateEuler';
import { interpolateMatrix } from './interpolateMatrix';
import { interpolateQuaternion } from './interpolateQuaternion';
import { preCalc } from './preCalc';

export class RotationRenderer extends Renderer {
    protected readonly _altered = Object.assign(new ChangeLookup(), {
        any: false,
        multiFrameNumber: false,
        frameSize: false,
        canvasSize: false,
        framePrecision: false,
        clearColor: false,
        debugTexture: false,
        model: false,
        mode: false,
        angles: false,
        interpolateFactor: false
    });

    protected _gl: WebGL2RenderingContext;

    protected _fbo: DefaultFramebuffer;
    protected _camera: Camera;
    protected _modelPass: ModelPass;

    // interactivity - control helper and data for selection menus
    protected _controls: Controls;

    protected _models = [
        {
            name: 'Koordinaten',
            uri: 'models/exercises/practical/rotation/models/coordinates.glb',
            scale: 0.25
        },
        {
            name: 'Bunter Würfel',
            uri: 'models/exercises/practical/rotation/models/unitCube.glb',
            scale: 0.7
        },
        {
            name: 'Hubschrauber',
            uri: 'models/exercises/practical/rotation/models/roflcopter.glb',
            scale: 0.45
        },
        {
            name: 'Heißluftballon',
            uri:
                'models/exercises/practical/rotation/models/Heißluftballon.glb',
            scale: 1.3
        },
        {
            name: 'Fröhliches Gesicht',
            uri: 'models/exercises/practical/rotation/models/rofl.glb',
            scale: 1
        },
    ];
    protected _model = 0;

    protected _modes = [
        {
            name: 'Matrix',
            f: interpolateMatrix,
        },
        {
            name: 'Eulerwinkel',
            f: interpolateEuler,
        },
        {
            name: 'Quaternionen',
            f: interpolateQuaternion,
        },
    ];
    protected _mode = 0;

    protected _interpolateFactor = 0;

    protected _presets: {name: string, angles: StartEndAngles}[] = [
        // {
        //     name: 'Nichts',
        //     angles: {
        //         start: { roll: 0, pitch: 0, yaw: 0},
        //         end: { roll: 0, pitch: 0, yaw: 0}}
        // },
        {
            name: 'Kombiniert',
            angles: {
                start: { roll: 2.89, pitch: -0.66, yaw: -2.45},
                end: { roll: -0.75, pitch: 0.38, yaw: 0.69}}
        },
        {
            name: 'Gieren',
            angles: {
                start: { roll: 0, pitch: 0, yaw: -1},
                end: { roll: 0, pitch: 0, yaw: 1}}
        },
        {
            name: 'Nicken',
            angles: {
                start: { roll: 0, pitch: -1, yaw: 0},
                end: { roll: 0, pitch: 1, yaw: 0}}
        },
        {
            name: 'Rollen',
            angles: {
                start: { roll: -1, pitch: 0, yaw: 0},
                end: { roll: 1, pitch: 0, yaw: 0}}
        },
        {
            name: 'Benutzerdefiniert',
            angles: {
                start: { roll: 0, pitch: 0, yaw: 0},
                end: { roll: 0, pitch: 0, yaw: 0}}
        },
    ];
    protected _presetSelect: HTMLSelectElement;

    protected _angleSliders: { elem: HTMLInputElement, angle: Angle }[];

    // precalculated rotation matrices for presets
    protected _precalculated = require('./precalculated.json');

    /**
     * Helper function for precalculating rotation matrices for all presets
     * and modes.
     * @param resolution - Number of intermediate rotation matrixes to calculate
     * @param maxPrecision - Max amount for number of digits in output
     * @returns The precalculated rotation matrices as string
     */
    protected preCalcAll(resolution: number, maxPrecision: number): void {
        const result = [];

        // text for variable declaration
        result.push('{');
        this._presets
            // skip custom preset as this is user defined
            .filter((p) => p.name !== 'Benutzerdefiniert')
            // iterate over all presets
            .forEach((p, pi, a) => {
                result.push(`"${p.name}":{`);
                // iterate over all modes
                this._modes.forEach((m, mi) => {
                    // precalculate and store matrices
                    result.push(`"${m.name}":[`);
                    result.push(
                        preCalc(p.angles, m.f, resolution, maxPrecision));
                    result.push(mi < this._modes.length - 1 ? '],' : ']');
                });
                result.push(pi < a.length - 1 ? '},' : '}');
            });
        result.push('}');

        // join all parts of the result together and output it to console
        console.log(result.join(''));
    }

    protected applyPreset(): void {
        const a = this._presets[this._presetSelect.selectedIndex].angles;
        this._angleSliders.forEach((s) =>
            s.elem.value = a[s.angle.se][s.angle.rpy].toString());
    }

    protected setupControls(): void {
        // controls
        this._controls = new Controls();

        // model selection
        const modelSelect = this._controls.createSelectListInput(
            'Modell', this._models.map((entry) => entry.name));
        modelSelect.addEventListener('change', () => {
            this._model = modelSelect.selectedIndex;
            this.loadAsset();
        });
        this._model = modelSelect.selectedIndex;

        // mode selection
        const modeSelect = this._controls.createSelectListInput(
            'Modus', this._modes.map((entry) => entry.name));
        modeSelect.addEventListener('change', () => {
            this._mode = modeSelect.selectedIndex;
            this._altered.alter('mode');
            this.invalidate();
        });
        this._mode = modeSelect.selectedIndex;

        // interpolation factor
        const interpolateInput = this._controls.createSliderInput(
            'Interpolationsfaktor', undefined, 0, undefined, 0, 1, 0.005);
        interpolateInput.addEventListener('input', () => {
            this._interpolateFactor = Number(interpolateInput.value);
            this._altered.alter('interpolateFactor');
            this.invalidate();
        });
        this._interpolateFactor = Number(interpolateInput.value);
        this._altered.alter('interpolateFactor');

        // play/pause
        const playPause = this._controls.createActionButton('Play/Pause');
        const animInfo = {
            direction: 1,
            handle: undefined as number,
        };
        const step = (): void => {
            if (animInfo.direction === 1) {
                interpolateInput.stepUp();
            } else {
                interpolateInput.stepDown();
            }
        };
        const anim = (): void => {
            const oldPos = interpolateInput.value;
            step();
            const newPos = interpolateInput.value;
            if (oldPos === newPos) {
                animInfo.direction *= -1;
                step();
            }
            this._interpolateFactor = Number(interpolateInput.value);
            this._altered.alter('interpolateFactor');
            this.invalidate();
        };
        playPause.addEventListener('click', () => {
            if (animInfo.handle) {
                window.clearInterval(animInfo.handle);
                animInfo.handle = undefined;
            } else {
                animInfo.handle = window.setInterval(anim, 1000 / 60);
            }
        });

        // presets
        this._presetSelect = this._controls.createSelectListInput(
            'Voreinstellung', this._presets.map((entry) => entry.name));
        this._presetSelect.addEventListener('change', () => {
            this.applyPreset();
            this._altered.alter('angles');
            this.invalidate();
        });

        // custom angle sliders
        const halfNumSteps = 50;
        this._angleSliders = [];
        const slider = (
            name: string,
            piRange: number,
            se: StartEnd,
            rpy: RollPitchYaw
        ): void => {
            const halfRange = piRange * Math.PI;
            const halfStep = halfRange / (halfNumSteps + 1);
            const elem = this._controls.createSliderInput(
                name, undefined, 0, undefined, -halfRange, halfRange, halfStep);
            const custom = this._presets.findIndex(
                (p) => (p.name === 'Benutzerdefiniert'));
            elem.addEventListener('input', () => {
                const old = this._presetSelect.selectedIndex;
                if (old !== custom) {
                    Object.apply(
                        this._presets[custom].angles,
                        this._presets[old].angles);
                }
                this._presets[custom].angles[se][rpy] = Number(elem.value);
                this._presetSelect.selectedIndex = custom;
                this._altered.alter('angles');
                this.invalidate();
            });
            this._presets[custom].angles[se][rpy] = Number(elem.value);
            this._angleSliders.push({ elem, angle: { se, rpy }});
        };
        slider('Startrollwinkel', 1, StartEnd.Start, RollPitchYaw.Roll);
        slider('Startnickwinkel', 1, StartEnd.Start, RollPitchYaw.Pitch);
        slider('Startgierwinkel', 1, StartEnd.Start, RollPitchYaw.Yaw);
        slider('Endrollwinkel', 1, StartEnd.End, RollPitchYaw.Roll);
        slider('Endnickwinkel', 1, StartEnd.End, RollPitchYaw.Pitch);
        slider('Endgierwinkel', 1, StartEnd.End, RollPitchYaw.Yaw);
        this.applyPreset();
    }
    /**
     * Initializes and sets up rendering passes, loads a font face
     * and links shaders with program.
     * @param context - valid context to create the object for.
     * @param identifier - meaningful name for identification of this instance.
     * @returns - whether initialization was successful
     */
    protected onInitialize(): boolean {
        this._gl = this._context.gl;

        this._fbo = new DefaultFramebuffer(this._context, 'DefaultFBO');
        this._fbo.initialize();

        // Create and configure camera.
        this._camera = new Camera();
        this._camera.center = vec3.fromValues(0.0, 0.0, 0.0);
        this._camera.up = vec3.fromValues(0.0, 1.0, 0.0);
        this._camera.eye = vec3.fromValues(0.0, 0.0, 100.0);
        this._camera.far = 101.0;
        this._camera.near = 99.0;
        this._camera.fovy = 1.7;

        // Create and configure render pass.
        this._modelPass = new ModelPass(this._context);
        this._modelPass.initialize();
        this._modelPass.camera = this._camera;
        this._modelPass.target = this._fbo;

        // Control setup is handled separately
        this.setupControls();

        // enable this to precalculate rotation values for all modes and presets
        // this.preCalcAll(50, 3);

        this.loadAsset();

        return true;
    }

    protected onUninitialize(): void {
        super.uninitialize();

        this._fbo.uninitialize();
        this._modelPass.uninitialize();
    }

    protected onUpdate(): boolean {
        return this._altered.any || this._camera.altered;
    }

    protected onPrepare(): void {
        if (this._altered.frameSize) {
            this._camera.viewport = [this._frameSize[0], this._frameSize[1]];
        }

        if (this._altered.canvasSize) {
            this._camera.aspect = this._canvasSize[0] / this._canvasSize[1];
        }

        if (this._altered.clearColor) {
            this._modelPass.clearColor = this._clearColor;
        }

        if (this._altered.angles ||
            this._altered.interpolateFactor ||
            this._altered.mode
        ) {
            const preset = this._presets[this._presetSelect.selectedIndex];
            const mode = this._modes[this._mode];

            this._modelPass.calculated = mode.f(
                preset.angles.start,
                preset.angles.end,
                this._interpolateFactor
            );

            const precalculated = this._precalculated[preset.name];
            if (precalculated) {
                const v = precalculated[mode.name];
                const i = Math.floor((v.length - 1) * this._interpolateFactor);
                this._modelPass.comparison = mat4.copy(mat4.create(), v[i]);
            } else {
                this._modelPass.comparison = undefined;
            }
        }

        if (this._altered.interpolateFactor) {
            this._modelPass.interpolateFactor = this._interpolateFactor;
        }

        this._modelPass.update();
        this._modelPass.prepare();

        this._altered.reset();
        this._camera.altered = false;
    }

    protected onFrame(): void {
        this._modelPass.frame();
    }

    protected onSwap(): void {
    }

    /**
     * Load asset from URI specified by the HTML select
     */
    protected loadAsset(): void {
        const m = this._models[this._model];
        const loader = new GLTFLoader(this._context);
        loader.loadAsset(m.uri)
            .then(() => {
                this._modelPass.scene = loader.defaultScene;
                this._modelPass.scale = m.scale;
                this._altered.alter('model');
                this.invalidate();
            });
    }

    protected onDiscarded(): void {
    }
}
