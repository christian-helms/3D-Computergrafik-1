
import {
    Camera,
    ChangeLookup,
    Color,
    Context,
    Initializable,
    Program,
    Shader,
    Texture2D,
    vec3,
} from 'webgl-operate';

import { Heightmap } from './map';
import { HeightmapGeometry } from './heightmapGeometry';

export class HeightmapPass extends Initializable {
    protected readonly _altered = Object.assign(new ChangeLookup(), {
        any: false,
        heightMap: false,
        normalMap: false,
        terrainResolution: false,
        heightColors: false,
        heightColorHeights: false,
        contourLineCount: false,
        contourLineOpacity: false,
        heightScale: false,
    });

    protected _context: Context;
    protected _gl: WebGL2RenderingContext;

    protected _program: Program;
    protected _geom: HeightmapGeometry;
    protected _camera: Camera;

    protected _invalidate: () => void;

    protected _map: Heightmap;

    protected _terrainResolution: number;
    protected _heightScale: number;
    protected _contourLineCount: number;
    protected _contourLineOpacity: number;
    protected _heightColors = new Array<vec3>(5);
    protected _heightColorHeights = new Array<number>(5);
    protected _heightmap: Texture2D;
    protected _normalmap: Texture2D;

    protected _uTransform: WebGLUniformLocation;
    protected _uEye: WebGLUniformLocation;
    protected _uHeightmap: WebGLUniformLocation;
    protected _uNormalmap: WebGLUniformLocation;
    protected _uHeightScale: WebGLUniformLocation;
    protected _uLowestContourLine: WebGLUniformLocation;
    protected _uContourLineCount: WebGLUniformLocation;
    protected _uContourLineOpacity: WebGLUniformLocation;
    protected _uHeightColors: WebGLUniformLocation;
    protected _uHeightColorHeights: WebGLUniformLocation;

    public constructor(context: Context) {
        super();
        this._context = context;
        this._gl = context.gl;
    }

    public initialize(): boolean {
        let valid = true;

        const vert = new Shader(this._context, this._gl.VERTEX_SHADER);
        valid &&= vert.initialize(require('./heightmap.vert'));
        const frag = new Shader(this._context, this._gl.FRAGMENT_SHADER);
        valid &&= frag.initialize(require('./heightmap.frag'));

        const vertexLocation = 0;

        this._program = new Program(this._context);
        valid &&= this._program.initialize([vert, frag], false);
        this._program.attribute('a_vertex', vertexLocation);
        valid &&= this._program.link();

        this._geom = new HeightmapGeometry(this._context);
        valid &&= this._geom.initialize(vertexLocation);

        this._uTransform = this._program.uniform('u_transform');
        this._uEye = this._program.uniform('u_eye');
        this._uHeightmap = this._program.uniform('u_heightmap');
        this._uNormalmap = this._program.uniform('u_normalmap');
        this._uHeightScale = this._program.uniform('u_heightScale');
        this._uLowestContourLine = this._program.uniform('u_lowestContourLine');
        this._uContourLineCount = this._program.uniform('u_contourLineCount');
        this._uContourLineOpacity =
            this._program.uniform('u_contourLineOpacity');
        this._uHeightColors = this._program.uniform('u_heightColors');
        this._uHeightColorHeights =
            this._program.uniform('u_heightColorHeights');

        this._heightmap = new Texture2D(this._context);
        this._heightmap.initialize(
            1, 1, this._gl.RGBA, this._gl.RGBA, this._gl.UNSIGNED_BYTE);
        this._normalmap = new Texture2D(this._context);
        this._normalmap.initialize(
            1, 1, this._gl.RGBA, this._gl.RGBA, this._gl.UNSIGNED_BYTE);

        this._program.bind();
        this._gl.uniform1i(this._uHeightmap, 0);
        this._gl.uniform1i(this._uNormalmap, 1);
        this._program.unbind();

        return valid;

    }

    public uninitialize(): void {
        this._program.uninitialize();
        this._geom.uninitialize();
        this._heightmap.uninitialize();
        this._normalmap.uninitialize();
    }

    public prepare(): void {
        const bind = this._altered.any || this._camera.altered;
        if(bind) {
            this._program.bind();
        }

        if(this._camera.altered) {
            this._gl.uniformMatrix4fv(
                this._uTransform, false, this._camera.viewProjection);
            this._gl.uniform3fv(this._uEye, this._camera.eye);
        }

        if(this._altered.heightColors) {
            this._gl.uniform3fv(
                this._uHeightColors, this._heightColors.flat() as number[]);
        }

        if(this._altered.heightColorHeights) {
            this._gl.uniform1fv(
                this._uHeightColorHeights, this._heightColorHeights.flat());
            this._gl.uniform1f(
                this._uLowestContourLine,
                (this._heightColorHeights[0] +
                    this._heightColorHeights[1]) / 2);
        }

        if(this._altered.contourLineCount) {
            this._gl.uniform1f(this._uContourLineCount, this._contourLineCount);
        }

        if(this._altered.contourLineOpacity) {
            this._gl.uniform1f(
                this._uContourLineOpacity, this._contourLineOpacity);
        }

        if(this._altered.heightScale) {
            this._gl.uniform1f(this._uHeightScale, this._heightScale);
        }

        if(bind) {
            this._program.unbind();
        }

        if(this._altered.terrainResolution) {
            this._geom.build(this._terrainResolution);
        }

        this._altered.reset();
    }

    public frame(): void {
        this._heightmap.bind(this._gl.TEXTURE0);
        this._normalmap.bind(this._gl.TEXTURE1);

        this._gl.disable(this._gl.CULL_FACE);
        this._gl.enable(this._gl.DEPTH_TEST);

        this._program.bind();

        this._geom.bind();
        this._geom.draw();
        this._geom.unbind();

        this._program.unbind();

        this._gl.enable(this._gl.CULL_FACE);
        this._gl.disable(this._gl.DEPTH_TEST);

        this._heightmap.unbind(this._gl.TEXTURE0);
        this._normalmap.unbind(this._gl.TEXTURE1);
    }

    public set invalidate(f: () => void) {
        this._invalidate = f;
    }

    public get altered(): boolean {
        return this._altered.any;
    }

    public set camera(camera: Camera) {
        this._camera = camera;
    }

    public set heightMap(map: Heightmap) {
        this._map = map;
        this._heightmap.fetch(map.height, false, true).then(() => {
            this._altered.alter('heightMap');
            this._invalidate();
        });
        this._normalmap.fetch(map.normal, false, true).then(() => {
            this._altered.alter('normalMap');
            this._invalidate();
        });
        this._heightColorHeights = map.heightColors.map((h) => h.height);
        this._altered.alter('heightColorHeights');
        this._heightColors = map.heightColors.map(
            (h) => Color.hex2rgba(h.color).slice(0, 3) as vec3);
        this._altered.alter('heightColors');
    }

    public setHeightColor(index: number, value: vec3): void {
        this._heightColors[index] = value;
        this._altered.alter('heightColors');
    }

    public setHeightColorHeight(index: number, value: number): void {
        this._heightColorHeights[index] = value;
        this._altered.alter('heightColorHeights');
    }

    public set terrainResolution(value: number) {
        this._terrainResolution = value;
        this._altered.alter('terrainResolution');
    }

    public set heightScale(value: number) {
        this._heightScale = value;
        this._altered.alter('heightScale');
    }

    public set contourLineCount(value: number) {
        this._contourLineCount = value;
        this._altered.alter('contourLineCount');
    }

    public set contourLineOpacity(value: number) {
        this._contourLineOpacity = value;
        this._altered.alter('contourLineOpacity');
    }
}
