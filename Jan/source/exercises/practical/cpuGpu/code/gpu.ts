/**
 * Processing function for GPU based effects.
 * Copies the values without changing them.
 */
export function gpu(): void {
    // loop over all pixels
    for (let x = 0; x < this._imageWidth; x++) {
        for (let y = 0; y < this._imageHeight; y++) {
            // calculate index of pixel in buffers
            const index = (x + y * this._imageWidth) * 3;
            // directly copy over values
            this._outputImage[index] =
                this._inputImage[index];
            this._outputImage[index + 1] =
                this._inputImage[index + 1];
            this._outputImage[index + 2] =
                this._inputImage[index + 2];
        }
    }
}
