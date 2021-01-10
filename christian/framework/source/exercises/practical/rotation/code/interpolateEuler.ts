import { Angles } from './angles';
import { lerp } from './lerp';
import { mat4 } from 'webgl-operate';
import { quat } from 'webgl-operate';

/**
 * Rotation interpolation using euler angles.
 * @param startRotation - Rotation at the left side, stored as yaw,
 * pitch and roll euler angles
 * @param endRotation - Rotation at the right side, stored as yaw,
 * pitch and roll euler angles
 * @param t - Interpolation factor
 * @returns The interpolated rotation, stored as rotation matrix
 */
export function interpolateEuler(
    startRotation: Angles, endRotation: Angles, t: number
): mat4 {
    const outputMatrix = mat4.create();
    const pitch = lerp(startRotation.pitch, endRotation.pitch, t);
    const roll = lerp(startRotation.roll, endRotation.roll, t);
    const yaw = lerp(startRotation.yaw, endRotation.yaw, t);

    const x = (pitch + Math.PI) * 360 / (2*Math.PI);
    const y = (yaw + Math.PI) * 360 / (2*Math.PI);
    const z = (roll + Math.PI) * 360 / (2*Math.PI);
    const temp = quat.create();
    quat.fromEuler(temp, x, -y, z);
    mat4.fromQuat(outputMatrix, temp);
    return outputMatrix;
}
