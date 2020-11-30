'use strict';

const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { prepareContent } = require('./scripts/prepack.js');


const { plugins, entryPoints, assignmentInfo, lecture } = prepareContent();
entryPoints['main'] = './source/common/code/main.ts';

module.exports = {
    entry: entryPoints,
    devtool: 'inline-source-map',
    mode: 'development',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /(source\/shaders|node_modules)/,
            },
            {
                test: /\.(glsl|vert|frag)$/,
                use: { loader: 'webpack-glsl-loader' },
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.(jpg|jpeg|png|woff|woff2|eot|ttf|svg)$/,
                loader: 'url-loader?limit=100000'
            },
            {
                test: /\.pug$/,
                loader: 'html-loader?attributes=false'
            },
            {
                test: /\.stl$/,
                loader: 'raw-loader'
            },
            {
                test: /\.pug$/,
                loader: 'pug-html-loader',
                options: {
                    data: {
                        assignments: assignmentInfo,
                        lecture
                    }
                }
            }
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'build'),
        library: undefined,
        libraryTarget: 'umd'
    },
    devServer: {
        contentBase: path.resolve(__dirname, './source'),
        watchContentBase: true
    },
    plugins: plugins.concat([
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: 'source/common/pages/index.pug',
            inject: false
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: 'source/common/css', to: 'css' },
                { from: 'source/common/img', to: 'img' },
                { from: 'source/common/fonts', to: 'fonts' },
                {
                    from: 'source/exercises/**/*.@(png|svg|jpg)',
                    to: 'img/',
                    transformPath(target) {
                        return target.replace(
                            /source[/|\\]/,
                            ''
                        );
                    },
                    noErrorOnMissing: true
                },
                { from: 'source/common/models', to: 'models/common' },
                {
                    from: 'source/exercises/**/*.@(glb|stl)',
                    to: 'models/',
                    transformPath(target) {
                        return target.replace(
                            /source[/|\\]/,
                            ''
                        );
                    },
                    noErrorOnMissing: true
                },
            ]
        }),
    ]),
    stats: { assets: false }
};
