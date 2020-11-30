'use strict';

const fs = require('fs');
const path = require('path');

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function cleanupFile(file, begin, end) {
    // \s is actually required, as this is a regex string
    // eslint-disable-next-line no-useless-escape
    const regexString = `\\\s*${escapeRegExp(begin)}.*?${escapeRegExp(end)}`;
    const regex = RegExp(regexString, 'gs');
    const fileContent = fs.readFileSync(file, { encoding: 'utf-8' });
    const count = (fileContent.match(regex) || []).length;

    if (count === 0) {
        return undefined;
    }

    return {
        file: file,
        count: count,
        fileContent: fileContent,
        cleaned: fileContent.replace(regex, '')
    };
}

function cleanupFiles(dir, begin, end) {
    const result = [];

    if (!fs.existsSync(dir)) {
        console.log(`Not found: ${dir}`);
        return result;
    }

    const stats = fs.statSync(dir);

    if (!stats.isDirectory()) {
        console.log(`Not a directory: ${dir}`);
        return result;
    }

    const dirObj = fs.opendirSync(dir);

    let file;
    while ((file = dirObj.readSync()) !== null) {
        if (file.isDirectory()) {
            const cleaned = cleanupFiles(path.join(dir, file.name), begin, end);
            result.push(...cleaned);
        } else if (file.isFile()) {
            const cleaned = cleanupFile(path.join(dir, file.name), begin, end);
            if (cleaned !== undefined) {
                result.push(cleaned);
            }
        }
    }

    return result;
}

module.exports = cleanupFiles;
