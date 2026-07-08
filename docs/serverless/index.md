---
sidebar_position: 0
title: Serverless 与边缘计算
slug: /serverless
---

# Serverless 与边缘计算

> **"Serverless 不是没有服务器，而是你不再需要关心服务器"** —— Serverless 和边缘计算正在重塑前端工程师的能力边界，从单纯的 UI 开发延伸到全链路应用架构。

## 什么是 Serverless？

```
Serverless 的本质
═══════════════════════════════════════════════════════

传统模式：  开发者 = 代码 + 服务器管理 + 扩容 + 运维
Serverless：开发者 = 代码（平台自动处理其余一切）

核心特征：
• 无需管理服务器 —— 平台自动分配计算资源
• 按需计费 —— 没有请求就没有费用
• 自动弹性伸缩 —— 从 0 到无限个实例
• 事件驱动 —— 由 HTTP 请求、消息队列、定时任务等触发

类比理解：
  传统服务器 = 自己买车位停车（固定成本）
  Serverless = 打网约车（用一次付一次钱）
```

## 为什么前端工程师需要关注？

```
前端工程师的能力边界在扩展
═══════════════════════════════════════════════════════

过去：前端 = HTML + CSS + JS → 浏览器端
现在：前端 = UI + BFF + 边缘函数 + 存储 → 全链路

Serverless 让前端工程师可以：
├── 不学运维，就能部署后端服务
├── 不买服务器，就能运行 API
├── 不配 CDN，就能实现边缘计算
└── 不写后端框架，就能处理表单、鉴权、数据库
```

## 🗺️ 知识图谱

```
Serverless 与边缘计算技术体系
═══════════════════════════════════════════════════════

Serverless 核心
├── FaaS（Function as a Service）
│   ├── AWS Lambda
│   ├── Vercel Serverless Functions
│   ├── Netlify Functions
│   └── 阿里云函数计算
├── BaaS（Backend as a Service）
│   ├── 数据库（Supabase / PlanetScale / Neon）
│   ├── 认证（Clerk / Auth0 / Firebase Auth）
│   ├── 存储（Cloudflare R2 / AWS S3）
│   └── 消息队列（Upstash Redis / SQS）
└── 冷启动 / 热执行 / 并发限制 / 超时策略

边缘计算
├── Edge Runtime
│   ├── Vercel Edge Functions（V8 Isolates）
│   ├── Cloudflare Workers（V8 Isolates）
│   ├── Deno Deploy（Deno Runtime）
│   └── Netlify Edge Functions（Deno Runtime）
├── 边缘存储
│   ├── Cloudflare KV（键值存储）
│   ├── Cloudflare D1（SQLite 数据库）
│   ├── Cloudflare R2（对象存储）
│   └── Vercel KV / Vercel Postgres
└── 边缘 vs 服务器 vs CDN

Serverless 前端模式
├── BFF（Backend For Frontend）
├── API Gateway 模式
├── 事件驱动架构
├── 流式响应（Streaming）
└── 增量静态再生成（ISR）
```

## 📚 内容导航

| 文档 | 难度 | 说明 |
|------|------|------|
| [边缘计算与 Edge Runtime](./edge-computing.md) | 🔴 高 | Vercel Edge Functions、Cloudflare Workers、Deno Deploy 原理与对比 |
| [Serverless 前端应用模式](./serverless-patterns.md) | 🔴 高 | BFF、API Gateway、事件驱动、冷启动优化、流式响应 |
| [Cloudflare Workers 实践](./cloudflare-workers.md) | 🔴 高 | KV/D1/R2 存储、Durable Objects、实际部署与调试 |

## 🎯 学习路线

```
推荐学习顺序
═══════════════════════════════════════════════════════

第一阶段：理解核心概念
  Serverless 定义 → FaaS vs BaaS → 边缘计算概念 → Edge Runtime

第二阶段：掌握边缘运行时
  Vercel Edge Functions → Cloudflare Workers → Deno Deploy

第三阶段：Serverless 架构模式
  BFF 模式 → API Gateway → 事件驱动 → 冷启动优化

第四阶段：实战与存储
  Cloudflare KV/D1/R2 → Durable Objects → 完整项目部署
```

## 与传统方案对比

| 维度 | 传统服务器 | Serverless（FaaS） | 边缘计算（Edge） |
|------|-----------|-------------------|-----------------|
| 部署单位 | 整个应用 | 单个函数 | 单个函数 |
| 运行环境 | Node.js / Docker | Node.js / Python | V8 Isolates / Deno |
| 冷启动 | 无 | 有（100ms ~ 数秒） | 极低（< 5ms） |
| 执行时长 | 无限制 | 通常 10s ~ 15min | 通常 < 30s |
| 地理分布 | 单区域 | 多区域（可选） | 全球边缘节点 |
| 计费方式 | 按服务器时长 | 按请求次数 + 执行时长 | 按请求次数 |
| 适用场景 | 长连接、复杂计算 | API、Webhook、定时任务 | 中间件、A/B 测试、鉴权 |

## 面试考察重点

- **Serverless 概念**：FaaS vs BaaS 的区别、冷启动的成因与优化方案
- **边缘计算**：Edge Runtime 与 Node.js 的区别、V8 Isolates 的限制
- **架构模式**：BFF 模式在 Serverless 下的实现、事件驱动架构
- **Cloudflare Workers**：KV/D1/R2 的适用场景、Durable Objects 的用途
- **性能优化**：冷启动优化策略、边缘缓存策略、流式响应
- **方案选型**：何时选择 Serverless、何时选择传统服务器、何时选择边缘计算

import DocCardList from '@theme/DocCardList';

<DocCardList />
