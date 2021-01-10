import { quat } from 'webgl-operate';

/**
 * Spherical linear interpolation. Used as helper for rotation based on
 * quaternions.
 * @param startQuat - First input quaternion
 * @param endQuat - Second input quaternion
 * @param t - Interpolation factor
 * @returns The interpolated value
 */

export function slerp(startQuat: quat, endQuat: quat, t: number): quat {
    const outputQuat = quat.create();
    const alpha = Math.acos(Math.max(Math.min(1, quat.dot(startQuat, endQuat)), -1));
    const startFactor = Math.sin((1 - t)*alpha);
    const endFactor = Math.sin(t*alpha);
    quat.scale(startQuat, startQuat, startFactor);
    quat.scale(endQuat, endQuat, endFactor);
    quat.add(outputQuat, startQuat, endQuat);
    quat.scale(outputQuat, outputQuat, 1 / Math.sin(alpha)); 
    return outputQuat;
}