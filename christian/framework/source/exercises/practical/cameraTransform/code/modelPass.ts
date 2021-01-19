import {
    Camera,
    ChangeLookup,
    Context,
    Framebuffer,
    GLTFPbrMaterial,
    GLTFPrimitive,
    GeometryComponent,
    Initializable,
    Program,
    SceneNode,
    Shader,
    Texture2D,
    mat4,
} from 'webgl-operate';

import { ScenePass } from './scenePass';

export class ModelPass extends Initializable {
    protected readonly _altered = Object.assign(new ChangeLookup(), {
        any: false,
        observedTransform: false,
        enableClipping: false
    });

    protected _context: Context;
    protected _gl: WebGL2RenderingContext;

    protected _scene: SceneNode;
    protected _scenePass: ScenePass;

    protected _camera: Camera;
    protected _target: Framebuffer;
    protected _program: Program;

    protected _uViewProjection: WebGLUniformLocation;
    protected _uModel: WebGLUniformLocation;

    protected _uBaseColor: WebGLUniformLocation;
    protected _uNormal: WebGLUniformLocation;

    protected _uEye: WebGLUniformLocation;
    protected _uGeometryFlags: WebGLUniformLocation;
    protected _uPbrFlags: WebGLUniformLocation;
    protected _uBaseColorFactor: WebGLUniformLocation;

    protected _uObservedTransform: WebGLUniformLocation;
    protected _uEnableClipping: WebGLUniformLocation;

    protected _observedTransform: mat4;
    protected _enableClipping: boolean;

    public constructor(context: Context) {
        super();
        this._context = context;
        this._gl = context.gl as WebGL2RenderingContext;
    }

    @Initializable.initialize()
    public initialize(): boolean {
        const vert = new Shader(this._context, this._gl.VERTEX_SHADER);
        vert.initialize(require('./warpedModel.vert'));
        const frag = new Shader(this._context, this._gl.FRAGMENT_SHADER);
        frag.initialize(require('./warpedModel.frag'));
        this._program = new Program(this._context);
        this._program.initialize([vert, frag]);

        this._uViewProjection = this._program.uniform('u_viewProjection');
        this._uModel = this._program.uniform('u_model');

        this._uBaseColor = this._program.uniform('u_baseColor');

        this._uEye = this._program.uniform('u_eye');
        this._uGeometryFlags = this._program.uniform('u_geometryFlags');
        this._uPbrFlags = this._program.uniform('u_pbrFlags');
        this._uBaseColorFactor = this._program.uniform('u_baseColorFactor');

        this._uObservedTransform = this._program.uniform('u_observedTransform');
        this._uEnableClipping = this._program.uniform('u_enableClipping');

        this._scenePass = new ScenePass(this._context);
        this._scenePass.initialize();
        this._scenePass.program = this._program;

        this._scenePass.updateModelTransform = (m) => {
            this._gl.uniformMatrix4fv(this._uModel, false, m);
        };

        this._scenePass.updateViewProjectionTransform = (m) => {
            this._gl.uniformMatrix4fv(this._uViewProjection, false, m);
        };

        this._scenePass.bindUniforms = () => {
            this._gl.uniform3fv(this._uEye, this._camera.eye);
            this._gl.uniform1i(this._uBaseColor, 0);
            this._gl.uniform1i(this._uNormal, 2);
        };

        this._scenePass.bindGeometry = (g) => {
            this._gl.uniform1i(
                this._uGeometryFlags, (g as GLTFPrimitive).flags);
        };

        this._scenePass.bindMaterial = (m) => {
            const pbr = m as GLTFPbrMaterial;

            const none = (i: number): void => {
                this._gl.activeTexture(i);
                this._gl.bindTexture(
                    this._gl.TEXTURE_2D, Texture2D.DEFAULT_TEXTURE);
            };

            // Base color texture
            if (pbr.baseColorTexture !== undefined) {
                pbr.baseColorTexture.bind(this._gl.TEXTURE0);
            } else {
                none(this._gl.TEXTURE0);
            }

            // Normal texture
            if (pbr.normalTexture !== undefined) {
                pbr.normalTexture.bind(this._gl.TEXTURE2);
            } else {
                none(this._gl.TEXTURE2);
            }

            // Factors
            this._gl.uniform4fv(this._uBaseColorFactor, pbr.baseColorFactor);
            this._gl.uniform1i(this._uPbrFlags, pbr.flags);
        };

        return true;
    }

    @Initializable.uninitialize()
    public uninitialize(): void {
    }

    public update(): void {
        this._scenePass.update();
    }

    public prepare(): void {
        if (this._altered.any) {
            this._program.bind();
        }

        if (this._altered.observedTransform) {
            this._gl.uniformMatrix4fv(
                this._uObservedTransform, false, this._observedTransform);
        }

        if (this._altered.enableClipping) {
            this._gl.uniform1i(this._uEnableClipping, +this._enableClipping);
        }

        if (this._altered.any) {
            this._program.unbind();
        }

        this._scenePass.prepare();
    }

    public frame(): void {
        if (!this._scene) return;

        this._gl.enable(this._gl.DEPTH_TEST);
        this._gl.enable(this._gl.BLEND);
        this._gl.blendFunc(this._gl.SRC_ALPHA, this._gl.ONE_MINUS_SRC_ALPHA);

        this._gl.viewport(0, 0, this._target.size[0], this._target.size[1]);

        this._program.bind();


        this._scenePass.frame();

        this._program.unbind();

        this._gl.disable(this._gl.BLEND);
        this._gl.disable(this._gl.DEPTH_TEST);
    }

    public set scene(scene: SceneNode) {
        this._scene = scene;
        this._scenePass.scene = scene;
        this._scene.traverse((n) => n.components.forEach((c) => {
            if (c instanceof GeometryComponent) {
                // only support normals and uv
                const g = (c.geometry as GLTFPrimitive).flags & ~0b101;
                if (g !== 0) {
                    console.log('unsupported geometry flags:', g.toString(2));
                }
                // only support color map and normal map
                const m = (c.material as GLTFPbrMaterial).flags & ~0b1100000;
                if (m !== 0) {
                    console.log('unsupported material flags:', m.toString(2));
                }
            }
        }));
    }

    public set camera(camera: Camera) {
        this._camera = camera;
        this._scenePass.camera = camera;
    }

    public set target(fbo: Framebuffer) {
        this._target = fbo;
        this._scenePass.target = fbo;
    }

    public set observedTransform(m: mat4) {
        this._altered.alter('observedTransform');
        this._observedTransform = m;
    }

    public set enableClipping(enable: boolean) {
        this._altered.alter('enableClipping');
        this._enableClipping = enable;
    }

    public get altered(): boolean {
        return this._altered.any || this._camera.altered;
    }
}
