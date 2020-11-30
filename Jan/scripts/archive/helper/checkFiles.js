'use strict';

const fs = require('fs');

function checkFile(file) {
    if (!fs.existsSync(file)) {
        return false;
    }

    const stats = fs.statSync(file);

    if (!stats.isFile()) {
        console.log(`Warning: ${file} is no file.`);
        return false;
    }
    if (stats.size == 0) {
        console.log(`Warning: ${file} is empty.`);
        return false;
    }

    return true;
}

function checkAnyFile(files, set) {
    return files.some(file => {
        if (checkFile(file)) {
            set.add(file);
            return true;
        }
        return false;
    });
}

function checkFiles(files, set) {
    return files.every(file => {
        if (Array.isArray(file)) {
            if (checkAnyFile(file, set)) {
                return true;
            }

            console.log(
                `Could not find any valid file for "${file.join('" or "')}".`);
            return false;
        }

        if (checkFile(file)) {
            set.add(file);
            return true;
        }

        console.log(`Could not find required file "${file}".`);
        return false;
    });
}

module.exports = checkFiles;
