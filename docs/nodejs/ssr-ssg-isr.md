---
sidebar_position: 1
title: SSR / SSG / ISR 原理与对比
---

# SSR / SSG / ISR 原理与对比

服务端渲染是现代前端框架的核心能力之一。理解 SSR、SSG、ISR 三种渲染策略的原理和适用场景，是前端架构设计的基础。

## 📖 核心概念

### CSR（Client-Side Rendering）

传统的客户端渲染模式，浏览器加载空 HTML 后由 JavaScript 完成渲染。

```
浏览器请求 → 返回空 HTML + JS Bundle → JS 执行 → API 请求 → 渲染页面
```

**优点**：服务器压力小、前后端分离清晰、交互体验流畅

**缺点**：首屏白屏时间长、SEO 不友好、TTFCP（Time to First Contentful Paint）高

### SSR（Server-Side Rendering）

服务端在每次请求时动态生成 HTML 并返回给浏览器。

```
浏览器请求 → 服务端获取数据 → 生成完整 HTML → 返回浏览器 → Hydration → 可交互
```

**工作原理**：

```js
// Next.js SSR 示例（App Router）
// app/posts/[id]/page.tsx
export default async function PostPage({ params }) {
  // 服务端执行：在 Node.js 环境中运行
  const post = await fetch(`https://api.example.com/posts/${params.id}`, {
    cache: 'no-store', // 每次请求都重新获取
  }).then(res => res.json());

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
}
```

**优点**：首屏渲染快、SEO 友好、社交分享预览完整

**缺点**：服务器压力大、TTFB 受服务端性能影响、需要处理 Hydration

### SSG（Static Site Generation）

在构建时预先生成静态 HTML 文件，部署到 CDN 直接分发。

```
构建阶段 → 预渲染所有页面为静态 HTML → 部署到 CDN → 用户请求直接返回
```

**工作原理**：

```js
// Next.js SSG 示例
// app/about/page.tsx
export default async function AboutPage() {
  // 构建时执行：生成静态 HTML
  const data = await fetch('https://api.example.com/about');

  return <div>{/* 静态内容 */}</div>;
}

// 生成静态路由参数
export async function generateStaticParams() {
  const posts = await fetch('https://api.example.com/posts').then(r => r.json());
  return posts.map(post => ({ id: post.id }));
}
```

**优点**：加载速度极快（CDN 分发）、服务器零压力、安全性高

**缺点**：内容更新需要重新构建、不适合动态内容、构建时间随页面增长

### ISR（Incremental Static Regeneration）

结合 SSG 和 SSR 的优势，在静态生成的基础上支持增量更新。

```
首次请求 → 返回缓存的静态 HTML + 后台异步重新生成
           → 后续请求返回新生成的静态 HTML
```

**工作原理**：

```js
// Next.js ISR 示例
// app/products/[id]/page.tsx
export default async function ProductPage({ params }) {
  const product = await fetch(`https://api.example.com/products/${params.id}`, {
    next: { revalidate: 60 }, // 60 秒后重新验证
  }).then(res => res.json());

  return <ProductDetail product={product} />;
}

// 按需重新验证（On-Demand Revalidation）
// app/api/revalidate/route.ts
import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(request) {
  const { path, tag } = await request.json();

  if (path) revalidatePath(path);
  if (tag) revalidateTag(tag);

  return Response.json({ revalidated: true, now: Date.now() });
}
```

**优点**：兼具静态性能和动态更新能力、无需完整重新构建

**缺点**：首次请求可能返回旧内容、缓存一致性问题、复杂度较高

## 📊 详细对比

| 特性 | CSR | SSR | SSG | ISR |
|------|-----|-----|-----|-----|
| **渲染时机** | 浏览器 | 服务端（每次请求） | 构建时 | 构建时 + 增量更新 |
| **首屏速度** | ❌ 慢 | ✅ 快 | ✅✅ 极快 | ✅✅ 极快 |
| **SEO** | ❌ 差 | ✅ 好 | ✅✅ 极好 | ✅✅ 极好 |
| **服务器压力** | ✅ 低 | ❌ 高 | ✅ 零 | ✅ 低 |
| **数据实时性** | ✅ 实时 | ✅ 实时 | ❌ 构建时快照 | 🟡 延迟更新 |
| **构建时间** | ✅ 短 | ✅ 短 | ❌ 长 | 🟡 中等 |
| **适用场景** | 后台管理系统 | 动态内容、需 SEO | 博客、文档站 | 电商、新闻站 |

## 🏗️ 架构流程图

### SSR 完整流程

```
用户请求
    │
    ▼
┌─────────────────┐
│   CDN / 负载均衡  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│   Node.js 服务器  │────▶│   数据源 API     │
│                 │◀────│                 │
│  1. 获取数据     │     └─────────────────┘
│  2. 渲染组件     │
│  3. 生成 HTML    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  返回完整 HTML   │
│  + JS Bundle    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  浏览器 Hydrate  │
│  绑定事件 → 可交互│
└─────────────────┘
```

### ISR 缓存策略

```
用户请求
    │
    ▼
┌──────────────────┐
│  检查 ISR 缓存    │
│  (CDN / 内存)     │
└──────┬───────────┘
       │
   ┌───┴───┐
   │ 缓存?  │
   └───┬───┘
   Yes │         No
   ┌───┘         └───┐
   ▼                 ▼
┌────────┐    ┌──────────────┐
│直接返回 │    │ SSR 渲染页面   │
│缓存HTML │    │ 写入缓存      │
└────────┘    └──────────────┘

revalidate 过期后：
第一个请求返回旧缓存 → 后台触发重新生成 → 后续请求返回新内容
```

## 🔑 面试高频问题

### 1. SSR 的 Hydration 是什么？为什么会有 Hydration mismatch？

**Hydration（注水）** 是将服务端渲染的静态 HTML 与客户端 JavaScript 建立关联的过程。React 会在客户端重新执行组件逻辑，为 DOM 元素绑定事件监听器。

**Hydration mismatch** 产生的原因：

```jsx
// ❌ 会导致 Hydration mismatch
function Component() {
  return <div>{new Date().toLocaleString()}</div>;
  // 服务端和客户端时间不同，导致不匹配
}

// ✅ 正确做法：使用 useEffect 在客户端更新
function Component() {
  const [time, setTime] = useState('');

  useEffect(() => {
    setTime(new Date().toLocaleString());
  }, []);

  return <div>{time}</div>;
}
```

### 2. 什么场景用 SSG，什么场景用 ISR？

**SSG 适用**：内容变化频率低的页面（文档、博客、营销页）

**ISR 适用**：内容需要定期更新但不要求实时性的页面（商品详情、文章列表）

### 3. SSR 流式渲染（Streaming SSR）是什么？

```jsx
// React 18 流式 SSR
import { Suspense } from 'react';

export default function Page() {
  return (
    <main>
      <h1>页面标题</h1>
      <Suspense fallback={<Loading />}>
        <SlowComponent />  {/* 这部分可以延迟流式传输 */}
      </Suspense>
    </main>
  );
}
```

流式 SSR 允许服务端分块发送 HTML，浏览器可以逐步渲染，减少 TTFB。

### 4. Edge Runtime 和 Node.js Runtime 的区别？

| 特性 | Node.js Runtime | Edge Runtime |
|------|-----------------|--------------|
| 冷启动 | 慢（~250ms） | 快（~5ms） |
| API 兼容性 | 完整 Node.js API | Web API 子集 |
| 包大小限制 | 无严格限制 | 通常 < 4MB |
| 部署位置 | 集中式服务器 | 全球边缘节点 |
| 适用场景 | 复杂计算、数据库连接 | 轻量逻辑、A/B 测试 |

### 5. 如何选择渲染策略？

```
                    ┌─────────────────┐
                    │  页面需要 SEO？   │
                    └───────┬─────────┘
                       No   │    Yes
                    ┌───────┘    └───────┐
                    ▼                    ▼
                  CSR           ┌────────────────┐
               (后台系统)        │ 数据变化频率？    │
                                └───────┬────────┘
                                   ┌────┴────┐
                                低频       高频
                               ┌───┘         └───┐
                               ▼                  ▼
                          ┌─────────┐      ┌──────────┐
                          │是否需要   │      │ 实时性要求？│
                          │按需更新？ │      └────┬─────┘
                          └────┬────┘       ┌────┴────┐
                           No  │  Yes    高       低
                           ┌───┘  └───┐   │        │
                           ▼         ▼   ▼        ▼
                         SSG       ISR  SSR    ISR
```
