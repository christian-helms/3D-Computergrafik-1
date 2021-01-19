/**
 * Ensure value to be between lower and upper limit.
 * @param val Value to constrain between limits.
 * @param min Lower bound.
 * @param max Upper bound.
 */
export function clamp(val: number, min: number, max: number): number {
    return Math.min(Math.max(val, min), max);
}
