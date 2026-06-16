---
sidebar_position: 2
title: "HTTP 协议"
difficulty: "medium"
tags: ["network", "http", "https"]
---

# HTTP 协议

HTTP（HyperText Transfer Protocol）是前端开发中最核心的网络协议，深入理解其各版本特性和工作机制是面试高频考点。

## HTTP 版本演进

| 特性 | HTTP/1.0 | HTTP/1.1 | HTTP/2.0 | HTTP/3.0 |
|------|----------|----------|----------|----------|
| 连接方式 | 短连接 | 持久连接 / 管道化 | 多路复用 | 基于 QUIC |
| 队头阻塞 | 有 | 有 | TCP 层面有 | 无 |
| 头部压缩 | 无 | 无 | HPACK | QPACK |
| 服务器推送 | 不支持 | 不支持 | 支持 | 支持 |
| 协议层 | TCP | TCP | TCP | UDP (QUIC) |

### HTTP/1.0 的问题

- 每次请求都要建立新的 TCP 连接
- 不支持断点续传
- 不支持 Host 头（一个 IP 只能绑一个域名）

### HTTP/1.1 的改进

- **持久连接**：默认启用 `Connection: keep-alive`
- **管道化**：允许在同一连接中连续发送多个请求（但响应必须按序返回）
- **Host 头**：支持虚拟主机
- **分块传输**：`Transfer-Encoding: chunked`
- **缓存增强**：`ETag`、`If-None-Match`、`Cache-Control`

### HTTP/2.0 的突破

- **多路复用**：同一连接并行处理多个请求，解决应用层队头阻塞
- **头部压缩**：HPACK 算法压缩头部，减少传输体积
- **二进制分帧**：将数据拆分为更小的帧传输
- **服务器推送**：服务器可主动推送资源到客户端

```javascript
// HTTP/2 服务器推送（Node.js 示例）
const http2 = require('http2');
const server = http2.createServer();
server.on('stream', (stream, headers) => {
  // 推送 CSS 资源
  stream.pushStream({ ':path': '/style.css' }, (err, pushStream) => {
    pushStream.respond({ ':status': 200, 'content-type': 'text/css' });
    pushStream.end(cssContent);
  });
  stream.respond({ ':status': 200 });
  stream.end(htmlContent);
});
```

### HTTP/3.0 的革新

- 基于 **QUIC** 协议，解决 TCP 层队头阻塞
- 0-RTT 连接建立
- 内置 TLS 1.3 加密
- 连接迁移（网络切换时不断连）

## 请求方法

| 方法 | 幂等性 | 安全性 | 含义 | 前端常用场景 |
|------|--------|--------|------|-------------|
| GET | 是 | 是 | 获取资源 | 查询数据、加载页面 |
| POST | 否 | 否 | 提交数据 | 表单提交、上传文件 |
| PUT | 是 | 否 | 替换资源 | 更新整个资源 |
| DELETE | 是 | 否 | 删除资源 | 删除数据 |
| PATCH | 否 | 否 | 部分更新 | 更新部分字段 |
| OPTIONS | 是 | 是 | 预检请求 | CORS 预检 |
| HEAD | 是 | 是 | 获取响应头 | 检查资源是否存在 |

**幂等性**：同一个请求执行多次，结果与执行一次相同。

**安全性**：请求不会修改服务器上的资源。

```javascript
// GET vs POST 的区别在前端的体现
// GET 请求参数在 URL 中，有长度限制
fetch('/api/users?page=1&size=10');

// POST 请求参数在请求体中，无大小限制
fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: '张三', age: 25 }),
});

// PUT 替换整个资源
fetch('/api/users/1', {
  method: 'PUT',
  body: JSON.stringify({ name: '张三', age: 26, email: 'new@example.com' }),
});

// PATCH 部分更新
fetch('/api/users/1', {
  method: 'PATCH',
  body: JSON.stringify({ age: 26 }),
});
```

## HTTP 状态码

### 1xx 信息性

| 状态码 | 含义 | 说明 |
|--------|------|------|
| 100 Continue | 继续 | 客户端应继续发送请求体 |
| 101 Switching Protocols | 协议切换 | 用于 WebSocket 升级 |

### 2xx 成功

| 状态码 | 含义 | 说明 |
|--------|------|------|
| 200 OK | 成功 | 最常见的成功状态码 |
| 201 Created | 已创建 | 资源创建成功（POST） |
| 204 No Content | 无内容 | 成功但无返回体（DELETE） |
| 206 Partial Content | 部分内容 | 断点续传、分片下载 |

### 3xx 重定向

| 状态码 | 含义 | 说明 |
|--------|------|------|
| 301 Moved Permanently | 永久重定向 | 浏览器会缓存，下次直接跳转 |
| 302 Found | 临时重定向 | 浏览器不缓存 |
| 304 Not Modified | 未修改 | 协商缓存命中 |
| 307 Temporary Redirect | 临时重定向 | 保持请求方法不变 |
| 308 Permanent Redirect | 永久重定向 | 保持请求方法不变 |

### 4xx 客户端错误

| 状态码 | 含义 | 说明 |
|--------|------|------|
| 400 Bad Request | 请求错误 | 参数格式错误 |
| 401 Unauthorized | 未认证 | 需要登录 |
| 403 Forbidden | 无权限 | 已认证但权限不足 |
| 404 Not Found | 未找到 | 资源不存在 |
| 405 Method Not Allowed | 方法不允许 | 请求方法不被支持 |
| 408 Request Timeout | 请求超时 | 客户端发送太慢 |
| 429 Too Many Requests | 请求过多 | 触发限流 |

### 5xx 服务器错误

| 状态码 | 含义 | 说明 |
|--------|------|------|
| 500 Internal Server Error | 服务器内部错误 | 通用服务器错误 |
| 502 Bad Gateway | 网关错误 | 上游服务器返回无效响应 |
| 503 Service Unavailable | 服务不可用 | 服务器过载或维护 |
| 504 Gateway Timeout | 网关超时 | 上游服务器响应超时 |

## 请求头与响应头

### 常用请求头

```http
GET /api/data HTTP/1.1
Host: api.example.com
Accept: application/json
Accept-Language: zh-CN,zh;q=0.9,en;q=0.8
Accept-Encoding: gzip, deflate, br
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
Cookie: sessionId=abc123; theme=dark
Content-Type: application/json
User-Agent: Mozilla/5.0 ...
Referer: https://example.com
Connection: keep-alive
Cache-Control: no-cache
```

### 常用响应头

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Length: 1234
Cache-Control: max-age=3600
ETag: "abc123"
Last-Modified: Wed, 21 Oct 2025 07:28:00 GMT
Set-Cookie: sessionId=abc123; HttpOnly; Secure; SameSite=Strict
Access-Control-Allow-Origin: https://example.com
Connection: keep-alive
```

### 关键头部详解

| 头部 | 方向 | 作用 |
|------|------|------|
| `Content-Type` | 双向 | 请求/响应体的 MIME 类型 |
| `Accept` | 请求 | 客户端可接受的响应类型 |
| `Authorization` | 请求 | 认证凭证（Bearer Token 等） |
| `Cookie` / `Set-Cookie` | 请求/响应 | Cookie 传输与设置 |
| `Cache-Control` | 双向 | 缓存策略控制 |
| `ETag` | 响应 | 资源的唯一标识（协商缓存） |
| `Last-Modified` | 响应 | 资源最后修改时间 |
| `Connection` | 双向 | 连接管理（keep-alive / close） |
| `Upgrade` | 请求 | 协议升级（如 WebSocket） |

## HTTPS 握手过程

HTTPS = HTTP + TLS（Transport Layer Security），在 HTTP 基础上增加了加密和身份验证。

### TLS 1.2 握手过程

```
  客户端                                    服务器
    │                                         │
    │ ─── ClientHello ──────────────────────> │  1. 发送支持的加密套件列表、随机数
    │                                         │
    │ <── ServerHello ─────────────────────── │  2. 选择加密套件、发送随机数
    │ <── Certificate ────────────────────── │  3. 发送服务器证书
    │ <── ServerHelloDone ─────────────────── │
    │                                         │
    │ ── ClientKeyExchange ────────────────> │  4. 发送预主密钥（用公钥加密）
    │ ── ChangeCipherSpec ─────────────────> │  5. 通知切换到加密通信
    │ ── Finished ─────────────────────────> │  6. 验证握手信息完整性
    │                                         │
    │ <── ChangeCipherSpec ───────────────── │  7. 服务器切换到加密通信
    │ <── Finished ──────────────────────── │  8. 验证握手信息完整性
    │                                         │
    │       === 加密通信开始 ===                │
```

### TLS 1.3 改进

| 特性 | TLS 1.2 | TLS 1.3 |
|------|---------|---------|
| 握手延迟 | 2 RTT | 1 RTT（首次），0 RTT（恢复） |
| 密钥交换 | RSA / DHE / ECDHE | 仅 ECDHE / DHE（更安全） |
| 加密套件 | 众多（含不安全算法） | 精简为 5 个安全套件 |
| 前向保密 | 可选 | 强制 |
| 0-RTT | 不支持 | 支持（有重放风险） |

```javascript
// 前端通常不直接处理 TLS，但可以通过浏览器 API 查看安全信息
// 在 Chrome DevTools → Security 面板可以查看 TLS 版本和证书信息
```

## HTTP Keep-Alive 与连接管理

```javascript
// HTTP/1.1 默认开启 Keep-Alive
// 同一 TCP 连接可以发送多个 HTTP 请求

// Connection 头部控制
fetch('/api/data', {
  headers: {
    'Connection': 'keep-alive',  // 保持连接（默认）
    // 'Connection': 'close',    // 关闭连接
  },
});
```

**连接管理策略：**

- **HTTP/1.0**：默认短连接，需要手动添加 `Connection: keep-alive`
- **HTTP/1.1**：默认持久连接，浏览器限制同域名 6-8 个并发连接
- **HTTP/2.0**：单一连接多路复用，无需限制并发数

## 面试要点

1. **HTTP 版本差异**：重点掌握 HTTP/1.1 → HTTP/2.0 的改进（多路复用、头部压缩）
2. **HTTPS 握手**：理解 TLS 握手过程，知道 TLS 1.3 的改进
3. **状态码**：掌握常见状态码（200/301/304/401/403/404/500/502/503）
4. **请求方法**：理解幂等性和安全性的区别
5. **CORS**：掌握跨域请求的预检机制（OPTIONS 请求）

## 常见面试题

**Q: HTTP/1.1 和 HTTP/2.0 的主要区别？**

A: HTTP/2.0 的核心改进：(1) 多路复用，同一连接并行处理多个请求；(2) 头部压缩（HPACK），减少传输体积；(3) 二进制分帧，解析效率更高；(4) 服务器推送，可主动推送资源。但 HTTP/2 仍基于 TCP，存在 TCP 层队头阻塞。

**Q: HTTPS 的加密过程是怎样的？**

A: (1) 客户端发送 ClientHello（支持的加密套件、随机数）；(2) 服务器返回 ServerHello（选定套件、随机数）和证书；(3) 客户端验证证书，生成预主密钥并用公钥加密发送；(4) 双方用三个随机数生成会话密钥；(5) 使用对称加密进行后续通信。核心是非对称加密交换密钥，对称加密传输数据。

**Q: GET 和 POST 的区别？**

A: (1) GET 参数在 URL 中，POST 在请求体中；(2) GET 可被缓存、收藏，POST 不行；(3) GET 有长度限制（浏览器实现），POST 理论上无限制；(4) GET 是幂等的，POST 不是；(5) GET 用于获取数据，POST 用于提交数据。语义上是核心区别，技术差异是实现层面的。

**Q: OPTIONS 预检请求是什么时候触发的？**

A: 当请求满足"非简单请求"条件时会触发预检：(1) 使用 PUT/DELETE/PATCH 等方法；(2) 自定义请求头（如 Authorization）；(3) Content-Type 为 application/json 等。浏览器先发 OPTIONS 请求询问服务器是否允许该跨域请求，服务器确认后才发送实际请求。
