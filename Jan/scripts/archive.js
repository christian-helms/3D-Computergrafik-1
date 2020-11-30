'use strict';

const yargs = require('yargs');

const packAssignment = require('./archive/packAssignment');
const exportSubmission = require('./archive/exportSubmission');
const importAssignment = require('./archive/importAssignment');
const cleanAssignment = require('./archive/cleanAssignment');

yargs
    .command({
        command: 'export',
        desc: 'Exports an assignment submission',
        builder: (yargs) => {
            yargs
                .option('authorsFile', {
                    alias: ['a'],
                    desc:
                        'Config file containing the authors\' ' +
                        'enrolment numbers.',
                    default: './authors.json',
                    requiresArg: true,
                    type: 'string'
                })
                .option('assignment', {
                    alias: ['s'],
                    desc:
                        'Assignment to export. If empty, ' +
                        'exports the last assignment.',
                    requiresArg: true,
                    type: 'string'
                })
                .option('archiveDir', {
                    alias: ['d'],
                    desc: 'Directory for reading/writing archives.',
                    default: './submissions/',
                    requiresArg: true,
                    type: 'string'
                });
        },
        handler: (argv) => {
            const { authors } = require('../' + argv.authorsFile);
            exportSubmission(
                argv.assignment, authors.join('_'), argv.archiveDir);
        }
    })
    .command({
        command: 'import',
        desc: 'Imports an assignment',
        builder: (yargs) => {
            yargs
                .option('archive', {
                    alias: ['archives', 'r'],
                    desc:
                        'Archive(s) to import. ' +
                        'If empty, imports the newest archive.',
                    requiresArg: true,
                    type: 'string',
                    array: true
                })
                .option('archiveDir', {
                    alias: ['d'],
                    desc: 'Directory for reading/writing archives.',
                    default: './assignments/',
                    requiresArg: true,
                    type: 'string'
                })
                .option('assumeYes', {
                    alias: ['y', 'yes'],
                    desc: 'Automatic yes to prompts',
                    requiresArg: false,
                    type: 'boolean'
                })
                .option('noBackup', {
                    alias: ['n'],
                    desc: 'Don\'t create backup of assignments.json',
                    requiresArg: false,
                    type: 'boolean'
                });
        },
        handler: (argv) => {
            if (!argv.archives) {
                importAssignment(
                    undefined, argv.archiveDir, argv.assumeYes, argv.noBackup);
            } else {
                argv.archives.forEach((a, i) => {
                    importAssignment(
                        a,
                        argv.archiveDir,
                        argv.assumeYes,
                        i === 0 ? argv.noBackup : true);
                });
            }
        }
    })
    .command({
        command: 'clean',
        desc: 'Removes all traces of an imported assignment - use with care',
        builder: (yargs) => {
            yargs
                .option('assignment', {
                    alias: ['s'],
                    desc:
                        'ID of assignment to remove. ' +
                        'If empty, removes the last assignment.',
                    requiresArg: true,
                    type: 'string'
                })
                .option('assumeYes', {
                    alias: ['y', 'yes'],
                    desc: 'Automatic yes to prompts',
                    requiresArg: false,
                    type: 'boolean'
                });
        },
        handler: (argv) => {
            cleanAssignment(argv.assignment, argv.assumeYes);
        }
    })
    .command({
        command: 'packAssignment',
        desc:
            '[TA] Exports an assignment, ' +
            'automatically removing the example solution',
        builder: (yargs) => {
            yargs
                .option('assignment', {
                    alias: ['s'],
                    desc:
                        'Assignment to export. ' +
                        'If empty, exports the last assignment.',
                    requiresArg: true,
                    type: 'string'
                })
                .option('archiveDir', {
                    alias: ['d'],
                    desc: 'Directory for reading/writing archives.',
                    default: './assignments/',
                    requiresArg: true,
                    type: 'string'
                })
                .option('removeBegin', {
                    alias: ['b'],
                    desc: 'Token designating the start of a solution',
                    default: '// TA: remove begin',
                    requiresArg: true,
                    type: 'string'
                })
                .option('removeEnd', {
                    alias: ['e'],
                    desc: 'Token designating the end of a solution',
                    default: '// TA: remove end',
                    requiresArg: true,
                    type: 'string'
                })
                .option('assumeYes', {
                    alias: ['y', 'yes'],
                    desc: 'Automatic yes to prompts',
                    requiresArg: false,
                    type: 'boolean'
                })
                .option('force', {
                    alias: ['f'],
                    desc: 'Force export even if git working tree isn\'t clean',
                    requiresArg: false,
                    type: 'boolean'
                });
        },
        handler: (argv) => {
            packAssignment(
                argv.assignment, argv.archiveDir,
                argv.removeBegin, argv.removeEnd,
                argv.assumeYes, argv.force);
        }
    })
    .command({
        command: 'cleanImport',
        desc: '[TA] Removes an assignment and imports a given list of archives',
        builder: (yargs) => {
            yargs
                .option('assignment', {
                    alias: ['s'],
                    desc:
                        'ID of assignment to remove. ' +
                        'If empty, removes the last assignment.',
                    requiresArg: true,
                    type: 'string'
                })
                .option('archives', {
                    alias: ['r'],
                    desc: 'Archives to import',
                    demandOption: true,
                    requiresArg: true,
                    type: 'string',
                    array: true
                })
                .option('archiveDir', {
                    alias: ['d'],
                    desc: 'Directory for reading/writing archives.',
                    default: './assignments/',
                    requiresArg: true,
                    type: 'string'
                })
                .option('assumeYes', {
                    alias: ['y', 'yes'],
                    desc: 'Automatic yes to prompts',
                    requiresArg: false,
                    type: 'boolean'
                });
        },
        handler: (argv) => {
            cleanAssignment(argv.assignment, argv.assumeYes);
            argv.archives.forEach((a) => {
                importAssignment(a, argv.archiveDir, argv.assumeYes, true);
            });
        }
    })
    .demandCommand()
    .locale('en')
    .help()
    .wrap(null)
    .argv;