const webpackMerge = require('webpack-merge');

const commonConfig = require('./common.js');

module.exports = webpackMerge(commonConfig, {
  mode: 'development',
  devtool: 'inline-source-map',
});
