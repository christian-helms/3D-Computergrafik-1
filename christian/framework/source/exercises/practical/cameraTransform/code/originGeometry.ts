import { LineGeometry } from './lineGeometry';

export class OriginGeometry extends LineGeometry {
    protected build(): void {
        const numLines = 3;
        const verticesPerLine = 2;
        const componentsPerVertex = 3;

        const vertices =
            new Float32Array(numLines * verticesPerLine * componentsPerVertex);

        let offset = 0;

        // x
        vertices.set([-1, 0, 0], offset++ * 3);
        vertices.set([1, 0, 0], offset++ * 3);

        // y
        vertices.set([0, -1, 0], offset++ * 3);
        vertices.set([0, 1, 0], offset++ * 3);

        // z
        vertices.set([0, 0, -1], offset++ * 3);
        vertices.set([0, 0, 1], offset++ * 3);

        this._vertices = vertices;
    }
}
