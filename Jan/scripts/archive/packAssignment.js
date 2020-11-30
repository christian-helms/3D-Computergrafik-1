'use strict';

const path = require('path');
const fs = require('fs');
const readlineSync = require('readline-sync');
const tar = require('tar');

const files = require('../files');
const getAssignmentJson = require('./helper/getAssignmentJson');
const ensureCleanWorkingTree = require('./helper/ensureCleanWorkingTree');
const cleanupFiles = require('./helper/cleanupFiles');
const checkYesNo = require('./helper/checkYesNo');
const iteratorToStringList = require('./helper/iteratorToStringList');
const ensureDirExists = require('./helper/ensureDirExists');

function packAssignment(
    assignment, archiveDir,
    removeBegin, removeEnd,
    assumeYes = false, force = false
) {
    // gather data
    const assignmentJson = getAssignmentJson(assignment);
    if (assignmentJson === undefined) {
        return;
    }
    const assignmentName = `${assignmentJson.name}`;
    const assignmentId = `${assignmentJson.id}`;

    const file = path.normalize(
        `${archiveDir}/${assignmentId}.tgz`
    );

    console.log('Exporting', assignmentName, 'to', file);

    // remove solution from files
    if (!ensureCleanWorkingTree()) {
        if (force) {
            console.log('Continuing due to force option being specified.');
        } else {
            console.log('Aborting.');
            return;
        }
    }

    const cleaned = assignmentJson.exercises.map((dir) => cleanupFiles(
        `source/exercises/${dir}`,
        removeBegin, removeEnd
    )).flat();

    console.log(
        'The following files contained example solutions ' +
        'which will be removed:');

    cleaned.forEach((f) => {
        console.log(`${f.file} (${f.count} hits)`);
    });

    if (!assumeYes) {
        const answer = readlineSync.question(
            'The files will be modified on disk and restored' +
            'after export is complete. Please confirm (y/n): ');
        if (!checkYesNo(answer)) {
            console.log('Aborting.');
            return;
        }
    }

    cleaned.forEach((f) => {
        fs.writeFileSync(f.file, f.cleaned);
    });

    // create assignment definition file
    fs.writeFileSync(
        files.assignment.file,
        JSON.stringify(assignmentJson, null, 4));

    // export assignment info and files
    const set = new Set([
        ...assignmentJson.exercises.map((dir) => 'source/exercises/' + dir),
        files.assignment.file
    ]);

    const expFiles = iteratorToStringList(set.values());
    console.log(`Exporting the following files:\n${expFiles}`);

    ensureDirExists(path.dirname(file));

    tar.create({
        file: file,
        gzip: true,
        sync: true,
    },
        Array.from(set)
    );

    // clean up
    console.log('Export done. Restoring files...');

    cleaned.forEach((f) => {
        fs.writeFileSync(f.file, f.fileContent);
    });

    fs.unlinkSync(files.assignment.file);


    console.log('Done.');
}

module.exports = packAssignment;
