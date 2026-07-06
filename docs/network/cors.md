---
sidebar_position: 8
title: "跨域与 CORS"
difficulty: "medium"
tags: ["network", "cors", "cross-origin", "proxy"]
---

# 🌐 跨域与 CORS

> **"跨域是前端开发中最常遇到的网络问题之一"** —— 理解同源策略和 CORS 是前后端协作的基础。

## 一、同源策略

### 1.1 什么是同源？

```
同源判断规则
═══════════════════════════════════════════════════════

协议 + 域名 + 端口 三者完全相同即为同源

URL                                同源？
────────────────────────────────  ────
https://example.com/page1         ✅ 同源
https://example.com/page2         ✅ 同源（路径不同没关系）
https://example.com:443/page      ✅ 同源（默认端口）
https://sub.example.com/page      ❌ 不同源（子域名不同）
http://example.com/page           ❌ 不同源（协议不同）
https://example.com:8080/page     ❌ 不同源（端口不同）
https://other.com/page            ❌ 不同源（域名不同）
```

### 1.2 同源策略的限制

```
同源策略限制了什么？
═══════════════════════════════════════════════════════

❌ 被限制的：
• XMLHttpRequest / fetch 跨域请求
• DOM 访问（iframe 中的 DOM）
• Cookie、LocalStorage、IndexedDB 读取

✅ 不受限制的：
• <script src="...">   — JSONP 的原理
• <img src="...">      — 图片跨域加载
• <link href="...">    — CSS 跨域加载
• <form action="...">  — 表单跨域提交
• WebSocket            — 不受同源策略限制
```

## 二、CORS（跨源资源共享）

### 2.1 CORS 原理

```
CORS 工作流程
═══════════════════════════════════════════════════════

浏览器                              服务器
  │                                   │
  │  检查是否需要预检请求              │
  │  （简单请求直接发送）              │
  │                                   │
  │──── OPTIONS 预检请求 ────────────→│
  │     Origin: https://app.com       │
  │     Access-Control-Request-Method │
  │                                   │
  │←─── 预检响应 ─────────────────────│
  │     Access-Control-Allow-Origin   │
  │     Access-Control-Allow-Methods  │
  │     Access-Control-Allow-Headers  │
  │                                   │
  │──── 实际请求 ────────────────────→│
  │     Origin: https://app.com       │
  │                                   │
  │←─── 实际响应 ─────────────────────│
  │     Access-Control-Allow-Origin   │
  │     数据...
```

### 2.2 简单请求 vs 预检请求

```
简单请求（直接发送）
═══════════════════════════════════════════════════════

满足以下全部条件：
1. 方法：GET、POST、HEAD
2. 只有简单头部：Accept、Content-Type 等
3. Content-Type：text/plain、multipart/form-data、
                 application/x-www-form-urlencoded

预检请求（先发 OPTIONS）
═══════════════════════════════════════════════════════

不满足简单请求条件时：
1. 方法：PUT、DELETE、PATCH 等
2. 自定义头部：Authorization、X-Token 等
3. Content-Type：application/json
```

### 2.3 CORS 响应头

```
CORS 响应头详解
═══════════════════════════════════════════════════════

Access-Control-Allow-Origin
  允许的源（* 或具体域名）
  例：https://app.example.com

Access-Control-Allow-Methods
  允许的 HTTP 方法
  例：GET, POST, PUT, DELETE, OPTIONS

Access-Control-Allow-Headers
  允许的请求头
  例：Content-Type, Authorization, X-Token

Access-Control-Allow-Credentials
  是否允许携带 Cookie（true/false）
  注意：设为 true 时 Allow-Origin 不能用 *

Access-Control-Max-Age
  预检请求的缓存时间（秒）
  例：86400（24小时）

Access-Control-Expose-Headers
  前端可以读取的响应头
  例：X-Total-Count, X-Request-Id
```

## 三、跨域解决方案

### 3.1 服务端配置 CORS

```js
// Node.js / Express
const cors = require('cors');

// 允许所有来源（开发环境）
app.use(cors());

// 生产环境：指定来源
app.use(cors({
  origin: 'https://app.example.com',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,  // 允许 Cookie
  maxAge: 86400,      // 预检缓存 24 小时
}));

// 多个来源
const allowedOrigins = ['https://app.example.com', 'https://admin.example.com'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
}));
```

### 3.2 开发代理

```js
// Vite 代理配置
// vite.config.js
export default {
  server: {
    proxy: {
      '/api': {
        target: 'https://api.example.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
};

// Webpack Dev Server 代理
// webpack.config.js
module.exports = {
  devServer: {
    proxy: {
      '/api': {
        target: 'https://api.example.com',
        changeOrigin: true,
        pathRewrite: { '^/api': '' },
      },
    },
  },
};
```

### 3.3 Nginx 反向代理

```nginx
# Nginx 代理配置
server {
    listen 80;
    server_name app.example.com;

    # 前端静态资源
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api/ {
        proxy_pass https://api.example.com/;
        proxy_set_header Host $api.example.com;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3.4 JSONP（已过时）

```js
// JSONP 原理：利用 <script> 标签不受同源策略限制
function jsonp(url, callbackName) {
  return new Promise((resolve, reject) => {
    // 注册全局回调
    window[callbackName] = (data) => {
      resolve(data);
      document.head.removeChild(script);
      delete window[callbackName];
    };

    // 创建 script 标签
    const script = document.createElement('script');
    script.src = `${url}?callback=${callbackName}`;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// 使用
jsonp('https://api.example.com/data', 'handleData')
  .then(data => console.log(data));

// 服务端返回：
// handleData({"name": "Alice", "age": 25})
```

```
跨域方案对比
═══════════════════════════════════════════════════════

方案          适用场景              优缺点
──────────  ──────────────────   ──────────────────
CORS         生产环境跨域 API      ✅ 标准方案，服务端配置
                                  ❌ 需要服务端配合

开发代理      开发环境              ✅ 无跨域问题
                                  ❌ 仅开发环境，生产需要 Nginx

Nginx 反向    生产环境              ✅ 灵活，前后端都可用
代理                              ❌ 需要运维配置

JSONP        老项目兼容            ✅ 兼容性好
                                  ❌ 只支持 GET，有安全风险

WebSocket    实时通信              ✅ 不受同源限制
                                  ❌ 不适合普通 API 请求
```

## 四、Cookie 与跨域

### 4.1 Cookie 的 SameSite 属性

```
SameSite 属性
═══════════════════════════════════════════════════════

Strict    完全禁止第三方 Cookie
          从第三方网站点击链接进入也不会携带 Cookie

Lax       默认值（Chrome 80+）
          允许顶级导航的 GET 请求携带 Cookie
          POST、iframe、AJAX 不携带

None      允许跨站携带 Cookie
          必须配合 Secure 属性（仅 HTTPS）

跨域请求携带 Cookie 的条件：
1. 服务端设置 Access-Control-Allow-Credentials: true
2. 服务端设置 Access-Control-Allow-Origin 为具体域名（不能用 *）
3. 前端请求设置 credentials: 'include'（fetch）或 withCredentials: true（XHR）
4. Cookie 的 SameSite 不能是 Strict
```

```js
// fetch 跨域携带 Cookie
fetch('https://api.example.com/data', {
  credentials: 'include',  // 携带 Cookie
});

// XMLHttpRequest 跨域携带 Cookie
const xhr = new XMLHttpRequest();
xhr.withCredentials = true;
xhr.open('GET', 'https://api.example.com/data');
xhr.send();
```

## 五、常见面试题

**Q1: 什么是跨域？为什么会有跨域？**

A: 跨域是指浏览器的同源策略限制了不同源之间的资源访问。同源策略是浏览器的安全机制，防止恶意网站读取其他网站的 Cookie 和数据。协议、域名、端口任一不同即为跨域。

**Q2: CORS 的简单请求和预检请求的区别？**

A: 简单请求（GET/POST/HEAD + 简单头部 + 特定 Content-Type）直接发送。非简单请求会先发 OPTIONS 预检请求，询问服务器是否允许该跨域请求，服务器确认后才发送实际请求。

**Q3: 跨域请求能携带 Cookie 吗？**

A: 可以，但需要满足：1) 服务端设置 `Access-Control-Allow-Credentials: true`；2) 服务端 `Allow-Origin` 不能用 `*`，必须指定具体域名；3) 前端设置 `credentials: 'include'`；4) Cookie 的 `SameSite` 不能是 `Strict`。
