export function laplace(): void {
    const layers = 3;

    // 3x3 kernel without diagonals
    // const k = 1;
    // const kernel = [[0, -1, 0],
    //                 [-1, 4, -1],
    //                 [0, -1, 0]];

    const kernel_size = 2 * this._blurRadius + 1;
    // for the rose a kernel size of 3 works best
    const k = Math.floor(kernel_size / 2);
    const kernel = Array<Array<number>>(kernel_size);
    for (let i = 0; i < kernel_size; ++i) {
        const row = Array<number>(kernel_size);
        for (let j = 0; j < kernel_size; ++j) {
            if (i == k && j == k)
                row[j] = kernel_size * kernel_size - 1;
            else
                row[j] = -1;
        }
        kernel[i] = row;
    }

    for (let x = 0; x < this._imageWidth; ++x) {
        for (let y = 0; y < this._imageHeight; ++y) {

            const sum = [0, 0, 0];
            // for all layers
            for (let l = 0; l < layers; ++l) {
                // iterate over kernel
                for (let i = -k; i <= k; ++i) {
                    const X = x + i;
                    if (X < 0 || X >= this._imageWidth)
                        continue;

                    for (let j = -k; j <= k; ++j) {
                        const Y = y + j;
                        if (Y < 0 || Y >= this.imageHeight)
                            continue;

                        const kernel_val = kernel[j + k][i + k];
                        const index = 3 * (X + Y * this._imageWidth);
                        sum[l] += this._inputImage[index + l] * kernel_val;
                    }
                }
                const index = 3 * (x + y * this._imageWidth);
                this._outputImage[index + l]
                    = Math.min(255, Math.max(0, sum[l]));
            }
        }
    }
}