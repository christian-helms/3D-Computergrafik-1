import {
    Camera,
    ChangeLookup,
    Context,
    Framebuffer,
    Initializable,
    Program,
    Shader,
    mat4,
    vec3
} from 'webgl-operate';

import { LineGeometry } from './lineGeometry';

export class LinePass extends Initializable {
    protected readonly _altered = Object.assign(new ChangeLookup(), {
        any: false,
        lineColor: false,
        observedTransform: false,
        observerTransform: false
    });

    protected _context: Context;
    protected _gl: WebGL2RenderingContext;

    protected _target: Framebuffer;

    protected _geom: LineGeometry;

    protected _program: Program;

    protected _lineColor: vec3;
    protected _observedTransform: mat4;
    protected _observerTransform: mat4;

    protected _uLineColor: WebGLUniformLocation;
    protected _uObservedTransform: WebGLUniformLocation;
    protected _uObserverTransform: WebGLUniformLocation;

    public constructor(context: Context) {
        super();
        this._context = context;
        this._gl = context.gl;
    }

    @Initializable.initialize()
    public initialize(geom: LineGeometry, camera: Camera): boolean {
        let valid = true;

        this._geom = geom;
        valid &&= this._geom.initialize(0, camera);

        const vert = new Shader(this._context, this._gl.VERTEX_SHADER);
        valid &&= vert.initialize(require('./line.vert'));
        const frag = new Shader(this._context, this._gl.FRAGMENT_SHADER);
        valid &&= frag.initialize(require('./line.frag'));

        this._program = new Program(this._context);
        valid &&= this._program.initialize([vert, frag], false);
        this._program.attribute('a_vertex', 0);
        valid &&= this._program.link();

        this._uLineColor = this._program.uniform('u_lineColor');
        this._uObservedTransform = this._program.uniform('u_observedTransform');
        this._uObserverTransform = this._program.uniform('u_observerTransform');

        return valid;
    }

    @Initializable.uninitialize()
    public uninitialize(): void {
        this._program.uninitialize();
        this._geom.uninitialize();
    }

    public prepare(): void {
        if (this._altered.any) {
            this._program.bind();
        }

        if (this._altered.lineColor) {
            this._gl.uniform3fv(this._uLineColor, this._lineColor);
        }

        if (this._altered.observedTransform) {
            this._gl.uniformMatrix4fv(
                this._uObservedTransform, false, this._observedTransform);
        }

        if (this._altered.observerTransform) {
            this._gl.uniformMatrix4fv(
                this._uObserverTransform, false, this._observerTransform);
        }

        if (this._altered.any) {
            this._program.unbind();
        }

        if (this._geom.altered) {
            this._geom.update();
        }

        this._altered.reset();
    }

    public frame(): void {
        this._gl.enable(this._gl.DEPTH_TEST);

        this._target.bind();

        this._program.bind();

        this._geom.bind();
        this._geom.draw();
        this._geom.unbind();

        this._program.unbind();

        this._target.unbind();

        this._gl.disable(this._gl.DEPTH_TEST);
    }

    public set target(fbo: Framebuffer) {
        this._target = fbo;
    }
    public set lineColor(color: vec3) {
        this._lineColor = color;
        this._altered.alter('lineColor');
    }

    public set observedTransform(mat: mat4) {
        this._observedTransform = mat;
        this._altered.alter('observedTransform');
    }

    public set observerTransform(mat: mat4) {
        this._observerTransform = mat;
        this._altered.alter('observerTransform');
    }

    public get altered(): boolean {
        return this._altered.any || this._geom.altered;
    }
}
