/**
 * Exponential function with f(0) = 0 and f(1) = 1. Apply this to the
 * interpolation factor to increase the resolution for lower values.
 * @param x - Argument to the exponential function
 * @param b - Base of the exponential function
 * @returns Value of the exponential function
 */
export function exp(x: number, b: number): number {
    return (Math.pow(b, x) - 1) / (b - 1);
}
