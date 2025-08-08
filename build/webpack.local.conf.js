const { merge } = require('webpack-merge');
const baseWebpackConfig = require('./webpack.base.conf.js');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const path = require('path');
const webpack = require('webpack');
const dotenv = require('dotenv');

// Load environment variables from .env.local
const env = dotenv.config({ path: path.join(__dirname, '../.env.local') }).parsed || {};

// Also load environment variables at runtime for the middleware
function getEnvVars() {
  return dotenv.config({ path: path.join(__dirname, '../.env.local') }).parsed || {};
}

const devWebpackConfig = merge(baseWebpackConfig, {
  mode: 'development',
  devtool: 'eval-cheap-module-source-map',
  devServer: {
    port: 9091,
    hot: true,
    open: false,
    historyApiFallback: true,
    static: {
      directory: path.join(__dirname, '../public')
    },
    setupMiddlewares: (middlewares, devServer) => {
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined');
      }

      // Simple test endpoint
      devServer.app.get('/test', (req, res) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ 
          message: 'Test endpoint works',
          timestamp: new Date().toISOString()
        }));
      });

      // 添加获取token的API路由
      devServer.app.get('/getDemoToken', async (req, res) => {
        try {
          // Load environment variables at runtime
          const runtimeEnv = getEnvVars();
          const config = {
            secretId: runtimeEnv.TENCENT_SECRET_ID || '',
            secretKey: runtimeEnv.TENCENT_SECRET_KEY || '',
            appId: runtimeEnv.TENCENT_APP_ID || ''
          };
          
          console.log('【getDemoToken】---config--->', { 
            secretId: config.secretId ? '***' + config.secretId.slice(-8) : 'undefined',
            secretKey: config.secretKey ? '***' + config.secretKey.slice(-8) : 'undefined',
            appId: config.appId ? '***' + config.appId.slice(-8) : 'undefined'
          });
          
          // Check if configuration is valid
          if (!config.secretId || !config.secretKey || !config.appId) {
            throw new Error('Missing required configuration: secretId, secretKey, or appId');
          }
          
          // If we have placeholder credentials, return a mock response
          if (config.secretId === 'your-tencent-secret-id-here') {
            const mockResponse = {
              Token: 'mock-token-for-testing',
              ExpireTime: Math.floor(Date.now() / 1000) + 3600
            };
            console.log('【getDemoToken】---mock response--->', mockResponse);
            res.statusCode = 200;
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ data: { apiResponse: mockResponse } }));
            return;
          }
          
          // Real API call
          const TencentCloudCommon = require('tencentcloud-sdk-nodejs-common');
          const CommonClient = TencentCloudCommon.CommonClient;
          
          const clientConfig = {
            credential: {
              secretId: config.secretId,
              secretKey: config.secretKey
            },
            region: 'ap-guangzhou',
            profile: {
              httpProfile: {
                endpoint: 'lke.ap-guangzhou.tencentcloudapi.com'
              }
            }
          };

          const client = new CommonClient(
            'lke.ap-guangzhou.tencentcloudapi.com',
            '2023-11-30',
            clientConfig
          );
          
          const params = {
            'Type': 5,
            'BotAppKey': config.appId,
            'VisitorBizId': config.appId.substring(0, 5)
          };
          
          console.log('【getDemoToken】---req--->', params);
          const apiResponse = await client.request('GetWsToken', params);
          console.log('【getDemoToken】---rep--->', apiResponse);

          res.statusCode = 200;
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ data: { apiResponse } }));
        } catch (error) {
          console.error('❌ GetDemoToken error:', error);
          console.error('❌ Error stack:', error.stack);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ 
            error: error.message,
            stack: error.stack
          }));
        }
      });

      return middlewares;
    }
  },
  plugins: [
    new ReactRefreshWebpackPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin({
      // 将 dotenv 注入的环境变量同时注入到业务中
      ...Object.entries(env || {}).reduce((acc, curr) => ({...acc, [`process.env.${curr[0]}`]: JSON.stringify(curr[1])}), {})
    })
  ]
});

module.exports = devWebpackConfig;