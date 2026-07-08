---
sidebar_position: 2
title: "Module Federation 原理"
difficulty: "hard"
tags: ["micro-frontend", "webpack", "module-federation", "rspack"]
---

# Module Federation 原理

Module Federation（模块联邦）是 Webpack 5 引入的革命性特性，它允许在运行时动态加载来自不同构建的模块，实现跨应用的模块共享。与 qiankun 等方案不同，它不依赖路由劫持，而是在模块层面实现联邦。

## 核心概念

```
Module Federation 核心概念
═══════════════════════════════════════════════════════

Host（宿主）   ──── 消费远程模块的应用
Remote（远程） ──── 提供远程模块的应用
Shared（共享） ──── 多个应用之间共享的依赖（如 React、Vue）
Expose（暴露） ──── Remote 暴露给 Host 使用的模块

┌─────────────────┐     ┌─────────────────┐
│    Host App      │     │   Remote App    │
│                 │     │                 │
│  消费远程模块 ───┼─────┼──▶ 暴露模块     │
│                 │     │                 │
│  共享依赖 ◀──────┼─────┼── 共享依赖      │
│  (React 等)     │     │  (React 等)     │
└─────────────────┘     └─────────────────┘
```

## 基础配置

### Remote 应用（提供模块）

```javascript
// remote-app/webpack.config.js
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  // ...其他配置
  plugins: [
    new ModuleFederationPlugin({
      name: 'remoteApp',              // 应用名称，全局唯一
      filename: 'remoteEntry.js',     // 入口文件名

      // 暴露的模块
      exposes: {
        './Button': './src/components/Button',
        './utils': './src/utils/index',
        './store': './src/store/index',
      },

      // 共享依赖
      shared: {
        react: {
          singleton: true,            // 只加载一个版本
          requiredVersion: '^18.0.0',
          eager: false,               // 延迟加载
        },
        'react-dom': {
          singleton: true,
          requiredVersion: '^18.0.0',
        },
      },
    }),
  ],
};
```

### Host 应用（消费模块）

```javascript
// host-app/webpack.config.js
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'hostApp',

      // 远程应用声明
      remotes: {
        remoteApp: 'remoteApp@//localhost:3001/remoteEntry.js',
      },

      // 共享依赖
      shared: {
        react: {
          singleton: true,
          requiredVersion: '^18.0.0',
        },
        'react-dom': {
          singleton: true,
          requiredVersion: '^18.0.0',
        },
      },
    }),
  ],
};
```

### 使用远程模块

```jsx
// host-app/src/App.jsx
import React, { Suspense, lazy } from 'react';

// 动态导入远程模块
const RemoteButton = lazy(() => import('remoteApp/Button'));
const RemoteUtils = import('remoteApp/utils'); // 非组件模块

function App() {
  return (
    <div>
      <h1>Host App</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <RemoteButton>Click Me</RemoteButton>
      </Suspense>
    </div>
  );
}
```

## 运行时原理

```
Module Federation 运行时加载流程
═══════════════════════════════════════════════════════

1. Host 应用启动
   │
2. 遇到 import('remoteApp/Button')
   │
3. Webpack 运行时查找 remoteApp 的配置
   │   └── 从 remoteEntry.js 获取远程应用的模块映射
   │
4. 加载 remoteEntry.js
   │   ├── 注册远程应用的容器
   │   └── 获取暴露的模块列表
   │
5. 检查 shared 依赖
   │   ├── Host 已加载 React 18.2.0
   │   ├── Remote 要求 React ^18.0.0
   │   ├── 版本匹配 → 复用 Host 的 React
   │   └── 版本不匹配 → 加载 Remote 自带的 React
   │
6. 加载目标模块
   │   ├── 从 Remote 的 chunk 中加载 Button 组件
   │   └── 使用共享的 React 运行
   │
7. 返回模块给 Host 应用
```

## 共享依赖机制

```javascript
// shared 配置详解
shared: {
  react: {
    // 必须为单例，避免多个 React 实例冲突
    singleton: true,

    // 版本要求（semver 范围）
    requiredVersion: '^18.0.0',

    // 是否在应用启动时就加载（false = 按需加载）
    eager: false,

    // 版本不匹配时的处理策略
    // 'version' - 检查版本号
    // 'singleton' - 强制使用单例
    // false - 不检查
    version: '18.2.0',
  },
},
```

```
共享依赖版本协商
═══════════════════════════════════════════════════════

场景 1：版本兼容（推荐）
  Host:   react@18.2.0
  Remote: react@18.1.0, requiredVersion: "^18.0.0"
  结果：   复用 Host 的 react@18.2.0 ✓

场景 2：版本不兼容
  Host:   react@18.2.0
  Remote: react@17.0.0, requiredVersion: "^17.0.0"
  结果：   Remote 使用自己的 react@17.0.0（可能导致多个 React 实例）

场景 3：单例模式
  Host:   react@18.2.0, singleton: true
  Remote: react@17.0.0, singleton: true
  结果：   强制使用 Host 的 react@18.2.0（可能报错）
```

## 双向联邦

```javascript
// 应用 A 既提供模块，也消费应用 B 的模块
// 应用 A 的配置
new ModuleFederationPlugin({
  name: 'appA',
  filename: 'remoteEntry.js',
  exposes: {
    './Header': './src/components/Header',
  },
  remotes: {
    appB: 'appB@//localhost:3002/remoteEntry.js',
  },
  shared: { react: { singleton: true }, 'react-dom': { singleton: true } },
});

// 应用 B 的配置
new ModuleFederationPlugin({
  name: 'appB',
  filename: 'remoteEntry.js',
  exposes: {
    './Footer': './src/components/Footer',
  },
  remotes: {
    appA: 'appA@//localhost:3001/remoteEntry.js',
  },
  shared: { react: { singleton: true }, 'react-dom': { singleton: true } },
});
```

## 动态远程加载

```javascript
// 不在 webpack.config.js 中静态声明 remotes
// 而是在运行时动态加载

// 方式 1：使用 dynamic-import-webpack-plugin
const loadComponent = (scope, module) => {
  return async () => {
    // 初始化共享作用域
    await __webpack_init_sharing__('default');
    const container = window[scope];
    await container.init(__webpack_share_scopes__.default);
    const factory = await container.get(module);
    return factory();
  };
};

// 动态加载远程应用
const useDynamicRemote = (url, scope, module) => {
  const [Component, setComponent] = useState(null);

  useEffect(() => {
    // 动态加载 remoteEntry.js
    const script = document.createElement('script');
    script.src = url;
    script.onload = () => {
      loadComponent(scope, module)().then(setComponent);
    };
    document.head.appendChild(script);
  }, [url, scope, module]);

  return Component;
};

// 使用
const RemoteHeader = useDynamicRemote(
  '//localhost:3001/remoteEntry.js',
  'appA',
  './Header'
);
```

## 与 qiankun 对比

| 维度 | Module Federation | qiankun |
|------|-------------------|---------|
| 隔离级别 | 模块级（无沙箱） | 应用级（完整沙箱） |
| 共享依赖 | 原生支持，版本协商 | 需自行处理 |
| 技术栈限制 | 需同为 Webpack/Rspack | 无限制 |
| 样式隔离 | 无（需自行处理） | Shadow DOM / Scoped CSS |
| JS 隔离 | 无（共享全局作用域） | Proxy 沙箱 |
| 部署独立性 | 高（只需部署 remoteEntry.js） | 中（需要 entry 地址） |
| 适用场景 | 同技术栈模块共享 | 跨技术栈应用集成 |

## Rspack / Module Federation 2.0

```javascript
// Rspack 原生支持 Module Federation
// rspack.config.js
const { ModuleFederationPlugin } = require('@rspack/core');

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'app',
      // 与 Webpack 5 配置一致
    }),
  ],
};

// Module Federation 2.0 新增能力
// 1. 动态远程类型提示
// 2. 联邦调试工具
// 3. 运行时插件系统
// 4. SSR 支持增强
```

## 面试要点

- **Module Federation 核心概念**：Host、Remote、Shared、Expose
- **共享依赖机制**：singleton、版本协商、eager 加载
- **运行时原理**：remoteEntry.js 加载、容器初始化、模块获取
- **与 qiankun 区别**：模块级共享 vs 应用级隔离
- **双向联邦**：应用既提供又消费远程模块
- **动态远程加载**：运行时加载 remoteEntry.js
- **版本冲突处理**：singleton 模式、版本协商策略
