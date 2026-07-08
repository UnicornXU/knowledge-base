---
sidebar_position: 1
title: "qiankun 原理与实践"
difficulty: "hard"
tags: ["micro-frontend", "qiankun", "sandbox", "css-isolation"]
---

# qiankun 原理与实践

qiankun 是蚂蚁金服开源的微前端框架，基于 single-spa 封装，提供了开箱即用的 JS 沙箱、CSS 隔离、预加载等能力，是目前国内企业级微前端落地最广泛的方案。

## 整体架构

```
qiankun 架构
═══════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────┐
│                    主应用 (Base App)                   │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐        │
│  │  路由系统  │  │  注册表    │  │  全局状态  │        │
│  └───────────┘  └───────────┘  └───────────┘        │
│         │              │              │               │
│  ┌──────────────────────────────────────────────┐    │
│  │              qiankun 核心                     │    │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐│    │
│  │  │应用加载│ │JS 沙箱 │ │CSS 隔离│ │ 通信层 ││    │
│  │  └────────┘ └────────┘ └────────┘ └────────┘│    │
│  └──────────────────────────────────────────────┘    │
│         │              │              │               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ 子应用 A │  │ 子应用 B │  │ 子应用 C │           │
│  │ (React)  │  │  (Vue)   │  │ (Angular)│           │
│  └──────────┘  └──────────┘  └──────────┘           │
└─────────────────────────────────────────────────────┘
```

## 快速上手

### 主应用配置

```javascript
// main-app/src/index.js
import { registerMicroApps, start, setDefaultMountApp } from 'qiankun';

// 注册子应用
registerMicroApps([
  {
    name: 'react-app',
    entry: '//localhost:7100',    // 子应用入口
    container: '#subapp-container', // 挂载容器
    activeRule: '/react',          // 激活规则
    props: { token: 'xxx' },       // 传递给子应用的 props
  },
  {
    name: 'vue-app',
    entry: '//localhost:7200',
    container: '#subapp-container',
    activeRule: '/vue',
  },
]);

// 设置默认子应用
setDefaultMountApp('/react');

// 启动 qiankun
start({
  prefetch: 'all',      // 预加载策略：true / 'all' / 空闲预加载
  sandbox: {
    strictStyleIsolation: false,  // 严格样式隔离（Shadow DOM）
    experimentalStyleIsolation: true, // 实验性样式隔离
  },
  singular: true,        // 单实例模式
});
```

### 子应用配置（React）

```javascript
// react-app/src/index.js
import ReactDOM from 'react-dom/client';

let root = null;

// 独立运行时
if (!window.__POWERED_BY_QIANKUN__) {
  root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<App />);
}

// 导出生命周期钩子
export async function bootstrap() {
  console.log('[React App] bootstrap');
}

export async function mount(props) {
  console.log('[React App] mount, props:', props);
  const { container } = props;
  const dom = container
    ? container.querySelector('#root')
    : document.getElementById('root');
  root = ReactDOM.createRoot(dom);
  root.render(<App />);
}

export async function unmount(props) {
  console.log('[React App] unmount');
  const { container } = props;
  const dom = container
    ? container.querySelector('#root')
    : document.getElementById('root');
  root.unmount(dom);
}
```

### 子应用 webpack 配置

```javascript
// react-app/config/webpack.config.js
const { name } = require('./package.json');

module.exports = {
  output: {
    library: `${name}-[name]`,
    libraryTarget: 'umd',
    chunkLoadingGlobal: `webpackJsonp_${name}`,
    publicPath: '//localhost:7100/',
  },
  devServer: {
    port: 7100,
    headers: {
      // 关键：允许跨域访问
      'Access-Control-Allow-Origin': '*',
    },
  },
};
```

## JS 沙箱机制

### 快照沙箱（Snapshot Sandbox）

适用于不支持 Proxy 的浏览器（IE），单实例场景。

```javascript
// 快照沙箱原理（简化版）
class SnapshotSandbox {
  constructor() {
    this.snapshot = {};   // 快照：记录激活前的状态
    this.modify = {};     // 修改记录：记录沙箱期间的修改
  }

  // 激活沙箱
  active() {
    // 1. 记录当前 window 的快照
    for (const key in window) {
      this.snapshot[key] = window[key];
    }

    // 2. 恢复上一次沙箱的修改
    Object.keys(this.modify).forEach((key) => {
      window[key] = this.modify[key];
    });
  }

  // 失活沙箱
  inactive() {
    // 1. 记录沙箱期间对 window 的修改
    for (const key in window) {
      if (window[key] !== this.snapshot[key]) {
        this.modify[key] = window[key];
        // 2. 恢复到快照状态
        window[key] = this.snapshot[key];
      }
    }
  }
}
```

### 代理沙箱（Proxy Sandbox）

qiankun 的默认沙箱方案，支持多实例并行。

```javascript
// 代理沙箱原理（简化版）
class ProxySandbox {
  constructor() {
    const rawWindow = window;
    const fakeWindow = {};  // 虚拟 window 对象

    const proxy = new Proxy(fakeWindow, {
      get(target, key) {
        // 优先从 fakeWindow 读取，没有则从 rawWindow 读取
        return key in target ? target[key] : rawWindow[key];
      },
      set(target, key, value) {
        // 只写入 fakeWindow，不影响真实 window
        target[key] = value;
        return true;
      },
      has(target, key) {
        return key in target || key in rawWindow;
      },
    });

    this.proxy = proxy;
  }
}

// 使用
const sandbox1 = new ProxySandbox();
const sandbox2 = new ProxySandbox();

// 在各自的沙箱中执行代码
// sandbox1.proxy 和 sandbox2.proxy 互不影响
```

### LegacySandbox（支持单实例的 Proxy 沙箱）

```javascript
// LegacySandbox 会在失活时将修改同步到真实 window
// 适用于子应用需要修改全局变量且同一时间只有一个子应用激活的场景
class LegacySandbox {
  constructor() {
    const rawWindow = window;
    const addedProps = new Map();  // 新增的属性
    const modifiedProps = new Map(); // 修改的属性

    const proxy = new Proxy(rawWindow, {
      set(target, key, value) {
        if (!target[key]) {
          addedProps.set(key, value);  // 记录新增
        } else if (!modifiedProps.has(key)) {
          modifiedProps.set(key, target[key]); // 记录原始值
        }
        target[key] = value;
      },
    });

    this.proxy = proxy;

    // 恢复：删除新增属性，恢复修改的属性
    this.active = () => { /* 恢复修改 */ };
    this.inactive = () => {
      addedProps.forEach((_, key) => delete rawWindow[key]);
      modifiedProps.forEach((value, key) => (rawWindow[key] = value));
    };
  }
}
```

## CSS 隔离方案

### Shadow DOM 隔离

```javascript
// qiankun 的 strictStyleIsolation 使用 Shadow DOM
// 子应用被包裹在 Shadow DOM 中，样式完全隔离

// 原理示意
start({
  sandbox: {
    strictStyleIsolation: true,  // 开启 Shadow DOM 隔离
  },
});

// 渲染后的 DOM 结构
// <div id="subapp-container">
//   └── #shadow-root        ← Shadow DOM 边界
//       └── <div id="root">  ← 子应用 DOM
//           └── ...
// </div>
```

### Scoped CSS 隔离

```javascript
// qiankun 的 experimentalStyleIsolation
// 给子应用的选择器添加属性选择器，缩小作用域

// 原始样式
// .container { color: red; }

// 隔离后
// div[data-name="react-app"] .container { color: red; }

start({
  sandbox: {
    strictStyleIsolation: false,
    experimentalStyleIsolation: true,  // 推荐方案
  },
});
```

### 样式冲突常见场景

```javascript
// 场景 1：全局样式污染
// 子应用 A 设置了 body { background: red; }
// 影响了子应用 B

// 解决：子应用使用更具体的选择器
// .app-a-container .component { ... }

// 场景 2：CSS 变量冲突
// 子应用 A 定义了 :root { --primary-color: blue; }
// 子应用 B 也定义了 :root { --primary-color: green; }

// 解决：使用组件级 CSS 变量，避免 :root

// 场景 3：第三方组件库样式冲突
// 两个子应用都引入了 antd，样式可能冲突

// 解决：使用 CSS Modules 或配置不同的 class 前缀
```

## 应用加载流程

```
qiankun 子应用加载流程
═══════════════════════════════════════════════════════

1. 路由变化触发 activeRule 匹配
   │
2. 加载子应用资源（HTML / JS / CSS）
   │   ├── 通过 fetch 获取子应用 HTML
   │   ├── 解析 HTML 中的 script / link 标签
   │   └── 动态创建 script / link 元素并插入主应用
   │
3. 创建 JS 沙箱
   │   ├── 创建 Proxy 代理对象
   │   └── 在沙箱中执行子应用代码
   │
4. 处理 CSS 隔离
   │   ├── Shadow DOM（严格模式）
   │   └── Scoped CSS（实验性模式）
   │
5. 调用子应用生命周期
   │   ├── bootstrap()  —— 首次加载时调用
   │   ├── mount()      —— 每次激活时调用
   │   └── unmount()    —— 每次失活时调用
   │
6. 路由变化，子应用失活
   │   ├── 调用 unmount()
   │   ├── 清理子应用 DOM
   │   └── 沙箱失活，恢复全局状态
```

## 预加载策略

```javascript
start({
  // 预加载策略
  prefetch: true,    // 第一个子应用挂载后预加载其他子应用
  // prefetch: 'all', // 主应用 start 后立即预加载所有子应用
  // prefetch: false, // 不预加载

  // 自定义预加载
  prefetch: (apps) => {
    // 返回需要预加载的子应用
    return apps.filter((app) => app.name === 'react-app');
  },
});

// 空闲预加载原理（requestIdleCallback）
function prefetchAfterFirstMounted(apps) {
  window.addEventListener('single-spa:first-mount', function listener() {
    if (!navigator.connection?.saveData) {
      // 空闲时预加载
      requestIdleCallback(() => {
        apps.forEach((app) => prefetch(app));
      });
    }
    window.removeEventListener('single-spa:first-mount', listener);
  });
}
```

## 实战技巧

### 子应用独立运行

```javascript
// 子应用可以脱离主应用独立运行
// 通过判断 window.__POWERED_BY_QIANKUN__ 区分运行环境

// src/index.js
if (!window.__POWERED_BY_QIANKUN__) {
  render();
}

export async function mount(props) {
  render(props);
}

// 或者使用 qiankun 提供的工具函数
import { setDefaultMountApp } from 'qiankun';

// 单独访问子应用时的默认路由
setDefaultMountApp('/react');
```

### 全局状态管理

```javascript
// 主应用：初始化全局状态
import { initGlobalState } from 'qiankun';

const actions = initGlobalState({
  user: null,
  token: '',
  theme: 'light',
});

// 监听变化
actions.onGlobalStateChange((state, prev) => {
  console.log('主应用监听:', state, prev);
});

// 修改状态
actions.setGlobalState({ user: { name: '张三' } });

// 子应用：通过 props 获取 actions
export async function mount(props) {
  props.onGlobalStateChange((state, prev) => {
    console.log('子应用监听:', state, prev);
  });

  // 修改全局状态
  props.setGlobalState({ token: 'new-token' });
}
```

## 常见问题与解决方案

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 子应用样式丢失 | 动态加载 CSS 时序问题 | 确保 CSS 文件可被正确访问 |
| 子应用白屏 | JS 加载失败或生命周期未导出 | 检查 webpack 配置和生命周期导出 |
| 全局变量污染 | 沙箱未正确隔离 | 使用 Proxy 沙箱，避免直接操作 window |
| 路由冲突 | 子应用路由前缀重复 | 配置 activeRule 和子应用 base 路由 |
| 多实例问题 | 同一子应用多次挂载 | 使用 singular: false + 不同 container |

## 面试要点

- **qiankun 的核心原理**：基于 single-spa + JS 沙箱 + CSS 隔离
- **Proxy 沙箱实现**：fakeWindow 代理，set/get 操作隔离
- **快照沙箱 vs 代理沙箱**：快照只支持单实例，代理支持多实例并行
- **CSS 隔离策略**：Shadow DOM（严格）vs Scoped CSS（实验性）
- **预加载机制**：第一个子应用挂载后，利用 requestIdleCallback 预加载其他子应用
- **子应用生命周期**：bootstrap → mount → unmount
- **umd 格式要求**：子应用必须导出生命周期钩子，使用 umd 格式打包
