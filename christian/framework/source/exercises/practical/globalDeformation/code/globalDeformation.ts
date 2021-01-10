import {
    Camera,
    Context,
    DefaultFramebuffer,
    EventProvider,
    ForwardSceneRenderPass,
    Framebuffer,
    GLTFLoader,
    GLTFPbrMaterial,
    GLTFPrimitive,
    Geometry,
    Invalidate,
    Material,
    Navigation,
    Program,
    Renderer,
    Shader,
    Texture2D,
    TextureCube,
    Wizard,
    auxiliaries,
} from 'webgl-operate';

import { mat3, mat4, vec3 } from 'gl-matrix';

import { Controls } from '../../../../common/code/uiHelper';
import { ZoomNavigation } from '../../../../common/code/zoom';

export class GlobalDeformationRenderer extends Renderer {
    protected static readonly _modelBase = (
        'models/exercises/practical/globalDeformation/models/'
    );

    protected _loader: GLTFLoader;

    protected _navigation: Navigation;

    protected _forwardPass: ForwardSceneRenderPass;

    protected _camera: Camera;

    protected _texture: Texture2D;
    protected _framebuffer: Framebuffer;
    protected _program: Program;
    protected _emptyTexture: Texture2D;

    protected _specularEnvironment: TextureCube;
    protected _brdfLUT: Texture2D;

    protected _uViewProjection: WebGLUniformLocation;
    protected _uModel: WebGLUniformLocation;
    protected _uNormalMatrix: WebGLUniformLocation;

    protected _uBaseColor: WebGLUniformLocation;
    protected _uBaseColorTexCoord: WebGLUniformLocation;
    protected _uMetallicRoughness: WebGLUniformLocation;
    protected _uMetallicRoughnessTexCoord: WebGLUniformLocation;
    protected _uNormal: WebGLUniformLocation;
    protected _uNormalTexCoord: WebGLUniformLocation;
    protected _uEmissive: WebGLUniformLocation;
    protected _uEmissiveTexCoord: WebGLUniformLocation;
    protected _uOcclusion: WebGLUniformLocation;
    protected _uOcclusionTexCoord: WebGLUniformLocation;

    protected _uEye: WebGLUniformLocation;
    protected _uGeometryFlags: WebGLUniformLocation;
    protected _uPbrFlags: WebGLUniformLocation;
    protected _uBaseColorFactor: WebGLUniformLocation;
    protected _uMetallicFactor: WebGLUniformLocation;
    protected _uRoughnessFactor: WebGLUniformLocation;
    protected _uEmissiveFactor: WebGLUniformLocation;
    protected _uNormalScale: WebGLUniformLocation;

    protected _uSpecularEnvironment: WebGLUniformLocation;
    protected _uBRDFLookupTable: WebGLUniformLocation;

    // interactivity - control helper and data for selection menus
    protected _controls: Controls;

    protected _moldFactor = 0;
    protected _uMoldFactor: WebGLUniformLocation;

    protected _pinchFactor = 0;
    protected _uPinchFactor: WebGLUniformLocation;

    protected _twistAngle = 0;
    protected _uTwistAngle: WebGLUniformLocation;

    protected _bendAngle = 0;
    protected _uBendAngle: WebGLUniformLocation;

    protected _objectDimensions = [1.0, 1.0, 1.0];
    protected _uObjectDimensions: WebGLUniformLocation;

    protected _models = [
        {
            name: 'Geschenk',
            uri: GlobalDeformationRenderer._modelBase + 'present.glb',
            dimensions: [1.0, 1.0, 1.0],
        },
        {
            name: 'Menger-Schwamm',
            uri: GlobalDeformationRenderer._modelBase + 'mengerSponge.glb',
            dimensions: [1.0, 1.0, 1.0],
        },
        {
            name: 'Tanzender Außerirdischer',
            uri: GlobalDeformationRenderer._modelBase +
                'Tanzender Außerirdischer.glb',
            dimensions: [0.970825, 1.16038, 0.564437],
        },
        {
            name: 'Häufchen',
            uri: GlobalDeformationRenderer._modelBase + 'Häufchen.glb',
            dimensions: [1.27433, 1.0623, 1.23555],
        },
    ];
    protected _selectedModelIndex = 0;

    /**
     * Initializes and sets up rendering passes, navigation, loads a font face
     * and links shaders with program.
     * @param context - valid context to create the object for.
     * @param identifier - meaningful name for identification of this instance.
     * @param eventProvider - required for mouse interaction
     * @returns - whether initialization was successful
     */
    protected onInitialize(context: Context, callback: Invalidate,
        eventProvider: EventProvider): boolean {

        const gl = this._context.gl;

        this._loader = new GLTFLoader(this._context);

        this._emptyTexture = new Texture2D(this._context, 'EmptyTexture');
        this._emptyTexture.initialize(1, 1, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE);

        this._framebuffer = new DefaultFramebuffer(this._context, 'DefaultFBO');
        this._framebuffer.initialize();

        const vert = new Shader(
            this._context, gl.VERTEX_SHADER, 'globalDeformation.vert');
        vert.initialize(require('./globalDeformation.vert'));
        const frag = new Shader(
            this._context, gl.FRAGMENT_SHADER, 'globalDeformation.frag');
        frag.initialize(require('./globalDeformation.frag'));
        this._program = new Program(this._context, 'GLTFPbrProgram');
        this._program.initialize([vert, frag]);

        this._uViewProjection = this._program.uniform('u_viewProjection');
        this._uModel = this._program.uniform('u_model');
        this._uNormalMatrix = this._program.uniform('u_normalMatrix');

        this._uBaseColor = this._program.uniform('u_baseColor');
        this._uBaseColorTexCoord = this._program.uniform('u_baseColorTexCoord');

        this._uMetallicRoughness = this._program.uniform('u_metallicRoughness');
        this._uMetallicRoughnessTexCoord =
            this._program.uniform('u_metallicRoughnessTexCoord');

        this._uNormal = this._program.uniform('u_normal');
        this._uNormalTexCoord = this._program.uniform('u_normalTexCoord');

        this._uEmissive = this._program.uniform('u_emissive');
        this._uEmissiveTexCoord = this._program.uniform('u_emissiveTexCoord');

        this._uOcclusion = this._program.uniform('u_occlusion');
        this._uOcclusionTexCoord = this._program.uniform('u_occlusionTexCoord');

        this._uEye = this._program.uniform('u_eye');
        this._uGeometryFlags = this._program.uniform('u_geometryFlags');
        this._uPbrFlags = this._program.uniform('u_pbrFlags');
        this._uBaseColorFactor = this._program.uniform('u_baseColorFactor');
        this._uMetallicFactor = this._program.uniform('u_metallicFactor');
        this._uRoughnessFactor = this._program.uniform('u_roughnessFactor');
        this._uEmissiveFactor = this._program.uniform('u_emissiveFactor');
        this._uNormalScale = this._program.uniform('u_normalScale');

        this._uSpecularEnvironment =
            this._program.uniform('u_specularEnvironment');
        this._uBRDFLookupTable = this._program.uniform('u_brdfLUT');

        this._uMoldFactor = this._program.uniform('u_moldFactor');
        this._uPinchFactor = this._program.uniform('u_pinchFactor');
        this._uTwistAngle = this._program.uniform('u_twistAngle');
        this._uBendAngle = this._program.uniform('u_bendAngle');
        this._uObjectDimensions = this._program.uniform('u_objectDimensions');

        /* Create and configure camera. */

        this._camera = new Camera();
        this._camera.center = vec3.fromValues(0.0, 0.0, 0.0);
        this._camera.up = vec3.fromValues(0.0, 1.0, 0.0);
        this._camera.eye = vec3.fromValues(0.7, 1.5, 2.0);
        this._camera.near = 0.1;
        this._camera.far = 32.0;

        /* Create and configure navigation */

        this._navigation = new ZoomNavigation(
            callback,
            eventProvider,
            { default: 4.0, min: 2.0, max: 10.0 }
        );
        this._navigation.camera = this._camera;

        /* Create and configure forward pass. */

        this._forwardPass = new ForwardSceneRenderPass(context);
        this._forwardPass.initialize();

        this._forwardPass.camera = this._camera;
        this._forwardPass.target = this._framebuffer;

        this._forwardPass.program = this._program;
        this._forwardPass.updateModelTransform = (matrix: mat4) => {
            gl.uniformMatrix4fv(this._uModel, gl.GL_FALSE, matrix);

            const normalMatrix = mat3.create();
            mat3.normalFromMat4(normalMatrix, matrix);
            gl.uniformMatrix3fv(this._uNormalMatrix, gl.GL_FALSE, normalMatrix);
        };
        this._forwardPass.updateViewProjectionTransform = (matrix: mat4) => {
            gl.uniformMatrix4fv(this._uViewProjection, gl.GL_FALSE, matrix);
        };
        this._forwardPass.bindUniforms = () => {
            gl.uniform3fv(this._uEye, this._camera.eye);

            gl.uniform1i(this._uBaseColor, 0);
            gl.uniform1i(this._uMetallicRoughness, 1);
            gl.uniform1i(this._uNormal, 2);
            gl.uniform1i(this._uOcclusion, 3);
            gl.uniform1i(this._uEmissive, 4);
            gl.uniform1i(this._uSpecularEnvironment, 5);
            gl.uniform1i(this._uBRDFLookupTable, 6);

            this._specularEnvironment.bind(gl.TEXTURE5);
            this._brdfLUT.bind(gl.TEXTURE6);
        };
        this._forwardPass.bindGeometry = (geometry: Geometry) => {
            const primitive = geometry as GLTFPrimitive;
            gl.uniform1i(this._uGeometryFlags, primitive.flags);
        };
        this._forwardPass.bindMaterial = (material: Material) => {
            const pbrMaterial = material as GLTFPbrMaterial;
            auxiliaries.assert(
                pbrMaterial !== undefined,
                `Material ${material.name} is not a PBR material.`);

            /**
             * Base color texture
             */
            if (pbrMaterial.baseColorTexture !== undefined) {
                pbrMaterial.baseColorTexture.bind(gl.TEXTURE0);
                gl.uniform1i(
                    this._uBaseColorTexCoord,
                    pbrMaterial.baseColorTexCoord);
            } else {
                this._emptyTexture.bind(gl.TEXTURE0);
            }

            /**
             * Metallic Roughness texture
             */
            if (pbrMaterial.metallicRoughnessTexture !== undefined) {
                pbrMaterial.metallicRoughnessTexture.bind(gl.TEXTURE1);
                gl.uniform1i(
                    this._uMetallicRoughnessTexCoord,
                    pbrMaterial.metallicRoughnessTexCoord);
            } else {
                this._emptyTexture.bind(gl.TEXTURE1);
            }

            /**
             * Normal texture
             */
            if (pbrMaterial.normalTexture !== undefined) {
                pbrMaterial.normalTexture.bind(gl.TEXTURE2);
                gl.uniform1i(this._uNormalTexCoord, pbrMaterial.normalTexCoord);
            } else {
                this._emptyTexture.bind(gl.TEXTURE2);
            }

            /**
             * Occlusion texture
             */
            if (pbrMaterial.occlusionTexture !== undefined) {
                pbrMaterial.occlusionTexture.bind(gl.TEXTURE3);
                gl.uniform1i(
                    this._uOcclusionTexCoord,
                    pbrMaterial.occlusionTexCoord);
            } else {
                this._emptyTexture.bind(gl.TEXTURE3);
            }

            /**
             * Emission texture
             */
            if (pbrMaterial.emissiveTexture !== undefined) {
                pbrMaterial.emissiveTexture.bind(gl.TEXTURE4);
                gl.uniform1i(
                    this._uEmissiveTexCoord,
                    pbrMaterial.emissiveTexCoord);
            } else {
                this._emptyTexture.bind(gl.TEXTURE4);
            }

            /**
             * Factors
             */
            gl.uniform4fv(this._uBaseColorFactor, pbrMaterial.baseColorFactor);
            gl.uniform3fv(this._uEmissiveFactor, pbrMaterial.emissiveFactor);
            gl.uniform1f(this._uMetallicFactor, pbrMaterial.metallicFactor);
            gl.uniform1f(this._uRoughnessFactor, pbrMaterial.roughnessFactor);
            gl.uniform1f(this._uNormalScale, pbrMaterial.normalScale);
            gl.uniform1i(this._uPbrFlags, pbrMaterial.flags);
        };

        this._controls = new Controls();

        const modelSelectList = this._controls.createSelectListInput(
            'Modell',
            this._models.map((entry) => entry.name),
            'Wähle ein 3D-Modell');
        this._selectedModelIndex = modelSelectList.selectedIndex;

        modelSelectList.addEventListener('change', (event) => {
            const index = (event.target as HTMLSelectElement).selectedIndex;
            this._selectedModelIndex = index;
            this.loadAsset();
        });

        const moldFactorInput = this._controls.createSliderInput(
            'Verformfaktor', undefined, 0,
            'Wie stark das Objekt verformt wird. [0,1]',
            0, 1, 0.01);
        this._moldFactor = parseFloat(moldFactorInput.value);
        moldFactorInput.addEventListener('input', (event) => {
            const value = (event.target as HTMLInputElement).value;
            this._moldFactor = parseFloat(value);
            this.invalidate(true);
        });

        const pinchFactorInput = this._controls.createSliderInput(
            'Zusammendrückfaktor', undefined, 0,
            'Wie stark das Objekt zusammengedrückt wird. [0,1]',
            0, 1, 0.01);
        this._pinchFactor = parseFloat(pinchFactorInput.value);
        pinchFactorInput.addEventListener('input', (event) => {
            const value = (event.target as HTMLInputElement).value;
            this._pinchFactor = parseFloat(value);
            this.invalidate(true);
        });

        const twistAngleInput = this._controls.createSliderInput(
            'Verdrehwinkel', undefined, 0,
            'Winkel wie weit das Objekt verdreht wird. [-180,180]',
            -180, 180, 0.1);
        this._twistAngle = parseFloat(twistAngleInput.value) / 180.0 * Math.PI;
        twistAngleInput.addEventListener('input', (event) => {
            const value = (event.target as HTMLInputElement).value;
            this._twistAngle = parseFloat(value) / 180.0 * Math.PI;
            this.invalidate(true);
        });

        const bendAngleInput = this._controls.createSliderInput(
            'Biegewinkel', undefined, 0,
            'Winkel wie weit das Objekt gebogen wird. [-180,180]',
            -180, 180, 0.1);
        this._bendAngle = parseFloat(bendAngleInput.value) / 180.0 * Math.PI;
        bendAngleInput.addEventListener('input', (event) => {
            const value = (event.target as HTMLInputElement).value;
            this._bendAngle = parseFloat(value) / 180.0 * Math.PI;
            this.invalidate(true);
        });

        const resetButton = this._controls.createActionButton('Zurücksetzen');
        resetButton.addEventListener('click', () => {
            moldFactorInput.value = '0';
            this._moldFactor = parseFloat(moldFactorInput.value);
            pinchFactorInput.value = '0';
            this._pinchFactor = parseFloat(pinchFactorInput.value);
            twistAngleInput.value = '0';
            this._twistAngle = parseFloat(twistAngleInput.value);
            bendAngleInput.value = '0';
            this._bendAngle = parseFloat(bendAngleInput.value);
            this.invalidate(true);
        });

        this.loadAsset();
        this.loadEnvironmentMap();

        return true;
    }

    /**
     * Uninitializes Buffers, Textures, and Program.
     */
    protected onUninitialize(): void {
        super.uninitialize();
    }

    /**
     * This is invoked in order to check if rendering of a frame is required by
     * means of implementation specific evaluation (e.g., lazy non continuous
     * rendering). Regardless of the return value a new frame (preparation,
     * frame, swap) might be invoked anyway, e.g., when update is forced or
     * canvas or context properties have changed or the renderer was invalidated
     * @see{@link invalidate}.
     * Updates the navigaten and the AntiAliasingKernel.
     * @returns whether to redraw
     */
    protected onUpdate(): boolean {
        if (this._altered.frameSize) {
            this._camera.viewport = [this._frameSize[0], this._frameSize[1]];
        }
        if (this._altered.canvasSize) {
            this._camera.aspect = this._canvasSize[0] / this._canvasSize[1];
        }
        if (this._altered.clearColor) {
            this._forwardPass.clearColor = this._clearColor;
        }

        this._navigation.update();
        this._forwardPass.update();

        return this._altered.any || this._camera.altered;
    }

    /**
     * This is invoked in order to prepare rendering of one or more frames,
     * regarding multi-frame rendering and
     * camera-updates.
     */
    protected onPrepare(): void {
        this._forwardPass.prepare();

        this._altered.reset();
        this._camera.altered = false;
    }

    protected onFrame(): void {
        const gl = this._context.gl;

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

        this._program.bind();
        gl.uniform1f(this._uMoldFactor, this._moldFactor);
        gl.uniform1f(this._uPinchFactor, this._pinchFactor);
        gl.uniform1f(this._uTwistAngle, this._twistAngle);
        gl.uniform1f(this._uBendAngle, this._bendAngle);
        gl.uniform3fv(this._uObjectDimensions, this._objectDimensions);
        this._program.unbind();

        this._forwardPass.frame();
    }

    protected onSwap(): void {
    }

    /**
     * Load asset from URI specified by the HTML select
     */
    protected loadAsset(): void {
        const model = this._models[this._selectedModelIndex];

        this._objectDimensions = model.dimensions;
        const uri = model.uri;
        this._forwardPass.scene = undefined;

        this._loader.uninitialize();
        this._loader.loadAsset(uri)
            .then(() => {
                this._forwardPass.scene = this._loader.defaultScene;
                this._invalidate(true);
            });
    }

    /**
     * Setup environment lighting
     */
    protected loadEnvironmentMap(): void {
        const gl = this._context.gl;

        this._brdfLUT = new Texture2D(this._context, 'BRDFLookUpTable');
        this._brdfLUT.initialize(1, 1, gl.RG16F, gl.RG, gl.FLOAT);
        this._brdfLUT.wrap(gl.CLAMP_TO_EDGE, gl.CLAMP_TO_EDGE);
        this._brdfLUT.filter(gl.LINEAR, gl.LINEAR);
        this._brdfLUT.fetch('img/imagebasedlighting/brdfLUT.png');

        const internalFormatAndType = Wizard.queryInternalTextureFormat(
            this._context, gl.RGBA, Wizard.Precision.byte);

        this._specularEnvironment = new TextureCube(this._context, 'Cubemap');
        this._specularEnvironment.initialize(
            512,
            internalFormatAndType[0],
            gl.RGBA,
            internalFormatAndType[1]);

        const MIPMAP_LEVELS = 9;

        this._specularEnvironment.filter(gl.LINEAR, gl.LINEAR_MIPMAP_LINEAR);
        this._specularEnvironment.levels(0, MIPMAP_LEVELS - 1);

        for (let mipLevel = 0; mipLevel < MIPMAP_LEVELS; ++mipLevel) {
            const base = 'img/imagebasedlighting/preprocessed-map';
            this._specularEnvironment.fetch({
                positiveX: `${base}-px-${mipLevel}.png`,
                negativeX: `${base}-nx-${mipLevel}.png`,
                positiveY: `${base}-py-${mipLevel}.png`,
                negativeY: `${base}-ny-${mipLevel}.png`,
                positiveZ: `${base}-pz-${mipLevel}.png`,
                negativeZ: `${base}-nz-${mipLevel}.png`,
            }, false, mipLevel);
        }
    }

    protected onDiscarded(): void {
    }
}
