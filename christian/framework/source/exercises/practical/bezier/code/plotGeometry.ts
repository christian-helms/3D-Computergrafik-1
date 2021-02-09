import {
    Buffer,
    Context,
    Geometry,
    vec3,
} from 'webgl-operate';

export class PlotGeometry extends Geometry {
    protected _gl: WebGL2RenderingContext;

    protected _vertices: Float32Array = new Float32Array([0, 0, 0]);

    protected _vertexLocation: GLuint;

    public constructor(context: Context) {
        super(context);
        this._gl = this.context.gl as WebGL2RenderingContext;

        this._buffers.push(new Buffer(context));

    }

    protected bindBuffers(): void {
        this._buffers[0].attribEnable(
            this._vertexLocation, 3, this.context.gl.FLOAT,
            false, 0, 0, true, false);
    }

    protected unbindBuffers(): void {
        this._buffers[0].attribDisable(this._vertexLocation, true, true);
    }

    public initialize(
        vertexLocation: GLuint = 0
    ): boolean {
        this._vertexLocation = vertexLocation;

        const valid = super.initialize([this._gl.ARRAY_BUFFER]);

        this._buffers[0].data(this._vertices, this._gl.STATIC_DRAW);

        return valid;
    }

    public set positions(positions: vec3[]) {
        this._vertices = new Float32Array(positions.map((v) => [...v]).flat());
        this._buffers[0].data(this._vertices, this._gl.STATIC_DRAW);
    }

    public draw(): void {
        this.drawWithMode(this._gl.POINTS);
    }

    public drawWithMode(mode: number): void {
        this._gl.drawArrays(mode, 0, this._vertices.length / 3);
    }
}
