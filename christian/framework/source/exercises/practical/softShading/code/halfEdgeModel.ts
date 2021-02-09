import { vec3 } from "gl-matrix";

export type Mesh = {
    cells: number[][];
    faceNormals: number[];
    name: string;
    positions: number[][];
};

class Vertex {
    public _position: vec3;
    public _halfEdges: HalfEdge[];
    public _normal: vec3;

    public constructor(x: number, y: number, z: number) {
        this._position = vec3.fromValues(x, y, z);
        this._halfEdges = [];
    }
}

class HalfEdge {
    public _vertex0: Vertex;

    public face: Face;

    public _otherHalfEdge: HalfEdge;

    public constructor(vertex0: Vertex, otherHalfEdge?: HalfEdge) {
        this._vertex0 = vertex0;
        if (otherHalfEdge) {
            this._otherHalfEdge = otherHalfEdge;
            otherHalfEdge._otherHalfEdge = this;
        }
        vertex0._halfEdges.push(this);
    }
}

class Face {
    public _halfEdges: HalfEdge[];
    public _normal: vec3;

    public constructor(
        halfEdge0: HalfEdge,
        halfEdge1: HalfEdge,
        halfEdge2: HalfEdge
    ) {
        this._halfEdges = [];
        this._halfEdges.push(halfEdge0);
        this._halfEdges.push(halfEdge1);
        this._halfEdges.push(halfEdge2);
        halfEdge0.face = this;
        halfEdge1.face = this;
        halfEdge2.face = this;
        this.calculateNormal();
    }

    protected calculateNormal(): void {
        const p0 = this._halfEdges[0]._vertex0._position;
        const p1 = this._halfEdges[1]._vertex0._position;
        const p2 = this._halfEdges[2]._vertex0._position;

        const v0 = vec3.subtract(vec3.create(), p1, p0);
        const v1 = vec3.subtract(vec3.create(), p2, p0);

        this._normal = vec3.cross(vec3.create(), v0, v1);
        this._normal = vec3.normalize(vec3.create(), this._normal);
    }
}

export class HalfEdgeModel {
    protected _vertices: Vertex[];
    protected _halfEdges: HalfEdge[];
    protected _faces: Face[];

    protected mergeByDistance(mesh: Mesh, threshold = 0.0000001): void {
        const threshold2 = threshold * threshold;
        const newVertexList: number[][] = [];
        const indexMap: number[] = [];
        mesh.positions.forEach((vertex: number[]) => {
            let found = false;
            newVertexList.forEach((newVertex: number[], newIndex) => {
                if (found) {
                    return;
                }
                const distX = vertex[0] - newVertex[0];
                const distY = vertex[1] - newVertex[1];
                const distZ = vertex[2] - newVertex[2];
                const dist2 = distX * distX + distY * distY + distZ * distZ;
                if (dist2 < threshold2) {
                    found = true;
                    indexMap.push(newIndex);
                }
            });
            if (!found) {
                indexMap.push(newVertexList.length);
                newVertexList.push(vertex);
            }
        });

        mesh.cells.forEach((face: number[]) => {
            face[0] = indexMap[face[0]];
            face[1] = indexMap[face[1]];
            face[2] = indexMap[face[2]];
        });
        mesh.positions = newVertexList;
    }

    protected calculateVertexNormals(): void {
        this._vertices.forEach((vertex: Vertex) => {
            const normal = vec3.fromValues(0, 0, 0);
            vertex._halfEdges.forEach((halfEdge) => {
                vec3.add(normal, normal, halfEdge.face._normal);
            });
            vec3.normalize(normal, normal);
            vertex._normal = normal;
        });
    }

    public load(mesh: Mesh): void {
        this.mergeByDistance(mesh);

        const vertices = mesh.positions;
        const faces = mesh.cells;

        this._vertices = vertices.map((v) => new Vertex(v[0], v[1], v[2]));

        this._faces = [];
        this._halfEdges = [];
        faces.forEach((face: number[]) => {
            // ignore degenerated faces
            if (
                face[0] === face[1] ||
                face[0] === face[2] ||
                face[1] === face[2]
            ) {
                return;
            }

            const vertices = [
                this._vertices[face[0]],
                this._vertices[face[1]],
                this._vertices[face[2]],
            ];

            const halfEdges: HalfEdge[] = [];
            for (let i = 0; i < 3; i++) {
                const j = (i + 1) % 3;
                halfEdges[i] = this._halfEdges.find((halfEdge) => {
                    return (
                        halfEdge._vertex0 === vertices[i] &&
                        halfEdge._otherHalfEdge._vertex0 === vertices[j]
                    );
                });
                if (!halfEdges[i]) {
                    const otherHalfEdge = new HalfEdge(vertices[j]);
                    halfEdges[i] = new HalfEdge(vertices[i], otherHalfEdge);
                    this._halfEdges.push(halfEdges[i]);
                    this._halfEdges.push(otherHalfEdge);
                }
            }

            this._faces.push(
                new Face(halfEdges[0], halfEdges[1], halfEdges[2])
            );
        });

        this.calculateVertexNormals();

        mesh.faceNormals = [];

        this._vertices.forEach((vertex: Vertex) => {
            mesh.faceNormals.push(vertex._normal[0]);
            mesh.faceNormals.push(vertex._normal[1]);
            mesh.faceNormals.push(vertex._normal[2]);
        });
    }

    public getVertices(): Float32Array {
        const vertices = new Float32Array(this._faces.length * 3 * 3);
        this._faces.forEach((face: Face, faceIndex: number) => {
            face._halfEdges.forEach((halfEdge: HalfEdge, edgeIndex: number) => {
                const pos = halfEdge._vertex0._position;
                vertices[faceIndex * 9 + edgeIndex * 3 + 0] = pos[0];
                vertices[faceIndex * 9 + edgeIndex * 3 + 1] = pos[1];
                vertices[faceIndex * 9 + edgeIndex * 3 + 2] = pos[2];
            });
        });
        return vertices;
    }

    public getIndices(): Uint32Array {
        const faces = new Uint32Array(this._faces.length * 3);
        this._faces.forEach((face: Face, index: number) => {
            face._halfEdges.forEach((halfEdge: HalfEdge, edgeIndex: number) => {
                faces[index * 3 + edgeIndex] = index * 3 + edgeIndex;
            });
        });
        return faces;
    }

    public getNextHalfEdge(prev: HalfEdge, vertex: Vertex): HalfEdge {
        for (const halfEdge of prev._otherHalfEdge.face._halfEdges)
            if (halfEdge._vertex0 === vertex) return halfEdge;
    }

    public getNormals(thresholdAngle = (30 / 180) * Math.PI): Float32Array {
        const normals = new Float32Array(this._faces.length * 3 * 3);
        this._faces.forEach((face: Face, faceIndex: number) => {
            face._halfEdges.forEach((halfEdge: HalfEdge, edgeIndex: number) => {
                let current = halfEdge;
                const prefixSum: vec3[] = [vec3.create()];
                const I: number[] = [];
                let i = 0;
                do {
                    const next_sum = vec3.create();
                    vec3.add(next_sum, prefixSum[i], current.face._normal);
                    prefixSum.push(next_sum);
                    const n1 = current.face._normal;
                    const n2 = current._otherHalfEdge.face._normal;
                    if (vec3.angle(n1, n2) > thresholdAngle) I.push(i + 1);
                    ++i;
                    current = this.getNextHalfEdge(current, halfEdge._vertex0);
                } while (current != halfEdge);
                let normal: vec3;
                if (I.length == 0) normal = prefixSum[prefixSum.length - 1];
                else {
                    normal = prefixSum[I[0]];
                    vec3.add(normal, normal, prefixSum[prefixSum.length - 1]);
                    vec3.sub(normal, normal, prefixSum[I[I.length - 1]]);
                }
                vec3.normalize(normal, normal);
                for (let i = 0; i < 3; ++i)
                    normals[faceIndex * 9 + edgeIndex * 3 + i] = normal[i];
            });
        });
        return normals;
    }
}
