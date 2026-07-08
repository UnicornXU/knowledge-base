---
sidebar_position: 3
title: "HTTP/2 协议详解"
difficulty: "medium"
tags: ["network", "http2", "multiplexing", "hpack"]
---

# HTTP/2 协议详解

HTTP/2（超文本传输协议第 2 版）是 HTTP 协议的重大升级，由 Google 的 SPDY 协议演化而来，于 2015 年正式发布为 RFC 7540。它在保持 HTTP 语义不变的前提下，对传输层进行了革命性优化。

## 协议演进历史

```
HTTP/1.0 (1996)          HTTP/1.1 (1997)          HTTP/2 (2015)           HTTP/3 (2022)
      │                        │                        │                       │
      ▼                        ▼                        ▼                       ▼
  短连接模型              持久连接/管道化           二进制分帧/多路复用       基于 QUIC/UDP
  每次请求新建连接        默认 Keep-Alive          解决应用层队头阻塞       解决 TCP 层队头阻塞
  无 Host 头支持          支持虚拟主机             头部压缩 HPACK           头部压缩 QPACK
  无断点续传              分块传输                 服务端推送               0-RTT 连接建立
```

### HTTP/1.1 的瓶颈

HTTP/1.1 虽然引入了持久连接和管道化，但仍存在严重问题：

| 问题 | 描述 | 影响 |
|------|------|------|
| 队头阻塞 | 同一连接上请求必须排队 | 一个慢请求阻塞后续所有请求 |
| 管道化不可靠 | 浏览器基本未实现 | 退化为串行请求 |
| 头部冗余 | 每个请求携带完整头部 | Cookie 等重复传输浪费带宽 |
| 连接数限制 | 浏览器对同域名限制 6-8 个连接 | 资源并行度受限 |
| 无法主动推送 | 服务器只能被动响应 | 无法优化资源加载时机 |

## 二进制分帧层

HTTP/2 最根本的变化是在应用层和传输层之间引入了**二进制分帧层**。

### 帧结构

```
+-----------------------------------------------+
|                 Length (24 bit)                |
+---------------+---------------+---------------+
|   Type (8)    |   Flags (8)   |
+-+-------------+---------------+---------------+
|R|         Stream Identifier (31 bit)          |
+-+---------------------------------------------+
|                   Frame Payload ...           |
+-----------------------------------------------+
```

| 字段 | 长度 | 说明 |
|------|------|------|
| Length | 24 bit | 帧负载长度（最大 16KB，可调整至 16MB） |
| Type | 8 bit | 帧类型（DATA、HEADERS、SETTINGS 等） |
| Flags | 8 bit | 帧标志位（END_STREAM、END_HEADERS 等） |
| R | 1 bit | 保留位 |
| Stream Identifier | 31 bit | 流 ID，用于标识所属的流 |

### 帧类型

| 类型 | 值 | 说明 |
|------|-----|------|
| DATA | 0x0 | 传输数据负载 |
| HEADERS | 0x1 | 头部帧 |
| PRIORITY | 0x2 | 流优先级 |
| RST_STREAM | 0x3 | 终止流 |
| SETTINGS | 0x4 | 连接配置 |
| PUSH_PROMISE | 0x5 | 服务端推送预告 |
| PING | 0x6 | 连接活性检测 |
| GOAWAY | 0x7 | 通知对端停止创建流 |
| WINDOW_UPDATE | 0x8 | 流量控制 |

### HTTP/1.1 vs HTTP/2 传输对比

```
HTTP/1.1 文本格式:
GET /index.html HTTP/1.1\r\n
Host: example.com\r\n
Accept: text/html\r\n
\r\n

HTTP/2 二进制帧:
[Length:24][Type:8][Flags:8][StreamID:31][Header Block Fragment...]
```

## 多路复用

多路复用是 HTTP/2 最核心的特性，彻底解决了 HTTP/1.1 的队头阻塞问题。

### 工作原理

```
HTTP/1.1 (串行):
  请求1 ──────► 响应1
                  请求2 ──────► 响应2
                                  请求3 ──────► 响应3
  ──────────────────────────────────────────────────► 时间

HTTP/2 (并行):
  请求1 ──┐
  请求2 ──┼──► 帧交错传输 ──┬──► 响应1
  请求3 ──┘                 ├──► 响应2
                            └──► 响应3
  ──────────────────────────────────────────────────► 时间
```

### Stream、Message、Frame 的关系

```
Connection (TCP 连接)
  ├── Stream 1 (请求/响应对)
  │     ├── HEADERS Frame (请求头)
  │     └── DATA Frame (响应体)
  ├── Stream 3
  │     ├── HEADERS Frame
  │     └── DATA Frame
  └── Stream 5
        ├── HEADERS Frame
        └── DATA Frame
```

| 概念 | 说明 |
|------|------|
| Connection | 一条 TCP 连接，承载所有 Stream |
| Stream | 一个双向字节流，对应一次请求/响应 |
| Message | 一帧或多帧组成的一条完整消息 |
| Frame | 最小通信单位，包含帧头和负载 |

### 关键特性

- **帧交错发送**：不同 Stream 的帧可以在同一连接上交错发送
- **独立流控制**：每个 Stream 有独立的流量控制窗口
- **优先级调度**：可以为不同 Stream 设置优先级和依赖关系
- **无队头阻塞**：一个 Stream 的延迟不影响其他 Stream

## 头部压缩（HPACK）

HTTP/2 使用 HPACK 算法压缩头部，解决 HTTP/1.1 中头部冗余的问题。

### HPACK 三板斧

#### 1. 静态表

预定义了 61 个常用头部字段和值：

| 索引 | 头部字段 | 值 |
|------|----------|-----|
| 1 | :authority | |
| 2 | :method | GET |
| 3 | :method | POST |
| 4 | :path | / |
| ... | ... | ... |
| 61 | www-authenticate | |

#### 2. 动态表

连接建立后，双方维护一个动态表，存储本次连接中出现过的头部：

```
初始动态表: []
请求1: Cookie: abc=123 → 编码后存入动态表[62]
请求2: Cookie: abc=123 → 直接引用索引 62，仅需 1 字节
```

#### 3. 霍夫曼编码

对头部值进行霍夫曼编码压缩：

```
原始: "text/html" (9 字节)
霍夫曼编码后: 约 6 字节 (压缩率 ~33%)
```

### 压缩效果对比

| 场景 | HTTP/1.1 头部大小 | HTTP/2 头部大小 | 压缩率 |
|------|-------------------|-----------------|--------|
| 首次请求 | ~800 bytes | ~300 bytes | 62% |
| 后续请求（含 Cookie） | ~800 bytes | ~30 bytes | 96% |

## 服务端推送

服务器可以在客户端请求之前，主动推送资源。

### 工作流程

```
客户端                    服务器
  │                         │
  │──── GET /index.html ───►│
  │                         │
  │◄── PUSH_PROMISE ────────│ (预告: 我要推 /style.css)
  │◄── PUSH_PROMISE ────────│ (预告: 我要推 /app.js)
  │◄── HEADERS (index) ─────│
  │◄── DATA (index) ────────│
  │◄── HEADERS (style) ─────│
  │◄── DATA (style) ────────│
  │◄── HEADERS (app.js) ────│
  │◄── DATA (app.js) ───────│
```

### Node.js 配置示例

```javascript
const http2 = require('http2');
const fs = require('fs');
const path = require('path');

const server = http2.createSecureServer({
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.cert')
});

server.on('stream', (stream, headers) => {
  const reqPath = headers[':path'];

  if (reqPath === '/' || reqPath === '/index.html') {
    // 推送关键 CSS
    stream.pushStream({ ':path': '/style.css' }, (err, pushStream) => {
      if (err) return;
      pushStream.respondWithFile(
        path.join(__dirname, 'public/style.css'),
        { 'content-type': 'text/css' }
      );
    });

    // 推送关键 JS
    stream.pushStream({ ':path': '/app.js' }, (err, pushStream) => {
      if (err) return;
      pushStream.respondWithFile(
        path.join(__dirname, 'public/app.js'),
        { 'content-type': 'application/javascript' }
      );
    });

    // 响应主页面
    stream.respondWithFile(
      path.join(__dirname, 'public/index.html'),
      { 'content-type': 'text/html' }
    );
  }
});

server.listen(8443);
```

### 推送的注意事项

- 浏览器可以拒绝推送（通过 RST_STREAM）
- 推送的资源必须遵循同源策略
- Chrome 从 2022 年起已移除 HTTP/2 Push 支持
- 推送缓存命中时会浪费带宽
- 更推荐使用 `103 Early Hints` 替代

## 流量控制

HTTP/2 实现了细粒度的流量控制机制。

### 机制说明

```
初始窗口大小: 65,535 字节 (64KB - 1)

发送方                    接收方
  │                         │
  │──── WINDOW_UPDATE ──────►│ (扩大窗口: +10000)
  │                         │
  │◄──── DATA (10000) ──────│ (在窗口内发送数据)
  │                         │
  │──── WINDOW_UPDATE ──────►│ (继续扩大窗口)
```

- **连接级**：控制整个 TCP 连接的流量
- **流级**：控制单个 Stream 的流量
- **动态调整**：接收方通过 WINDOW_UPDATE 帧调整窗口大小

## Nginx 配置

```nginx
# 启用 HTTP/2
server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /etc/nginx/ssl/example.crt;
    ssl_certificate_key /etc/nginx/ssl/example.key;

    # TLS 配置（HTTP/2 通常要求 TLS 1.2+）
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers on;

    # HTTP/2 优化
    http2_max_concurrent_streams 128;
    http2_recv_timeout 30s;
    http2_idle_timeout 3m;

    location / {
        root /var/www/html;
        index index.html;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        root /var/www/html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# HTTP/2 明文模式（h2c，仅内网使用）
server {
    listen 80 http2;
    server_name internal.example.com;

    location / {
        proxy_pass http://backend;
    }
}
```

## 性能对比数据

| 指标 | HTTP/1.1 | HTTP/2 | 提升 |
|------|----------|--------|------|
| 页面加载时间 | 3.4s | 1.6s | 53% |
| TCP 连接数 | 6-8 个 | 1 个 | 87% |
| 头部传输大小 | ~800B/请求 | ~30B/请求 | 96% |
| 首字节时间 (TTFB) | 200ms | 150ms | 25% |
| 资源加载并行度 | 受连接数限制 | 无限制 | 显著提升 |

> 以上数据基于典型电商页面测试（约 80 个资源请求），实际效果因网络环境而异。

## 面试高频问题

### Q1: HTTP/2 的多路复用是如何实现的？

**答**：HTTP/2 在应用层和传输层之间引入了二进制分帧层。每个请求/响应被拆分为多个帧，每个帧带有 Stream ID 标识所属的流。不同流的帧可以在同一 TCP 连接上交错发送，接收端根据 Stream ID 重新组装。这样就实现了同一连接上的并行传输，解决了 HTTP/1.1 的队头阻塞问题。

### Q2: HTTP/2 还存在队头阻塞吗？

**答**：HTTP/2 解决了**应用层**的队头阻塞，但**TCP 层**的队头阻塞仍然存在。因为 TCP 是字节流协议，一个包丢失会阻塞该连接上的所有数据。这正是 HTTP/3 改用 QUIC（基于 UDP）的原因。

### Q3: HPACK 头部压缩的原理是什么？

**答**：HPACK 使用三种机制压缩头部：
1. **静态表**：预定义 61 个常用头部，直接用索引引用
2. **动态表**：连接中出现的新头部存入动态表，后续用索引引用
3. **霍夫曼编码**：对头部值进行霍夫曼编码进一步压缩

### Q4: 为什么 Chrome 移除了 HTTP/2 Push？

**答**：
- 推送的资源可能已在浏览器缓存中，造成带宽浪费
- 无法准确判断客户端是否需要该资源
- 实现复杂且容易出错
- `103 Early Hints` 提供了更好的替代方案

### Q5: HTTP/2 如何设置资源优先级？

**答**：HTTP/2 使用**权重**和**依赖关系**来设置优先级：
- 每个 Stream 有 1-256 的权重
- Stream 可以依赖其他 Stream
- 服务器根据优先级调度帧的发送顺序

```
Stream 3 (HTML)  权重: 256
  ├── Stream 5 (CSS)   权重: 200  依赖: 3
  └── Stream 7 (JS)    权重: 100  依赖: 3
```

## 总结

| 特性 | 说明 | 面试要点 |
|------|------|----------|
| 二进制分帧 | 文本 → 二进制，帧是最小单位 | 帧结构、Stream/Message/Frame 关系 |
| 多路复用 | 同一连接并行处理多个请求 | 解决应用层队头阻塞，但 TCP 层仍有 |
| HPACK 压缩 | 静态表 + 动态表 + 霍夫曼编码 | 后续请求头部可压缩 96% |
| 服务端推送 | 主动推送资源到客户端 | Chrome 已移除，103 Early Hints 替代 |
| 流量控制 | 连接级 + 流级的窗口控制 | WINDOW_UPDATE 帧动态调整 |
