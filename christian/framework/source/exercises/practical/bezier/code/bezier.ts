import { BezierCurve, CurveLookup, DistSample, Lookup } from "./types";

import { vec3 } from "webgl-operate";

/**
 * Samples a bezier curve at a given t and returns the resulting position.
 * @param curve The bezier curve.
 * @param t The interpolation factor.
 * @returns The calculated position.
 */
export function bezierPosition(curve: BezierCurve, t: number): vec3 {
    const c: vec3[] = [];
    for (let i = 0; i < 4; ++i) c.push(vec3.clone(curve[i]));
    for (let i = 3; i > 0; --i)
        for (let j = 0; j < i; ++j)
            vec3.lerp(c[j], c[j], c[j + 1], t);
    return c[0];
}

/**
 * Samples the bezier curves using a global t. All curves should be
 * assigned the same share of the total [0, 1] range, with each curve being
 * sampled using a local t, also ranging from 0 to 1, over this range.
 * @param curves The list of bezier curves.
 * @param t The global interpolation factor.
 * @returns The calculated position.
 */
export function sampleNaive(curves: BezierCurve[], t: number): vec3 {
    // TODO: implement this
    let curveIndex: number = Math.floor(t * curves.length);
    if (t == 1) --curveIndex;
    const local_t = t * curves.length - Math.floor(t * curves.length);
    return bezierPosition(curves[curveIndex], local_t);
}

/**
 * Generates lookup tables for all curves mapping arc lengths to the
 * appropriate interpolation factor t. You may adapt this to your needs.
 * @param curve The list of bezier curves.
 * @param resolution Number of samples for each curve.
 */
export function prepareDistLookup(
    curves: BezierCurve[],
    resolution: number
): Lookup {
    let samples: CurveLookup[] = [];
    let totalLength = 0;
    return {
        samples,
        totalLength,
    };
}

/**
 * Generates lookup tables for one curve mapping arc lengths to the
 * appropriate interpolation factor t. You may adapt this to your needs.
 * @param curve The bezier curve.
 * @param resolution Number of samples.
 * @returns The generated lookup table.
 */
function buildLookupForCurve(
    curve: BezierCurve,
    resolution: number
): CurveLookup {
    const samples: DistSample[] = [];
    let totalLength = 0;
    return {
        totalLength: totalLength,
        normalizedLength: 0,
        samples,
    };
}

/**
 * Samples the bezier curves using a global normalized arc length. All
 * curves should be assigned a share of the total [0, 1] range based on its
 * own arc length.
 * @param curves The list of bezier curves.
 * @param lookup The lookup you built in prepareDistLookup.
 * @param normDist Normalized arc length for which the position should be
 * calculated.
 * @returns The calculated position.
 */
export function sampleEquiDist(
    curves: BezierCurve[],
    lookup: Lookup,
    normDist: number
): vec3 {
    return [0, 0, 0];
}
