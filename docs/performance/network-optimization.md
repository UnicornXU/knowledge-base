---
sidebar_position: 4
title: 网络性能优化
tags:
  - 性能优化
  - 网络
  - 缓存
  - CDN
---

# 🌐 网络性能优化

> **"网络是前端性能的天花板——再好的代码优化，也扛不住一个 3 秒的 TTFB"**

用户从点击链接到看到页面，中间经历了什么？让我们沿着数据包的旅程，逐站优化。

## 一、缓存策略——你的第一道防线

### 1.1 为什么缓存这么重要？

```
没有缓存的世界：
─────────────────────────────────────────────
用户 ──请求──→ 服务器 ──响应──→ 用户
      100ms          200ms
      每次都要走完整链路 😱

有缓存的世界：
─────────────────────────────────────────────
用户 ──检查缓存──→ 命中！直接使用 🚀
      0.1ms
      本地拿，快到飞起 ✈️
```

**一个真实的数字：** 缓存命中率从 60% 提升到 90% 后，某电商网站的服务器带宽成本下降了 40%，页面加载速度提升了 2 倍。

### 1.2 强缓存——不问服务器，直接用

```
强缓存判断流程
─────────────────────────────────────────────

浏览器发起请求
    ↓
检查 Cache-Control / Expires
    ↓
┌─ 未过期 → 直接使用缓存（200 from cache）🎉
│
└─ 已过期 → 进入协商缓存流程
```

**Cache-Control 常用指令：**

```nginx
# 最常见的缓存策略
Cache-Control: max-age=31536000    # 缓存 1 年（适合静态资源）
Cache-Control: no-cache            # 每次都要协商验证
Cache-Control: no-store            # 完全不缓存（敏感数据）
Cache-Control: public              # CDN 可以缓存
Cache-Control: private             # 只有浏览器可以缓存
Cache-Control: immutable           # 永远不会变（配合内容哈希）
```

**实战配置：**

```nginx
# Nginx 缓存配置
# HTML 文件：不缓存，每次都协商
location ~* \.html$ {
    add_header Cache-Control "no-cache";
}

# 带哈希的静态资源：缓存 1 年
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {
    add_header Cache-Control "public, max-age=31536000, immutable";
}

# API 接口：不缓存
location /api/ {
    add_header Cache-Control "no-store";
}
```

### 1.3 协商缓存——问问服务器变没变

```
协商缓存流程
─────────────────────────────────────────────

浏览器：我有这个资源，ETag 是 "abc123"，Last-Modified 是 1月1日
    ↓
服务器：我看看...
    ↓
┌─ 没变 → 304 Not Modified（不传内容，省带宽）✅
│
└─ 变了 → 200 OK（返回新内容）
```

**两种协商方式对比：**

| 方式 | 依据 | 精确度 | 性能 |
|------|------|--------|------|
| **Last-Modified** | 文件修改时间 | 秒级（1秒内修改检测不到） | 高 |
| **ETag** | 文件内容哈希 | 字节级（精确） | 略低（需计算哈希） |

```javascript
// Express 配置 ETag
const express = require('express');
const app = express();

// 启用 ETag（默认开启）
app.set('etag', 'strong'); // 强 ETag：内容完全一致

// 自定义缓存中间件
app.use('/static', (req, res, next) => {
  // 带哈希的文件名，缓存 1 年
  if (req.path.match(/\.[a-f0-9]{8}\./)) {
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
  } else {
    res.set('Cache-Control', 'public, max-age=3600');
  }
  next();
});
```

### 1.4 缓存策略最佳实践

```
缓存策略决策树
─────────────────────────────────────────────

文件内容会变吗？
├── 不会变（带内容哈希的文件名）
│   └── Cache-Control: public, max-age=31536000, immutable
│
├── 偶尔会变（HTML 入口文件）
│   └── Cache-Control: no-cache（每次协商）
│
└── 经常变（API 数据）
    └── Cache-Control: no-store（不缓存）
```

**前端配合：文件名加哈希**

```javascript
// webpack.config.js
module.exports = {
  output: {
    // 生产环境给文件名加内容哈希
    filename: '[name].[contenthash:8].js',
    chunkFilename: '[name].[contenthash:8].chunk.js',
  },
};

// 结果：
// main.a1b2c3d4.js  ← 内容变了，哈希就变，浏览器自动拉新
// main.a1b2c3d4.js  ← 内容没变，哈希不变，继续用缓存
```

---

## 二、HTTP/2 & HTTP/3——协议升级

### 2.1 HTTP/1.1 的痛点

```
HTTP/1.1 的队头阻塞问题
─────────────────────────────────────────────

请求 1: [============================] 300ms
请求 2:     [等待][================] 350ms
请求 3:          [等待][============] 400ms
                 ↑
            前一个请求没完成，后面的只能等

浏览器对策：开 6 个 TCP 连接
但每个连接内还是串行的 → 资源浪费 + 握手开销
```

### 2.2 HTTP/2 的革命性改进

```
HTTP/2 多路复用
─────────────────────────────────────────────

一个 TCP 连接，所有请求并行：

请求 1: [==][  ][==][  ][==]  ← 交错传输
请求 2: [  ][==][  ][==][  ]
请求 3: [==][==][==][  ][  ]

不再有队头阻塞！🎉
```

**HTTP/2 核心特性：**

| 特性 | 说明 | 收益 |
|------|------|------|
| **多路复用** | 一个连接并行多个请求 | 消除队头阻塞 |
| **头部压缩** | HPACK 压缩请求头 | 减少 30-50% 头部大小 |
| **服务端推送** | 服务器主动推送资源 | 减少往返次数 |
| **二进制分帧** | 数据以帧传输 | 解析更高效 |

```nginx
# Nginx 开启 HTTP/2
server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # HTTP/2 服务端推送
    location /index.html {
        http2_push /style.css;
        http2_push /app.js;
    }
}
```

### 2.3 HTTP/3——告别 TCP

```
HTTP/2 vs HTTP/3
─────────────────────────────────────────────

HTTP/2（基于 TCP）：
┌─────────────────────────────────────┐
│  TCP 队头阻塞仍在！                  │
│  一个包丢了 → 整个连接等待重传       │
│  握手：TCP 1RTT + TLS 1-2RTT = 3RTT │
└─────────────────────────────────────┘

HTTP/3（基于 QUIC/UDP）：
┌─────────────────────────────────────┐
│  流之间完全独立，互不影响            │
│  0-RTT 连接建立                      │
│  内置 TLS 1.3，更安全                │
└─────────────────────────────────────┘
```

```nginx
# Nginx 开启 HTTP/3（需要 1.25.0+）
server {
    listen 443 quic reuseport;
    listen 443 ssl;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # 告诉浏览器支持 HTTP/3
    add_header Alt-Svc 'h3=":443"; ma=86400';
}
```

---

## 三、CDN 加速——让内容离用户更近

### 3.1 CDN 的工作原理

```
没有 CDN：
─────────────────────────────────────────────
北京用户 ──2000km──→ 广州服务器 → 响应 200ms 😰

有 CDN：
─────────────────────────────────────────────
北京用户 ──10km──→ 北京节点 → 响应 20ms 🚀
                    ↓ 缓存未命中时
              广州服务器（回源）
```

### 3.2 CDN 缓存策略

```javascript
// CDN 配置最佳实践
const cdnConfig = {
  // 静态资源：长期缓存
  static: {
    'Cache-Control': 'public, max-age=31536000, immutable',
    // CDN 专属缓存头
    'CDN-Cache-Control': 'max-age=31536000',
    'Surrogate-Control': 'max-age=31536000',
  },

  // HTML：短缓存 + 协商
  html: {
    'Cache-Control': 'public, max-age=300, must-revalidate',
    'CDN-Cache-Control': 'max-age=60',
  },

  // API：不缓存或极短缓存
  api: {
    'Cache-Control': 'no-store',
    'CDN-Cache-Control': 'no-store',
  },
};
```

### 3.3 CDN 回源策略

```
CDN 回源优化
─────────────────────────────────────────────

问题：缓存过期时，所有请求同时回源（缓存击穿）

解决方案：

1. 缓存预热
   └── 部署时主动推送到 CDN 节点

2. 回源合并（Origin Shield）
   └── 多个节点合并成一个回源请求

3. 渐进过期
   └── 不同节点设置不同 TTL，错开过期时间

4. stale-while-revalidate
   └── 过期后先返回旧内容，后台异步更新
```

```nginx
# stale-while-revalidate 配置
Cache-Control: public, max-age=600, stale-while-revalidate=3600
# 600秒内：直接用缓存
# 600秒-4200秒：返回旧缓存，后台异步更新
```

---

## 四、DNS 优化

### 4.1 DNS 解析过程

```
DNS 解析流程（通常需要 20-120ms）
─────────────────────────────────────────────

浏览器缓存 → 系统缓存 → 路由器缓存 → ISP DNS → 递归查询
    ↓           ↓          ↓           ↓          ↓
   0ms        1ms         2ms        10ms      50-100ms
```

### 4.2 DNS 优化手段

```html
<!-- 1. DNS 预解析 -->
<link rel="dns-prefetch" href="//cdn.example.com" />
<link rel="dns-prefetch" href="//api.example.com" />
<link rel="dns-prefetch" href="//analytics.google.com" />

<!-- 2. DNS 预连接（DNS + TCP + TLS） -->
<link rel="preconnect" href="https://api.example.com" />
<link rel="preconnect" href="https://cdn.example.com" crossorigin />

<!-- 3. 实际使用时，减少域名数量 -->
<!-- ❌ 坏：4 个域名，4 次 DNS -->
<link href="//cdn1.example.com/a.js" />
<link href="//cdn2.example.com/b.js" />
<link href="//cdn3.example.com/c.js" />
<link href="//cdn4.example.com/d.js" />

<!-- ✅ 好：2 个域名，2 次 DNS -->
<link rel="preconnect" href="//cdn.example.com" />
<link href="//cdn.example.com/a.js" />
<link href="//cdn.example.com/b.js" />
```

---

## 五、请求优化

### 5.1 减少请求次数

```javascript
// 1. 合并 API 请求
// ❌ 3 次请求
const user = await fetch('/api/user/1');
const orders = await fetch('/api/orders?userId=1');
const products = await fetch('/api/products?userId=1');

// ✅ 1 次请求（BFF 层聚合）
const data = await fetch('/api/user-detail/1');
// 服务器端一次返回 user + orders + products

// 2. GraphQL 按需查询
const query = `
  query {
    user(id: 1) {
      name
      orders(limit: 5) {
        id
        total
      }
    }
  }
`;

// 3. 图片 Sprites（图标合并）
// 把多个小图标合并成一张大图
.icon-home {
  background: url('sprites.png') 0 0;
  width: 24px;
  height: 24px;
}
```

### 5.2 减少请求体积

```javascript
// 1. 请求头压缩
// HTTP/2 自动压缩头部，但我们可以减少 Cookie 大小
// ❌ 坏：Cookie 挂载了太多东西
// Cookie: token=xxx; user_prefs=xxx; tracking=xxx; ...（4KB）

// ✅ 好：只在需要的路径携带 Cookie
// API 请求带 Cookie，静态资源请求不带

// 2. 条件请求
const response = await fetch('/api/data', {
  headers: {
    'If-None-Match': localStorage.getItem('etag'),
  },
});

if (response.status === 304) {
  // 内容没变，用本地缓存
  return localStorage.getItem('cached-data');
}

const data = await response.json();
localStorage.setItem('etag', response.headers.get('ETag'));
localStorage.setItem('cached-data', JSON.stringify(data));

// 3. 分页 / 流式加载
// ❌ 一次加载全部
const allProducts = await fetch('/api/products');

// ✅ 分页加载
const page1 = await fetch('/api/products?page=1&limit=20');
```

### 5.3 请求优先级

```html
<!-- 关键资源：尽早加载 -->
<link rel="preload" href="/critical.css" as="style" />
<link rel="preload" href="/main.js" as="script" />
<link rel="preload" href="/hero.webp" as="image" />

<!-- 字体：必须预加载 -->
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin />

<!-- 非关键资源：延后加载 -->
<link rel="prefetch" href="/analytics.js" />
<link rel="prefetch" href="/about.js" />
```

```javascript
// Fetch Priority API（现代浏览器）
// 高优先级
fetch('/api/critical-data', { priority: 'high' });

// 低优先级
fetch('/api/analytics', { priority: 'low' });

// 图片优先级
<img src="hero.webp" fetchpriority="high" />
<img src="below-fold.webp" fetchpriority="low" loading="lazy" />
```

---

## 六、Service Worker 离线缓存

### 6.1 缓存策略

```javascript
// service-worker.js

// 策略 1：缓存优先（适合静态资源）
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  const cache = await caches.open('static-v1');
  cache.put(request, response.clone());
  return response;
}

// 策略 2：网络优先（适合 API）
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open('api-v1');
    cache.put(request, response.clone());
    return response;
  } catch (e) {
    return caches.match(request);
  }
}

// 策略 3：stale-while-revalidate（适合频繁更新的资源）
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);

  const fetchPromise = fetch(request).then(response => {
    const cache = caches.open('dynamic-v1');
    cache.then(c => c.put(request, response.clone()));
    return response;
  });

  return cached || fetchPromise;
}

// 拦截请求
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(event.request));
  } else if (url.pathname.match(/\.(js|css|woff2)$/)) {
    event.respondWith(cacheFirst(event.request));
  } else {
    event.respondWith(staleWhileRevalidate(event.request));
  }
});
```

### 6.2 Workbox——Service Worker 工具库

```javascript
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute } from 'workbox-precaching';

// 预缓存构建产物
precacheAndRoute(self.__WB_MANIFEST);

// 静态资源：缓存优先
registerRoute(
  ({ request }) => request.destination === 'script' || request.destination === 'style',
  new CacheFirst({
    cacheName: 'static-v1',
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  })
);

// API：网络优先
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-v1',
    networkTimeoutSeconds: 3,
    plugins: [
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 5 * 60 }),
    ],
  })
);

// 图片：stale-while-revalidate
registerRoute(
  ({ request }) => request.destination === 'image',
  new StaleWhileRevalidate({
    cacheName: 'images-v1',
    plugins: [
      new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 }),
    ],
  })
);
```

---

## 七、实战案例

### 案例：某 SaaS 产品网络优化

**优化前：**
- TTFB：800ms
- 完全加载：4.5 秒
- API 请求：15 次

**优化措施：**

```
1. 缓存策略优化
   ├── HTML：no-cache（协商缓存）
   ├── 静态资源：max-age=1年 + 内容哈希
   └── API：no-store + BFF 聚合

2. HTTP/2 升级
   ├── 开启多路复用
   ├── 启用头部压缩
   └── 配置服务端推送

3. CDN 部署
   ├── 静态资源上 CDN
   ├── API 走边缘节点加速
   └── 配置 stale-while-revalidate

4. DNS 优化
   ├── 预解析关键域名
   └── 减少域名数量（4→2）
```

**优化后：**
- TTFB：120ms ⬇️ 85%
- 完全加载：1.8 秒 ⬇️ 60%
- API 请求：5 次 ⬇️ 67%

---

## 🎯 高频面试题

### 1. 强缓存和协商缓存的区别？

**答：**

```
强缓存（不问服务器）
├── 头部：Cache-Control / Expires
├── 状态码：200 (from cache)
├── 特点：完全不发请求，最快
└── 适用：带哈希的静态资源

协商缓存（问问服务器）
├── 头部：ETag / Last-Modified
├── 状态码：304 Not Modified
├── 特点：发请求但不传内容
└── 适用：HTML、频繁更新的资源
```

### 2. HTTP/2 相比 HTTP/1.1 有什么优势？

**答：**

| 特性 | HTTP/1.1 | HTTP/2 |
|------|----------|--------|
| 连接方式 | 6个TCP连接 | 1个连接多路复用 |
| 头部 | 文本，无压缩 | 二进制，HPACK压缩 |
| 队头阻塞 | 存在 | 应用层解决 |
| 服务端推送 | 不支持 | 支持 |
| 优先级 | 不支持 | 支持流优先级 |

### 3. 如何设计一个合理的缓存策略？

**答：**

```
按资源类型选择缓存策略：

1. HTML 入口文件
   → Cache-Control: no-cache
   → 原因：需要获取最新版本，但可以利用协商缓存省带宽

2. 带哈希的 JS/CSS
   → Cache-Control: public, max-age=31536000, immutable
   → 原因：内容变了哈希就变，可以永久缓存

3. 图片/字体
   → Cache-Control: public, max-age=86400
   → 或者带哈希则长期缓存

4. API 数据
   → Cache-Control: no-store
   → 或者 short max-age + stale-while-revalidate
```

---

## 📚 推荐资源

- [Web.dev 缓存指南](https://web.dev/http-cache/)
- [HTTP/2 官方网站](https://http2.github.io/)
- [HTTP/3 详解](https://http3-explained.haxx.se/)
- [CDN 选型指南](https://www.cdnperf.com/)
- [Service Worker 文档](https://developer.mozilla.org/zh-CN/docs/Web/API/Service_Worker_API)
