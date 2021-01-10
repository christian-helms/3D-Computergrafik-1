import {
    Context,
    Framebuffer,
    Initializable,
    Program,
    Shader
} from 'webgl-operate';
import { HillGeometry } from './hillGeometry';

export class HillPass extends Initializable {
    protected _context: Context;
    protected _gl: WebGL2RenderingContext;

    protected _target: Framebuffer;

    protected _geom: HillGeometry;

    protected _shader: Program;

    public constructor(context: Context) {
        super();
        this._context = context;
        this._gl = context.gl;
    }

    public initialize(): boolean {
        let valid = true;

        this._geom = new HillGeometry(this._context);
        valid &&= this._geom.initialize(0, 1, 2, 3);

        const vert = new Shader(this._context, this._gl.VERTEX_SHADER);
        valid &&= vert.initialize(require('./hills.vert'));
        const frag = new Shader(this._context, this._gl.FRAGMENT_SHADER);
        valid &&= frag.initialize(require('./hills.frag'));

        this._shader = new Program(this._context);
        valid &&= this._shader.initialize([vert, frag], false);
        this._shader.attribute('a_vertex', 0);
        this._shader.attribute('a_height', 1);
        this._shader.attribute('a_angleOffset', 2);
        this._shader.attribute('a_color', 3);
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

        // The hills should be drawn partly transparent.
        // This requires blending to be enabled.
        this._gl.enable(this._gl.BLEND);
        // The blend function specifies how a new fragment is mixed with a
        // existing color value at this position. Typically, you want to
        // multiply the new color (SRC) with its alpha value and the existing
        // color with one minus the new color's alpha. This is the same as
        // mixing the colors using GLSL's mix function.
        this._gl.blendFunc(this._gl.SRC_ALPHA, this._gl.ONE_MINUS_SRC_ALPHA);

        this._geom.bind();
        this._geom.draw();
        this._geom.unbind();

        this._shader.unbind();

        // Don't forget to disable blending afterwards, or you might have
        // unexpected results in lated passes.
        this._gl.disable(this._gl.BLEND);

        this._target.unbind();
    }

    public set target(fbo: Framebuffer) {
        this._target = fbo;
    }
}
