# Node.js Server (Deprecated)

⚠️ **注意**: 此 Node.js 服务端代码已被 Go 服务端替代。

新的服务端实现位于: `~/Projects/golang/src/ifix-service`

## 迁移说明

- 前端现在连接到 Go 服务端 (端口 4000)
- 所有 API 端点保持不变
- 聊天功能现在使用 WebSocket 连接

## 如何运行

### Go 服务端
```bash
cd ~/Projects/golang/src/ifix-service
go run cmd/server/main.go
```

### 前端
```bash
npm run dev
```

前端会通过 Vite 代理连接到 Go 服务端。

