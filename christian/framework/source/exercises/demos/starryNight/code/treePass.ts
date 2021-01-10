import {
    Context,
    Framebuffer,
    Initializable,
    Program,
    Shader
} from 'webgl-operate';
import { TreeGeometry } from './treeGeometry';

export class TreePass extends Initializable {
    protected _context: Context;
    protected _gl: WebGL2RenderingContext;

    protected _target: Framebuffer;

    protected _geom: TreeGeometry;

    protected _shader: Program;
    protected _uAspect: WebGLUniformLocation;

    public constructor(context: Context) {
        super();
        this._context = context;
        this._gl = context.gl;
    }

    public initialize(): boolean {
        let valid = true;

        this._geom = new TreeGeometry(this._context);
        valid &&= this._geom.initialize(0, 1);

        const vert = new Shader(this._context, this._gl.VERTEX_SHADER);
        valid &&= vert.initialize(require('./trees.vert'));
        const frag = new Shader(this._context, this._gl.FRAGMENT_SHADER);
        valid &&= frag.initialize(require('./trees.frag'));

        this._shader = new Program(this._context);
        valid &&= this._shader.initialize([vert, frag], false);
        this._shader.attribute('a_vertex', 0);
        this._shader.attribute('a_color', 1);
        valid &&= this._shader.link();

        return valid;
    }

    @Initializable.uninitialize()
    public uninitialize(): void {
        this._shader.uninitialize();
        this._geom.uninitialize();
    }

    public frame(): void {
        this._target.bind();

        this._shader.bind();

        this._geom.bind();
        this._geom.draw();
        this._geom.unbind();

        this._shader.unbind();

        this._target.unbind();
    }

    public set target(fbo: Framebuffer) {
        this._target = fbo;
    }
}
