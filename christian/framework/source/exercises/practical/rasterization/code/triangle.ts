import {
    Buffer,
    Context,
    Geometry,
} from 'webgl-operate';

/**
 * Geometry of a triangle with vertex colors.
 */
export class TriangleGeometry extends Geometry {

    protected static readonly INDICES = new Uint8Array([0, 1, 2]);

    protected static readonly COLORS = new Float32Array([
        1, 0, 0,
        0, 1, 0,
        0, 0, 1,
    ]);

    protected static readonly VERTICES = new Float32Array([
        0.5, 0.0,
        0.0, 1.0,
        1.0, 1.0,
    ]);

    /** @see {@link vertexLocation} */
    protected _vertexLocation: GLuint = 0;

    /** @see {@link colorLocation} */
    protected _colorLocation: GLuint;

    /**
     * Object constructor, requires a context and an identifier.
     * @param context - Valid context to create the object for.
     * @param identifier - Meaningful name for identification of this instance.
     * vertices).
     */
    public constructor(context: Context, identifier?: string) {
        super(context, identifier);

        /* Generate identifier from constructor name if none given. */
        identifier = identifier !== undefined && identifier !== '' ?
            identifier : this.constructor.name;

        /* Generate vertex buffers. */
        const vertexVBO = new Buffer(context, identifier + 'VBO');
        this._buffers.push(vertexVBO);

        /* Generate color buffers. */
        const colorBuffer = new Buffer(context, `${identifier}ColorVBO`);
        this._buffers.push(colorBuffer);

        /* Generate index buffers. */
        const indexBuffer = new Buffer(context, `${identifier}IndicesVBO`);
        this._buffers.push(indexBuffer);
    }


    /**
     * Binds the vertex buffer object (VBO) to an attribute binding point of a
     * given, pre-defined index.
     */
    protected bindBuffers(/*indices: Array<GLuint>*/): void {
        this._buffers[0].attribEnable(
            this._vertexLocation, 2, this.context.gl.FLOAT,
            false, 0, 0, true, false);
        this._buffers[1].attribEnable(
            this._colorLocation, 3, this.context.gl.FLOAT,
            false, 0, 0, true, false);
        this._buffers[2].bind();
    }

    /**
     * Unbinds the vertex buffer object (VBO) and disables the binding point.
     */
    protected unbindBuffers(): void {
        this._buffers[0].attribDisable(this._vertexLocation, true, true);
        this._buffers[1].attribDisable(this._colorLocation, true, true);
        this._buffers[2].unbind();
    }

    /**
     * Creates the vertex buffer object (VBO) and creates and initializes the
     * buffer's data store.
     * @param vertexLocation - Attribute binding point for vertices.
     * @param colorLocation - Attribute binding point for vertex colors.
     */
    public initialize(
        vertexLocation: GLuint = 0, colorLocation: GLuint = 1
    ): boolean {
        this._vertexLocation = vertexLocation;
        this._colorLocation = colorLocation;

        const gl = this.context.gl;
        const valid = super.initialize(
            [gl.ARRAY_BUFFER, gl.ARRAY_BUFFER, gl.ELEMENT_ARRAY_BUFFER],
            [vertexLocation, colorLocation]);

        this._buffers[0].data(TriangleGeometry.VERTICES, gl.DYNAMIC_DRAW);
        this._buffers[1].data(TriangleGeometry.COLORS, gl.DYNAMIC_DRAW);
        this._buffers[2].data(TriangleGeometry.INDICES, gl.STATIC_DRAW);

        return valid;
    }

    public setVertices(vertices: Float32Array): void {
        const gl = this.context.gl;
        this._buffers[0].data(vertices, gl.DYNAMIC_DRAW);
    }

    public setColors(colors: Float32Array): void {
        const gl = this.context.gl;
        this._buffers[1].data(colors, gl.DYNAMIC_DRAW);
    }

    /**
     * Draws the triangle.
     */
    public draw(): void {
        const gl = this.context.gl;
        gl.drawElements(gl.TRIANGLE_STRIP, 3, gl.UNSIGNED_BYTE, 0);
    }

    /**
     * Attribute location to which this geometry's vertices are bound to.
     */
    public get vertexLocation(): GLuint {
        return this._vertexLocation;
    }

    /**
     * Attribute location to which this geometry's vertex colors are bound to.
     */
    public get colorLocation(): GLuint {
        return this._colorLocation;
    }
}
