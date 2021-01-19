import { vec3 } from 'webgl-operate';

export function calculateSideAndRUp(
    dir: vec3, up: vec3
): { side: vec3, rUp: vec3 } {
    const side = vec3.cross(vec3.create(), dir, up);
    vec3.normalize(side, side);
    const rUp = vec3.cross(vec3.create(), side, dir);
    vec3.normalize(rUp, rUp);
    return { side, rUp };
}
