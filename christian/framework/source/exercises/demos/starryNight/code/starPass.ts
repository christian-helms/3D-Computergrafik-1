import {
    Context,
    Framebuffer,
    Initializable,
    Program,
    Shader
} from 'webgl-operate';

import { StarGeometry } from './starGeometry';

export class StarPass extends Initializable {
    // Store the webgl-operate and WebGL contexts for easier access
    protected _context: Context;
    protected _gl: WebGL2RenderingContext;

    // Framebuffer to render the output into
    protected _target: Framebuffer;

    // Geometry object defining the stars
    protected _geom: StarGeometry;

    // Compiled shader program (vertex + fragment)
    protected _shader: Program;
    // Uniform location for handing the screen aspect ratio to the shaders
    protected _uAspect: WebGLUniformLocation;

    /**
     * The constructor just stores the rendering context, not much to see here.
     * @param context The webgl-operate rendering context
     */
    public constructor(context: Context) {
        super();
        this._context = context;
        this._gl = context.gl;
    }

    /**
     * The actual setup, invoked during the renderer's setup. The @-line
     * preceding the function header is used by the Initializable parent class
     * to track the init state.
     */
    @Initializable.initialize()
    public initialize(): boolean {
        // Tracking the setup state
        let valid = true;

        // Prepare the geometry, and tell it to bind the vertex/instance data
        // to attribute locations 0 to 3
        this._geom = new StarGeometry(this._context);
        valid &&= this._geom.initialize(0, 1, 2, 3);

        // Create shader objects for both vertex and fragment shader and
        // initialize them with respective source code (loaded using require)
        const vert = new Shader(this._context, this._gl.VERTEX_SHADER);
        valid &&= vert.initialize(require('./stars.vert'));
        const frag = new Shader(this._context, this._gl.FRAGMENT_SHADER);
        valid &&= frag.initialize(require('./stars.frag'));

        // Prepare the shader program. The initialize function takes the list
        // of shaders, and if the should be immediately linked. Since we want to
        // specify the attribute locations, we link the program manually.
        this._shader = new Program(this._context);
        valid &&= this._shader.initialize([vert, frag], false);
        this._shader.attribute('a_vertex', 0);
        this._shader.attribute('a_position', 1);
        this._shader.attribute('a_size', 2);
        this._shader.attribute('a_rotation', 3);
        valid &&= this._shader.link();

        // Read and store the aspect ratio uniform's location.
        this._uAspect = this._shader.uniform('u_aspect');

        return valid;
    }

    /**
     * Clean up.
     */
    @Initializable.uninitialize()
    public uninitialize(): void {
        this._shader.uninitialize();
        this._geom.uninitialize();
    }

    /**
     * Renders the frame.
     */
    public frame(): void {
        // Activate target framebuffer
        this._target.bind();

        // Activate shader program
        this._shader.bind();
        // Update the aspect ratio. If the frame would be rendered often
        // without resizing the canvas, it would be better to move this to the
        // prepare function and only update if necessary. Since we never
        // invalidate the frame ourself, it is only redrawn when the frame size
        // changes, so setting the uniform here does not add unnecessary work.
        // Uniform set function names encode the type of the variable that is
        // written to: Here, it is a float with 1 component, another example is
        // uniform3i for a 3-component int vector.
        this._gl.uniform1f(
            this._uAspect, this._target.width / this._target.height);

        // Activate the geometry, call the draw function and disable it again.
        this._geom.bind();
        this._geom.draw();
        this._geom.unbind();

        // Deactivate the shader program
        this._shader.unbind();

        // Deactivate target framebuffer. Since the other passes use the same
        // framebuffer, it's not strictly necessary to un- and rebind it all
        // the time. It is good practice however to always leave a clean
        // configuration state to avoid errors.
        this._target.unbind();
    }

    // setter function for telling the pass in which buffer it should render
    public set target(fbo: Framebuffer) {
        this._target = fbo;
    }
}
