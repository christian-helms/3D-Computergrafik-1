import { LineGeometry } from './lineGeometry';
import { calculateSideAndRUp } from './calculateSideUp';
import { vec3 } from 'webgl-operate';

export class CameraGeometry extends LineGeometry {
    protected build(): void {
        const eye = this._camera.eye;
        const center = this._camera.center;
        const dir = vec3.sub(vec3.create(), center, eye);
        const up = this._camera.up;
        const upPos = vec3.add(vec3.create(), eye, up);

        // calculate a new up vector that is actually perpendicular to dir
        const { side, rUp } = calculateSideAndRUp(dir, up);

        const sidePos = vec3.add(vec3.create(), eye, side);
        const rUpPos = vec3.add(vec3.create(), eye, rUp);

        const numLines = 4;
        const verticesPerLine = 2;
        const componentsPerVertex = 3;

        const vertices =
            new Float32Array(numLines * verticesPerLine * componentsPerVertex);

        let offset = 0;

        // eye -> center
        vertices.set(eye, offset++ * 3);
        vertices.set(center, offset++ * 3);

        // up
        vertices.set(eye, offset++ * 3);
        vertices.set(upPos, offset++ * 3);

        // side
        vertices.set(eye, offset++ * 3);
        vertices.set(sidePos, offset++ * 3);

        // perpendicular up
        vertices.set(eye, offset++ * 3);
        vertices.set(rUpPos, offset++ * 3);

        this._vertices = vertices;
    }
}
