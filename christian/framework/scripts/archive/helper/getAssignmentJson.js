'use strict';

function getAssignmentJson(assignment, checkName = false) {
    const assignmentsJson = require('../../../assignments.json');

    if (assignment != undefined) {
        const assignmentJson =
            checkName ?
                assignmentsJson.assignments.find(
                    a => a.name === assignment) :
                assignmentsJson.assignments.find(
                    a => a.id.toString() === assignment);
        if (assignmentJson === undefined) {
            console.log(
                'Could not find assignment "' + assignment +
                '" in assignments.json!`');
        }
        return assignmentJson;
    } else {
        if (assignmentsJson.assignments.length == 0) {
            console.log(
                'Could not find any assignments in assignments.json!');
            return undefined;
        }
        return assignmentsJson.assignments.slice(-1)[0];
    }
}

module.exports = getAssignmentJson;
