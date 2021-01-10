import { Angles, StartEndAngles } from './angles';
import { mat4 } from 'webgl-operate';

/**
 * Helper function for precalculating rotation matrices for a given preset
 * and mode.
 * @param angles - Start and end euler angles
 * @param f - Interpolation function
 * @param resolution - Number of intermediate rotation matrixes to calculate
 * @param maxPrecision - Max amount for number of digits in output
 * @returns The precalculated rotation matrices as string
 */
export function preCalc(
    angles: StartEndAngles,
    f: (a: Angles, b: Angles, t: number) => mat4,
    resolution: number,
    maxPrecision: number
): string {
    // step size
    const divider = resolution - 1;
    // factor for rounding
    const precisionFactor = Math.pow(10, maxPrecision);

    const result = [];
    for (let i = 0; i < resolution; i++) {
        // calculate interpolation factor and interpolate
        const t = i / divider;
        const value = f(angles.start, angles.end, t);
        // round and store to result array
        result.push('[');
        value.forEach((num: number, i: number) => {
            result.push(Math.floor(num * precisionFactor) / precisionFactor);
            if(i < value.length - 1 ) {
                result.push(',');
            }
        });
        result.push(i < resolution - 1 ? '],': ']');
    }

    // join all parts of the result together
    return result.join('');
}
