import {
    Buffer,
    Camera,
    Context,
    Geometry,
    Initializable
} from 'webgl-operate';

export abstract class LineGeometry extends Geometry {
    protected _gl: WebGL2RenderingContext;

    protected _vertices: Float32Array;

    protected _aVertex: GLuint;

    protected _camera: Camera;

    public constructor(context: Context) {
        super(context);
        this._gl = this.context.gl as WebGL2RenderingContext;

        this._buffers.push(new Buffer(context));
    }

    protected bindBuffers(): void {
        this._buffers[0].attribEnable(
            this._aVertex, 3, this._gl.FLOAT,
            false, 0, 0, true, false);
        this._gl.vertexAttribDivisor(this._aVertex, 0);
    }

    protected unbindBuffers(): void {
        this._buffers[0].attribDisable(this._aVertex, false);
    }

    protected abstract build(): void;

    @Initializable.initialize()
    public initialize(
        aVertex: GLuint,
        camera: Camera
    ): boolean {
        this._aVertex = aVertex;
        this._camera = camera;

        const valid = super.initialize([this._gl.ARRAY_BUFFER]);

        this.build();
        this._buffers[0].data(this._vertices, this._gl.STATIC_DRAW);

        return valid;
    }

    public draw(): void {
        this._gl.drawArrays(this._gl.LINES, 0, this._vertices.length / 3);
    }

    public update(): void {
        this.build();
        this._buffers[0].data(this._vertices, this._gl.STATIC_DRAW);
    }

    public get altered(): boolean {
        return this._camera?.altered;
    }
}
