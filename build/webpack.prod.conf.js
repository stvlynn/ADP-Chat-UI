const { merge } = require('webpack-merge');
const baseWebpackConfig = require('./webpack.base.conf.js');
const path = require('path');

const prodWebpackConfig = merge(baseWebpackConfig, {
  mode: 'production',
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: 'bundle.[contenthash].js',
    clean: true
  }
});

module.exports = prodWebpackConfig;