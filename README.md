# 腾讯云智能体平台 ADP Chatbot 前端

## 项目简介

本项目是[腾讯云智能体开发平台（Tencent Cloud Agent Development Platform，Tencent Cloud ADP）](https://lke.cloud.tencent.com)的第三方 Chatbot 前端。

它基于 React 构建，提供与腾讯云智能体后端服务的实时聊天交互功能，支持 WebSocket 和 SSE 两种连接方式，具备 Token 管理和 AI 对话能力。

腾讯云智能体开发平台（ADP）是基于大模型的智能体构建平台，提供 LLM+RAG、Workflow、Multi-agent 等多种智能体开发框架，助力企业结合专属数据，高效搭建稳定、安全、符合业务需求的智能体应用。

## Demo

![2025-08-11 21.36.45.png](https://s2.loli.net/2025/08/11/YGiroLFEOenkyIP.png)

[快速体验](https://adp-chat-ui.vercel.app)

## 🚀 快速部署

### Vercel 一键部署

点击下方按钮，即可一键部署到 Vercel：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fstvlynn%2FADP-Chat-UI)

配置环境变量（见下方）后，点击 Deploy 即可开始使用。

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

如何获取？

![2025-08-11 21.47.26.png](https://s2.loli.net/2025/08/11/WtLOHNdaE37h62j.png)

1. 进入 [API 密钥管理](https://console.cloud.tencent.com/cam/capi)
2. 新建密钥
3. 获取 API 密钥 ID 和 API 密钥 Key
4. 在 [应用管理](https://console.cloud.tencent.com/lke/app) 中创建应用
5. 进入 [腾讯云智能体平台](https://lke.cloud.tencent.com) -> 应用 -> 应用发布 -> API 管理 -> 复制 AppKey 获取应用 ID

### 作为网页嵌入

下面提供两种最简单的嵌入方式，适用于任何站点，无需暴露密钥：

#### 方式一：作为 iframe 内嵌

将部署后的地址直接以 iframe 引入：

```html
<iframe
  src="https://adp-chat-ui.vercel.app" //此处替换为你的部署地址
  style="width: 100%; height: 600px; border: 0;"
  allow="clipboard-write *; microphone; camera"
></iframe>
```

你可以根据页面需要调整宽高与样式。

#### 方式二：用 script 动态注入悬浮窗（简易版）

在任意网页底部加入如下脚本，即可生成一个固定在右下角的聊天悬浮窗：

```html
<script>
(function () {
  var url = 'https://adp-chat-ui.vercel.app'; // 你的部署地址
  var iframe = document.createElement('iframe');
  iframe.src = url;
  iframe.style.cssText = [
    'position:fixed',
    'right:24px',
    'bottom:24px',
    'width:380px',
    'height:600px',
    'border:1px solid #e5e7eb',
    'border-radius:12px',
    'box-shadow:0 10px 30px rgba(0,0,0,.15)',
    'z-index:2147483647',
    'background:#fff'
  ].join(';');
  iframe.setAttribute('allow', 'clipboard-write *; microphone; camera');
  document.body.appendChild(iframe);
})();
</script>
```

如需气泡按钮/最小化等高级嵌入，可在此脚本基础上扩展按钮 DOM 与开关逻辑；当前仓库未内置独立的 embed SDK。

#### 注意事项

- 该嵌入方式不会暴露 `TENCENT_SECRET_ID/KEY` 等敏感信息：iframe 内的应用会自行调用其同域的 `/getDemoToken` 接口完成鉴权。
- 确保部署域名允许被其它站点 iframe：不要设置 `X-Frame-Options: DENY`，若使用 CSP，请为 `frame-ancestors` 配置允许的上级域名。Vercel 默认不阻止被嵌入。
- 若目标站点使用严格的 CSP，请为 `script-src`/`frame-src` 增加你的部署域名（例如 `https://adp-chat-ui.vercel.app`）。
- 高级联动（如页面与聊天窗的双向通信）可通过 `postMessage` 实现，当前示例未内置该协议。

#### 方式三：一行脚本（推荐）

本仓库已在 `public/` 提供优化的 `embed.min.js`，部署后可通过一行脚本接入。特性包括：

- 🎨 **与主应用配色一致**：使用 teal 色系 (#0d9488)
- ✨ **流畅动画效果**：展开/收起带 0.2s 缓动动画
- 🎯 **优化图标设计**：28x28 像素清晰聊天图标
- 🧹 **简洁界面**：无冗余标题，专注聊天体验
- 💾 **状态记忆**：localStorage 保存展开/最小化状态

**最简接入（推荐）：**

```html
<script>
  window.adpChatbotConfig = {
    baseUrl: 'https://adp-chat-ui.vercel.app' // 替换为你的部署域名
  };
</script>
<script src="https://adp-chat-ui.vercel.app/embed.min.js" defer></script>
```

**完整配置示例：**

```html
<script>
  window.adpChatbotConfig = {
    baseUrl: 'https://adp-chat-ui.vercel.app', // 你的部署域名
    width: 380,           // 聊天窗宽度
    height: 600,          // 聊天窗高度
    right: 24,            // 距离右边距离
    bottom: 24,           // 距离底部距离
    bubbleColor: '#0d9488', // 气泡按钮颜色（默认 teal 色）
    iframePath: '/',      // 聊天页面路径
    allow: 'clipboard-write *; microphone; camera' // iframe 权限
  };
</script>
<script src="https://adp-chat-ui.vercel.app/embed.min.js" defer></script>
```

调用控制（可选）：

```js
// 在外部页面中可随时控制：
window.ADPChatbot.open();   // 打开
window.ADPChatbot.close();  // 最小化
window.ADPChatbot.toggle(); // 切换
```

**可选样式自定义：**

```html
<style>
  /* 自定义气泡按钮颜色 */
  [data-adp-chatbot="bubble"] {
    background-color: #your-color !important;
  }
  
  /* 自定义聊天窗尺寸 */
  [data-adp-chatbot="wrap"] {
    width: 400px !important;
    height: 650px !important;
  }
</style>
```

**说明：**

- 🔧 **智能配置**：`baseUrl` 可省略，脚本会自动从 `src` 域名推断
- 🎯 **灵活定位**：通过 `right`、`bottom` 调整气泡按钮位置
- 💾 **状态持久化**：展开/最小化状态自动保存到 localStorage
- 🎨 **主题一致**：默认使用与主应用相同的 teal 配色方案
- ✨ **动画流畅**：内置 0.2s 缓动动画，提升用户体验

## 🧪 本地开发与测试

### 环境准备

1. 确保已安装 [Node.js](https://nodejs.org/) (推荐使用 LTS 版本)
2. 克隆项目到本地：

   ```bash
   git clone https://github.com/stvlynn/ADP-Chat-UI.git
   cd ADP-Chat-UI
   ```
3. 安装依赖：
   ```bash
   npm install
   ```

### 配置环境变量

1. 在项目根目录下复制 `.env.local.example` 文件为 `.env.local` 文件

```bash
cp .env.local.example .env.local
```

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