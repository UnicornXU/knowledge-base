---
sidebar_position: 0
title: Node.js 与服务端渲染
slug: /nodejs
---

# Node.js 与服务端渲染

Node.js 在前端工程化和全栈开发中扮演着核心角色。掌握 Node.js 运行时原理、服务端渲染（SSR）、BFF 架构等知识，是高级前端工程师的必备技能。

## 🗺️ 知识图谱

```
Node.js 与服务端渲染
├── 核心概念
│   ├── 事件循环（Event Loop）
│   ├── 非阻塞 I/O
│   ├── 模块系统（CommonJS / ESM）
│   └── Stream / Buffer
├── 服务端渲染
│   ├── SSR（Server-Side Rendering）
│   ├── SSG（Static Site Generation）
│   ├── ISR（Incremental Static Regeneration）
│   └── RSC（React Server Components）
├── 框架
│   ├── Next.js（React 生态）
│   └── Nuxt.js（Vue 生态）
└── 架构模式
    ├── BFF（Backend For Frontend）
    ├── 微前端
    └── 全栈开发
```

## 📚 内容导航

| 文档 | 难度 | 说明 |
|------|------|------|
| [SSR / SSG / ISR 原理与对比](./ssr-ssg-isr.md) | 🟡 中 | 三种渲染策略的原理、优缺点与适用场景 |
| [Next.js 核心概念与面试题](./nextjs.md) | 🔴 高 | App Router、Server Components、缓存策略 |
| [Nuxt.js 核心概念与面试题](./nuxtjs.md) | 🟡 中 | Nuxt 3 架构、组合式 API、服务端中间件 |
| [BFF 层设计与实践](./bff-pattern.md) | 🔴 高 | 接口聚合、鉴权、错误处理、性能优化 |

## 🎯 学习路线

```
SSR/SSG/ISR 基础 → Next.js 实践 → Nuxt.js 对比 → BFF 架构设计
   (渲染原理)       (React 全栈)    (Vue 全栈)     (后端架构)
```

## 面试考察重点

- **渲染策略**：SSR vs SSG vs ISR 的区别、各自适用场景
- **Next.js**：App Router 与 Pages Router 的区别、Server Components 原理、缓存策略
- **Nuxt.js**：Nuxt 3 的 Composition API、服务端中间件、自动导入机制
- **BFF**：为什么需要 BFF、如何设计接口聚合、鉴权方案
- **性能**：首屏渲染优化、流式 SSR、边缘渲染（Edge Runtime）

## 🧩 Node.js 核心知识点

### 事件循环（Event Loop）

```
   ┌───────────────────────────┐
┌─>│           timers          │  ← setTimeout / setInterval
│  └─────────────┬─────────────┘
│  ┌─────────────▼─────────────┐
│  │     pending callbacks     │  ← 系统级回调
│  └─────────────┬─────────────┘
│  ┌─────────────▼─────────────┐
│  │       idle, prepare       │  ← 内部使用
│  └─────────────┬─────────────┘
│  ┌─────────────▼─────────────┐
│  │           poll            │  ← I/O 回调
│  └─────────────┬─────────────┘
│  ┌─────────────▼─────────────┐
│  │           check           │  ← setImmediate
│  └─────────────┬─────────────┘
│  ┌─────────────▼─────────────┐
└──┤     close callbacks       │  ← socket.on('close')
   └───────────────────────────┘
```

### CommonJS vs ESM

| 特性 | CommonJS | ESM |
|------|----------|-----|
| 加载方式 | 运行时同步加载 | 编译时静态分析 |
| 模块语法 | `require()` / `module.exports` | `import` / `export` |
| Tree Shaking | 不支持 | 支持 |
| 循环依赖 | 返回部分结果 | 引用绑定 |
| 动态导入 | 原生支持 | `import()` |

## 🛠️ 技术栈速查

| 框架 | 生态 | 渲染策略 | 核心优势 |
|------|------|----------|----------|
| Next.js | React | SSR / SSG / ISR / RSC | App Router、Server Components |
| Nuxt.js | Vue | SSR / SSG / ISR / Hybrid | 自动导入、Nitro 引擎 |
| Remix | React | SSR | 嵌套路由、Web 标准 |
| Astro | 多框架 | SSG / Islands | 零 JS 默认、多框架支持 |

import DocCardList from '@theme/DocCardList';

<DocCardList />
