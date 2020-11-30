'use strict';

function sanitizeFilename(filename) {
    // see https://en.wikipedia.org/wiki/Filename#Reserved_characters_and_words
    return filename
        .replace(/[/\\?%*:|"<>.]/g, '')
        .replace(/\s/g, '_');
}

module.exports = sanitizeFilename;
