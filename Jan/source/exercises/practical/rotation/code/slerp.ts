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
    // TODO: implement slerp
    // HINT: clamp the cosine value to [-1, 1],
    // quat.dot can give faulty values if the input quaternions are the same

    quat.slerp(outputQuat, startQuat, endQuat, t);
    return outputQuat;
}
