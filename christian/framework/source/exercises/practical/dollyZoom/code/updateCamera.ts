import {
    Camera,
    mat4,
    vec3
} from 'webgl-operate';

import { Rotation } from './rotation';
import { exp } from './exp';
import { getFov } from './getFov';
import { lerp } from './lerp';
import { smoothstep } from './smoothstep';
import { sign } from 'webgl-operate/lib/gl-matrix-extensions';

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
    maxRotation: Rotation,
    dollyZoomOn: boolean
): void {
    // use an exponential function to slow down movement when closer
    const slow = exp(interpolateFactor, 7);
    // and use smooth acceleration for moving
    const smooth = smoothstep(0, 1, slow);
    // center - the point the camera looks at
    camera.center = viewTarget;// vec3.fromValues(1.5,2,0);
    // eye - the camera's position
    camera.eye = vec3.fromValues(camera.center[0], camera.center[1], camera.center[2] + lerp(minDist, maxDist, smooth));
    vec3.rotateX(camera.eye, camera.eye, camera.center, (Math.abs(rotation.latitude) < Math.PI / 2 - 0.001) ? rotation.latitude : Math.sign(rotation.latitude) * (Math.PI / 2 - 0.001));
    vec3.rotateY(camera.eye, camera.eye, camera.center, rotation.longitude);
    vec3.rotateY(camera.eye, camera.eye, camera.center, lerp(maxRotation.longitude, 0, smooth));

    // up - y axis of the camera
    const distvector = vec3.fromValues(0, 0, 0);
    vec3.subtract(distvector, camera.eye, camera.center);
    const helpvector = vec3.fromValues(-distvector[2], 0, distvector[0]);
    vec3.cross(camera.up, helpvector, distvector);
    vec3.normalize(camera.up, camera.up);

    camera.fovy = dollyZoomOn ? getFov(vec3.len(distvector), focalWidth) : 45;
}
