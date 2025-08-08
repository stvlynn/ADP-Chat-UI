# Vercel Deployment Guide

## 环境变量配置

在 Vercel 项目设置中添加以下环境变量：

### 必需的环境变量
```
TENCENT_SECRET_ID=your-tencent-secret-id-here
TENCENT_SECRET_KEY=your-tencent-secret-key-here
TENCENT_APP_ID=your-tencent-app-id-here
APP_KEY=your-app-key-here
```

### 可选的环境变量
```
NODE_ENV=production
SERVER_ENV=production
ACCESS_TYPE=ws
WS_BASE_URL=wss://wss.lke.cloud.tencent.com
SSE_BASE_URL=https://wss.lke.cloud.tencent.com
```

## 部署步骤

1. **连接代码仓库**
   - 在 Vercel 控制台中导入项目
   - 连接到你的 Git 仓库

2. **配置环境变量**
   - 进入项目设置 > Environment Variables
   - 添加上述必需的环境变量

3. **部署配置**
   - 项目已包含 `vercel.json` 配置文件
   - 构建命令：`npm run build`
   - 输出目录：`dist`

4. **部署**
   - Vercel 会自动检测配置并开始部署
   - 部署完成后会提供访问 URL

## 故障排除

### 常见问题

1. **构建失败**
   - 确保所有依赖已正确安装
   - 检查 TypeScript 配置是否正确

2. **API 路由不工作**
   - 确认环境变量已正确设置
   - 检查 `api/getDemoToken.js` 文件是否正确部署

3. **WebSocket 连接失败**
   - 确认腾讯云凭证有效
   - 检查网络连接和防火墙设置

### 调试方法

1. **查看构建日志**
   - 在 Vercel 控制台查看部署日志
   - 检查是否有构建错误

2. **检查运行时日志**
   - 访问 `https://your-app.vercel.app/_logs` 查看运行时日志
   - 查看函数执行错误

3. **本地测试**
   - 使用 `npm run build` 本地构建
   - 检查构建输出是否正确

## 项目结构

```
├── api/                    # Vercel 无服务器函数
│   └── getDemoToken.js     # 获取腾讯云 token 的 API
├── build/                  # Webpack 配置
│   ├── webpack.base.conf.js
│   ├── webpack.local.conf.js
│   └── webpack.prod.conf.js
├── dist/                   # 构建输出目录
├── public/                 # 静态文件
├── src/                    # 源代码
├── vercel.json             # Vercel 配置
└── package.json            # 项目依赖
```

## 注意事项

1. **安全性**
   - 不要在前端代码中硬编码敏感信息
   - 使用环境变量存储 API 密钥
   - 定期轮换访问密钥

2. **性能优化**
   - 使用 Vercel 的 CDN 缓存静态资源
   - 优化图片和资源加载

3. **监控**
   - 设置 Vercel 分析监控
   - 配置错误告警