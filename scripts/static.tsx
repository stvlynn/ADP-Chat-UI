import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Configuration interface
interface AppConfig {
  secretId: string;
  secretKey: string;
  appId: string;
}

// Export configuration directly from environment variables
const config: AppConfig = {
  secretId: process.env.TENCENT_SECRET_ID || '',
  secretKey: process.env.TENCENT_SECRET_KEY || '',
  appId: process.env.TENCENT_APP_ID || ''
};

export default config;