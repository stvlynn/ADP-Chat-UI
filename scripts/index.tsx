import http from 'http';
import { CommonClient } from 'tencentcloud-sdk-nodejs-common';
import config from './static';

// Configuration interface for the server
interface ServerConfig {
  secretId: string;
  secretKey: string;
  appId: string;
}

// API Response interface
interface ApiResponse {
  Token?: string;
  ExpireTime?: number;
  InputLenLimit?: number;
  RequestId?: string;
  Balance?: number;
  Pattern?: string;
  SingleWorkflow?: {
    IsEnable: boolean;
    Status: string;
    WorkflowDesc: string;
    WorkflowId: string;
    WorkflowName: string;
  };
}

// Request handler function
async function handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  if (req.url === '/getDemoToken') {
    try {
      console.log('【getDemoToken】---config--->', {
        secretId: config.secretId ? '***' + config.secretId.slice(-8) : 'undefined',
        secretKey: config.secretKey ? '***' + config.secretKey.slice(-8) : 'undefined',
        appId: config.appId ? '***' + config.appId.slice(-8) : 'undefined'
      });

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
      const apiResponse: ApiResponse = await client.request('GetWsToken', params);
      console.log('【getDemoToken】---rep--->', apiResponse);

      res.statusCode = 200;
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ apiResponse }));
    } catch (error) {
      console.error('❌ GetDemoToken error:', error);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  } else {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Not found' }));
  }
}

// Create HTTP server
const server = http.createServer(handleRequest);

const port = 3000;
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});