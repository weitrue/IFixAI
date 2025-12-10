# 静态资源目录

此目录用于存储项目的静态资源文件。

## 目录结构

```
assets/
├── icons/          # SVG图标文件
│   └── favicon.svg # 网站图标
├── images/         # 图片资源（PNG, JPG, WebP等）
└── fonts/          # 字体文件（如果需要自定义字体）
```

## 使用说明

### Icons (图标)
- 存放所有SVG格式的图标文件
- 包括favicon、应用图标等
- 推荐使用SVG格式以获得最佳缩放效果

### Images (图片)
- 存放PNG、JPG、WebP等格式的图片
- 包括背景图、插图、用户头像等
- 建议使用WebP格式以获得更好的压缩比

### Fonts (字体)
- 存放自定义字体文件
- 包括.woff、.woff2、.ttf等格式
- 如需使用，请在CSS中通过@font-face引入

## 引用方式

在代码中引用这些资源时，使用绝对路径：

```tsx
// React组件中
<img src="/assets/images/logo.png" alt="Logo" />

// CSS中
background-image: url('/assets/images/background.jpg');

// HTML中
<link rel="icon" href="/assets/icons/favicon.svg" />
```

Vite会自动处理这些静态资源的路径。

