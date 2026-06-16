---
sidebar_position: 4
title: "WebSocket 与实时通信"
difficulty: "medium"
tags: ["network", "websocket", "sse"]
---

# WebSocket 与实时通信

实时通信是现代 Web 应用的重要能力，选择合适的通信方式是前端面试的高频考点。

## 通信方式对比

| 特性 | HTTP 轮询 | 长轮询 | SSE | WebSocket |
|------|----------|--------|-----|-----------|
| 通信方向 | 单向（客户端拉） | 单向（客户端拉） | 单向（服务器推） | 全双工 |
| 协议 | HTTP | HTTP | HTTP | WebSocket（基于 TCP） |
| 实时性 | 差（取决于轮询间隔） | 较好 | 好 | 最好 |
| 服务器压力 | 大（频繁请求） | 中等 | 小 | 小 |
| 浏览器支持 | 全部 | 全部 | 除 IE 外 | 全部 |
| 自动重连 | 手动实现 | 手动实现 | 内置 | 手动实现 |
| 二进制数据 | 不支持 | 不支持 | 不支持 | 支持 |
| 适用场景 | 简单定时刷新 | 一般实时通知 | 通知、数据流 | 聊天、游戏、协同编辑 |

```javascript
// 1. HTTP 轮询 - 最简单但效率最低
setInterval(async () => {
  const res = await fetch('/api/messages');
  const data = await res.json();
  updateUI(data);
}, 3000); // 每 3 秒请求一次

// 2. 长轮询 - 客户端发起请求，服务器有数据才返回
async function longPoll() {
  try {
    const res = await fetch('/api/messages/poll');
    const data = await res.json();
    updateUI(data);
  } catch (err) {
    await new Promise(r => setTimeout(r, 3000)); // 失败后等待重试
  }
  longPoll(); // 立即发起下一次轮询
}
```

## WebSocket 协议

WebSocket 是一种在单个 TCP 连接上进行全双工通信的协议，适合需要实时双向通信的场景。

### WebSocket 握手

WebSocket 通过 HTTP Upgrade 机制建立连接：

```http
# 客户端发起握手请求
GET /chat HTTP/1.1
Host: server.example.com
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
Origin: https://example.com

# 服务器响应
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

握手流程：
1. 客户端发送 HTTP 请求，包含 `Upgrade: websocket` 头
2. 服务器返回 `101 Switching Protocols`，同意协议切换
3. 连接升级为 WebSocket，后续使用 WebSocket 帧格式通信

### WebSocket 帧格式

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-------+-+-------------+-------------------------------+
|F|R|R|R| opcode|M| Payload len |    Extended payload length    |
|I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
|N|V|V|V|       |S|             |   (if payload len==126/127)   |
| |1|2|3|       |K|             |                               |
+-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
|     Extended payload length continued, if payload len == 127  |
+ - - - - - - - - - - - - - - - +-------------------------------+
|                               |Masking-key, if MASK set to 1  |
+-------------------------------+-------------------------------+
| Masking-key (continued)       |          Payload Data         |
+-------------------------------- - - - - - - - - - - - - - - - +
:                     Payload Data continued ...                :
+ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
|                     Payload Data (continued)                  |
+---------------------------------------------------------------+
```

常用操作码（Opcode）：

| Opcode | 含义 |
|--------|------|
| 0x0 | 继续帧 |
| 0x1 | 文本帧 |
| 0x2 | 二进制帧 |
| 0x8 | 关闭连接 |
| 0x9 | Ping |
| 0xA | Pong |

### 基本使用

```javascript
// 创建 WebSocket 连接
const ws = new WebSocket('wss://api.example.com/chat');

// 连接建立
ws.onopen = () => {
  console.log('连接已建立');
  ws.send(JSON.stringify({ type: 'join', room: 'general' }));
};

// 接收消息
ws.onmessage = (event) => {
  if (typeof event.data === 'string') {
    const message = JSON.parse(event.data);
    console.log('收到消息:', message);
  } else {
    // 二进制数据 (Blob 或 ArrayBuffer)
    console.log('收到二进制数据:', event.data);
  }
};

// 连接关闭
ws.onclose = (event) => {
  console.log('连接关闭:', event.code, event.reason);
};

// 错误处理
ws.onerror = (error) => {
  console.error('WebSocket 错误:', error);
};

// 发送消息
ws.send('Hello!');
ws.send(JSON.stringify({ type: 'message', content: '你好' }));
```

### 心跳机制（Ping/Pong）

心跳机制用于检测连接是否存活，防止连接因长时间空闲被中间设备断开。

```javascript
class HeartbeatWebSocket {
  constructor(url, options = {}) {
    this.url = url;
    this.heartbeatInterval = options.heartbeatInterval || 30000; // 30秒
    this.heartbeatTimeout = options.heartbeatTimeout || 5000;    // 5秒超时
    this.connect();
  }

  connect() {
    this.ws = new WebSocket(this.url);
    this.ws.onopen = () => {
      console.log('连接已建立');
      this.startHeartbeat();
    };
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'pong') {
        this.onPong();
        return;
      }
      this.onMessage?.(data);
    };
    this.ws.onclose = () => {
      this.stopHeartbeat();
      this.onClose?.();
    };
  }

  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      this.ws.send(JSON.stringify({ type: 'ping' }));
      this.pongTimer = setTimeout(() => {
        // 超时未收到 pong，断开重连
        console.log('心跳超时，断开连接');
        this.ws.close();
      }, this.heartbeatTimeout);
    }, this.heartbeatInterval);
  }

  onPong() {
    clearTimeout(this.pongTimer);
  }

  stopHeartbeat() {
    clearInterval(this.heartbeatTimer);
    clearTimeout(this.pongTimer);
  }
}
```

### 重连策略

```javascript
class ReconnectWebSocket {
  constructor(url, options = {}) {
    this.url = url;
    this.maxRetries = options.maxRetries || 10;
    this.baseDelay = options.baseDelay || 1000;
    this.retries = 0;
    this.connect();
  }

  connect() {
    this.ws = new WebSocket(this.url);
    this.ws.onopen = () => {
      this.retries = 0; // 重置重连计数
      console.log('连接成功');
    };
    this.ws.onclose = (event) => {
      // 非主动关闭时尝试重连
      if (!event.wasClean && this.retries < this.maxRetries) {
        this.reconnect();
      }
    };
  }

  reconnect() {
    this.retries++;
    // 指数退避 + 随机抖动
    const delay = Math.min(
      this.baseDelay * Math.pow(2, this.retries) + Math.random() * 1000,
      30000 // 最大延迟 30 秒
    );
    console.log(`${delay}ms 后第 ${this.retries} 次重连`);
    setTimeout(() => this.connect(), delay);
  }
}
```

## SSE（Server-Sent Events）

SSE 是一种服务器向客户端单向推送数据的技术，基于 HTTP 协议，使用简单。

### EventSource API

```javascript
// 基本使用
const source = new EventSource('/api/events');

// 监听默认消息
source.onmessage = (event) => {
  console.log('收到消息:', event.data);
};

// 监听自定义事件
source.addEventListener('notification', (event) => {
  const data = JSON.parse(event.data);
  console.log('通知:', data);
});

// 错误处理与自动重连
source.onerror = (event) => {
  if (source.readyState === EventSource.CONNECTING) {
    console.log('连接断开，正在自动重连...');
  } else if (source.readyState === EventSource.CLOSED) {
    console.log('连接已关闭');
  }
};

// 手动关闭连接
source.close();
```

### 服务端实现

```javascript
// Node.js SSE 端点
const express = require('express');
const app = express();

app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // 发送消息格式：data: <message>\n\n
  res.write('data: {"type":"connected"}\n\n');

  // 自定义事件
  res.write('event: notification\ndata: {"title":"新消息"}\n\n');

  // 带 ID 的消息（用于 Last-Event-ID 重连）
  res.write('id: 1001\ndata: {"content":"带 ID 的消息"}\n\n');

  // 定时发送
  const timer = setInterval(() => {
    res.write(`data: ${JSON.stringify({ time: Date.now() })}\n\n`);
  }, 5000);

  req.on('close', () => {
    clearInterval(timer);
  });
});
```

### Last-Event-ID 重连

```javascript
// SSE 自动重连时会发送 Last-Event-ID 头
// 服务端据此返回该 ID 之后的消息，实现消息不丢失
// GET /api/events
// Last-Event-ID: 1001
```

## 通信方式选择指南

```
                    ┌──────────────────────┐
                    │  需要双向通信吗？       │
                    └─────┬──────────┬─────┘
                     Yes  │          │ No
                          │          │
                  ┌───────▼───┐  ┌──▼──────────────┐
                  │ WebSocket │  │ 只需要服务器推送？  │
                  │ 聊天/游戏  │  └──┬──────────┬───┘
                  │ 协同编辑   │  Yes│          │ No
                  └───────────┘     │          │
                            ┌───────▼───┐  ┌──▼──────────┐
                            │    SSE    │  │  HTTP 轮询   │
                            │  通知/数据流│  │  简单定时刷新 │
                            └───────────┘  └─────────────┘
```

| 场景 | 推荐方案 | 原因 |
|------|---------|------|
| 聊天应用 | WebSocket | 需要双向实时通信 |
| 在线游戏 | WebSocket | 低延迟双向数据传输 |
| 协同编辑 | WebSocket | 多用户实时同步 |
| 消息通知 | SSE | 简单的服务器推送 |
| 实时数据面板 | SSE | 服务器单向推送 |
| 股票行情 | WebSocket | 高频双向数据 |
| 简单状态检查 | HTTP 轮询 | 最简单，兼容性最好 |

## 面试要点

1. **WebSocket vs HTTP**：理解全双工与半双工的区别
2. **握手过程**：WebSocket 通过 HTTP Upgrade 机制建立连接
3. **心跳与重连**：掌握心跳保活和指数退避重连策略
4. **SSE 特点**：自动重连、Last-Event-ID、单向推送
5. **选型依据**：根据场景选择合适的实时通信方案

## 常见面试题

**Q: WebSocket 和 HTTP 的区别？**

A: HTTP 是半双工（请求-响应模式），WebSocket 是全双工（双方可同时发送）。WebSocket 通过 HTTP Upgrade 握手后，使用独立的 WebSocket 协议通信，头部开销更小（2-14 字节 vs HTTP 数百字节）。WebSocket 适合实时双向通信场景，HTTP 适合请求-响应模式。

**Q: WebSocket 如何实现心跳保活？**

A: 客户端定期发送 Ping 帧（或自定义 ping 消息），服务器回复 Pong 帧。如果超时未收到 Pong，认为连接已断开，主动关闭并触发重连。心跳间隔通常 30 秒，超时 5 秒。

**Q: SSE 和 WebSocket 分别适用于什么场景？**

A: SSE 适用于服务器单向推送的场景，如消息通知、实时数据看板、日志流。优势是基于 HTTP、自动重连、实现简单。WebSocket 适用于需要双向通信的场景，如聊天、游戏、协同编辑。如果只需要服务器推送，SSE 更简单可靠。

**Q: WebSocket 断线重连的策略？**

A: 使用指数退避策略：第一次重连等待 1 秒，第二次 2 秒，第三次 4 秒，依次翻倍直到最大延迟（如 30 秒），同时加入随机抖动防止多个客户端同时重连导致服务器压力突增（惊群效应）。重连成功后重置计数器。
