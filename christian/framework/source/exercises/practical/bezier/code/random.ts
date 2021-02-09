import { BezierCurve, Bounds } from './types';
import { vec3 } from 'webgl-operate';

const randomCurveControlMagnitude = 10;

/**
 * Generates random Bezier curves.
 * @param numCurves Number of curves/handles to generate.
 */
export function randomBezier(bounds: Bounds, numCurves: number): BezierCurve[] {
    const handles = Array.from({ length: numCurves }, () => {
        return randomHandle(bounds);
    });
    const curves: BezierCurve[] = [];
    for (let i = 0; i < numCurves; i++) {
        const nextIndex = (i + 1) % numCurves;
        const handle0 = handles[i];
        const handle1 = handles[nextIndex];
        const control0: vec3 = [0, 0, 0];
        const control1: vec3 = [0, 0, 0];
        for (let j = 0; j < 3; j++) {
            control0[j] += handle0.pos[j] + handle0.dir[j] * handle0.mag0;
            control1[j] += handle1.pos[j] + handle1.dir[j] * handle1.mag1;
        }
        curves.push([handle0.pos, control0, control1, handle1.pos]);
    }

    return curves;
}

/**
 * Generates a random Bezier curve handle.
 */
export function randomHandle(bounds: Bounds): {
    pos: vec3, dir: vec3, mag0: number, mag1: number,
} {
    const pos: vec3 = [
        bounds.x[0] + Math.random() * (bounds.x[1] - bounds.x[0]),
        bounds.y[0] + Math.random() * (bounds.y[1] - bounds.y[0]),
        bounds.z[0] + Math.random() * (bounds.z[1] - bounds.z[0]),
    ];
    const dir: vec3 = [
        Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5,
    ];
    const length = dir[0] * dir[0] + dir[1] * dir[1] + dir[2] * dir[2];
    for (let i = 0; i < 3; i++) {
        dir[i] /= length;
    }
    dir[1] /= 3;
    const mag0 = -(Math.random() * 0.5 + 0.5) * randomCurveControlMagnitude;
    const mag1 = (Math.random() * 0.5 + 0.5) * randomCurveControlMagnitude;
    return { pos, dir, mag0, mag1 };
}
