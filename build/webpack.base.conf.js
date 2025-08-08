const path = require('path');
const webpack = require('webpack');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const dotenv = require('dotenv');

const env = dotenv.config({ path: path.join(__dirname, `../config/.env.${process.env.SERVER_ENV || 'local'}`) }).parsed || {};

const baseWebpackConfig = {
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: 'bundle.js',
    publicPath: '/'
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/preset-env',
                '@babel/preset-react',
                '@babel/preset-typescript'
              ],
              plugins: [
                // Enable React Refresh only in non-production builds
                ...(process.env.NODE_ENV !== 'production' ? ['react-refresh/babel'] : [])
              ]
            }
          }
        ]
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
          'postcss-loader'
        ]
      },
      {
        test: /\.less$/,
        use: [
          'style-loader',
          'css-loader',
          'less-loader'
        ]
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/resource'
      }
    ]
  },
  plugins: [
    // Only expose a safe, whitelisted subset of env vars to the client
    new webpack.DefinePlugin((() => {
      const allowedKeys = ['WS_BASE_URL', 'SSE_BASE_URL'];
      const exposed = {};
      allowedKeys.forEach((key) => {
        const val = (process.env && Object.prototype.hasOwnProperty.call(process.env, key))
          ? process.env[key]
          : (env ? env[key] : undefined);
        exposed[`process.env.${key}`] = JSON.stringify(val || '');
      });
      return exposed;
    })()),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, '../public/index.html'),
      filename: 'index.html'
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, '../public'),
          to: path.resolve(__dirname, '../dist'),
          globOptions: {
            ignore: ['**/index.html']
          }
        }
      ]
    })
  ]
};

module.exports = baseWebpackConfig;