import {
    Context,
    DefaultFramebuffer,
    Framebuffer,
    Renderer,
    Texture2D,
} from 'webgl-operate';

import { ApplyPass } from './applyPass';
import { Controls } from '../../../../common/code/uiHelper';
import { ExportPass } from './exportPass';
import Jimp from 'jimp';

enum Mode {
    PreviewIdentity,
    ExportIdentity,
    ApplyToImage
}

export class LutRenderer extends Renderer {
    // underlying WebGL context
    protected _gl: WebGLRenderingContext;

    // render passes
    protected _exportPass: ExportPass;
    protected _applyPass: ApplyPass;

    // interactivity - control helper and data for selection menus
    protected _controls: Controls;
    protected _images: Map<string, string> = new Map<string, string>([
        // ['Mike', 'img/assignment1/mike.jpg'],
        ['Testbild', 'img/input/testbild.png'],
        ['Schnabeltier', 'img/input/platypus.png'],
        ['Blume', 'img/input/flower.png'],
        ['Kürbisse', 'img/input/pumpkins.jpg'],
        ['Matrix', 'img/input/matrix.jpg'],
    ]);

    // gpu texture handles
    protected _exportRenderTexture: Texture2D;

    // the framebuffers to render to
    protected _outputFBO: DefaultFramebuffer;
    protected _exportFBO: Framebuffer;

    // storage for the selected LUT resolution
    protected _lutRes: number;

    // active pass and framebuffer
    protected _mode = Mode.PreviewIdentity;

    /**
     * Exports the LUT currently stored in the export framebuffer as png image.
     */
    protected exportIdentityLut(): void {
        // calculate LUT texture resolution
        const w = this._lutRes * this._lutRes;
        const h = this._lutRes;

        // fetch pixels from buffer
        const out = new Uint8Array(w * h * 4);
        this._exportFBO.bind();
        this._gl.readPixels(
            0, 0, w, h, this._gl.RGBA, this._gl.UNSIGNED_BYTE, out);
        this._exportFBO.unbind();

        // export image by creating and automatically clicking a download link
        new Jimp({ data: out, width: w, height: h })
            .mirror(false, true)
            .getBase64(Jimp.MIME_PNG, (e, v) => {
                const a = document.createElement('a');
                a.setAttribute('href', v);
                a.setAttribute('download', `identity_${this._lutRes}.png`);
                a.click();
            });
    }

    /**
     * Copies the LUT currently stored in the export framebuffer to the
     * ApplyPass's LUT texture.
     */
    protected applyIdentityLut(): void {
        // calculate LUT texture resolution
        const w = this._lutRes * this._lutRes;
        const h = this._lutRes;

        // prepare texture
        const tex = this._applyPass.lutObject;
        tex.resize(w, h);

        // copy from active buffer to active texture
        this._exportFBO.bind();
        tex.bind();
        this._gl.copyTexImage2D(
            this._gl.TEXTURE_2D, 0, this._gl.RGBA, 0, 0, w, h, 0);
        tex.unbind();
        this._exportFBO.unbind();
    }

    /**
     * Initializes and sets up buffer, cube geometry, camera and links shaders
     * with program.
     * @param context - valid context to create the object for.
     * @param identifier - meaningful name for identification of this instance.
     * @param mouseEventProvider - required for mouse interaction
     * @returns - whether initialization was successful
     */
    protected onInitialize(context: Context): boolean {
        // store rendering context
        this._gl = context.gl as WebGLRenderingContext;

        // set up framebuffer for display
        this._outputFBO = new DefaultFramebuffer(context);
        this._outputFBO.initialize();

        // create a new texture for exporting the identity lut
        this._exportRenderTexture = new Texture2D(this._context);
        // initialize the texture as RGBA texture with placeholder size 1x1
        this._exportRenderTexture.initialize(
            1, 1, this._gl.RGBA, this._gl.RGBA, this._gl.UNSIGNED_BYTE);

        // set up framebuffer for export
        this._exportFBO = new Framebuffer(context);
        this._exportFBO.initialize([
            [this._gl.COLOR_ATTACHMENT0, this._exportRenderTexture],
        ]);

        // set up passes
        this._exportPass = new ExportPass(context);
        this._exportPass.initialize();
        this._applyPass = new ApplyPass(context);
        this._applyPass.initialize();
        this._applyPass.invalidate = () => this.invalidate();

        // initialize controls
        this._controls = new Controls();

        // select list for lut resolution
        const resSelect = this._controls.createSelectListInput(
            'Auflösung der LUT',
            [...Array(6).keys()].map((i) => String(Math.pow(2, i + 2))));
        resSelect.addEventListener('change', () => {
            const res = Number(resSelect.value);
            this._lutRes = res;
            this._exportPass.resolution = res;
            this.invalidate();
        });

        // button for identity lut preview
        const previewButton = this._controls.createActionButton(
            'Identitäts-LUT anzeigen');
        previewButton.addEventListener('click', () => {
            this._mode = Mode.PreviewIdentity;
            this.invalidate();
        });

        // button for identity lut export
        const exportButton = this._controls.createActionButton(
            'Identitäts-LUT exportieren');
        exportButton.addEventListener('click', () => {
            this._mode = Mode.ExportIdentity;
            this._exportRenderTexture.resize(
                this._lutRes * this._lutRes, this._lutRes);
            this.onFrame();
            this.exportIdentityLut();
        });

        // button for result output
        const applyButton = this._controls.createActionButton(
            'Identitäts-LUT anwenden');
        applyButton.addEventListener('click', () => {
            this._mode = Mode.ExportIdentity;
            this._exportRenderTexture.resize(
                this._lutRes * this._lutRes, this._lutRes);
            this.onFrame();
            this.applyIdentityLut();
            this._mode = Mode.ApplyToImage;
            this.invalidate();
        });

        // select list for predefined images
        const imageSelect = this._controls.createSelectListInput(
            'Eingabebild', Array.from(this._images.keys()));
        imageSelect.addEventListener('change', () => {
            this._mode = Mode.ApplyToImage;
            this._applyPass.image = this._images.get(imageSelect.value);
        });

        // file input for custom images
        const imageInput = this._controls.createFileInput(
            'Eigenes Eingabebild hochladen', 'image/png, image/jpeg');
        imageInput.addEventListener('change', () => {
            this._mode = Mode.ApplyToImage;
            const file = imageInput.files[0];
            if (!file) return;
            this._applyPass.image = file;
        });
        imageInput.addEventListener('click', () => {
            lutInput.value = '';
        });

        // file input for lut
        const lutInput = this._controls.createFileInput(
            'LUT importieren', 'image/png');
        lutInput.addEventListener('change', () => {
            this._mode = Mode.ApplyToImage;
            const file = lutInput.files[0];
            if (!file) return;
            this._applyPass.lut = file;
        });
        lutInput.addEventListener('click', () => {
            lutInput.value = '';
        });

        // initial values
        this._applyPass.image = this._images.get(imageSelect.value);
        const initialRes = Number(resSelect.value);
        this._lutRes = initialRes;
        this._exportPass.resolution = initialRes;

        return true;
    }

    /**
     * Uninitializes buffers, geometry and program.
     */
    protected onUninitialize(): void {
        super.uninitialize();

        this._exportPass.uninitialize();
        this._applyPass.uninitialize();
        this._exportRenderTexture.uninitialize();
        this._exportFBO.uninitialize();
        this._outputFBO.uninitialize();
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
        // just return true - we only invalidate if we wan't to redraw,
        // no additional logic is needed here
        return true;
    }

    /**
     * This is invoked in order to prepare rendering of one or more frames,
     * regarding multi-frame rendering and camera-updates.
     */
    protected onPrepare(): void {
        if (this._altered.clearColor) {
            this._outputFBO.clearColor(this._clearColor);
        }

        this._altered.reset();
    }

    /**
     * This is invoked after both onUpdate and onPrepare and should be used to
     * do the actual rendering.
     */
    protected onFrame(): void {
        // choose to render which pass to which buffer based on current mode
        let fbo: Framebuffer;
        let pass: ExportPass | ApplyPass;
        switch (this._mode) {
            case Mode.PreviewIdentity:
                fbo = this._outputFBO;
                pass = this._exportPass;
                break;
            case Mode.ExportIdentity:
                fbo = this._exportFBO;
                pass = this._exportPass;
                break;
            case Mode.ApplyToImage:
                fbo = this._outputFBO;
                pass = this._applyPass;
            // no default
        }
        // set camera viewport
        this._gl.viewport(0, 0, fbo.width, fbo.height);
        // render selected pass into selected framebuffer
        pass.target = fbo;
        pass.frame();
    }

    protected onSwap(): void { }

    protected onDiscarded(): void { }
}
