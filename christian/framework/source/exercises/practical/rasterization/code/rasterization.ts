import {
    Color,
    Context,
    DefaultFramebuffer,
    Geometry,
    NdcFillingRectangle,
    Program,
    Renderer,
    Shader,
} from 'webgl-operate';

import { Controls } from '../../../../common/code/uiHelper';
import { TriangleGeometry } from './triangle';

export class RasterizationRenderer extends Renderer {

    // index of the selected program: 0 = fragment based; 1 = vertex based
    protected _selectedProgram = 0;
    protected _programSettings: {
        name: string;
        // shader program
        program: Program;
        // triangle points uniform location
        uPoints: WebGLUniformLocation;
        // triangle points uniform location
        uResolution: WebGLUniformLocation;
        // vertex color uniform location
        uVertexColors: WebGLUniformLocation;
        // geometry to render
        geometry: Geometry;
    }[];

    protected _palettes = [
        { name: 'RGB', colors: ['#ff0000', '#00ff00', '#0000ff'] },
        { name: 'HPI', colors: ['#b1063a', '#dd6108', '#f6a800'] }
    ];

    // interactivity - control helper and data for selection menus
    protected _controls: Controls;

    // index of vertex to move; -1 = don't move any
    protected _moveIndex = -1;

    // triangle vertices: 3 floats per point (x, y, z = 0)
    protected _numberOfPoints = 3;
    protected _vertices: Float32Array;

    protected _defaultFBO: DefaultFramebuffer;

    // [0]: speed in x-direction - [1]: speed in y-direction
    protected _vertexColors = new Float32Array(9);

    // radius of the area around the triangle vertices that is clickable
    protected _selectRadius = 100;

    /**
     * Helper functions for setting up the various shader programs.
     * @param context - rendering context to create the shaders in
     * @param vertexShader - source code for vertex shader
     * @param fragmentShader - source code for fragment shader
     */
    private setupProgram(
        context: Context, vertexShader: string, fragmentShader: string
    ): Program {
        // store gl object locally for easier access
        const gl = context.gl as WebGLRenderingContext;

        // create shaders from source and initialize
        const vert = new Shader(context, gl.VERTEX_SHADER);
        vert.initialize(vertexShader);
        const frag = new Shader(context, gl.FRAGMENT_SHADER);
        frag.initialize(fragmentShader);

        // create program and initialize it with the prepared shaders
        const program = new Program(context);
        program.initialize([vert, frag], false);

        return program;
    }

    /**
     * Initializes and sets up buffer, geometry, camera and links shaders
     * with program.
     * @param context - valid context to create the object for.
     * @returns - whether initialization was successful
     */
    protected onInitialize(
        context: Context): boolean {

        // set up framebuffer and activate it
        this._defaultFBO = new DefaultFramebuffer(context, 'DefaultFBO');
        this._defaultFBO.initialize();
        this._defaultFBO.bind();

        // initialize the screen filling quad for fragment based rasterization
        const quad = new NdcFillingRectangle(context);
        quad.initialize();

        // initialize the triangle for vertex based rasterization
        const triangle = new TriangleGeometry(context);
        triangle.initialize();

        // prepare shader program for fragment based rasterization
        const fragmentProgram = this.setupProgram(
            context,
            require('../../../../common/code/quad.vert'),
            require('./fragmentbasedRasterization.frag'));

        // connect the quad's vertex locations to the shader attribute
        fragmentProgram.attribute('a_vertex', quad.vertexLocation);
        fragmentProgram.link();

        // prepare shader program for vertex based rasterization
        const vertexProgram = this.setupProgram(
            context,
            require('./vertexbasedRasterization.vert'),
            require('./vertexbasedRasterization.frag'));

        // connect the triangle's vertex locations to the shader attribute
        vertexProgram.attribute('a_vertex', triangle.vertexLocation);
        // connect the triangle's vertex color locations to the shader attribute
        vertexProgram.attribute('a_color', triangle.colorLocation);
        vertexProgram.link();

        this._programSettings = [];
        this._programSettings = [
            {
                name: 'Fragmentshader',
                program: fragmentProgram,
                uResolution: fragmentProgram.uniform('u_resolution'),
                uPoints: fragmentProgram.uniform('u_vertices'),
                uVertexColors: fragmentProgram.uniform('u_colors'),
                geometry: quad,
            },
            {
                name: 'Vertexshader + Fragmentshader',
                program: vertexProgram,
                uResolution: vertexProgram.uniform('u_resolution'),
                uPoints: vertexProgram.uniform('u_vertices'),
                uVertexColors: vertexProgram.uniform('u_colors'),
                geometry: triangle,
            },
        ];

        // initialize controls
        this._controls = new Controls();

        // implementation selection
        const shaderInput = this._controls.createSelectListInput(
            'Implementierung',
            this._programSettings.map((e) => e.name));
        this._selectedProgram = shaderInput.selectedIndex;

        // add change event listener to shader input element
        shaderInput.addEventListener('change', (event: InputEvent) => {
            // get the index of the selected entry
            this._selectedProgram =
                (event.target as HTMLSelectElement).selectedIndex;
            // re-process the image
            this.invalidate(true);
        });

        // color selection
        const colorPaletteInput = this._controls.createSelectListInput(
            'Farbpalette',
            this._palettes.map((e) => e.name));
        const vertexColor1Input =
            this._controls.createColorInput('Vertexfarbe 1');
        const vertexColor2Input =
            this._controls.createColorInput('Vertexfarbe 2');
        const vertexColor3Input =
            this._controls.createColorInput('Vertexfarbe 3');

        const palette = this._palettes[0];
        for (let i = 0; i < 3; i++) {
            this.setVertexColor(i, palette.colors[i]);
        }
        triangle.setColors(this._vertexColors);

        // add change event listener to color palette selection element
        colorPaletteInput.addEventListener('change', (event: InputEvent) => {
            // get the index of the selected entry
            const index = (event.target as HTMLSelectElement).selectedIndex;
            const palette = this._palettes[index];
            for (let i = 0; i < 3; i++) {
                this.setVertexColor(i, palette.colors[i]);
            }
            vertexColor1Input.value = palette.colors[0];
            vertexColor2Input.value = palette.colors[1];
            vertexColor3Input.value = palette.colors[2];
            triangle.setColors(this._vertexColors);
            // this._selectedProgram =
            //     (event.target as HTMLSelectElement).selectedIndex;
            // re-process the image
            this.invalidate(true);
        });

        // vertex color 1
        vertexColor1Input.value = palette.colors[0];
        vertexColor1Input.addEventListener('input', (event: InputEvent) => {
            this.setVertexColor(0, (event.target as HTMLInputElement).value);
            triangle.setColors(this._vertexColors);
            this.invalidate(true);
        });

        // vertex color 2
        vertexColor2Input.value = palette.colors[1];
        vertexColor2Input.addEventListener('input', (event: InputEvent) => {
            this.setVertexColor(1, (event.target as HTMLInputElement).value);
            triangle.setColors(this._vertexColors);
            this.invalidate(true);
        });

        // vertex color 3
        vertexColor3Input.value = palette.colors[2];
        vertexColor3Input.addEventListener('input', (event: InputEvent) => {
            this.setVertexColor(2, (event.target as HTMLInputElement).value);
            triangle.setColors(this._vertexColors);
            this.invalidate(true);
        });

        const canvas = document.getElementById('webgl-canvas');

        // initialize point list: 2 floats per point (x, y)
        this._vertices = new Float32Array(2 * this._numberOfPoints);
        // generate the points clockwise around the middle of the canvas
        for (let i = 0; i < this._numberOfPoints; i++) {
            const angle = (Math.PI * 2 / this._numberOfPoints) * -i;
            const dist = Math.random() / 2;
            const x = Math.cos(angle) * dist;
            const y = Math.sin(angle) * dist;
            this._vertices[i * 2 + 0] = 0.5 + x;
            this._vertices[i * 2 + 1] = 0.5 + y;
            // vertex based implementations uses
            // coordinates in the range [-1, 1]^2
            triangle.setVertices(this._vertices.map((val) => {
                return val * 2 - 1;
            }));
        }

        // check if mouse down happened close to a vertex
        canvas.addEventListener('mousedown', (event) => {
            // distance to the closest vertex yet
            let minDist = Number.MAX_VALUE;
            // check all the vertices
            for (let i = 0; i < this._numberOfPoints; i++) {
                // convert vertex coordinates to canvas coordinates
                const pointX = this._vertices[i * 2 + 0] * canvas.clientWidth;
                const pointY = this._vertices[i * 2 + 1] * canvas.clientHeight;
                // get click position on canvas
                const posX = event.offsetX;
                const posY = canvas.clientHeight - event.offsetY;
                // calculate the distance
                const diffX = pointX - posX;
                const diffY = pointY - posY;
                const dist = Math.sqrt(diffX * diffX + diffY * diffY);
                // select closest vertex within the select radius
                if (dist < this._selectRadius && dist < minDist) {
                    this._moveIndex = i;
                    minDist = dist;
                }
            }
        });

        // move vertex if one is selected
        canvas.addEventListener('mousemove', (event) => {
            if (this._moveIndex >= 0) {
                this._vertices[this._moveIndex * 2 + 0] =
                    event.offsetX / canvas.clientWidth;
                this._vertices[this._moveIndex * 2 + 1] =
                    1 - (event.offsetY / canvas.clientHeight);
                // vertex based implementations uses
                // coordinates in the range [-1, 1]^2
                triangle.setVertices(this._vertices.map((val) => {
                    return val * 2 - 1;
                }));
                // make sure a new frame is calculated
                this.invalidate(true);
            }
        });

        // deselect if mouse button is released
        canvas.addEventListener('mouseup', () => {
            this._moveIndex = -1;
        });

        return true;
    }

    protected setVertexColor(index: number, hexColor: string): void {
        const color = Color.hex2rgba(hexColor);
        this._vertexColors[index * 3 + 0] = color[0];
        this._vertexColors[index * 3 + 1] = color[1];
        this._vertexColors[index * 3 + 2] = color[2];
    }

    /**
     * Uninitializes buffers, geometry and program.
     */
    protected onUninitialize(): void {
        super.uninitialize();

        this._programSettings.forEach((ps) => {
            ps.program.uninitialize();
            ps.geometry.uninitialize();
        });

        this._defaultFBO.uninitialize();
    }

    /**
     * This is invoked in order to check if rendering of a frame is required by
     * means of implementation specific evaluation (e.g., lazy non continuous
     * rendering). Regardless of the return value a new frame (preparation,
     * frame, swap) might be invoked anyway, e.g., when update is forced or
     * canvas or context properties have changed or the renderer was
     * invalidated @see{@link invalidate}.
     * @returns whether to redraw
     */
    protected onUpdate(): boolean {
        return this._altered.any;
    }

    /**
     * This is invoked in order to prepare rendering of one or more frames,
     * regarding multi-frame rendering and camera-updates.
     */
    protected onPrepare(): void {
        this.clearColor = [0, 0, 0, 1];
        if (this._altered.clearColor) {
            this._defaultFBO.clearColor(this._clearColor);
        }

        this._altered.reset();
    }


    /**
     * This is invoked after both onUpdate and onPrepare and should be used to
     * do the actual rendering.
     */
    protected onFrame(): void {
        // store gl object locally for easier access
        const gl = this._context.gl;

        // set camera viewport to canvas size
        gl.viewport(0, 0, this._canvasSize[0], this._canvasSize[1]);

        // activate framebuffer for rendering
        this._defaultFBO.bind();
        // reset framebuffer
        this._defaultFBO.clear(
            gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT, true, false);

        const programSettings = this._programSettings[this._selectedProgram];

        // activate shader program
        programSettings.program.bind();

        // set uniforms (shader inputs)
        gl.uniform2f(
            programSettings.uResolution,
            this._canvasSize[0],
            this._canvasSize[1]);
        gl.uniform2fv(programSettings.uPoints, this._vertices);
        gl.uniform3fv(programSettings.uVertexColors, this._vertexColors);

        // activate, render and deactivate the screen-aligned quad
        programSettings.geometry.bind();
        programSettings.geometry.draw();
        programSettings.geometry.unbind();

        // deactivate shader program
        programSettings.program.unbind();
    }

    protected onSwap(): void { }

    protected onDiscarded(): void {
    }

    public get contextAttributes(): WebGLContextAttributes {
        return {
            antialias: false,
        };
    }
}
