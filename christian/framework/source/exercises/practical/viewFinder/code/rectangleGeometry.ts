import {
    Buffer,
    Context,
    Geometry,
    Initializable
} from 'webgl-operate';

export class RectangleGeometry extends Geometry {
    protected readonly _bytesPerFloat = 4;
    protected readonly _lengthVertexPos = 2;

    // Store the WebGL context for easier access
    protected _gl: WebGL2RenderingContext;

    // The CPU-side data storage containing the vertex data (defining a single
    // star) and instance data (defining how to adjust each copy). This doesn't
    // has to be stored as a member variable (you could sent the date to the
    // GPU from a local variable), but it can sometime be useful e.g. if only
    // parts of the data should be changed.
    protected _vertices: Float32Array;

    // The shader program's attribute locations, needed for correctly matching
    // the geometry buffers to the shader.
    protected _aVertex: GLuint;

    protected _geometryResolution = 1;

    /**
     * The constructor stores the WebGL context and prepares the GPU buffers.
     * @param context The webgl-operate rendering context
     */
    public constructor(context: Context) {
        super(context);
        this._gl = this.context.gl as WebGL2RenderingContext;

        // Create two buffers on the GPU for vertex and instance data
        this._buffers.push(new Buffer(context));
    }

    /**
     * Configures the buffers correctly when geom.bind is called.
     */
    protected bindBuffers(): void {
        // Buffer 0 is used for a_vertex, providing 2 components of type float
        // the stride (offset in bytes between the beginning of consecutive
        // vertex attributes) is set to 0. WebGL thus assumes that consecutive
        // follow each other immediately. Passing 2 * bytesPerFloat would have
        // the same effect.
        this._buffers[0].attribEnable(
            this._aVertex, this._lengthVertexPos, this._gl.FLOAT,
            false, 0, 0, true, false);
        // Since we use instanced rendering, we have to specify after how many
        // instances the next data block should be used. As this attribute is
        // always the same, we set the divisor to 0.
        this._gl.vertexAttribDivisor(this._aVertex, 0);
    }

    /**
     * Configures the buffers correctly when geom.unbind is called.
     */
    protected unbindBuffers(): void {
        // disable the buffer-attribute mappings
        this._buffers[0].attribDisable(this._aVertex, false);
    }

    /**
     * @param numInstances The number of instances to generate.
     */
    protected build(): void {
        const vertices = new Float32Array([
            -1.0, -1.0, 1.0, 1.0, -1.0, 1.0,
            -1.0, -1.0, 1.0, -1.0, 1.0, 1.0
        ]);

        // Store the generated values
        this._vertices = vertices;
    }

    /**
     * Setup function, invoked during the pass' setup. The @-line preceding the
     * function header is used to track the init state.
     */
    @Initializable.initialize()
    public initialize(
        geometryResolution: number,
        aVertex: GLuint
    ): boolean {
        this._geometryResolution = geometryResolution;
        // Store the attribute locations
        this._aVertex = aVertex;

        // Call super, which inits the buffers created in the constructor
        // ARRAY_BUFFER means the buffers will contains a list of attributes
        const valid = super.initialize(
            [
                this._gl.ARRAY_BUFFER,
            ]
        );

        // Call the data generation function.
        // Tip: Try changing these values.
        this.build();


        // Send the data stored in the member arrays to the GPU buffers.
        // STATIC_DRAW tells WebGL that we rarely update the data,
        // which can be used for optimizations.
        this._buffers[0].data(this._vertices, this._gl.STATIC_DRAW);

        return valid;
    }

    public set geometryResolution(geometryResolution: number) {
        this._geometryResolution = geometryResolution;
    }

    /**
     * Draws the geometry.
     */
    public draw(): void {
        this._gl.drawArraysInstanced(
            this._gl.TRIANGLES,
            0,
            6,
            this._geometryResolution * this._geometryResolution
        );
    }
}
