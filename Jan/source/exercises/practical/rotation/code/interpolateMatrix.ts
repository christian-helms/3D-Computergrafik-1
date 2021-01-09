import { Angles } from './angles';
import { lerp } from './lerp';
import { mat4 } from 'webgl-operate';

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
    // TODO: implement rotation using matrix coefficient interpolation
    // HINT: your implementation should use lerp
    const startMatrix = mat4.create();
    const endMatrix = mat4.create();
    mat4.rotateZ(startMatrix, startMatrix, startRotation.roll);
    mat4.rotateY(startMatrix, startMatrix, startRotation.yaw);
    mat4.rotateX(startMatrix, startMatrix, startRotation.pitch);
    mat4.rotateZ(endMatrix, endMatrix, endRotation.roll);
    mat4.rotateY(endMatrix, endMatrix, endRotation.yaw);
    mat4.rotateX(endMatrix, endMatrix, endRotation.pitch);
    const outputMatrix = mat4.create();
    for (let i = 0; i < 16; i++)
        outputMatrix[i] = lerp(startMatrix[i], endMatrix[i], t);

    return outputMatrix;
}
