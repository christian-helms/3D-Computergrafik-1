'use strict';

const path = require('path');
const fs = require('fs');
const tar = require('tar');

const files = require('../files');
const getAssignmentJson = require('./helper/getAssignmentJson');
const sanitizeFilename = require('./helper/sanitizeFilename');
const checkFiles = require('./helper/checkFiles');
const iteratorToStringList = require('./helper/iteratorToStringList');
const ensureDirExists = require('./helper/ensureDirExists');

function exportSubmission(assignment, authorsString, archiveDir) {
    const assignmentJson = getAssignmentJson(assignment);
    if (assignmentJson === undefined) {
        return;
    }
    const assignmentName = `${assignmentJson.name}`;
    const assignmentId = `${assignmentJson.id}`;

    const authors = sanitizeFilename(authorsString);
    const file = path.normalize(
        `${archiveDir}/cg1-solution-${assignmentId}-${authors}.tgz`
    );

    console.log('Exporting', assignmentName, 'to', file);

    const set = new Set();

    const success = assignmentJson.exercises.every(path => {
        const exercise =
            JSON.parse(fs.readFileSync(
                `./source/exercises/${path}/${files.exercise.file}`));
        return checkFiles(exercise.files, set);
    });

    if (!success) {
        console.log('Required files missing! Aborting!');
        return false;
    }

    const expFiles = iteratorToStringList(set.values());
    console.log(
        `Exporting the following files:\n${expFiles}`);

    ensureDirExists(path.dirname(file));

    tar.create({
        file: file,
        gzip: true,
        sync: true,
    },
        Array.from(set)
    );

    console.log('Done.');
}

module.exports = exportSubmission;
