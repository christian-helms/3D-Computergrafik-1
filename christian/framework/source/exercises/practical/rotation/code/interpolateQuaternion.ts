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
    const startQuat = quat.create();
    const endQuat = quat.create();

    const xStart = (startRotation.pitch + Math.PI) * 360 / (2*Math.PI);
    const yStart = (startRotation.yaw + Math.PI) * 360 / (2*Math.PI);
    const zStart = (startRotation.roll + Math.PI) * 360 / (2*Math.PI);
    const xEnd = (endRotation.pitch + Math.PI) * 360 / (2*Math.PI);
    const yEnd = (endRotation.yaw + Math.PI) * 360 / (2*Math.PI);
    const zEnd = (endRotation.roll + Math.PI) * 360 / (2*Math.PI);
    quat.fromEuler(startQuat, xStart, -yStart, zStart);
    quat.fromEuler(endQuat, xEnd, -yEnd, zEnd);

    const interpolated_quat = slerp(startQuat, endQuat, t);
    const outputMatrix = mat4.create();
    mat4.fromQuat(outputMatrix, interpolated_quat);
    return outputMatrix;
}
