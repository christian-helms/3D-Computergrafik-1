'use strict';

const yargs = require('yargs');
const Jimp = require('jimp');
const fs = require('fs');

/**
 * Loads a png and stores it in Adobe LUT format
 * @param {string} input 
 * @param {string} output 
 */
function png2cube(input, output) {
    // read the image using jimp
    Jimp.read(input, (e, img) => {
        // in the file, the first pixel is the top-left one,
        // but we want the bottom-left pixel to be the first
        const flipped = img.flip(false, true);
        const data = flipped.bitmap.data;
        const resolution = img.getHeight();

        const stream = fs.createWriteStream(output);

        // write header
        stream.write(`LUT_3D_SIZE ${resolution}\n`);

        // helper function for getting normalized color
        const val = (i, c) => {
            return data[i * 4 + c] / 255;
        };

        // format requires outer loop to be blue,
        // which means red is the most-changing channel
        for (let b = 0; b < resolution; b++) {
            for (let g = 0; g < resolution; g++) {
                for (let r = 0; r < resolution; r++) {
                    // calculate index and write out color values
                    const i =
                        r +
                        g * resolution * resolution +
                        b * resolution;
                    stream.write(
                        `${val(i, 0)} ${val(i, 1)} ${val(i, 2)}\n`);
                }
            }
        }

        stream.close();
    });
}

var argv = yargs
    .demandCommand(2)
    .argv;
png2cube(argv._[0], argv._[1]);
