import {
    Buffer,
    Context,
    Geometry,
    Initializable
} from 'webgl-operate';

export class TriangleFanGeometry extends Geometry {
    protected _gl: WebGL2RenderingContext;

    protected _vertices: Float32Array;
    protected _aVertex: GLuint;

    protected _aInstanceAttrA: GLuint;
    protected _aInstanceAttrB: GLuint;
    protected _numInstances = 1;

    public constructor(context: Context) {
        super(context);
        this._gl = this.context.gl as WebGL2RenderingContext;

        this._buffers.push(new Buffer(context));
    }

    protected bindBuffers(): void {
        this._buffers[0].attribEnable(
            this._aVertex, 2, this._gl.FLOAT,
            false, 0, 0, true, false);
        this._gl.vertexAttribDivisor(this._aVertex, 0);
    }

    protected unbindBuffers(): void {
        this._buffers[0].attribDisable(this._aVertex, false);
    }

    protected uploadBuffers(): void {
        this._buffers[0].data(this._vertices, this._gl.STATIC_DRAW);
    }

    @Initializable.initialize()
    public initialize(aVertex: GLuint = 0): boolean {
        this._aVertex = aVertex;

        const valid = super.initialize([this._gl.ARRAY_BUFFER]);

        this._vertices = new Float32Array([0, 0, 0, 0, 0, 0, 0, 0]);
        this.uploadBuffers();

        return valid;
    }

    public build(numOuterPoints: number, radius: number): void {
        const n = numOuterPoints;
        const vertices: number[] = new Array(2 * (1 + n + 1));

        const alpha = 2 * Math.PI / n;
        const side_length = radius / Math.cos(alpha / 2);

        // put circle center
        vertices[0] = 0; vertices[1] = 0;
        // put triangle points
        for (let i = 0; i < n + 1; ++i) {
            const phi = i * alpha;
            const x = side_length * Math.cos(phi);
            const y = side_length * Math.sin(phi);
            vertices[2 + 2*i] = x;
            vertices[2 + 2*i + 1] = y;
        }

        this._vertices = new Float32Array(vertices);
        this.uploadBuffers();
    }

    public draw(): void {
        this._gl.drawArraysInstanced(
            this._gl.TRIANGLE_FAN,
            0,
            this._vertices.length / 2,
            this._numInstances);
    }

    public get aVertex(): GLuint {
        return this._aVertex;
    }

    public set numInstances(num: number) {
        this._numInstances = num;
    }
}
