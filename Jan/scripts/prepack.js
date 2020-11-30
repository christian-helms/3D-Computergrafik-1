'use strict';

const fs = require('fs');
const pug = require('pug');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const kt = require('katex');
const katexRenderer = require('markdown-it-texmath').use(kt);
const markdownRenderer = require('markdown-it')().use(
    katexRenderer,
    { delimiters: 'dollars', macros: { '\\RR': '\\mathbb{R}' } });

function generateAssignmentInfo(assignmentsJson) {
    const info = [];
    assignmentsJson.assignments.forEach(assignment => {
        const exercises = [];
        assignment.exercises.forEach(path => {
            const dir = 'source/exercises/' + path;
            const exercise = JSON.parse(
                fs.readFileSync(dir + '/exercise.json', 'utf8'));

            const summary = fs.readFileSync(dir + '/summary.md', 'utf8');
            const summaryText = markdownRenderer.render(summary);

            const task = fs.readFileSync(dir + '/assignment.md', 'utf8');
            const taskText = markdownRenderer.render(task);

            exercises.push({
                path: dir,
                id: path.replace('/', '_'),
                thumbnail: `img/exercises/${path}/thumbnail.png`,
                summaryText,
                taskText,
                ...exercise
            });
        });
        info.push({
            name: assignment.name,
            id: assignment.id,
            exercises
        });
    });

    return info;
}

function generateExercisePages(assignmentInfo, lecture) {
    const plugins = [];
    assignmentInfo.forEach(assignment => {
        assignment.exercises.forEach(exercise => {
            plugins.push(
                new HtmlWebpackPlugin({
                    filename: `${exercise.id}.html`,
                    templateContent: pug.renderFile(
                        `source/common/pages/${exercise.type}Exercise.pug`,
                        {
                            filename: 'source/common/pages/dummy.pug',
                            assignments: assignmentInfo,
                            exercise,
                            lecture
                        }
                    ),
                    inject: false
                })
            );
        });
    });

    return plugins;
}

function generateEntryPoints(assignmentInfo) {
    const entryPoints = {};
    assignmentInfo.forEach(assignment => {
        assignment.exercises.forEach(exercise => {
            if (exercise.type === 'text') {
                return;
            }
            const main = fs.readdirSync(exercise.path + '/code')
                .filter((f) => f.endsWith('.ts'))
                .map((f) => {
                    return {
                        file: f,
                        content: fs.readFileSync(
                            exercise.path + '/code/' + f, 'utf8')
                    };
                })
                .filter((f) => f.content.includes('Renderer'))
                .map((f) => f.file);
            if (!main) {
                console.log(
                    `Could not find code file for exercise ${exercise.name}`);
                return;
            }
            entryPoints[exercise.id] = './' + exercise.path + '/code/' + main;
        });
    });

    return entryPoints;
}

function prepareContent() {
    const assignmentJson = require('../assignments.json');
    const assignmentInfo = generateAssignmentInfo(assignmentJson);

    return {
        plugins: generateExercisePages(assignmentInfo, assignmentJson.lecture),
        entryPoints: generateEntryPoints(assignmentInfo),
        assignmentInfo: assignmentInfo,
        lecture: assignmentJson.lecture
    };
}

module.exports = { prepareContent };