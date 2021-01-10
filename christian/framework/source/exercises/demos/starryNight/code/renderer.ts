import {
    Context,
    DefaultFramebuffer,
    Renderer
} from 'webgl-operate';

// include the passes stored in the same dir
import { HillPass } from './hillPass';
import { StarPass } from './starPass';
import { TreePass } from './treePass';

/**
 * Entry point. The renderer should handle all the rendering.
 * For simplicity, we also use it to handle the controls and application data,
 * but in a real application, you would use a separate class for that.
 * Here, the main class, source/common/code/exerciseRunner.ts, does barely
 * anything, except connecting the renderer to the canvas.
 * Please don't rat us out to the SWA chair.
 *
 * The framework automatically includes all files specifying a renderer.
 * The renderer specified in exercise.json is instanced by
 * source/common/pages/partials/content.pug (template file, compiled to html)
 * and then handed to the ExerciseRunner.
 */
export class StarryNightRenderer extends Renderer {
    // Store the webgl-operate and WebGL contexts for easier access
    protected _context: Context;
    protected _gl: WebGL2RenderingContext;

    // The framebuffer is a buffer to render a frame into.
    // The DefaultFramebuffer class is for rendering to the screen framebuffer.
    // (fbo is short for framebuffer object)
    protected _fbo: DefaultFramebuffer;

    // The passes are used to handle parts of the scene separately.
    protected _stars: StarPass;
    protected _hills: HillPass;
    protected _trees: TreePass;

    /**
     * Called by the framework to set the renderer up.
     * @param context
     */
    protected onInitialize(context: Context): boolean {
        this._context = context;
        this._gl = context.gl as WebGL2RenderingContext;

        // Tracking the setup state
        let valid = true;

        // Prepare the output. Usually, this consists of creating the object
        // and then initializing it. Separating these steps into two calls is
        // just webgl-operate's convention. This way, you could split this up
        // if necessary (e.g. creating a texture immediately, but only
        // initializing it once the data is ready).
        this._fbo = new DefaultFramebuffer(context);
        valid &&= this._fbo.initialize();
        // The clearColor is used by _fbo.clear to fill the whole buffer with
        // the same color, preparing the buffer for a new frame.
        this._fbo.clearColor([0.1, 0.1, 0.4, 1.0]);

        // Prepare the three passes. As they all render to the same target
        // framebuffer, so this could be handled globally,
        // but it's cleaner for each pass to handle this separately.
        this._stars = new StarPass(context);
        valid &&= this._stars.initialize();
        this._stars.target = this._fbo;

        this._hills = new HillPass(context);
        valid &&= this._hills.initialize();
        this._hills.target = this._fbo;

        this._trees = new TreePass(context);
        valid &&= this._trees.initialize();
        this._trees.target = this._fbo;

        // Inform caller if everything is set up correctly
        return valid;
    }

    /**
     * Clean up if renderer is stopped for any reason. The framework does not
     * properly use this (the context and everything belonging to it is just
     * destroyed when reloading or leaving the page), but it's cleaner to
     * implement it.
     */
    protected onUninitialize(): void {
        this._stars.uninitialize();
        this._hills.uninitialize();
        this._trees.uninitialize();
        this._fbo.uninitialize();
    }

    /**
     * Invoked if the context got discarded while we're still running. This can
     * happen if the device goes to sleep mode or something went really wrong.
     * In theory, we could try to salvage things and ask teh browser to restore
     * the context (https://www.khronos.org/webgl/wiki/HandlingContextLost),
     * but usually its not worth it, so we just expect the user to reload.
     */
    protected onDiscarded(): void { }

    /**
     * If invalidate was called anywhere to request a new frame (e.g. when the
     * canvas is resized by toggling fullscreen), this function is called to
     * check if there have been any changes that require a re-draw. For the
     * renderer, this will usually be true (if not, the invalidate call is
     * unnecessary and should be avoided), but tracking this for all components
     * can be beneficial, as needless calls to their prepare functions can be
     * skipped.
     */
    protected onUpdate(): boolean {
        // Usually, this would look something like
        // return (
        //     this._altered.any ||
        //     this._stars.altered ||
        //     this._hills.altered ||
        //     this._trees.altered
        // );
        // But since there's no internal state to keep track of in this demo,
        // we just check if any external options (frame size etc.) changed.
        return this._altered.any;
    }

    /**
     * If update function returned true: prepare all components for new frame.
     * This demo does not utilize this, as there is no internal state which
     * could change.
     */
    protected onPrepare(): void { }

    /**
     * This is where the actual rendering happens.
     * onFrame is called if onUpdate returned true and after onPrepare was
     * called to set up the new frame.
     */
    protected onFrame(): void {
        // Reset the framebuffer to the previously set clear color
        this._fbo.clear(this._gl.COLOR_BUFFER_BIT);

        // Set where in the frame we want to render. This could be used to
        // render only to parts of it, but we want to fill the whole canvas.
        this._gl.viewport(0, 0, this._canvasSize[0], this._canvasSize[1]);

        // call the passes' rendering functions
        this._stars.frame();
        this._hills.frame();
        this._trees.frame();
    }
}
