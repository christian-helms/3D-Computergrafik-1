/**
 * Linear interpolation. Used as helper for rotation based on
 * matrices and euler angles.
 * @param a - First input value
 * @param b - Second input value
 * @param t - Interpolation factor
 * @returns The interpolated value
 */
export function lerp(a: number, b: number, t: number): number {
    return (1 - t) * a + t * b;
}
