---
sidebar_position: 0
title: React 进阶概述
description: React 进阶知识体系全景 — RSC、并发模式、React 19 新特性深度指南
keywords: [React进阶, RSC, 并发模式, React 19, Suspense, Server Components]
---

# React 进阶概述

React 在 18/19 版本中引入了革命性的架构变化：Server Components、并发渲染、新的数据处理模式。掌握这些进阶知识是现代 React 开发的必备能力。

## React 架构演进

```mermaid
graph LR
    subgraph 演进["React 架构演进路线"]
        direction TB
        V1["React 16<br/>Fiber 架构<br/>可中断渲染"]
        V2["React 18<br/>并发模式<br/>Suspense / Transitions"]
        V3["React 19<br/>Actions / RSC<br/>编译器优化"]
    end

    V1 -->|"重构渲染器"| V2 -->|"重新定义数据流"| V3

    style V1 fill:#e0e0e0,stroke:#616161
    style V2 fill:#bbdefb,stroke:#2196f3
    style V3 fill:#c8e6c9,stroke:#43a047
```

## 核心知识图谱

```mermaid
graph TB
    subgraph REACT_ADVANCED["React 进阶知识体系"]
        direction TB

        subgraph RSC_MODULE["React Server Components"]
            RSC1["Server vs Client 组件"]
            RSC2["流式渲染 Streaming"]
            RSC3["RSC 与 SSR 对比"]
            RSC4["数据获取模式"]
        end

        subgraph CONCURRENT_MODULE["并发模式"]
            CC1["并发渲染原理"]
            CC2["Suspense 机制"]
            CC3["useTransition"]
            CC4["useDeferredValue"]
        end

        subgraph R19_MODULE["React 19 新特性"]
            R191["Actions 模式"]
            R192["useOptimistic"]
            R193["useActionState"]
            R194["React Compiler"]
            R195["新 ref 回调"]
        end
    end

    RSC_MODULE -->|"数据获取"| CONCURRENT_MODULE
    CONCURRENT_MODULE -->|"API 演进"| R19_MODULE

    style RSC_MODULE fill:#e3f2fd,stroke:#2196f3
    style CONCURRENT_MODULE fill:#fff3e0,stroke:#ff9800
    style R19_MODULE fill:#e8f5e9,stroke:#4caf50
```

## React 18/19 核心架构

```mermaid
graph TB
    subgraph ARCH["React 18/19 运行时架构"]
        direction TB

        subgraph SERVER["服务端"]
            RSC_SERVER["RSC 渲染器<br/>生成 RSC Payload"]
            SSR["SSR 渲染器<br/>生成 HTML"]
        end

        subgraph CLIENT["客户端"]
            FIBER["Fiber 树<br/>协调与 Diff"]
            SCHEDULER["Scheduler<br/>优先级调度"]
            RENDERER["渲染器<br/>DOM / Native"]
        end

        subgraph DATA["数据层"]
            ACTIONS["Actions<br/>服务端/客户端动作"]
            CACHE["缓存层<br/>fetch + memo"]
        end
    end

    RSC_SERVER -->|"RSC Payload<br/>流式传输"| FIBER
    SSR -->|"HTML + JS Bundle"| CLIENT
    ACTIONS --> SERVER
    ACTIONS --> CLIENT
    SCHEDULER --> FIBER

    style SERVER fill:#e3f2fd,stroke:#2196f3
    style CLIENT fill:#e8f5e9,stroke:#4caf50
    style DATA fill:#fff3e0,stroke:#ff9800
```

## 并发渲染优先级模型

```mermaid
graph TB
    subgraph PRIORITY["React 优先级模型"]
        direction TB
        P1["Immediate<br/>离散事件优先级<br/>click, input"]
        P2["UserBlocking<br/>用户阻塞优先级<br/>drag, hover"]
        P3["Normal<br/>普通更新优先级<br/>render, setState"]
        P4["Low<br/>低优先级<br/>offscreen 预渲染"]
        P5["Idle<br/>空闲优先级<br/>离屏内容"]
    end

    P1 --> P2 --> P3 --> P4 --> P5

    style P1 fill:#e53935,color:#fff
    style P2 fill:#ff9800,color:#fff
    style P3 fill:#fbc02d,color:#000
    style P4 fill:#43a047,color:#fff
    style P5 fill:#1e88e5,color:#fff
```

## RSC 数据流总览

```mermaid
sequenceDiagram
    participant Client as 客户端浏览器
    participant Server as Node.js 服务端
    participant DB as 数据源

    Client->>Server: 请求页面
    Server->>DB: Server Component 直接查询
    DB-->>Server: 返回数据
    Server->>Server: 渲染 RSC Payload（流式）
    Server-->>Client: 流式传输 RSC Payload
    Client->>Client: 协调 Client Components
    Note over Client: HTML 可交互

    Client->>Server: 用户交互触发 Action
    Server->>DB: 处理业务逻辑
    DB-->>Server: 返回结果
    Server-->>Client: 增量更新 RSC Payload
```

## 本模块内容导航

| 章节 | 核心内容 | 关键知识点 |
|------|----------|------------|
| [React Server Components](./server-components.md) | RSC 架构与流式渲染 | Server/Client 组件、RSC Payload、SSR 对比 |
| [Suspense 与并发模式](./suspense-concurrent.md) | 并发渲染原理与实践 | Suspense 原理、Transition、useDeferredValue |
| [React 19 新特性](./react-19.md) | Actions 与编译器优化 | useOptimistic、useActionState、React Compiler |

## 学习路线建议

```mermaid
graph LR
    START["开始学习"] --> RSC["先学 RSC<br/>理解服务端/客户端边界"]
    RSC --> SUSPENSE["再学 Suspense<br/>理解并发渲染机制"]
    SUSPENSE --> R19["最后学 React 19<br/>新 API 与编译器"]

    RSC -->|"重点关注"| FOCUS1["数据获取模式<br/>服务端/客户端分工"]
    SUSPENSE -->|"重点关注"| FOCUS2["优先级调度<br/>Transition vs setState"]
    R19 -->|"重点关注"| FOCUS3["Actions 模式<br/>表单与数据变更"]

    style START fill:#ff9800,color:#fff
    style RSC fill:#2196f3,color:#fff
    style SUSPENSE fill:#4caf50,color:#fff
    style R19 fill:#9c27b0,color:#fff
```

## 面试高频问题预览

1. **Server Components 和 Client Components 的区别是什么？** — 运行环境、能力边界、打包方式
2. **Suspense 的工作原理？** — 捕获 Promise、挂起树、fallback UI
3. **useTransition 和 useState 的区别？** — 优先级不同，Transition 不阻塞 UI
4. **React Compiler 做了什么？** — 自动 memo、自动优化重渲染
5. **RSC Payload 是什么格式？** — 类 JSON 的流式协议，描述组件树的序列化表示

---

> **下一步**：从 [React Server Components](./server-components.md) 开始，理解 React 的服务端渲染新范式。
