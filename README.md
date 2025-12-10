# IFixAI - AI Chat Application

一个功能丰富的 AI 聊天应用，支持多个 AI agent、多会话管理、图像处理、文件管理和 Excel 处理。

## 功能特性

- 🤖 多 AI Agent 支持：Gemini、Claude、Qwen Code、GPT-4
- 💬 多会话管理：同时开启多个聊天，互不干扰
- 💾 本地存储：所有对话保存在本地，不会丢失
- 🖼️ 智能图像处理：生成、编辑和识别（Gemini 2.5 Flash Image Preview）
- 📁 智能文件管理：批量重命名、自动整理、智能分类、文件合并
- 📊 Excel 智能处理：AI 帮你创建、整理、分析、美化 Excel 文件
- ⚙️ 灵活配置：支持为每个 agent 添加多个 API key

## 技术栈

- **前端**: React + TypeScript + Vite
- **后端**: Node.js + Express + TypeScript
- **数据库**: SQLite (better-sqlite3)
- **AI SDKs**: 
  - @google/generative-ai (Gemini)
  - @anthropic-ai/sdk (Claude)
  - openai (GPT-4, Qwen Code)

## 安装

```bash
npm install
```

## 开发

```bash
npm run dev
```

这将同时启动前端（端口 3000）和后端（端口 4000）。

## 构建

```bash
npm run build
```

## 运行生产版本

```bash
npm start
```

## 使用说明

### 1. 配置 API Keys

启动应用后，点击左下角的"设置和帮助"按钮，进入设置页面。

在设置页面中：
- 选择要配置的 AI Agent（Gemini、Claude 或 Qwen Code）
- 点击"添加新的 API 密钥"
- 输入密钥名称和 API 密钥
- 可以为一个 Agent 添加多个 API 密钥，通过开关控制启用/禁用

### 2. 创建新对话

- 点击左侧边栏的"发起新对话"按钮
- 选择要使用的 AI Agent
- 开始聊天

### 3. 多会话管理

- 所有对话都会显示在左侧边栏的"近期对话"列表中
- 点击对话项可以切换不同的对话
- 每个对话独立保存，互不干扰
- 可以删除不需要的对话

### 4. 图像处理

在聊天界面中：
- 点击输入框左侧的"+"按钮可以上传图片
- 支持图像识别、编辑等功能（使用 Gemini 2.5 Flash Image Preview）

### 5. 文件管理

通过 API 调用实现：
- 批量重命名文件
- 自动整理文件到不同文件夹
- 智能分类文件
- 合并多个文件

### 6. Excel 处理

通过 API 调用实现：
- AI 辅助创建 Excel 文件
- 分析 Excel 数据
- 美化 Excel 文件格式

## API 端点

### 对话相关
- `GET /api/conversations` - 获取所有对话
- `GET /api/conversations/:id` - 获取单个对话及消息
- `POST /api/conversations` - 创建新对话
- `PATCH /api/conversations/:id` - 更新对话标题
- `DELETE /api/conversations/:id` - 删除对话

### 聊天相关
- `POST /api/chat/:conversationId` - 发送消息
- `POST /api/chat/:conversationId/stream` - 流式发送消息

### 设置相关
- `GET /api/settings/api-keys` - 获取所有 API 密钥
- `GET /api/settings/api-keys/:agentType` - 获取特定 Agent 的 API 密钥
- `POST /api/settings/api-keys` - 添加 API 密钥
- `PATCH /api/settings/api-keys/:id` - 更新 API 密钥
- `DELETE /api/settings/api-keys/:id` - 删除 API 密钥

### 文件相关
- `POST /api/files/rename` - 批量重命名文件
- `POST /api/files/organize` - 自动整理文件
- `POST /api/files/merge` - 合并文件

### Excel 相关
- `POST /api/excel/create` - 创建 Excel 文件
- `POST /api/excel/analyze` - 分析 Excel 文件
- `POST /api/excel/beautify` - 美化 Excel 文件

### 图像相关
- `POST /api/image/generate` - 生成图像
- `POST /api/image/edit` - 编辑图像
- `POST /api/image/recognize` - 识别图像

## 项目结构

```
IFixAI/
├── src/
│   ├── client/          # 前端代码
│   │   ├── components/  # React 组件
│   │   │   ├── Sidebar.tsx      # 侧边栏组件
│   │   │   ├── ChatArea.tsx     # 聊天区域组件
│   │   │   └── Settings.tsx     # 设置页面组件
│   │   ├── types/       # TypeScript 类型
│   │   ├── App.tsx      # 主应用组件
│   │   └── main.tsx     # 入口文件
│   └── server/          # 后端代码
│       ├── routes/      # API 路由
│       │   ├── chat.ts           # 聊天路由
│       │   ├── conversations.ts # 对话路由
│       │   ├── settings.ts       # 设置路由
│       │   ├── files.ts          # 文件管理路由
│       │   ├── excel.ts          # Excel 处理路由
│       │   └── image.ts          # 图像处理路由
│       ├── services/    # 业务逻辑
│       │   └── ai-agents.ts     # AI Agent 服务
│       ├── models/      # 数据模型
│       │   └── database.ts      # 数据库模型
│       └── index.ts     # 服务器入口
├── data/                # 数据库文件（自动创建）
└── public/              # 静态资源
```

## 环境变量

可以创建 `.env` 文件配置：

```
PORT=4000
DB_PATH=./data/ifixai.db
```

## 注意事项

1. 首次运行会自动创建数据库文件
2. 所有对话数据保存在本地 SQLite 数据库中
3. API 密钥存储在数据库中，请妥善保管
4. 图像处理功能需要 Gemini API 支持
5. Qwen Code 的 API 端点可能需要根据实际提供商调整

## 许可证

MIT

