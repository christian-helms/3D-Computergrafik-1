import { vec3 } from 'webgl-operate';

/**
 * Bezier curve definition containing the four control points P0, P1, P2 and P3.
 */
export type BezierCurve = [
    vec3, vec3, vec3, vec3
];

/**
 * Axis-aligned bounding box with a min and max value for each axis.
 */
export interface Bounds {
    x: [number, number];
    y: [number, number];
    z: [number, number];
}

/**
 * Per-model clipping plane configuration.
 */
interface ClippingPlanes {
    near: number;
    far: number;
}

/**
 * Model definition, containing the name and file path, as well as additional
 * information useful for the assignment.
 */
export interface Model {
    name: string;
    uri: string;
    bounds: Bounds;
    fpPlanes: ClippingPlanes;
    tpPlanes: ClippingPlanes;
    defaultCurves: BezierCurve[];
}

/**
 * Data structure for sampling the bezier points. Contains data about one
 * specific t on a given curve. You may adapt this to your needs.
 */
export interface DistSample {
    /**
     * The bezier interpolation factor on this curve.
     */
    t: number;
    /**
     * The arc length on this curve up to t.
     */
    length: number;
    /**
     * Arc length on this curve, divided by the total length of all curves.
     * This means the sum of all curves' arc lengths should be 1.
     */
    normalizedLength: number;
}

/**
 * Arc length measurements for a bezier curve. Contains general data about the
 * curve, as well as samples for a list of t values on the curve. You may adapt
 * this to your needs.
 */
export interface CurveLookup {
    /**
     * Total arc length of this curve, equal to the arc length of t=1.
     */
    totalLength: number;
    /**
     * Arc length of this curve, divided by the total length of all curves.
     */
    normalizedLength: number;
    /**
     * List of samples for mapping arc lengths back to t values.
     */
    samples: DistSample[];
}

/**
 * Lookup data for a set of curves.
 */
export interface Lookup {
    /**
     * Total arc length of all curves, equal to the arc length of t=1.
     */
    totalLength: number;
    /**
     * List of per-curve lookups.
     */
    samples: CurveLookup[];
}
