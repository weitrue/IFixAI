# 迁移指南：从 Node.js 到 Go 服务端

## 变更说明

### 1. 服务端架构变更

- **旧**: Node.js + Express (`src/server/`)
- **新**: Go + Hertz (`~/Projects/golang/src/ifix-service`)

### 2. 前端连接变更

- **API 基础 URL**: 现在通过 Vite 代理连接到 Go 服务端
- **WebSocket**: 每个会话创建独立的 WebSocket 连接
- **端口**: 
  - 前端: `http://localhost:3000`
  - Go 服务端: `http://localhost:4000`

### 3. 启动方式变更

**旧方式**:
```bash
npm run dev  # 同时启动 Node.js 服务端和前端
```

**新方式**:
```bash
# 终端 1: 启动 Go 服务端
cd ~/Projects/golang/src/ifix-service
go run cmd/server/main.go

# 终端 2: 启动前端
npm run dev
```

### 4. WebSocket 连接

每个会话现在都有独立的 WebSocket 连接：
- 打开会话时自动创建连接
- 切换会话时关闭旧连接，创建新连接
- 关闭会话时断开连接

### 5. 环境变量

可以通过环境变量配置 API URL：

```bash
# .env
VITE_API_URL=http://localhost:4000
VITE_WS_URL=ws://localhost:4000
```

如果不设置，将使用相对路径（通过 Vite 代理）。

## 已废弃的文件

- `src/server/` - Node.js 服务端代码（已标记为废弃）
- `package.json` 中的 `dev:server` 脚本已移除

## API 兼容性

所有 API 端点保持不变，前端代码无需修改 API 调用逻辑（除了使用新的 `api()` 辅助函数）。

