# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Install dependencies**: `npm install`
- **Start development server**: `npm run dev` (runs on port 9091)
- **Build for production**: `npm run build`
- **Run tests**: `npm test`
- **Validate configuration**: `npm run validate-config`

## Project Architecture

This is a React-based chat application that integrates with Tencent Cloud's LKE (Large Knowledge Engine) service. The application provides real-time chat functionality with WebSocket and SSE support, token management, and AI-powered responses.

### Technology Stack

- **Frontend**: React 19 with TypeScript
- **State Management**: React Hooks + Custom Event System
- **WebSocket**: Socket.io Client
- **Styling**: Less CSS + Tailwind CSS
- **Build Tool**: Webpack 5 with Dev Server
- **Real-time Communication**: WebSocket/SSE with EventHub
- **Testing**: React Testing Library + Jest

### Key Configuration Files

- **API Configuration**: `scripts/static.tsx` - Loads Tencent Cloud credentials from environment variables
- **Client Configuration**: `src/constants/static.ts` - Sets ACCESS_TYPE ('ws' or 'sse') and APP_KEY
- **Environment Variables**: `.env.local` - Contains TENCENT_SECRET_ID, TENCENT_SECRET_KEY, TENCENT_APP_ID
- **Main App**: `src/App.tsx` - Root React component with initialization logic
- **Router**: React Router DOM for navigation

### Core Components

#### Connection Management
- **WebSocket**: `src/manage/utils/Socket.ts` - WebSocket connection handling with Socket.io
- **SSE**: `src/manage/sse.ts` - Server-Sent Events alternative connection method
- **EventHub**: `src/manage/utils/EventHub.ts` - Global event system for component communication
- **ClientData**: `src/pages/chat-demo/utils/ClientData.ts` - Chat session and message management

#### Chat Interface
- **Main Chat**: `src/pages/chat-demo/ChatDemo.tsx` - Primary chat interface container
- **Client Chat**: `src/pages/chat-demo/components/ClientChat.tsx` - Chat message display component
- **Question Input**: `src/pages/chat-demo/components/QuestionInput.tsx` - User input component
- **Common Header**: `src/pages/chat-demo/components/CommonHeader.tsx` - Chat header component
- **Markdown Renderer**: `src/pages/chat-demo/components/MarkdownRenderer.tsx` - Markdown content rendering with Mermaid support

#### Supporting Components
- **Token Display**: `src/pages/chat-demo/components/TokensBoardBrief.tsx` - Token usage display
- **Reference Component**: `src/pages/chat-demo/components/ReferenceComponent.tsx` - Reference/attachment display
- **Loading Spinner**: `src/components/LoadingSpinner.tsx` - Loading indicator component

### Key Features

1. **Dual Connection Support**: Can operate in either WebSocket or SSE mode
2. **Real-time Chat**: Live messaging with token usage tracking
3. **Event-driven Architecture**: Uses EventHub for component communication
4. **Token Management**: Displays and tracks API token usage
5. **Reference System**: Supports file attachments and references in chat
6. **Markdown Rendering**: Supports rich text formatting with Mermaid diagrams
7. **Responsive Design**: Mobile-friendly interface with Tailwind CSS

## Complete Request/Response Flow

### 1. Application Initialization
- App starts in `src/App.tsx:11-58` and checks `ACCESS_TYPE` from `src/constants/static.ts`
- If `ACCESS_TYPE === 'ws'`, requests token from `/getDemoToken` endpoint
- Token acquisition logic creates Promise array for different connection types

### 2. Token Generation Process (WebSocket Mode)

#### API Request Flow:
1. **Frontend Request**: `src/App.tsx:25` makes GET request to `/getDemoToken`
2. **Webpack DevServer**: `build/webpack.local.conf.js:43-83` handles the request
3. **Tencent Cloud API Call**: Uses environment variables loaded from `.env.local`

#### Environment Variables Usage:
```bash
# .env.local
TENCENT_SECRET_ID=your-secret-id
TENCENT_SECRET_KEY=your-secret-key
TENCENT_APP_ID=your-app-id
```

#### API Request Parameters:
```typescript
// build/webpack.local.conf.js:63-67
const params = {
    'Type': 5,                              // Connection type (5 = WebSocket)
    'BotAppKey': config.appId,              // Uses appId from environment
    'VisitorBizId': config.appId.substring(0, 5)  // First 5 chars of appId as visitor ID
};
```

### 3. Response Processing
- **API Response**: Tencent Cloud returns token data via `GetWsToken` API call
- **Frontend Processing**: `src/App.tsx:28-30` extracts token from response
- **Global Storage**: Token stored in `window.webimToken` for chat connections

### 4. Chat Connection Establishment
- **WebSocket Mode**: Uses `src/manage/utils/Socket.ts` with acquired token
- **SSE Mode**: Uses `src/manage/sse.ts` (no token required)
- **Event System**: `src/manage/utils/EventHub.ts` handles component communication

### 5. Chat Interface Flow
1. **Component Loading**: `src/pages/chat-demo/ChatDemo.tsx` initializes chat interface
2. **Connection Setup**: Establishes WebSocket/SSE connection to LKE service
3. **Message Handling**: `src/pages/chat-demo/components/ClientChat.tsx` displays messages
4. **User Input**: `src/pages/chat-demo/components/QuestionInput.tsx` handles user messages
5. **Token Tracking**: `src/pages/chat-demo/components/TokensBoardBrief.tsx` monitors usage

### Configuration Requirements

Before running, you must configure:
1. **Environment Variables**: Create `.env.local` with TENCENT_SECRET_ID, TENCENT_SECRET_KEY, TENCENT_APP_ID
2. **App Key**: Set APP_KEY in `src/constants/static.ts`
3. **Connection Type**: Choose 'ws' or 'sse' in ACCESS_TYPE

### Port Usage

- **Port 9091**: Development server (React frontend + API token generation)
- Webpack dev server handles both frontend and API endpoints

## Development Workflow

### Environment Setup
1. Install dependencies: `npm install`
2. Configure environment variables in `.env.local`
3. Start development server: `npm run dev`
4. Access application at `http://localhost:9091`

### Build Process
- **Development**: Uses webpack-dev-server with hot reload
- **Production**: Optimized build with webpack production configuration
- **Testing**: Uses React Testing Library and Jest

### Code Structure
- **Components**: Functional React components with TypeScript
- **Styling**: Mix of Less CSS and Tailwind CSS
- **State Management**: React hooks with custom event system
- **TypeScript**: Full type safety with proper interfaces

## Testing

### Running Tests
- **All tests**: `npm test`
- **Watch mode**: `npm test -- --watch`
- **Coverage**: `npm test -- --coverage`

### Test Structure
- **Component tests**: Located alongside components (e.g., `App.test.tsx`)
- **Setup**: `src/setupTests.ts` for testing configuration
- **Utilities**: React Testing Library for DOM testing

## Debugging

### Common Debug Scenarios
- **WebSocket Connection**: Check console for "🎯 Token found" and "🔌 WebSocket connected" messages
- **Token Issues**: Verify `.env.local` configuration and `npm run validate-config`
- **Message Flow**: Look for "📦 ClientData.assembleMsgContent" and "📡 EventHub" messages

### Console Logging
The application includes comprehensive debug logging for:
- WebSocket connection status
- Token generation and storage
- Message processing and display
- Event system activity

## Security Considerations

- **API Credentials**: Stored in environment variables, not in code
- **Token Management**: Server-side token generation via webpack middleware
- **Session Security**: UUID-generated session IDs
- **Data Validation**: Message content validation before processing