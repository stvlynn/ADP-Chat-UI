const dotenv = require('dotenv');

// Load environment variables from .env.local
const env = dotenv.config({ path: '.env.local' }).parsed || {};

// Also load environment variables at runtime for the middleware
function getEnvVars() {
  return dotenv.config({ path: '.env.local' }).parsed || {};
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Load environment variables at runtime
    const runtimeEnv = getEnvVars();
    const config = {
      secretId: runtimeEnv.TENCENT_SECRET_ID || process.env.TENCENT_SECRET_ID || '',
      secretKey: runtimeEnv.TENCENT_SECRET_KEY || process.env.TENCENT_SECRET_KEY || '',
      appId: runtimeEnv.TENCENT_APP_ID || process.env.TENCENT_APP_ID || ''
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
      res.status(200).json({ data: { apiResponse: mockResponse } });
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

    res.status(200).json({ data: { apiResponse } });
  } catch (error) {
    console.error('❌ GetDemoToken error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack
    });
  }
};