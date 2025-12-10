# Gems 工具组件目录 (Toolbox Tools)

此目录包含 Gems 中的各种工具组件。

## 目录结构

```
toolbox/
├── TextConverter.tsx  # 文本转换工具组件
├── index.ts           # 模块导出文件
└── README.md          # 本说明文件
```

**注意**: `Toolbox.tsx` 主组件位于 `components/` 目录下，与 `toolbox/` 目录同级。

## 组件说明

### TextConverter.tsx
文本转换工具组件，提供：
- 大小写转换（全大写、全小写、首字母大写等）
- 格式转换（空格、下划线、驼峰等）
- 文本操作（复制、剪切、清空）

## 添加新工具

要添加新的工具组件：

1. 在 `toolbox/` 目录下创建新的工具组件文件（如 `CodeFormatter.tsx`）
2. 在 `components/Toolbox.tsx` 的 `tools` 数组中添加工具信息
3. 在 `Toolbox.tsx` 的 `handleToolClick` 函数中添加工具的路由逻辑
4. 在 `index.ts` 中导出新组件（可选）

## 使用示例

```tsx
// 在 Toolbox.tsx 中导入工具组件
import TextConverter from './toolbox/TextConverter';

// 在 App.tsx 中使用 Toolbox
import Toolbox from './components/Toolbox';
<Toolbox onClose={() => setShowToolbox(false)} />
```

