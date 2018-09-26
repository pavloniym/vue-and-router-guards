const webpack = require('webpack');


module.exports = {
    mode: 'production',
    entry: {
        entry: __dirname + '/src/guards.js'
    },
    output: {
        filename: 'guards.min.js'
    },
    optimization: {
        minimize: true
    },
}