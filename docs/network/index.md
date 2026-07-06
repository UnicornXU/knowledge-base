---
sidebar_position: 0
title: "计算机网络"
slug: /network
---

# 🌐 计算机网络与安全

计算机网络与 Web 安全是前端面试中考察频率较高的基础知识，涵盖协议原理、缓存策略、安全防护、跨域处理等核心内容。

## 内容导航

### 网络协议

| 文档 | 难度 | 说明 |
|------|------|------|
| [TCP 与连接建立](./tcp.md) | 🟡 中 | 三次握手、四次挥手、TCP 与 UDP、拥塞控制 |
| [HTTP 协议](./http.md) | 🟡 中 | HTTP 版本演进、请求方法、状态码、HTTPS |
| [HTTP 缓存策略](./cache.md) | 🟡 中 | 强缓存、协商缓存、Service Worker 缓存 |
| [WebSocket 与实时通信](./websocket.md) | 🟡 中 | WebSocket、SSE、轮询对比 |
| [DNS 解析](./dns.md) | 🟡 中 | DNS 解析过程、DNS 预解析、DNS over HTTPS |

### 安全与跨域

| 文档 | 难度 | 说明 |
|------|------|------|
| [HTTPS 与 TLS](./https-tls.md) | 🔴 难 | TLS 握手过程、数字证书、加密算法 |
| [Web 安全攻防](./web-security.md) | 🔴 难 | XSS、CSRF、点击劫持、注入攻击、安全响应头 |
| [跨域与 CORS](./cors.md) | 🟡 中 | 同源策略、CORS 配置、代理方案、JSONP |

## 学习路线

```
网络协议基础                 安全与跨域
─────────────              ─────────────
TCP 连接 → HTTP 协议        HTTPS/TLS → Web 安全 → CORS 跨域
  (基础)      (核心)          (加密)     (防御)     (实践)

         ↓ 汇合 ↓

    HTTP 缓存 → WebSocket → DNS 解析
      (重点)      (进阶)      (综合)
```

## 面试考察重点

### 网络协议
- **TCP 三次握手**：为什么是三次而不是两次或四次
- **HTTP 版本差异**：HTTP/1.1 vs 2.0 vs 3.0 的核心改进
- **缓存策略**：强缓存与协商缓存的配合使用

### 安全防护
- **HTTPS 握手**：TLS 1.2 vs 1.3 握手过程与区别
- **Web 安全**：XSS、CSRF 的原理与防御方案
- **安全响应头**：CSP、HSTS、X-Frame-Options 的作用

### 跨域处理
- **CORS**：简单请求与预检请求的区别
- **代理方案**：开发代理与 Nginx 反向代理
- **Cookie 跨域**：SameSite、credentials 的配置

import DocCardList from '@theme/DocCardList';

<DocCardList />
