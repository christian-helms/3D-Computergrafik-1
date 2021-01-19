import { LineGeometry } from './lineGeometry';
import { calculateSideAndRUp } from './calculateSideUp';
import { vec3 } from 'webgl-operate';
import { vertFovToHorFov } from './vertFovToHorFov';

function buildCorner(
    out: vec3,
    eye: vec3,
    dir: vec3,
    up: vec3, upFac: number,
    side: vec3, sideFac: number
): vec3 {
    vec3.add(out, out, eye);
    vec3.add(out, out, dir);
    vec3.scaleAndAdd(out, out, up, upFac);
    return vec3.scaleAndAdd(out, out, side, sideFac);
}

export class FrustumGeometry extends LineGeometry {
    protected build(): void {
        const eye = this._camera.eye;
        const near = this._camera.near;
        const far = this._camera.far;
        const dir = vec3.sub(vec3.create(), this._camera.center, eye);
        vec3.normalize(dir, dir);
        const up = this._camera.up;
        const fovY = this._camera.fovy * Math.PI / 180;
        const hFovY = fovY / 2;
        const tHFovY = Math.tan(hFovY);
        const hFovX = vertFovToHorFov(fovY, this._camera.aspect) / 2;
        const tHFovX = Math.tan(hFovX);

        // calculate a new up vector that is actually perpendicular to dir
        const { side, rUp } = calculateSideAndRUp(dir, up);

        const nHalfWidth = tHFovX * near;
        const nHalfHeight = tHFovY * near;
        const nSide = vec3.scale(vec3.create(), side, nHalfWidth);
        const nUp = vec3.scale(vec3.create(), rUp, nHalfHeight);
        const nDir = vec3.scale(vec3.create(), dir, near);

        const fHalfWidth = tHFovX * far;
        const fHalfHeight = tHFovY * far;
        const fSide = vec3.scale(vec3.create(), side, fHalfWidth);
        const fUp = vec3.scale(vec3.create(), rUp, fHalfHeight);
        const fDir = vec3.scale(vec3.create(), dir, far);

        const nnn = buildCorner(vec3.create(), eye, nDir, nUp, -1, nSide, -1);
        const npn = buildCorner(vec3.create(), eye, nDir, nUp, -1, nSide, +1);
        const pnn = buildCorner(vec3.create(), eye, nDir, nUp, +1, nSide, -1);
        const ppn = buildCorner(vec3.create(), eye, nDir, nUp, +1, nSide, +1);
        const nnf = buildCorner(vec3.create(), eye, fDir, fUp, -1, fSide, -1);
        const npf = buildCorner(vec3.create(), eye, fDir, fUp, -1, fSide, +1);
        const pnf = buildCorner(vec3.create(), eye, fDir, fUp, +1, fSide, -1);
        const ppf = buildCorner(vec3.create(), eye, fDir, fUp, +1, fSide, +1);

        // build lines
        const numLines = 12;
        const verticesPerLine = 2;
        const componentsPerVertex = 3;

        const vertices =
            new Float32Array(numLines * verticesPerLine * componentsPerVertex);

        let offset = 0;

        // near plane
        vertices.set(nnn, offset++ * 3);
        vertices.set(npn, offset++ * 3);

        vertices.set(npn, offset++ * 3);
        vertices.set(ppn, offset++ * 3);

        vertices.set(ppn, offset++ * 3);
        vertices.set(pnn, offset++ * 3);

        vertices.set(pnn, offset++ * 3);
        vertices.set(nnn, offset++ * 3);

        // far plane
        vertices.set(nnf, offset++ * 3);
        vertices.set(npf, offset++ * 3);

        vertices.set(npf, offset++ * 3);
        vertices.set(ppf, offset++ * 3);

        vertices.set(ppf, offset++ * 3);
        vertices.set(pnf, offset++ * 3);

        vertices.set(pnf, offset++ * 3);
        vertices.set(nnf, offset++ * 3);

        // near -> far connections
        vertices.set(nnn, offset++ * 3);
        vertices.set(nnf, offset++ * 3);

        vertices.set(npn, offset++ * 3);
        vertices.set(npf, offset++ * 3);

        vertices.set(pnn, offset++ * 3);
        vertices.set(pnf, offset++ * 3);

        vertices.set(ppn, offset++ * 3);
        vertices.set(ppf, offset++ * 3);

        this._vertices = vertices;

        this._camera.altered = false;
    }
}
