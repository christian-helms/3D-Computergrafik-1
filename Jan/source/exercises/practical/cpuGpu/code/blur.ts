/**
 * Box blur implemented using the CPU.
 * Loops over all pixels and uses the radius stored in this._blurRadius to
 * average all pixels in a square box to calculate the output values.
 */
export function blur(): void {
    console.log(this._blurRadius);
    /*const kernel = [
        [1/16, 2/16, 1/16],
        [2/16, 4/16, 2/16],
        [1/16, 2/16, 1/16],
    ];*/
    const kernel: number[][] = [];
    for (let y = 0; y < 2 * this._blurRadius + 1; y++) {
        kernel.push([]);
        for (let x = 0; x < 2 * this._blurRadius + 1; x++) kernel[y].push(0);
    }
    let sum = 0;
    const sig = this._blurRadius / 3;
    for (let y = 0; y < 2 * this._blurRadius + 1; y++)
        for (let x = 0; x < 2 * this._blurRadius + 1; x++) {
            kernel[y][x] = 1 / Math.sqrt(2 * Math.PI * sig * sig) *
                Math.exp(-((x - this._blurRadius) * (x - this._blurRadius) +
                    (y - this._blurRadius) * (y - this._blurRadius)) /
                    (2 * sig * sig));
            sum += kernel[y][x];
        }
    for (let y = 0; y < 2 * this._blurRadius + 1; y++)
        for (let x = 0; x < 2 * this._blurRadius + 1; x++)
            kernel[y][x] *= 1 / sum;

    if (this._blurRadius == 0) return;

    // loop over all pixels
    for (let x = 0; x < this._imageWidth; x++) {
        for (let y = 0; y < this._imageHeight; y++) {
            // prepare a sum for each color channel
            let rSum = 0;
            let gSum = 0;
            let bSum = 0;
            // loop over the blur kernel in x direction
            for (let i = -this._blurRadius; i <= this._blurRadius; i++) {
                // calculate x index for sample
                const sampleX = x + i;
                // ensure index is inside image
                if (sampleX < 0 || sampleX >= this._imageWidth) {
                    continue;
                }
                // loop over the blur kernel in y direction
                for (let j = -this._blurRadius; j <= this._blurRadius; j++) {
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
                    const kernelValue =
                        kernel[j + this._blurRadius][i + this._blurRadius];
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
