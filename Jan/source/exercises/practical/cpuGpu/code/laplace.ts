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
        [1, 1, 1],
        [1, -8, 1],
        [1, 1, 1],
    ];

    // loop over all pixels
    for (let x = 0; x < this._imageWidth; x++) {
        for (let y = 0; y < this._imageHeight; y++) {
            // prepare a sum for each color channel
            let rSum = 0;
            let gSum = 0;
            let bSum = 0;
            // loop over the blur kernel in x direction
            for (let i = -1; i <= 1; i++) {
                // calculate x index for sample
                const sampleX = x + i;
                // ensure index is inside image
                if (sampleX < 0 || sampleX >= this._imageWidth) {
                    continue;
                }
                // loop over kernel in y direction
                for (let j = -1; j <= 1; j++) {
                    // calculate y index for sample
                    const sampleY = y + j;
                    // ensure index is inside image
                    if (sampleY < 0 || sampleY >= this._imageHeight) {
                        continue;
                    }
                    // calculate pixel index in buffer
                    const index =
                        (sampleX + sampleY * this._imageWidth) * 3;
                    // read weighting value from kernel
                    const kernelValue = kernel[j + 1][i + 1];
                    // sample pixel, apply weight, increase sums
                    rSum += this._inputImage[index] * kernelValue;
                    gSum += this._inputImage[index + 1] * kernelValue;
                    bSum += this._inputImage[index + 2] * kernelValue;
                }
            }
            // calculate index of output pixel
            const index = (x + y * this._imageWidth) * 3;
            // ensure value stays in range and store in output
            this._outputImage[index] =
                Math.max(Math.min(rSum, 255), 0);
            this._outputImage[index + 1] =
                Math.max(Math.min(gSum, 255), 0);
            this._outputImage[index + 2] =
                Math.max(Math.min(bSum, 255), 0);
        }
    }
}