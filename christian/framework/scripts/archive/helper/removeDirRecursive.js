const fs = require('fs');
const Path = require('path');

// based on https://stackoverflow.com/a/32197381
// may be replaced by fs.rmdirSync with option recursive once stable
function removeDirRecursive(path) {
    if (path === '' | !fs.existsSync(path)) {
        console.log(`Can't remove ${path}. Skipping.`);
        return;
    }
    fs.readdirSync(path).forEach((file) => {
        const curPath = Path.join(path, file);
        if (fs.lstatSync(curPath).isDirectory()) {
            removeDirRecursive(curPath);
        } else {
            fs.unlinkSync(curPath);
        }
    });
    fs.rmdirSync(path);
}

module.exports = removeDirRecursive;
