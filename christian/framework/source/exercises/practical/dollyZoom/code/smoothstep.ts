import { clamp } from './clamp';

/**
 * Calculates a smoothed interpolation factor.
 * @param a - Lower bound
 * @param b - Upper bound
 * @param x - Value
 * @returns The smooth interpolation factor
 */
export function smoothstep(a: number, b: number, x: number): number {
    const t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
}
