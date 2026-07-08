---
sidebar_position: 1
title: 错误捕获与上报
slug: /monitoring/error-tracking
---

# 🐛 错误捕获与上报

> **"在线上丢一个 Bug，比在测试环境丢一个 Bug 严重 100 倍"** —— 错误监控是前端监控体系中最基础、最重要的一环。

## 错误类型全景

```
前端错误分类
═══════════════════════════════════════════════════════

🐛 前端错误
├── JS 运行时错误
│   ├── SyntaxError    —— 语法错误（构建阶段发现）
│   ├── TypeError      —— 类型错误（最常见）
│   ├── ReferenceError —— 引用未定义变量
│   └── RangeError     —— 值超出范围
│
├── 资源加载错误
│   ├── img / script / link 加载失败
│   └── 动态 import() 失败
│
├── Promise 异常
│   ├── 未捕获的 reject
│   └── async/await 中的错误
│
├── 接口请求错误
│   ├── HTTP 状态码非 2xx
│   ├── 网络超时
│   └── 跨域错误
│
└── 框架级错误
    ├── React ErrorBoundary 捕获
    ├── Vue errorHandler 捕获
    └── 小程序 App.onError
```

## 一、全局错误捕获方式

### 1.1 try-catch（基础但有限）

```javascript
// try-catch 只能捕获同步错误
try {
  JSON.parse('invalid json');
} catch (e) {
  console.error('解析错误:', e.message);
  reportError(e); // 上报
}
```

**局限性：**
- 无法捕获异步错误（setTimeout、Promise）
- 无法捕获资源加载错误
- 需要包裹每一段代码，侵入性强

### 1.2 window.onerror（全局 JS 错误）

```javascript
/**
 * window.onerror 捕获全局 JS 运行时错误
 * 注意：需要在最前面注册，避免被其他 handler 抢先
 */
window.onerror = (message, source, lineno, colno, error) => {
  console.log('错误信息:', message);
  console.log('错误文件:', source);
  console.log('行号:', lineno);
  console.log('列号:', colno);
  console.log('错误对象:', error);

  // 上报错误
  reportError({
    type: 'js-error',
    message,
    source,
    lineno,
    colno,
    stack: error?.stack,
  });

  // 返回 true 可阻止浏览器默认行为（如控制台报错）
  return true;
};
```

**关键点：**
- 只能捕获**同步**运行时错误
- 无法捕获 `try-catch` 已处理的错误
- `source` 是错误发生的脚本 URL
- 网络请求的跨域脚本错误只会显示 `Script error`，需要配置 CORS

### 1.3 window.addEventListener('error')（资源加载错误）

```javascript
/**
 * 捕获资源加载错误（img、script、link、video 等）
 * 注意：只能通过 addEventListener 方式捕获，onerror 不行
 */
window.addEventListener(
  'error',
  (event) => {
    // 判断是否为资源加载错误
    const target = event.target;
    if (target && (target.src || target.href)) {
      const url = target.src || target.href;
      console.error('资源加载失败:', url);

      reportError({
        type: 'resource-error',
        url,
        tagName: target.tagName,
        html: target.outerHTML,
      });
    }
  },
  true // 必须设置为 true（捕获阶段），否则冒泡阶段拿不到资源错误
);
```

### 1.4 unhandledrejection（Promise 异常）

```javascript
/**
 * 捕获未处理的 Promise rejection
 * 这是面试高频考点！很多候选人不知道这个 API
 */
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  console.error('未处理的 Promise 异常:', reason);

  reportError({
    type: 'promise-error',
    message: reason?.message || String(reason),
    stack: reason?.stack,
  });

  // 阻止浏览器默认行为（控制台报错）
  event.preventDefault();
});
```

### 1.5 React ErrorBoundary

```tsx
import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * React 错误边界组件
 * 注意：只能捕获子组件的渲染错误，不能捕获：
 * - 事件处理函数中的错误（用 try-catch）
 * - 异步代码
 * - 服务端渲染
 * - ErrorBoundary 自身的错误
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // 上报错误 + 组件堆栈
    reportError({
      type: 'react-error',
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>页面出错了，请刷新重试</div>;
    }
    return this.props.children;
  }
}

// 使用方式
function App() {
  return (
    <ErrorBoundary fallback={<div>出错了</div>}>
      <MyComponent />
    </ErrorBoundary>
  );
}
```

### 1.6 Vue errorHandler

```javascript
import Vue from 'vue';

// Vue 2 全局错误处理
Vue.config.errorHandler = (err, vm, info) => {
  console.error('Vue 错误:', err);
  console.error('错误信息:', info); // 如 "render function" / "watcher"

  reportError({
    type: 'vue-error',
    message: err.message,
    stack: err.stack,
    info,
    component: vm?.$options?.name || vm?.$options?._componentTag,
  });
};

// Vue 3 全局错误处理
app.config.errorHandler = (err, instance, info) => {
  reportError({
    type: 'vue-error',
    message: err.message,
    stack: err.stack,
    info,
    component: instance?.$?.type?.name,
  });
};
```

## 二、Sentry 接入实战

### 2.1 基础接入

```bash
# 安装
npm install @sentry/react @sentry/tracing
# 或
pnpm add @sentry/react @sentry/tracing
```

```typescript
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

Sentry.init({
  dsn: 'https://xxx@sentry.io/xxx',
  integrations: [
    new BrowserTracing(), // 自动追踪性能
  ],

  // 采样率：生产环境建议 0.1 ~ 0.5
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // 环境标识
  environment: process.env.NODE_ENV,

  // 发布版本（用于 Source Map 关联）
  release: 'my-app@1.0.0',

  // 面包屑：记录用户操作路径
  beforeBreadcrumb(breadcrumb) {
    // 过滤掉高频无用的 console 日志
    if (breadcrumb.category === 'console') return null;
    return breadcrumb;
  },

  // 数据过滤：脱敏、过滤已知错误
  beforeSend(event) {
    // 过滤浏览器扩展引起的错误
    if (event.exception?.values?.[0]?.stacktrace?.frames?.some(
      (f) => f.filename?.includes('extensions/')
    )) {
      return null;
    }
    return event;
  },
});
```

### 2.2 Source Map 上传

```javascript
// webpack 插件方式
const SentryWebpackPlugin = require('@sentry/webpack-plugin');

module.exports = {
  configureWebpack: {
    devtool: 'source-map', // 必须生成 source map
    plugins: [
      new SentryWebpackPlugin({
        org: 'your-org',
        project: 'your-project',
        authToken: process.env.SENTRY_AUTH_TOKEN,
        include: './dist',
        ignore: ['node_modules'],
        release: 'my-app@1.0.0', // 和 init 的 release 一致
      }),
    ],
  },
};
```

> **安全提示**：Source Map 不要部署到生产服务器！只上传到 Sentry 后，删除构建产物中的 `.map` 文件。

### 2.3 手动上报

```typescript
import * as Sentry from '@sentry/react';

// 捕获已处理的异常
try {
  riskyOperation();
} catch (error) {
  Sentry.captureException(error);
}

// 上报自定义消息
Sentry.captureMessage('用户完成了支付流程', 'info');

// 添加用户信息
Sentry.setUser({
  id: '123',
  email: 'user@example.com',
  username: 'testuser',
});

// 添加自定义标签
Sentry.setTag('page', 'checkout');
Sentry.setExtra('cartItems', cartData);
```

## 三、错误上报策略

```javascript
/**
 * 错误上报核心策略
 */

// 1. 防抖去重：同一错误短时间内不重复上报
const errorCache = new Set();

function shouldReport(error) {
  const key = `${error.message}-${error.source}-${error.lineno}`;
  if (errorCache.has(key)) return false;
  errorCache.add(key);
  // 5 秒后清除缓存
  setTimeout(() => errorCache.delete(key), 5000);
  return true;
}

// 2. 上报方式选择
function reportError(data) {
  if (!shouldReport(data)) return;

  // 方式一：sendBeacon（推荐，页面关闭时也能发送）
  const blob = new Blob([JSON.stringify(data)], {
    type: 'application/json',
  });
  navigator.sendBeacon('/api/error-report', blob);

  // 方式二：图片打点（兼容性最好）
  // const img = new Image();
  // img.src = `/api/error-report?data=${encodeURIComponent(JSON.stringify(data))}`;

  // 方式三：XHR（可获取响应，但页面关闭时可能丢失）
  // const xhr = new XMLHttpRequest();
  // xhr.open('POST', '/api/error-report');
  // xhr.setRequestHeader('Content-Type', 'application/json');
  // xhr.send(JSON.stringify(data));
}
```

## 四、跨域脚本错误处理

```html
<!-- 跨域脚本需要配置 CORS 才能获取详细错误信息 -->
<script
  src="https://cdn.example.com/lib.js"
  crossorigin="anonymous"
></script>
```

```javascript
// 服务端需要返回 CORS 响应头
// Access-Control-Allow-Origin: *

// 如果无法配置 CORS，可以使用 try-catch 包裹
// 或者在构建时内联第三方脚本
```

## 面试要点总结

### 高频面试题

| 问题 | 关键答案 |
|------|---------|
| 有哪些错误捕获方式？ | try-catch、window.onerror、error 事件、unhandledrejection、ErrorBoundary |
| 资源加载错误怎么捕获？ | `addEventListener('error', fn, true)` 第三个参数必须为 true |
| Promise 错误怎么捕获？ | `unhandledrejection` 事件 |
| Source Map 怎么处理？ | 上传到 Sentry，不部署到生产环境 |
| 跨域脚本错误怎么办？ | 配置 `crossorigin` 属性 + CORS 响应头 |
| Sentry beforeSend 有什么用？ | 数据脱敏、过滤无关错误、补充上下文 |

### 加分项

1. 知道 `window.onerror` 和 `addEventListener('error')` 的区别
2. 能说出错误去重和采样策略
3. 了解 `sendBeacon` 在页面关闭时的优势
4. 知道 React ErrorBoundary 的局限性（不能捕获事件处理器错误）
5. 能设计一个完整的错误监控 SDK 架构
