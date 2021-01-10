import {
    Buffer,
    Context,
    Geometry,
    Initializable
} from 'webgl-operate';

export class StarGeometry extends Geometry {
    // Store the WebGL context for easier access
    protected _gl: WebGL2RenderingContext;

    // The CPU-side data storage containing the vertex data (defining a single
    // star) and instance data (defining how to adjust each copy). This doesn't
    // has to be stored as a member variable (you could sent the date to the
    // GPU from a local variable), but it can sometime be useful e.g. if only
    // parts of the data should be changed.
    protected _vertices: Float32Array;
    protected _instances: Float32Array;

    // The shader program's attribute locations, needed for correctly matching
    // the geometry buffers to the shader.
    protected _aVertex: GLuint;
    protected _aPosition: GLuint;
    protected _aSize: GLuint;
    protected _aRotation: GLuint;

    /**
     * The constructor stores the WebGL context and prepares the GPU buffers.
     * @param context The webgl-operate rendering context
     */
    public constructor(context: Context) {
        super(context);
        this._gl = this.context.gl as WebGL2RenderingContext;

        // Create two buffers on the GPU for vertex and instance data
        this._buffers.push(new Buffer(context), new Buffer(context));
    }

    /**
     * Configures the buffers correctly when geom.bind is called.
     */
    protected bindBuffers(): void {
        const bytesPerFloat = 4;

        // Buffer 0 is used for a_vertex, providing 2 components of type float
        // the stride (offset in bytes between the beginning of consecutive
        // vertex attributes) is set to 0. WebGL thus assumes that consecutive
        // follow each other immediately. Passing 2 * bytesPerFloat would have
        // the same effect.
        this._buffers[0].attribEnable(
            this._aVertex, 2, this._gl.FLOAT,
            false, 0, 0, true, false);
        // Since we use instanced rendering, we have to specify after how many
        // instances the next data block should be used. As this attribute is
        // always the same, we set the divisor to 0.
        this._gl.vertexAttribDivisor(this._aVertex, 0);

        // Buffer 1 contains the position, size and rotation angle of each
        // instance, which are interleaved (all data for each instance is
        // stored consecutively). Thus, we have to specify the stride between
        // instances, as well as the offset for the second and third attribute.
        // The divisor is then set to 1, which means teh attributes are
        // advanced to the next block after each instance.
        this._buffers[1].attribEnable(
            this._aPosition, 2, this._gl.FLOAT,
            false, 4 * bytesPerFloat, 0, true, false);
        this._gl.vertexAttribDivisor(this._aPosition, 1);
        this._buffers[1].attribEnable(
            this._aSize, 1, this._gl.FLOAT,
            false, 4 * bytesPerFloat, 2 * bytesPerFloat, true, false);
        this._gl.vertexAttribDivisor(this._aSize, 1);
        this._buffers[1].attribEnable(
            this._aRotation, 1, this._gl.FLOAT,
            false, 4 * bytesPerFloat, 3 * bytesPerFloat, true, false);
        this._gl.vertexAttribDivisor(this._aRotation, 1);
    }

    /**
     * Configures the buffers correctly when geom.unbind is called.
     */
    protected unbindBuffers(): void {
        // disable the buffer-attribute mappings
        this._buffers[0].attribDisable(this._aVertex, false);
        this._buffers[1].attribDisable(this._aPosition, false);
        this._buffers[1].attribDisable(this._aSize, false);
        this._buffers[1].attribDisable(this._aRotation, false);
    }

    /**
     * Generates the star geometry, as well as the instance data.
     * Supports stars with an arbitrary number of points.
     * 1 points has no area and 2 looks weird, but values above 2 work fine.
     * Annoyingly, the pointy things of a star are called points as well,
     * so be prepared for some ambiguity.
     * @param innerRadius The radius of the star's inner corners.
     * @param outerRadius The radius of the star's points.
     * @param numPoints The star's number of points.
     * @param numInstances The number of instances to generate.
     */
    protected build(
        innerRadius: number,
        outerRadius: number,
        numPoints: number,
        numInstances: number
    ): void {
        // Helper function for placing a point on a circle with given radius.
        // The id normalized using the number of points to calculate the angle.
        const getPoint = (id: number, radius: number): [number, number] => {
            const angle = 2 * Math.PI * (id / (numPoints));
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            return [x, y];
        };

        // Number of components per star point:
        // Three points, two triangles, two coords
        const vertStride = 3 * 2 * 2;
        const vertices = new Float32Array(numPoints * vertStride);

        // For each star point
        for (let i = 0; i < numPoints; i++) {
            // Outer triangle, resulting in the point
            vertices.set(getPoint(i, outerRadius), i * vertStride + 0);
            vertices.set(getPoint(i + 0.5, innerRadius), i * vertStride + 2);
            vertices.set(getPoint(i - 0.5, innerRadius), i * vertStride + 4);
            // Inner triangle resulting in the filled polygon in the center
            vertices.set(getPoint(i, 0), i * vertStride + 6);
            vertices.set(getPoint(i + 0.5, innerRadius), i * vertStride + 8);
            vertices.set(getPoint(i - 0.5, innerRadius), i * vertStride + 10);
        }

        // Number of components per instance point:
        // 2 for pos, 1 for size, 1 for rotation angle
        const instStride = 2 + 1 + 1;
        const instances = new Float32Array(numInstances * instStride);

        // Math.random's range is 0 to 1, these are used to customize the values
        const minPos = -1;
        const posRange = 2;
        const minSize = 0.01;
        const sizeRange = 0.04;
        const fullCircle = 2 * Math.PI;

        // For each instance
        for (let i = 0; i < numInstances; i++) {
            // Generate a random position from -1 to +1
            instances[i * instStride + 0] = Math.random() * posRange + minPos;
            instances[i * instStride + 1] = Math.random() * posRange + minPos;
            // Generate a random size between 0.01 and 0.05
            instances[i * instStride + 2] = Math.random() * sizeRange + minSize;
            // Generate a random angle
            instances[i * instStride + 3] = Math.random() * fullCircle;
        }

        // Store the generated values
        this._vertices = vertices;
        this._instances = instances;
    }

    /**
     * Setup function, invoked during the pass' setup. The @-line preceding the
     * function header is used to track the init state.
     */
    @Initializable.initialize()
    public initialize(
        aVertex: GLuint,
        aPosition: GLuint,
        aSize: GLuint,
        aRotation: GLuint,
    ): boolean {
        // Store the attribute locations
        this._aVertex = aVertex;
        this._aPosition = aPosition;
        this._aSize = aSize;
        this._aRotation = aRotation;

        // Call super, which inits the buffers created in the constructor
        // ARRAY_BUFFER means the buffers will contains a list of attributes
        const valid = super.initialize([
            this._gl.ARRAY_BUFFER,
            this._gl.ARRAY_BUFFER
        ]);

        // Call the data generation function.
        // Tip: Try changing these values.
        this.build(0.35, 1, 5, 100);

        // Send the data stored in the member arrays to the GPU buffers.
        // STATIC_DRAW tells WebGL that we rarely update the data,
        // which can be used for optimizations.
        this._buffers[0].data(this._vertices, this._gl.STATIC_DRAW);
        this._buffers[1].data(this._instances, this._gl.STATIC_DRAW);

        return valid;
    }

    /**
     * Draws the geometry.
     */
    public draw(): void {
        // For rendering only one star (one array of vertices), we would use
        // drawArrays, which omits the last parameter.
        // Parameter description for drawArraysInstanced:
        // 1. Draw single triangles, no triangle strip or triangle fan.
        // 2. Rendering should start at index 0 of the vertex array.
        // 3. Draw v.length/2 vertices, as each vertex has 2 components.
        // The number is always the number of vertices, regardless of the mode.
        // 4. Draw i.length/4 instances, as each instance has 4 components.
        this._gl.drawArraysInstanced(
            this._gl.TRIANGLES,
            0,
            this._vertices.length / 2,
            this._instances.length / 4
        );
    }
}
