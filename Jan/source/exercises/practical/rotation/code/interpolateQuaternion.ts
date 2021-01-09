import {
    mat4,
    quat,
    vec3
} from 'webgl-operate';

import { Angles } from './angles';
import { slerp } from './slerp';

/**
 * Rotation interpolation using quaternions.
 * @param startRotation - Rotation at the left side, stored as yaw,
 * pitch and roll euler angles
 * @param endRotation - Rotation at the right side, stored as yaw,
 * pitch and roll euler angles
 * @param t - Interpolation factor
 * @returns The interpolated rotation, stored as rotation matrix
 */
export function interpolateQuaternion(
    startRotation: Angles, endRotation: Angles, t: number
): mat4 {
    // TODO: implement rotation using quaternion interpolation
    // HINT: your implementation should use slerp
    const startQuad = quat.create();
    const endQuad = quat.create();
    quat.rotateZ(startQuad, startQuad, startRotation.roll);
    quat.rotateY(startQuad, startQuad, startRotation.yaw);
    quat.rotateX(startQuad, startQuad, startRotation.pitch);
    quat.rotateZ(endQuad, endQuad, endRotation.roll);
    quat.rotateY(endQuad, endQuad, endRotation.yaw);
    quat.rotateX(endQuad, endQuad, endRotation.pitch);
    const outputMatrix = mat4.create();
    const outputQuad =  slerp(startQuad, endQuad, t);
    mat4.fromQuat(outputMatrix, outputQuad);

    return outputMatrix;
}
