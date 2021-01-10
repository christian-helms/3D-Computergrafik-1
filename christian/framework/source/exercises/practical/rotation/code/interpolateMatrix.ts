import { Angles } from './angles';
import { lerp } from './lerp';
import { mat4 } from 'webgl-operate';
import { quat } from 'webgl-operate';

/**
 * Rotation interpolation using matrices.
 * @param startRotation - Rotation at the left side, stored as yaw,
 * pitch and roll euler angles
 * @param endRotation - Rotation at the right side, stored as yaw,
 * pitch and roll euler angles
 * @param t - Interpolation factor
 * @returns The interpolated rotation, stored as rotation matrix
 */
export function interpolateMatrix(
    startRotation: Angles, endRotation: Angles, t: number
): mat4 {
    const outputMatrix = mat4.create();

    const xStart = (startRotation.pitch + Math.PI) * 360 / (2*Math.PI);
    const yStart = (startRotation.yaw + Math.PI) * 360 / (2*Math.PI);
    const zStart = (startRotation.roll + Math.PI) * 360 / (2*Math.PI);
    const xEnd = (endRotation.pitch + Math.PI) * 360 / (2*Math.PI);
    const yEnd = (endRotation.yaw + Math.PI) * 360 / (2*Math.PI);
    const zEnd = (endRotation.roll + Math.PI) * 360 / (2*Math.PI);
    
    const qStart = quat.create();
    const qEnd = quat.create();
    quat.fromEuler(qStart, xStart, -yStart, zStart);
    quat.fromEuler(qEnd, xEnd, -yEnd, zEnd);
    
    const startMatrix = mat4.create();
    const endMatrix = mat4.create();
    mat4.fromQuat(startMatrix, qStart);
    mat4.fromQuat(endMatrix, qEnd);

    mat4.multiplyScalar(startMatrix, startMatrix, 1 - t);
    mat4.multiplyScalar(endMatrix, endMatrix, t);
    mat4.add(outputMatrix, startMatrix, endMatrix);
    return outputMatrix;
}
