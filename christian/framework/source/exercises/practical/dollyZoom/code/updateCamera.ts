import {
    Camera,
    vec3
} from 'webgl-operate';

import { Rotation } from './rotation';
import { exp } from './exp';
import { getFov } from './getFov';
import { lerp } from './lerp';
import { smoothstep } from './smoothstep';

/**
 * Configures the camera.
 * @param viewTarget The scene's point of interest.
 * @param rotation Camera rotation around viewTarget.
 * @param minDist Minimum distance from the viewTarget.
 * @param maxDist Maximum distance from the viewTarget.
 * @param interpolateFactor Progress of interpolation between min and max dist.
 * @param focalWidth Size of the object in focus.
 * @param camera The camera object to manipulate.
 */
export function updateCamera(
    viewTarget: vec3,
    rotation: Rotation,
    minDist: number,
    maxDist: number,
    interpolateFactor: number,
    focalWidth: number,
    camera: Camera,
): void {
    // use an exponential function to slow down movement when closer
    const slow = exp(interpolateFactor, 7);

    // and use smooth acceleration for moving
    const smooth = smoothstep(0, 1, slow);


    /**
     * Values you should use:
     *
     * viewTarget: Based on the selected model, this variable contains the
     * scene's point of interest.
     *
     * rotation: Camera rotation. Uses a longitude/latitude system,
     * with values being stored as radians.
     *
     * smooth: Contains a "better" version of the interpolationFactor,
     * which makes the animation look smoother. It is recommended to use
     * this instead of the default interpolation factor.
     *
     * minDist: Minimum distance from the viewTarget (when the
     * interpolation factor is 0).
     *
     * maxDist: Maximum distance from the viewTarget (when the
     * interpolation factor is 1).
     *
     * focalWidth: Size of the area that's in focus.
     */

    // TODO: set correct camera properties
    // center - the point the camera looks at
    camera.center = viewTarget;
    // eye - the camera's position
    const dist = lerp(minDist, maxDist, smooth);
    camera.eye = camera.center;
    camera.eye[2] += 2* dist;
    camera.up = camera.eye;
    vec3.rotateX(camera.eye, camera.eye, camera.center, rotation.latitude);
    vec3.rotateY(camera.eye, camera.eye, camera.center, rotation.longitude);
    // up - y axis of the camera
    camera.up[1] += 1;
    vec3.rotateX(camera.up, camera.up, camera.center, rotation.latitude);
    vec3.rotateY(camera.up, camera.up, camera.center, rotation.longitude);
    vec3.subtract(camera.up, camera.up, camera.eye);
    // fovy - the camera's vertical field of view
    camera.fovy = getFov(dist, focalWidth);
}
