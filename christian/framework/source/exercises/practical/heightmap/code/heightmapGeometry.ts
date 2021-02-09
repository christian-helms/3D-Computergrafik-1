import { Buffer, Context, Geometry } from "webgl-operate";

export class HeightmapGeometry extends Geometry {
    protected _gl: WebGL2RenderingContext;

    protected _vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    protected _indices = new Uint32Array([0, 1, 2, 3]);

    protected _vertexLocation: GLuint;

    public constructor(context: Context) {
        super(context);
        this._gl = this.context.gl as WebGL2RenderingContext;

        this._buffers.push(new Buffer(context), new Buffer(context));
    }

    protected bindBuffers(): void {
        this._buffers[0].attribEnable(
            this._vertexLocation,
            2,
            this.context.gl.FLOAT,
            false,
            0,
            0,
            true,
            false
        );
        this._buffers[1].bind();
    }

    protected unbindBuffers(): void {
        this._buffers[0].attribDisable(this._vertexLocation, true, true);
        this._buffers[1].unbind();
    }

    public initialize(vertexLocation: GLuint = 0): boolean {
        this._vertexLocation = vertexLocation;

        const valid = super.initialize([
            this._gl.ARRAY_BUFFER,
            this._gl.ELEMENT_ARRAY_BUFFER,
        ]);

        this._buffers[0].data(this._vertices, this._gl.STATIC_DRAW);
        this._buffers[1].data(this._indices, this._gl.STATIC_DRAW);

        return valid;
    }

    public build(resolution: number): void {
        const N = resolution;
        this._vertices = new Float32Array(N * N * 2);
        const vertex_distance = 2 / (N - 1);
        for (let i = 0; i < N; ++i) {
            for (let j = 0; j < N; ++j) {
                const x = -1 + j * vertex_distance;
                const y = -1 + i * vertex_distance;
                this._vertices[2 * (i * N + j) + 0] = x;
                this._vertices[2 * (i * N + j) + 1] = y;
            }
        }
        
        this._indices = new Uint32Array(2 * (N * N - 1));
        let next = 0;
        for (let i = 0; i < N * (N - 1); ++i) {
            this._indices[next++] = i;
            this._indices[next++] = i + N;
            if ((i + 1) % N == 0) {
                this._indices[next++] = i + N;
                this._indices[next++] = i + 1;
            }
        }

        this._buffers[0].data(this._vertices, this._gl.STATIC_DRAW);
        this._buffers[1].data(this._indices, this._gl.STATIC_DRAW);
    }

    public draw(): void {
        this._gl.drawElements(
            this._gl.TRIANGLE_STRIP,
            this._indices.length,
            this._gl.UNSIGNED_INT,
            0
        );
    }
}
