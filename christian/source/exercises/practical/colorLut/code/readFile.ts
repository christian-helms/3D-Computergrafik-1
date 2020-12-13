/**
 * Helper function for reading a file provided to a file input.
 * @param file The file to be read
 * @param callback Will be called with a data URL containing the file's data
 */
export function readFile(
    file: File, callback: (dataURL: string) => void
): void {
    // create FileReader
    const reader = new FileReader();
    // define what should happen as soon as the image is fully loaded
    reader.onload = () => {
        // get the internal url referencing the image
        const dataURL = reader.result as string;
        // load the new lut
        callback(dataURL);
    };
    // start loading the image
    reader.readAsDataURL(file);
}
