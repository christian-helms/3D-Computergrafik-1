import {
    Buffer,
    Context,
    Geometry,
    Initializable
} from 'webgl-operate';

export class HillGeometry extends Geometry {
    protected _gl: WebGL2RenderingContext;

    protected _vertices: Float32Array;
    protected _instances: Float32Array;

    protected _aVertex: GLuint;
    protected _aHeight: GLuint;
    protected _aAngleOffset: GLuint;
    protected _aColor: GLuint;

    public constructor(context: Context) {
        super(context);
        this._gl = this.context.gl as WebGL2RenderingContext;

        this._buffers.push(new Buffer(context), new Buffer(context));
    }

    protected bindBuffers(): void {
        const bytesPerFloat = 4;

        this._buffers[0].attribEnable(
            this._aVertex, 2, this._gl.FLOAT,
            false, 0, 0, true, false);
        this._gl.vertexAttribDivisor(this._aVertex, 0);

        this._buffers[1].attribEnable(
            this._aHeight, 1, this._gl.FLOAT,
            false, 5 * bytesPerFloat, 0, true, false);
        this._gl.vertexAttribDivisor(this._aHeight, 1);
        this._buffers[1].attribEnable(
            this._aAngleOffset, 1, this._gl.FLOAT,
            false, 5 * bytesPerFloat, 1 * bytesPerFloat, true, false);
        this._gl.vertexAttribDivisor(this._aAngleOffset, 1);
        this._buffers[1].attribEnable(
            this._aColor, 3, this._gl.FLOAT,
            false, 5 * bytesPerFloat, 2 * bytesPerFloat, true, false);
        this._gl.vertexAttribDivisor(this._aColor, 1);
    }

    protected unbindBuffers(): void {
        this._buffers[0].attribDisable(this._aVertex, false);
        this._buffers[1].attribDisable(this._aHeight, false);
        this._buffers[1].attribDisable(this._aAngleOffset, false);
        this._buffers[1].attribDisable(this._aColor, false);
    }

    protected build(numInstances: number): void {
        // The geometry is quite simple: Two triangles, creating a quad
        const vertices = new Float32Array(3 * 2 * 2);
        vertices.set([-1, -1, 1, -1, 1, 1], 0);
        vertices.set([1, 1, -1, 1, -1, -1], 3 * 2);

        const instStride = 1 + 1 + 3;
        const instances = new Float32Array(numInstances * instStride);

        const blueishWhite = [0.9, 0.9, 1.0];
        const minHeight = 0.2;
        const heightRange = 0.2;
        const fullCircle = 2 * Math.PI;
        const minLightness = 0.5;
        const lightnessRange = 0.4;

        for (let i = 0; i < numInstances; i++) {
            // The height isn't random, but goes down. This means the hills
            // drawn first (which will be behind those drawn later) are higher.
            instances[i * instStride + 0] =
                (1 - i / numInstances) * heightRange + minHeight;
            // The hills are made hilly using sinus. The random offset makes
            // sure they don't align.
            instances[i * instStride + 1] = Math.random() * fullCircle;
            // Give each hill a random shade of the blueish white snow color.
            const lightness = Math.random() * lightnessRange + minLightness;
            instances.set(
                blueishWhite.map((c) => c * lightness),
                i * instStride + 2
            );
        }

        this._vertices = vertices;
        this._instances = instances;
    }

    @Initializable.initialize()
    public initialize(
        aVertex: GLuint = 0,
        aHeight: GLuint = 1,
        aAngleOffset: GLuint = 2,
        aColor: GLuint = 3,
    ): boolean {
        this._aVertex = aVertex;
        this._aHeight = aHeight;
        this._aAngleOffset = aAngleOffset;
        this._aColor = aColor;

        const valid = super.initialize([
            this._gl.ARRAY_BUFFER,
            this._gl.ARRAY_BUFFER
        ]);

        this.build(3);
        this._buffers[0].data(this._vertices, this._gl.STATIC_DRAW);
        this._buffers[1].data(this._instances, this._gl.STATIC_DRAW);

        return valid;
    }

    public draw(): void {
        this._gl.drawArraysInstanced(
            this._gl.TRIANGLES,
            0,
            this._vertices.length / 2,
            this._instances.length / 5
        );
    }
}
