'use strict';

const fs = require('fs');
const readlineSync = require('readline-sync');

const files = require('../files');
const getAssignmentJson = require('./helper/getAssignmentJson');
const removeDirRecursive = require('./helper/removeDirRecursive');
const iteratorToStringList = require('./helper/iteratorToStringList');
const checkYesNo = require('./helper/checkYesNo');

function cleanAssignment(assignment, assumeYes = false) {
    const assignmentJson = getAssignmentJson(assignment);

    const dirs = assignmentJson.exercises.map((d) => 'source/exercises/' + d);

    if (!fs.existsSync(files.assignments.file)) {
        console.log(`Could not find ${files.assignments.files}. ` +
            'Please run this script from the framework\'s base dir. Aborting.');
    }
    const assignmentsJson =
        JSON.parse(fs.readFileSync(files.assignments.files));
    const assignmentIndex = assignmentsJson.assignments.findIndex(
        (a) => a.id === assignmentJson.id);

    if (!assumeYes) {
        const answer =
            readlineSync.question(
                'This will remove the following directories:\n' +
                iteratorToStringList(dirs) +
                '.\nAdditionally, this section will be removed from' +
                `${files.assignments.files}:\n` +
                JSON.stringify(assignmentJson, null, 4) +
                '\nPlease confirm (y/n):');
        if (!checkYesNo(answer)) {
            console.log('Aborting.');
            return;
        }
    }

    console.log(`Cleaning ${files.assignments.files}`);
    assignmentsJson.assignments.splice(assignmentIndex, 1);
    fs.writeFileSync(
        files.assignments.files, JSON.stringify(assignmentsJson, null, 4));

    dirs.forEach((d) => {
        console.log('Removing ' + d);
        removeDirRecursive(d);
    });

    console.log('Done.');
}

module.exports = cleanAssignment;
