'use strict';

const path = require('path');
const fs = require('fs');
const tar = require('tar');
const readlineSync = require('readline-sync');

const files = require('../files');
const checkYesNo = require('./helper/checkYesNo');

function importAssignment(
    archive, archiveDir, assumeYes = false, noBackup = false
) {
    if (!archive) {
        const archives = fs.readdirSync(archiveDir, { withFileTypes: true });
        let time = 0;
        archives.forEach(archiveFile => {
            if (archiveFile.isFile()) {
                const archivePath = path.join(archiveDir, archiveFile.name);
                const stats = fs.statSync(archivePath);
                if (stats.mtime > time) {
                    time = stats.mtime;
                    archive = archivePath;
                }
            }
        });
    } else {
        archive = path.join(archiveDir, archive);
    }

    console.log(`Importing ${archive}...`);
    console.log(`Reading ${files.assignment.label} file...`);

    let assignmentJsonFound = false;
    tar.list({
        file: archive,
        onentry: () => assignmentJsonFound = true,
        sync: true
    }, [files.assignment.file]);

    if (!assignmentJsonFound) {
        console.log(`${files.assignment.file} not found! Aborting.`);
        return;
    }

    tar.extract({
        file: archive,
        sync: true
    }, [files.assignment.file]);

    const assignments = JSON.parse(fs.readFileSync(files.assignments.file));
    const assignment = JSON.parse(fs.readFileSync(files.assignment.file));
    const existing = assignments.assignments.findIndex(
        (a) => a.id === assignment.id
    );

    if (existing > -1) {
        if (!assumeYes) {
            const answer =
                readlineSync.question(
                    `Assignment ID ${assignment.id} already in ` +
                    `${files.assignments.file}. Replace? (y/n) `);
            if (!checkYesNo(answer)) {
                console.log('Aborting.');
                return;
            }
        }
        assignments.assignments.splice(existing, 1, assignment);
    } else {
        assignments.assignments.push(assignment);
    }

    console.log('Importing the following files:');
    tar.list({
        file: archive,
        filter: (path) => path !== files.assignment.file,
        onentry: (f) => console.log(f.path),
        sync: true
    });

    if (!assumeYes) {
        const answer =
            readlineSync.question('Please confirm file import (y/n): ');
        if (!checkYesNo(answer)) {
            console.log('Aborting.');
            return;
        }
    }

    console.log('Importing...');
    if (!noBackup) {
        const date = new Date().toISOString().replace(/\.|:/g, '-');
        const backup = `${files.assignments.label}-${date}.json`;
        fs.copyFile(files.assignments.file, backup, (err) => {
            if (err) throw err;
            console.log(
                `Backup of ${files.assignments.file} was saved to ${backup}`);
        });
    }

    tar.extract({
        file: archive,
        filter: (path) => path !== files.assignment.file,
        sync: true
    });

    console.log(`Adding assignment to ${files.assignments.file}...`);
    fs.writeFileSync(
        files.assignments.file,
        JSON.stringify(assignments, null, 4));
    fs.unlinkSync(files.assignment.file);

    console.log('Done.');
}

module.exports = importAssignment;
