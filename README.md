# IFixAI

AI 聊天应用，支持多种 AI 代理（Gemini, Claude, GPT, Qwen, Cursor）。

## 架构

- **前端**: React + TypeScript + Vite
- **后端**: Go + Hertz 框架
- **数据库**: SQLite

## 快速开始

### 1. 启动 Go 服务端

```bash
cd ~/Projects/golang/src/ifix-service
go run cmd/server/main.go
```

服务端将在 `http://localhost:4000` 启动。

### 2. 启动前端

```bash
npm install
npm run dev
```

前端将在 `http://localhost:3000` 启动，并通过 Vite 代理连接到 Go 服务端。

## 功能特性

- ✅ 多 AI 代理支持（Gemini, Claude, GPT, Qwen, Cursor）
- ✅ WebSocket 实时聊天
- ✅ 每个会话独立的 WebSocket 连接
- ✅ 流式响应
- ✅ Excel 文件处理
- ✅ 图片识别和分析
- ✅ 文件操作（重命名、整理、合并）

## 注意事项

- Node.js 服务端代码已废弃，现在使用 Go 服务端
- 前端通过 Vite 代理连接到 Go 服务端
- WebSocket 连接会自动通过 Vite 代理
