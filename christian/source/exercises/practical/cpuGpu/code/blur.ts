import { glMatrix } from "gl-matrix";

export function blur(): void {
    const layers = 3;

    const kernel_size = 2 * this._blurRadius + 1;
    // for the rose a kernel size of 3 works best
    const k = Math.floor(kernel_size / 2);

    for (let x = 0; x < this._imageWidth; ++x) {
        for (let y = 0; y < this._imageHeight; ++y) {

            const sum = [0, 0, 0];
            // for all layers
            for (let l = 0; l < layers; ++l) {
                // iterate over kernel
                let num_neighbors = 0;
                for (let i = -k; i <= k; ++i) {
                    const X = x + i;
                    if (X < 0 || X >= this._imageWidth)
                        continue;

                    for (let j = -k; j <= k; ++j) {
                        const Y = y + j;
                        if (Y < 0 || Y >= this.imageHeight)
                            continue;

                        const index = 3 * (X + Y * this._imageWidth);
                        sum[l] += this._inputImage[index + l];
                        num_neighbors++;
                    }
                }
                sum[l] /= num_neighbors;
                const index = 3 * (x + y * this._imageWidth);
                this._outputImage[index + l]
                    = Math.min(255, Math.max(0, sum[l]));
            }
        }
    }
}
