import {
    Camera,
    mat4,
    vec3
} from 'webgl-operate';
import { vertFovToHorFov } from './vertFovToHorFov';

// TODO: Implement all these functions.

/**
 * Calculates the LookAt (view transform) matrix.
 */
export function getLookAt(camera: Camera): mat4 {
    const translation = mat4.fromValues(
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        -camera.eye[0], -camera.eye[1], -camera.eye[2], 1
    );

    const n = vec3.create();
    vec3.subtract(n, camera.eye, camera.center);
    const u = vec3.create();
    vec3.cross(u, camera.up, n);
    vec3.normalize(n, n);
    vec3.normalize(u, u);
    const v = vec3.create();
    vec3.cross(v, n, u);

    const new_base = mat4.fromValues(
        u[0], u[1], u[2], 0,
        v[0], v[1], v[2], 0,
        n[0], n[1], n[2], 0,
        0, 0, 0, 1
    );
    const base_transformtion = mat4.create();
    mat4.transpose(base_transformtion, new_base);

    const view_transform = mat4.create();
    mat4.multiply(view_transform, base_transformtion, translation);
    return view_transform;
}

/**
 * Adjusts both view angles (horizontal and vertical field of view) to 90°.
 */
export function getAngleAdjustment(camera: Camera): mat4 {
    const out = mat4.create();
    // unfortunately camera.fovx is not set
    const fovx = camera.fovy * camera.aspect;
    const width_angle = 2 * Math.PI * (fovx / 360);
    const height_angle = 2 * Math.PI * (camera.fovy / 360);
    const scale_vector = vec3.fromValues(
        1.0 / Math.tan(width_angle / 2.0),
        1.0 / Math.tan(height_angle / 2.0),
        1.0
    );
    mat4.scale(out, out, scale_vector);
    return out;
}

/**
 * Uniform scaling to place far clipping plane at z=-1.
 */
export function getScaling(camera: Camera): mat4 {
    const out = mat4.create();
    const s = 1 / camera.far;
    const scale_vector = vec3.fromValues(s, s, s);
    mat4.scale(out, out, scale_vector);
    return out;
}

/**
 * Distorts the frustum into a cuboid.
 */
export function getPerspectiveTransform(camera: Camera): mat4 {
    const k = camera.near / camera.far;
    const out = mat4.fromValues(
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1 / (k - 1), -1,
        0, 0, k / (k - 1), 0
    );
    return out;
}
