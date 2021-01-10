import {
    Buffer,
    Context,
    Geometry,
    Initializable
} from 'webgl-operate';

/**
 * NOTE: The Tree does not use instancing. Yes, it only consists of a triangles
 * that could be instanced, but I wanted to handle the tree as one object,
 * which would allow to render multiple trees using instancing.
 */
export class TreeGeometry extends Geometry {
    protected _gl: WebGL2RenderingContext;

    // Only one array
    protected _vertices: Float32Array;

    protected _aVertex: GLuint;
    protected _aColor: GLuint;

    public constructor(context: Context) {
        super(context);
        this._gl = this.context.gl as WebGL2RenderingContext;

        // Only one buffer
        this._buffers.push(new Buffer(context));
    }

    protected bindBuffers(): void {
        // Both values are defined per vertex and thus stored interleaved.
        const bytesPerFloat = 4;
        this._buffers[0].attribEnable(
            this._aVertex, 2, this._gl.FLOAT,
            false, 5 * bytesPerFloat, 0, true, false);
        this._buffers[0].attribEnable(
            this._aColor, 2, this._gl.FLOAT,
            false, 5 * bytesPerFloat, 2 * bytesPerFloat, true, false);
    }

    protected unbindBuffers(): void {
        this._buffers[0].attribDisable(this._aVertex, false);
        this._buffers[0].attribDisable(this._aColor, false);
    }

    /**
     * Places a tree at the gives position. It will have a given number of
     * triangles representing the needles and an additional one for the stump.
     * @param pos The trees base position.
     * @param triangles Number of needle triangles.
     */
    protected build(pos: [number, number], triangles: number): void {
        // three points, two + three values
        const stride = 3 * (2 + 3);
        const vertices = new Float32Array((triangles + 1) * stride);

        const triangleHeight = 0.3;
        const triangleWidth = 0.4;
        const stumpWidth = 0.1;

        const brown = [0.5, 0.2, 0.05];
        const green = [0.05, 0.4, 0.05];

        // create the stump first to make sure the needles are drawn over it
        vertices[0] = pos[0] - stumpWidth / 2;
        vertices[1] = pos[1];
        vertices.set(brown, 2);
        vertices[5] = pos[0] + stumpWidth / 2;
        vertices[6] = pos[1];
        vertices.set(brown, 7);
        vertices[10] = pos[0];
        vertices[11] = pos[1] + (triangles / 2) * triangleHeight;
        vertices.set(brown, 12);

        // create the needles using a loop
        let wFac = 1;
        for (let i = 1; i <= triangles; i++) {
            vertices[i * stride + 0] = pos[0] - triangleWidth / 2 * wFac;
            vertices[i * stride + 1] = pos[1] + (i / 2) * triangleHeight;
            vertices.set(green, i * stride + 2);

            vertices[i * stride + 5] = pos[0] + triangleWidth / 2 * wFac;
            vertices[i * stride + 6] = pos[1] + (i / 2) * triangleHeight;
            vertices.set(green, i * stride + 7);

            vertices[i * stride + 10] = pos[0];
            vertices[i * stride + 11] =
                pos[1] + (i / 2 + 1) * triangleHeight;
            vertices.set(green, i * stride + 12);

            // make triangles slimmer towards top
            wFac *= 0.9;
        }

        this._vertices = vertices;
    }

    @Initializable.initialize()
    public initialize(
        aVertex: GLuint = 0,
        aColor: GLuint = 1,
    ): boolean {
        this._aVertex = aVertex;
        this._aColor = aColor;

        const valid = super.initialize([
            this._gl.ARRAY_BUFFER,
            this._gl.ARRAY_BUFFER
        ]);

        this.build([-0.5, -0.8], 3);
        this._buffers[0].data(this._vertices, this._gl.STATIC_DRAW);

        return valid;
    }

    public draw(): void {
        // draw length/5 triangles, beginning with index 0. No instancing.
        this._gl.drawArrays(this._gl.TRIANGLES, 0, this._vertices.length / 5);
    }
}
