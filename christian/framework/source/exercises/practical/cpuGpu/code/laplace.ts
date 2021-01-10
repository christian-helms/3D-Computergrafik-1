/**
 * Laplace edge detection implemented using the CPU.
 * Loops over all pixels and uses the given kernel to calculate a local
 * gradient. Areas without edges will turn out black, since the differences
 * are small, while areas with high differences will stand out.
 */
export function laplace(): void {
    // TODO: set correct kernel
    // kernel for weighting the neighboring pixels
    const kernel = [
        [0, 0, 0],
        [0, 1, 0],
        [0, 0, 0],
    ];

    // TODO: implement edge detection
}