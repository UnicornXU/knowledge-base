---
sidebar_position: 3
title: "HTTP 缓存策略"
difficulty: "medium"
tags: ["network", "cache", "performance"]
---

# HTTP 缓存策略

HTTP 缓存是前端性能优化的核心手段之一，合理利用缓存可以显著减少网络请求，提升页面加载速度。

## 强缓存与协商缓存

HTTP 缓存分为两大类：

| 特性 | 强缓存 | 协商缓存 |
|------|--------|---------|
| 是否发请求 | 不发请求（命中时） | 发请求验证资源是否更新 |
| 状态码 | 200（from disk/memory cache） | 304 Not Modified |
| 相关头部 | `Cache-Control`、`Expires` | `ETag`、`Last-Modified` |
| 优先级 | 优先于协商缓存 | 强缓存未命中时生效 |

## 强缓存

### Cache-Control 指令

`Cache-Control` 是 HTTP/1.1 引入的缓存控制头部，是最常用的强缓存手段。

```http
# 常用指令
Cache-Control: max-age=3600          # 资源有效期 3600 秒
Cache-Control: no-cache              # 不直接使用缓存，每次向服务器验证
Cache-Control: no-store              # 完全不缓存
Cache-Control: private               # 仅浏览器可缓存，CDN 等中间代理不缓存
Cache-Control: public                # 浏览器和代理服务器都可缓存
Cache-Control: s-maxage=3600         # 覆盖 max-age，仅对 CDN 等共享缓存生效
Cache-Control: immutable             # 资源永远不变，浏览器不会发验证请求
Cache-Control: max-age=31536000, immutable  # 长期缓存 + 不变资源
```

| 指令 | 含义 | 前端使用场景 |
|------|------|-------------|
| `max-age=N` | 缓存 N 秒后过期 | 静态资源（JS/CSS/图片） |
| `no-cache` | 每次向服务器验证 | HTML 入口文件 |
| `no-store` | 完全不缓存 | 敏感数据（账户信息、支付） |
| `private` | 仅浏览器缓存 | 用户个人数据 |
| `public` | 浏览器和代理都可缓存 | 公共静态资源 |
| `s-maxage=N` | 代理缓存有效期 | CDN 资源 |
| `immutable` | 资源内容不变 | 带 hash 的构建产物 |

### Expires 头部（已过时）

```http
Expires: Wed, 21 Oct 2025 07:28:00 GMT
```

`Expires` 是 HTTP/1.0 的缓存控制方式，使用绝对时间。问题在于客户端和服务器时间不同步会导致缓存失效。**`Cache-Control: max-age` 优先级高于 `Expires`。**

## 协商缓存

当强缓存未命中（或设置了 `no-cache`）时，浏览器携带缓存标识向服务器验证资源是否更新。

### ETag + If-None-Match

```http
# 首次请求 - 服务器返回 ETag
HTTP/1.1 200 OK
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
Content-Length: 4200

# 后续请求 - 浏览器携带 ETag 验证
GET /style.css HTTP/1.1
If-None-Match: "33a64df551425fcc55e4d42a148795d9f25f89d4"

# 服务器验证 - 资源未变化
HTTP/1.1 304 Not Modified
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
```

### Last-Modified + If-Modified-Since

```http
# 首次请求 - 服务器返回修改时间
HTTP/1.1 200 OK
Last-Modified: Wed, 21 Oct 2025 07:28:00 GMT
Content-Length: 4200

# 后续请求 - 浏览器携带修改时间验证
GET /style.css HTTP/1.1
If-Modified-Since: Wed, 21 Oct 2025 07:28:00 GMT

# 服务器验证 - 资源未变化
HTTP/1.1 304 Not Modified
```

**ETag vs Last-Modified：**

| 对比项 | ETag | Last-Modified |
|--------|------|---------------|
| 精确度 | 精确到内容（哈希值） | 精确到秒 |
| 性能 | 需要计算哈希 | 读取文件修改时间即可 |
| 优先级 | 更高 | 更低 |
| 适用场景 | 频繁变动的内容 | 不常变动的资源 |

## 缓存决策流程图

```
                    ┌─────────────────┐
                    │   发起 HTTP 请求  │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │  是否有缓存？     │
                    └───┬─────────┬───┘
                   No   │         │ Yes
                        │         │
              ┌─────────▼──┐  ┌──▼──────────────────┐
              │  发起网络请求 │  │  Cache-Control:      │
              └────────────┘  │  no-store?            │
                              └──┬──────────────┬────┘
                            Yes  │              │ No
                                 │              │
                       ┌─────────▼──┐  ┌───────▼──────────┐
                       │  发起网络请求 │  │  max-age /        │
                       └────────────┘  │  Expires 未过期？   │
                                       └──┬───────────┬───┘
                                     Yes  │           │ No
                                          │           │
                                  ┌───────▼───┐  ┌───▼────────────────┐
                                  │ 直接使用缓存 │  │  发送条件请求        │
                                  │  (200 缓存) │  │  If-None-Match /   │
                                  └───────────┘  │  If-Modified-Since  │
                                                 └──┬──────────────┬──┘
                                               304  │              │ 200
                                                    │              │
                                          ┌─────────▼───┐  ┌──────▼─────┐
                                          │ 使用缓存      │  │ 使用新响应   │
                                          └─────────────┘  │ 更新缓存    │
                                                           └────────────┘
```

## 前端资源缓存策略实践

```nginx
# Nginx 配置示例

# HTML 入口文件 - 不缓存，每次向服务器验证
location ~* \.html$ {
    add_header Cache-Control "no-cache";
}

# 带 hash 的 JS/CSS - 长期强缓存
location ~* \.(js|css)$ {
    add_header Cache-Control "max-age=31536000, immutable";
}

# 图片资源 - 中期缓存
location ~* \.(png|jpg|jpeg|gif|webp|avif|svg)$ {
    add_header Cache-Control "max-age=2592000";  # 30 天
}

# 字体文件 - 长期缓存
location ~* \.(woff|woff2|ttf|eot)$ {
    add_header Cache-Control "max-age=31536000, immutable";
}
```

```javascript
// 构建工具中生成带 hash 的文件名
// Webpack
output: {
  filename: '[name].[contenthash:8].js',   // main.a1b2c3d4.js
  chunkFilename: '[name].[contenthash:8].js',
}

// Vite（默认开启）
build: {
  rollupOptions: {
    output: {
      entryFileNames: 'assets/[name]-[hash].js',
      chunkFileNames: 'assets/[name]-[hash].js',
      assetFileNames: 'assets/[name]-[hash].[ext]',
    },
  },
}
```

**缓存策略总结：**

| 资源类型 | 缓存策略 | 原因 |
|---------|---------|------|
| HTML | `no-cache` | 入口文件需要获取最新的资源引用列表 |
| JS/CSS（带 hash） | `max-age=31536000, immutable` | 文件名变化即内容变化，可永久缓存 |
| 图片 | `max-age=2592000` | 图片更新频率低，30 天缓存 |
| API 响应 | `no-store` 或短 `max-age` | 数据实时性要求高 |
| 字体文件 | `max-age=31536000, immutable` | 字体几乎不变 |

## Service Worker 缓存

Service Worker 可以拦截网络请求，实现更灵活的缓存策略。

### Cache API

```javascript
// 注册 Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

// sw.js - Service Worker 文件
const CACHE_NAME = 'v1';
const ASSETS = ['/index.html', '/style.css', '/app.js'];

// 安装阶段 - 预缓存静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// 激活阶段 - 清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
});
```

### 缓存策略

```javascript
// 策略 1: Cache First（缓存优先）
// 适用：静态资源（JS、CSS、图片）
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});

// 策略 2: Network First（网络优先）
// 适用：API 请求、需要实时数据
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// 策略 3: Stale While Revalidate（先用缓存，后台更新）
// 适用：频繁访问但实时性要求不高的资源
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      });
      return cached || fetchPromise;
    })
  );
});
```

| 策略 | 优先级 | 适用场景 | 优点 | 缺点 |
|------|--------|---------|------|------|
| Cache First | 缓存 | 静态资源 | 速度快，离线可用 | 更新不及时 |
| Network First | 网络 | API / 动态数据 | 数据实时 | 无网络时不可用 |
| Stale While Revalidate | 缓存 + 网络 | 频繁访问资源 | 兼顾速度和更新 | 短暂数据不一致 |

## 面试要点

1. **缓存分类**：区分强缓存和协商缓存，理解优先级关系
2. **Cache-Control 指令**：掌握 `max-age`、`no-cache`、`no-store` 的区别
3. **ETag vs Last-Modified**：理解两者精确度和性能的权衡
4. **实际策略**：不同资源类型应使用不同的缓存策略
5. **Service Worker**：了解三种缓存策略及其适用场景

## 常见面试题

**Q: 强缓存和协商缓存的区别？哪个优先级更高？**

A: 强缓存不向服务器发请求，直接使用本地缓存（200 from cache）；协商缓存向服务器验证资源是否更新（304）。强缓存优先于协商缓存。流程：先检查强缓存（Cache-Control/Expires），未命中再检查协商缓存（ETag/Last-Modified）。

**Q: `Cache-Control: no-cache` 和 `no-store` 的区别？**

A: `no-cache` 并非不缓存，而是"不直接使用缓存"——每次使用前必须向服务器验证，验证通过后仍可使用缓存（304）。`no-store` 才是真正不缓存，每次都从服务器重新下载完整资源。

**Q: 为什么推荐用 `Cache-Control: max-age` 而不是 `Expires`？**

A: `Expires` 使用绝对时间，受客户端时钟影响，时钟不同步会导致缓存失效。`max-age` 使用相对时间（秒数），不受时钟影响，更加可靠。`Cache-Control` 的优先级也高于 `Expires`。

**Q: 前端项目如何配置缓存策略？**

A: HTML 入口文件用 `no-cache`（每次验证获取最新资源引用）；带 contenthash 的 JS/CSS 用 `max-age=31536000, immutable`（文件名变化即内容变化）；图片用中等 `max-age`。这样用户每次访问都能获取最新入口文件，同时静态资源享受长期缓存。

**Q: Service Worker 的 Cache First 和 Network First 分别适用什么场景？**

A: Cache First 适用于不常变化的静态资源（JS/CSS/图片），优势是加载速度快、支持离线访问。Network First 适用于需要实时数据的 API 请求，保证数据新鲜度，但无网络时回退到缓存。Stale While Revalidate 适用于频繁访问但对实时性要求不高的资源，先用缓存响应，后台更新缓存。
