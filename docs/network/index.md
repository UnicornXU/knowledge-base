---
sidebar_position: 0
title: "计算机网络"
slug: /network
---

# 计算机网络

计算机网络是前端面试中考察频率较高的基础知识，涵盖协议原理、缓存策略、安全防护等核心内容。

## 内容导航

| 文档 | 难度 | 说明 |
|------|------|------|
| [TCP 与连接建立](./tcp.md) | 🟡 中 | 三次握手、四次挥手、TCP 与 UDP、拥塞控制 |
| [HTTP 协议](./http.md) | 🟡 中 | HTTP 版本演进、请求方法、状态码、HTTPS |
| [HTTP 缓存策略](./cache.md) | 🟡 中 | 强缓存、协商缓存、Service Worker 缓存 |
| [WebSocket 与实时通信](./websocket.md) | 🟡 中 | WebSocket、SSE、轮询对比 |
| [DNS 解析与网络安全](./dns.md) | 🟡 中 | DNS 解析、XSS/CSRF/点击劫持、安全头 |

## 学习路线

```
TCP 与连接建立 → HTTP 协议 → HTTP 缓存策略 → WebSocket → DNS 与网络安全
    (基础)        (核心)       (重点)        (进阶)      (综合)
```

## 面试考察重点

- **TCP 三次握手**：为什么是三次而不是两次或四次
- **HTTP 版本差异**：HTTP/1.1 vs 2.0 vs 3.0 的核心改进
- **缓存策略**：强缓存与协商缓存的配合使用
- **HTTPS 握手**：TLS 握手过程与证书验证
- **Web 安全**：XSS、CSRF 的原理与防御方案
- **跨域解决方案**：CORS、代理、JSONP 的适用场景

import DocCardList from '@theme/DocCardList';

<DocCardList />
