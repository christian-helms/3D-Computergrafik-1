import {
    ChangeLookup,
    Context,
    Framebuffer,
    Initializable,
    Program,
    Shader,
    mat4,
    vec3
} from 'webgl-operate';

import { PlotGeometry } from './plotGeometry';

export class PlotPass extends Initializable {
    protected readonly _altered = Object.assign(new ChangeLookup(), {
        any: false,
        transform: false
    });

    protected _context: Context;
    protected _gl: WebGL2RenderingContext;

    protected _target: Framebuffer;

    protected _program: Program;

    protected _transform: mat4;

    protected _uColor: WebGLUniformLocation;
    protected _uTransform: WebGLUniformLocation;

    public constructor(context: Context) {
        super();
        this._context = context;
        this._gl = context.gl;
    }

    @Initializable.initialize()
    public initialize(
        vertexLocation: GLuint = 0, fragmentShader: string
    ): boolean {
        let valid = true;

        const vert = new Shader(this._context, this._gl.VERTEX_SHADER);
        valid &&= vert.initialize(require('./pos.vert'));
        const frag = new Shader(this._context, this._gl.FRAGMENT_SHADER);
        valid &&= frag.initialize(fragmentShader);

        this._program = new Program(this._context);
        valid &&= this._program.initialize([vert, frag], false);
        this._program.attribute('a_vertex', vertexLocation);
        valid &&= this._program.link();

        this._uColor = this._program.uniform('u_color');
        this._uTransform = this._program.uniform('u_transform');

        return valid;
    }

    @Initializable.uninitialize()
    public uninitialize(): void {
        this._program.uninitialize();
    }

    public prepare(): void {
        if (this._altered.transform) {
            this._program.bind();
            this._gl.uniformMatrix4fv(this._uTransform, false, this._transform);
            this._program.unbind();
        }

        this._altered.reset();
    }

    public frame(geom: PlotGeometry, color: vec3, mode: number): void {
        this._gl.enable(this._gl.DEPTH_TEST);
        this._gl.enable(this._gl.SAMPLE_ALPHA_TO_COVERAGE);

        this._target.bind();

        this._program.bind();
        this._gl.uniform3fv(this._uColor, color);

        geom.bind();
        geom.drawWithMode(mode);
        geom.unbind();

        this._program.unbind();

        this._target.unbind();

        this._gl.disable(this._gl.SAMPLE_ALPHA_TO_COVERAGE);
        this._gl.disable(this._gl.DEPTH_TEST);
    }

    public set target(fbo: Framebuffer) {
        this._target = fbo;
    }

    public set transform(mat: mat4) {
        this._transform = mat;
        this._altered.alter('transform');
    }
}
