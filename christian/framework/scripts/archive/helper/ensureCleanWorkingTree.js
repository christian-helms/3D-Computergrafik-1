'use strict';

const readlineSync = require('readline-sync');
const childProcess = require('child_process');

function ensureCleanWorkingTree() {
    const gitCheck = childProcess.spawnSync(
        process.platform === 'win32' ? 'where' : 'which', ['git']);

    if (gitCheck.status !== 0) {
        const noGitConfirm = readlineSync.question(
            'Could not find git. You should use git in combination with this ' +
            'script, as it overwrites files. If you still want to continue, ' +
            'please type "yes": ');
        return (noGitConfirm === 'yes');
    }

    childProcess.spawnSync(
        'git',
        [
            'update-index',
            '-q',
            '--ignore-submodules',
            '--refresh'
        ]);

    const unstagedCheck = childProcess.spawnSync(
        'git',
        [
            'diff-files',
            '--quiet',
            '--ignore-submodules',
            '--'
        ]);

    if (unstagedCheck.status !== 0) {
        console.log('There are unstaged changes!');
        const unstagedOutput = childProcess.spawnSync(
            'git',
            [
                'diff-files',
                '--name-status',
                '-r',
                '--ignore-submodules',
                '--'
            ], {
            encoding: 'utf-8'
        });
        console.log(unstagedOutput.stdout);
        return false;
    }

    const uncommitedCheck = childProcess.spawnSync(
        'git',
        [
            'diff-index',
            '--cached',
            '--quiet',
            'HEAD',
            '--ignore-submodules',
            '--'
        ]);

    if (uncommitedCheck.status !== 0) {
        console.log('There are uncommited changes!');
        const uncommitedOutput = childProcess.spawnSync(
            'git',
            [
                'diff-index',
                '--cached',
                '--name-status',
                '-r',
                '--ignore-submodules',
                'HEAD',
                '--'
            ], {
            encoding: 'utf-8'
        });
        console.log(uncommitedOutput.stdout);
        return false;
    }

    return true;
}

module.exports = ensureCleanWorkingTree;
