---
sidebar_position: 4
title: 浏览器存储与跨域
difficulty: medium
tags:
  - browser
  - storage
  - cors
  - security
---

# 🔒 浏览器存储与跨域

> **"同源策略是浏览器安全的基石，理解它才能正确处理跨域问题"**

浏览器存储和跨域是前端开发中最常遇到的两个基础问题。选择合适的存储方案和正确处理跨域请求，是每个前端工程师必须掌握的技能。

## 一、浏览器存储方案

### 1.1 存储方案全景对比

```
存储方案对比
═══════════════════════════════════════════════════════════════════════

                Cookie        localStorage   sessionStorage   IndexedDB
                ──────        ────────────   ──────────────   ─────────
大小限制        4KB           5-10MB         5-10MB           无限制
生命周期        可配置        永久           会话级           永久
作用域          同源+Path     同源           同源+标签页      同源
                                    +标签页
与服务器通信    ✅ 自动携带    ❌             ❌               ❌
API            同步          同步           同步             异步
数据格式        字符串        字符串         字符串           结构化数据
```

### 1.2 Cookie

```js
// 设置 Cookie
document.cookie = 'username=john; path=/; max-age=3600';
document.cookie = 'theme=dark; path=/; expires=Fri, 31 Dec 2026 23:59:59 GMT';

// 读取 Cookie
const cookies = document.cookie; // "username=john; theme=dark"

// 解析 Cookie
function parseCookies() {
  return document.cookie.split('; ').reduce((acc, pair) => {
    const [key, value] = pair.split('=');
    acc[key] = decodeURIComponent(value);
    return acc;
  }, {});
}
```

```
Cookie 关键属性：
═══════════════════════════════════════════════════════

  属性            说明                              示例
  ────            ────                              ────
  HttpOnly        禁止 JS 访问（防 XSS 窃取）        Set-Cookie: token=xxx; HttpOnly
  Secure          仅 HTTPS 传输                     Set-Cookie: token=xxx; Secure
  SameSite        跨站限制                           Set-Cookie: token=xxx; SameSite=Lax

                  None：允许跨站发送（需 Secure）
                  Lax：顶级导航的 GET 请求可发送（默认）
                  Strict：完全禁止跨站发送

  Domain          指定域名范围                       Set-Cookie: token=xxx; Domain=.example.com
  Path            指定路径范围                       Set-Cookie: token=xxx; Path=/api
  Expires         过期时间（绝对）                   Set-Cookie: token=xxx; Expires=Fri, 31 Dec 2026
  Max-Age         过期时间（相对秒数）               Set-Cookie: token=xxx; Max-Age=3600
```

### 1.3 localStorage 与 sessionStorage

```js
// localStorage API（同步）
localStorage.setItem('key', 'value');
const value = localStorage.getItem('key');
localStorage.removeItem('key');
localStorage.clear();

// 存储对象需要序列化
localStorage.setItem('user', JSON.stringify({ name: 'John', age: 30 }));
const user = JSON.parse(localStorage.getItem('user'));

// sessionStorage（同一标签页有效）
sessionStorage.setItem('tempData', '123');
// 关闭标签页后自动清除

// 监听存储变化（跨标签页通信）
window.addEventListener('storage', (event) => {
  console.log('key:', event.key);
  console.log('旧值:', event.oldValue);
  console.log('新值:', event.newValue);
  // 注意：此事件在触发变更的标签页中不会触发
  // 只在其他同源标签页中触发
});
```

### 1.4 IndexedDB 基础

```js
// 打开数据库
const request = indexedDB.open('MyDatabase', 1);

request.onupgradeneeded = (event) => {
  const db = event.target.result;

  // 创建对象仓库（类似表）
  if (!db.objectStoreNames.contains('users')) {
    const store = db.createObjectStore('users', {
      keyPath: 'id',         // 主键
      autoIncrement: true    // 自增
    });
    store.createIndex('email', 'email', { unique: true });
  }
};

request.onsuccess = (event) => {
  const db = event.target.result;

  // 写入数据
  const tx = db.transaction('users', 'readwrite');
  const store = tx.objectStore('users');
  store.add({ name: 'John', email: 'john@example.com' });

  // 读取数据
  const getRequest = store.get(1);
  getRequest.onsuccess = () => {
    console.log(getRequest.result);
  };
};

// ⚠️ IndexedDB 是异步 API，所有操作通过事件回调
// 推荐使用 idb 库封装（Promises 化）
// npm install idb
```

### 1.5 SharedArrayBuffer 与跨域隔离

```js
// SharedArrayBuffer 需要跨域隔离环境
// Chrome 92+ 默认要求以下两个头部：

// 服务器必须设置：
// Cross-Origin-Opener-Policy: same-origin
// Cross-Origin-Embedder-Policy: require-corp

// 检查是否处于跨域隔离环境
if (crossOriginIsolated) {
  const sab = new SharedArrayBuffer(1024);
  const view = new Int32Array(sab);

  // 在 Worker 中共享内存
  const worker = new Worker('worker.js');
  worker.postMessage(sab);
} else {
  console.warn('当前环境不支持 SharedArrayBuffer');
}
```

## 二、同源策略（Same-Origin Policy）

### 2.1 什么是同源

```
同源判断规则：
═══════════════════════════════════════════════════════

  URL: https://www.example.com:443/path

  协议（protocol）: https
  主机（host）:     www.example.com
  端口（port）:     443

  协议 + 主机 + 端口 三者完全一致才算同源

  示例：
  URL A: https://www.example.com:443/page1
  URL B: https://www.example.com:443/page2
  → ✅ 同源

  URL A: https://www.example.com/api
  URL B: http://www.example.com/api
  → ❌ 不同源（协议不同）

  URL A: https://www.example.com
  URL B: https://api.example.com
  → ❌ 不同源（主机不同）

  URL A: https://www.example.com:443
  URL B: https://www.example.com:8080
  → ❌ 不同源（端口不同）
```

### 2.2 受同源策略限制的操作

```
受限操作 vs 不受限操作：
═══════════════════════════════════════════════════════

  ✅ 可以跨域（不受同源策略限制）：
  • <script src="...">         → JSONP 的基础
  • <link href="...">          → 加载 CSS
  • <img src="...">            → 加载图片
  • <video> / <audio>          → 媒体
  • <iframe src="...">         → 嵌入页面
  • @font-face（需 CORS 头）   → 加载字体

  ❌ 受限（需要 CORS 或其他方案）：
  • XMLHttpRequest / fetch     → AJAX 请求
  • DOM 访问                   → iframe 内容访问
  • Cookie / Storage 访问      → 跨域存储
```

## 三、CORS（跨域资源共享）

### 3.1 简单请求 vs 预检请求

```
简单请求的条件：
═══════════════════════════════════════

  同时满足以下条件：
  1. 方法：GET / HEAD / POST
  2. 头部限制：仅以下字段
     - Accept
     - Accept-Language
     - Content-Language
     - Content-Type（仅限以下值）
       • application/x-www-form-urlencoded
       • multipart/form-data
       • text/plain
  3. 无自定义请求头
  4. 没有使用 ReadableStream

  不满足以上条件 → 预检请求（Preflight）
```

```
简单请求流程：
═══════════════════════════════════════

  浏览器                         服务器
    │                              │
    │── GET /api/data ────────────→│
    │   Origin: https://a.com     │
    │                              │
    │←── 200 OK ──────────────────│
    │   Access-Control-Allow-Origin│
    │   : https://a.com           │
    │                              │
    │   → 浏览器检查响应头         │
    │   → 匹配则返回数据给 JS      │
```

```
预检请求流程：
═══════════════════════════════════════

  浏览器                         服务器
    │                              │
    │── OPTIONS /api/data ────────→│  ← 预检请求
    │   Origin: https://a.com     │
    │   Access-Control-Request-   │
    │     Method: PUT             │
    │   Access-Control-Request-   │
    │     Headers: Content-Type   │
    │                              │
    │←── 204 No Content ──────────│  ← 预检响应
    │   Access-Control-Allow-Origin│
    │   : https://a.com           │
    │   Access-Control-Allow-     │
    │     Methods: GET,POST,PUT   │
    │   Access-Control-Allow-     │
    │     Headers: Content-Type   │
    │   Access-Control-Max-Age:   │
    │     86400                   │
    │                              │
    │── PUT /api/data ────────────→│  ← 实际请求
    │   Origin: https://a.com     │
    │                              │
    │←── 200 OK ──────────────────│
    │                              │
```

### 3.2 CORS 响应头详解

```js
// 服务器端 CORS 配置示例（Node.js/Express）

// 1. 允许指定源
app.use((req, res, next) => {
  const allowedOrigins = ['https://a.com', 'https://b.com'];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  // 2. 允许携带凭证（Cookie）
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // 3. 允许的请求方法
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');

  // 4. 允许的请求头
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 5. 预检缓存时间（秒）
  res.setHeader('Access-Control-Max-Age', '86400');

  // 6. 允许前端访问的响应头
  res.setHeader('Access-Control-Expose-Headers', 'X-Custom-Header');

  // 预检请求直接返回
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});
```

```js
// 前端携带 Cookie 的跨域请求
fetch('https://api.example.com/data', {
  credentials: 'include',  // 必须设置
  headers: {
    'Content-Type': 'application/json'
  }
});
```

## 四、其他跨域解决方案

### 4.1 JSONP（已过时）

```html
<!-- JSONP 原理：利用 script 标签不受同源策略限制 -->
<script>
function handleResponse(data) {
  console.log('收到数据:', data);
}
</script>
<script src="https://api.example.com/data?callback=handleResponse"></script>

<!-- 服务端返回：handleResponse({"name":"John","age":30}) -->
```

```js
// 封装 JSONP
function jsonp(url, callbackName = 'cb') {
  return new Promise((resolve, reject) => {
    const funcName = `jsonp_${Date.now()}`;
    const script = document.createElement('script');

    script.src = `${url}?callback=${funcName}`;
    script.onerror = reject;

    window[funcName] = (data) => {
      resolve(data);
      document.body.removeChild(script);
      delete window[funcName];
    };

    document.body.appendChild(script);
  });
}
```

### 4.2 postMessage

```js
// 父页面
const iframe = document.getElementById('myIframe');

// 发送消息
iframe.contentWindow.postMessage(
  { type: 'getData', payload: { id: 1 } },
  'https://other.com'  // 目标源
);

// 接收消息
window.addEventListener('message', (event) => {
  // ⚠️ 必须验证来源！
  if (event.origin !== 'https://other.com') return;

  console.log('收到消息:', event.data);
});

// iframe 内部
window.addEventListener('message', (event) => {
  if (event.origin !== 'https://parent.com') return;

  // 处理请求
  const result = processRequest(event.data);

  // 回复父页面
  event.source.postMessage(
    { type: 'result', payload: result },
    event.origin
  );
});
```

### 4.3 代理 / Nginx 反向代理

```nginx
# Nginx 反向代理配置
server {
    listen 80;
    server_name www.example.com;

    # 前端页面
    location / {
        root /var/www/html;
        try_files $uri /index.html;
    }

    # API 代理（解决跨域）
    location /api/ {
        proxy_pass http://backend-server:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# 前端代码中直接请求同源的 /api/xxx
# Nginx 转发到后端服务器，避免跨域
```

### 4.4 document.domain（仅限主域相同）

```js
// 页面 a.example.com
document.domain = 'example.com';

// 页面 b.example.com
document.domain = 'example.com';

// 现在两个页面可以互相访问 DOM
// ⚠️ 已被废弃，仅作了解
```

## 五、面试要点

- Cookie 的**七个属性**及各自的用途必须掌握
- localStorage 和 sessionStorage 的**三个核心区别**：生命周期、作用域、大小
- **同源策略**的三个组成部分：协议 + 主机 + 端口
- **简单请求**和**预检请求**的区别和触发条件
- CORS 相关的**请求头和响应头**
- 常见跨域方案的**适用场景和优缺点**

## 六、常见面试题

**Q1: Cookie、localStorage、sessionStorage 的区别？**

A: Cookie 大小 4KB，可设置过期时间，会随请求自动发送到服务器，可设置 HttpOnly 防止 JS 访问；localStorage 大小 5-10MB，永久存储，同源标签页共享；sessionStorage 大小 5-10MB，标签页级生命周期，不共享。

**Q2: CORS 的简单请求和预检请求有什么区别？**

A: 简单请求直接发送，浏览器在响应中检查 Access-Control-Allow-Origin。预检请求先发送 OPTIONS 询问服务器是否允许该跨域请求，服务器确认后再发送实际请求。满足 GET/HEAD/POST 方法且无自定义头的请求为简单请求，否则为预检请求。

**Q3: 如何实现跨标签页通信？**

A: 1）BroadcastChannel API（推荐，专用方案）；2）localStorage 的 storage 事件；3）SharedWorker；4）Service Worker 的 postMessage；5）WebSocket（通过服务器中转）。

**Q4: 什么是 SameSite 属性？**

A: SameSite 控制 Cookie 在跨站请求中的发送行为。Strict 完全禁止跨站发送；Lax 允许顶级导航的 GET 请求发送（默认值）；None 允许跨站发送但必须配合 Secure 属性。这是为了防止 CSRF 攻击。

**Q5: 前端开发中遇到跨域问题有哪些解决方案？**

A: 1）CORS：服务端配置响应头（推荐）；2）代理：开发环境用 webpack devServer，生产环境用 Nginx 反向代理；3）JSONP：仅支持 GET，已过时；4）postMessage：用于 iframe 通信；5）WebSocket：不受同源策略限制。
