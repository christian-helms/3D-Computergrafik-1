export function vertFovToHorFov(fov: number, aspect: number): number {
    return 2 * Math.atan(Math.tan(fov / 2) * aspect);
}
