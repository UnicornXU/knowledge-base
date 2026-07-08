---
sidebar_position: 3
title: "single-spa 原理"
difficulty: "medium"
tags: ["micro-frontend", "single-spa", "routing", "lifecycle"]
---

# single-spa 原理

single-spa 是最早的微前端框架之一，它的核心思想是通过路由劫持和生命周期管理，将多个前端应用组合到一个页面中。qiankun 就是基于 single-spa 构建的。

## 核心架构

```
single-spa 工作原理
═══════════════════════════════════════════════════════

用户访问页面
    │
    ▼
┌─────────────────────────────┐
│      single-spa 路由监听      │
│   (popstate / hashchange)    │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│      应用状态机管理           │
│                             │
│  NOT_LOADED → LOADING       │
│      │           │          │
│      ▼           ▼          │
│  LOADED    → BOOTSTRAPPING  │
│                  │          │
│                  ▼          │
│            NOT_MOUNTED      │
│                  │          │
│                  ▼          │
│              MOUNTED         │
│                  │          │
│                  ▼          │
│            UNMOUNTING        │
│                  │          │
│                  ▼          │
│            NOT_MOUNTED       │
└─────────────────────────────┘
    │
    ▼
┌─────────────────────────────┐
│      DOM 操作               │
│   挂载 / 卸载子应用 DOM      │
└─────────────────────────────┘
```

## 快速上手

### 注册应用

```javascript
// main-app/src/index.js
import {
  registerApplication,
  start,
} from 'single-spa';

// 方式 1：简单配置
registerApplication({
  name: 'react-app',
  app: () => import('./react-app/main.js'), // 加载函数
  activeWhen: '/react',                      // 激活规则
  customProps: { token: 'xxx' },             // 自定义 props
});

// 方式 2：多个应用
registerApplication({
  name: 'vue-app',
  app: () => import('./vue-app/main.js'),
  activeWhen: '/vue',
});

// 方式 3：复杂的激活规则
registerApplication({
  name: 'shared-app',
  app: () => import('./shared-app/main.js'),
  activeWhen: (location) => {
    return location.pathname.startsWith('/shared') ||
           location.pathname.startsWith('/common');
  },
});

// 启动 single-spa（必须在所有应用注册后调用）
start({
  urlRerouteOnly: true, // 只在 URL 变化时重新路由
});
```

### 子应用实现

```javascript
// react-app/src/main.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

let root = null;

// 子应用必须导出以下生命周期函数

// 应用首次加载时调用（只调用一次）
export async function bootstrap() {
  console.log('[React App] bootstrapped');
}

// 应用每次激活时调用
export async function mount(props) {
  console.log('[React App] mounted', props);
  const { domElement } = props;

  // 创建 React 根节点并渲染
  root = ReactDOM.createRoot(domElement || document.getElementById('root'));
  root.render(React.createElement(App));
}

// 应用每次失活时调用
export async function unmount(props) {
  console.log('[React App] unmounted');
  root?.unmount();
}

// 可选：应用卸载时调用（用于清理资源）
export async function unload(props) {
  console.log('[React App] unloaded');
}
```

### 生命周期状态

```
应用生命周期状态机
═══════════════════════════════════════════════════════

NOT_LOADED（未加载）
    │
    │ activeWhen 匹配
    ▼
LOADING（加载中）───── 加载应用代码
    │
    ▼
NOT_BOOTSTRAPPED（未启动）
    │
    │ 调用 bootstrap()
    ▼
BOOTSTRAPPING（启动中）
    │
    ▼
NOT_MOUNTED（未挂载）
    │
    │ 调用 mount()
    ▼
MOUNTED（已挂载）──── 应用运行中
    │
    │ 调用 unmount()
    ▼
UNMOUNTING（卸载中）
    │
    ▼
NOT_MOUNTED（未挂载）──── 等待再次激活
    │
    │ 可选：调用 unload()
    ▼
NOT_LOADED（未加载）──── 代码已卸载
```

## 路由劫持原理

```javascript
// single-spa 的路由劫持机制（简化版）

// 1. 监听浏览器路由事件
window.addEventListener('popstate', reroute);

// 2. 劫持 pushState / replaceState
const originalPushState = window.history.pushState;
const originalReplaceState = window.history.replaceState;

window.history.pushState = function (state, title, url) {
  originalPushState.apply(this, arguments);
  reroute(); // 触发重新路由
};

window.history.replaceState = function (state, title, url) {
  originalReplaceState.apply(this, arguments);
  reroute();
};

// 3. reroute 函数：检查所有应用的 activeWhen，决定挂载/卸载
function reroute() {
  const { toLoad, toMount, toUnmount } = getAppChanges();

  // 按顺序执行
  return Promise.resolve()
    .then(() => toUnmount.map(unmountApp))   // 卸载不再匹配的应用
    .then(() => toLoad.map(loadApp))          // 加载新匹配的应用
    .then(() => toMount.map(mountApp));       // 挂载已加载的应用
}

// 4. getAppChanges：根据当前 URL 计算需要操作的应用
function getAppChanges() {
  const toLoad = [];
  const toMount = [];
  const toUnmount = [];

  apps.forEach((app) => {
    const isActive = app.activeWhen(window.location);

    switch (app.status) {
      case 'NOT_LOADED':
        if (isActive) toLoad.push(app);
        break;
      case 'NOT_MOUNTED':
        if (isActive) toMount.push(app);
        break;
      case 'MOUNTED':
        if (!isActive) toUnmount.push(app);
        break;
    }
  });

  return { toLoad, toMount, toUnmount };
}
```

## 应用加载函数

```javascript
// 子应用可以是多种格式

// 1. 直接返回生命周期对象
registerApplication({
  name: 'app1',
  app: {
    bootstrap: async () => {},
    mount: async (props) => {},
    unmount: async () => {},
  },
  activeWhen: '/app1',
});

// 2. 返回 Promise（动态导入）
registerApplication({
  name: 'app2',
  app: () => import('./app2/main.js'),
  activeWhen: '/app2',
});

// 3. UMD 格式（需要手动提取生命周期）
registerApplication({
  name: 'app3',
  app: () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = '//cdn.example.com/app3.js';
      script.onload = () => {
        resolve(window.app3); // 从全局变量获取
      };
      document.head.appendChild(script);
    });
  },
  activeWhen: '/app3',
});

// 4. 加载 HTML 入口（需要额外处理）
registerApplication({
  name: 'app4',
  app: async () => {
    // 加载 HTML
    const html = await fetch('//localhost:4000/').then((r) => r.text());
    const container = document.createElement('div');
    container.innerHTML = html;

    // 提取并执行 script
    const scripts = container.querySelectorAll('script');
    for (const script of scripts) {
      await new Promise((resolve) => {
        const newScript = document.createElement('script');
        newScript.src = script.src;
        newScript.onload = resolve;
        document.head.appendChild(newScript);
      });
    }

    return window.app4;
  },
  activeWhen: '/app4',
});
```

## 自定义 Props 传递

```javascript
// 主应用传递数据给子应用
registerApplication({
  name: 'react-app',
  app: () => import('./react-app/main.js'),
  activeWhen: '/react',
  customProps: {
    authToken: 'xxx-yyy-zzz',
    domElement: document.getElementById('react-container'),
    basePath: '/react',
    // 传递事件总线
    eventBus: {
      emit: (event, data) => { /* ... */ },
      on: (event, handler) => { /* ... */ },
    },
  },
});

// 子应用接收 props
export async function mount(props) {
  console.log(props.authToken);    // 'xxx-yyy-zzz'
  console.log(props.domElement);   // 挂载容器
  console.log(props.basePath);     // '/react'

  // 使用事件总线通信
  props.eventBus.on('user-login', (user) => {
    console.log('用户登录:', user);
  });
}
```

## 与 qiankun 的关系

```
single-spa vs qiankun
═══════════════════════════════════════════════════════

single-spa（底层框架）
├── 路由劫持
├── 应用注册
├── 生命周期管理
└── 不提供：
    ├── JS 沙箱    ← 需要自行实现
    ├── CSS 隔离   ← 需要自行实现
    └── 预加载     ← 需要自行实现

qiankun（上层封装）
├── 基于 single-spa
├── + Proxy JS 沙箱
├── + CSS 隔离（Shadow DOM / Scoped）
├── + HTML Entry 加载
├── + 预加载策略
├── + 全局状态管理
└── = 开箱即用的微前端方案
```

## 面试要点

- **single-spa 核心机制**：路由劫持（popstate + pushState/replaceState 劫持）
- **应用状态机**：NOT_LOADED → LOADING → NOT_BOOTSTRAPPED → BOOTSTRAPPING → NOT_MOUNTED → MOUNTED → UNMOUNTING
- **生命周期函数**：bootstrap（首次）、mount（激活）、unmount（失活）、unload（卸载）
- **reroute 函数**：根据 URL 和应用状态决定 load/mount/unmount
- **与 qiankun 区别**：single-spa 不提供沙箱和 CSS 隔离，qiankun 是其上层封装
- **加载函数灵活性**：支持同步对象、动态导入、UMD、HTML Entry 等多种格式
- **customProps 传递**：通过注册时的 customProps 向子应用传递数据和能力
