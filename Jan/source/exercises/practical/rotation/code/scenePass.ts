import {
    ForwardSceneRenderPass,
    Initializable
} from 'webgl-operate';

/**
 * More cooperative version of the model renderer - allows calling frame
 * multiple times without clearing the framebuffer during every pass.
 */
export class ScenePass extends ForwardSceneRenderPass {
    @Initializable.assert_initialized()
    public frame(): void {
        this.bindUniforms?.();
        this.updateViewProjectionTransform(this._camera.viewProjection);
        this.drawCalls();
    }
}
