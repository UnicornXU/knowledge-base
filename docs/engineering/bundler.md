---
sidebar_position: 1
title: "构建工具"
difficulty: "medium"
tags: ["engineering", "bundler", "webpack", "vite"]
---

# 构建工具

## Webpack vs Vite

| 特性 | Webpack | Vite |
|------|---------|------|
| 开发服务器 | 先打包再启动 | 原生 ESM，按需编译 |
| 冷启动 | 慢（全量打包） | 快（按需加载） |
| HMR | 较慢 | 极快 |
| 生产构建 | 自带 | 使用 Rollup |
| 生态 | 成熟 | 快速成长 |

## Vite 原理

```javascript
// 开发阶段：利用浏览器原生 ESM
// 浏览器请求 /src/App.tsx → Vite 拦截 → 按需编译 → 返回

// index.html
<script type="module" src="/src/main.tsx"></script>

// 浏览器遇到 type="module" 会自动请求 /src/main.tsx
// Vite 拦截请求，编译后返回
// main.tsx 中的 import 又会触发新的请求
// 实现按需编译，无需打包
```

## Webpack 核心概念

```javascript
// webpack.config.js
module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
};
```

## Tree Shaking

```javascript
// Webpack 需要配置
// package.json
{
  "sideEffects": false // 标记无副作用
}

// 或指定有副作用的文件
{
  "sideEffects": ["*.css", "*.global.js"]
}

// 代码中使用 ESM 导出（不要用 default export）
export function add(a, b) { return a + b; }
export function subtract(a, b) { return a - b; }

// 只导入使用的函数
import { add } from './math';
// subtract 会被 tree shaking 移除
```

## 关键点

- Vite 开发体验优于 Webpack，新项目推荐使用 Vite
- Webpack 生态更成熟，复杂项目仍有优势
- Tree Shaking 要求使用 ESM 语法
- 代码分割可以减少首屏加载时间
- Content Hash 用于实现长效缓存
