# 腾讯云智能体平台 ADP Chatbot 前端

## 项目简介

本项目是[腾讯云智能体开发平台（Tencent Cloud Agent Development Platform，Tencent Cloud ADP）](https://lke.cloud.tencent.com)的 Chatbot 前端示例应用。它基于 React 构建，提供与腾讯云智能体后端服务的实时聊天交互功能，支持 WebSocket 和 SSE 两种连接方式，具备 Token 管理和 AI 对话能力。

腾讯云智能体开发平台（ADP）是基于大模型的智能体构建平台，提供 LLM+RAG、Workflow、Multi-agent 等多种智能体开发框架，助力企业结合专属数据，高效搭建稳定、安全、符合业务需求的智能体应用。

## 🚀 快速部署

### Vercel 一键部署

点击下方按钮，即可一键部署到 Vercel：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fstvlynn%2FADP-Chat-UI)

### 手动部署到 Vercel

1. 将项目推送到你的 GitHub 仓库
2. 登录 [Vercel](https://vercel.com/) 并导入你的仓库
3. 在项目设置中，配置环境变量（见下方）
4. 点击 "Deploy" 开始部署

### 环境变量配置

部署时需要配置以下环境变量：

- `TENCENT_SECRET_ID`: 你的腾讯云 API 密钥 ID
- `TENCENT_SECRET_KEY`: 你的腾讯云 API 密钥 Key
- `TENCENT_APP_ID`: 你的腾讯云应用 ID

## 🧪 本地开发与测试

### 环境准备

1. 确保已安装 [Node.js](https://nodejs.org/) (推荐使用 LTS 版本)
2. 克隆项目到本地：

   ```bash
   git clone https://github.com/stvlynn/qbot-api-demo.git
   cd qbot-api-demo/react-app
   ```
3. 安装依赖：
   ```bash
   npm install
   ```

### 配置环境变量

1. 在项目根目录下创建 `.env.local` 文件
2. 添加以下环境变量：

   ```env
   TENCENT_SECRET_ID=your_secret_id
   TENCENT_SECRET_KEY=your_secret_key
   TENCENT_APP_ID=your_app_id
   ```

### 启动开发服务器

```bash
npm run dev
```

开发服务器将在 `http://localhost:9091` 启动。

### 构建生产版本

```bash
npm run build
```

构建后的文件将位于 `dist/` 目录。

## 🤝 贡献指南

我们欢迎并感谢任何形式的贡献！

### 贡献方式

1. **报告问题**：如果你发现了 bug 或有功能建议，请在 GitHub 上提交 [Issue](https://github.com/stvlynn/ADP-Chat-UI/issues)。
2. **提交代码**：

   - Fork 项目
   - 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
   - 提交你的更改 (`git commit -m 'Add some amazing feature'`)
   - 推送到分支 (`git push origin feature/AmazingFeature`)
   - 开启一个 Pull Request

### 开发规范

- 遵循项目现有的代码风格
- 确保所有测试通过后再提交
- 更新相关文档