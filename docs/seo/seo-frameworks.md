---
sidebar_position: 3
title: SSR/SSG 对 SEO 的影响
---

# SSR/SSG 对 SEO 的影响

> **"SPA 的用户体验很好，但搜索引擎可能根本看不到你的内容"** —— 理解爬虫如何渲染页面，是前端 SEO 最核心的知识点之一。

## 核心问题：爬虫能"看到"你的页面吗？

```
CSR（客户端渲染）的问题
═══════════════════════════════════════════════════════

浏览器访问 CSR 页面：
  1. 服务器返回一个空的 HTML（只有 <div id="root"></div>）
  2. 浏览器下载并执行 JavaScript
  3. JS 渲染出完整的 DOM
  4. 用户看到完整页面 ✅

爬虫访问 CSR 页面：
  1. 服务器返回一个空的 HTML（只有 <div id="root"></div>）
  2. 爬虫看到的是空 HTML ❌
  3. 可能不会执行 JS（或者延迟执行）
  4. 搜索结果中看不到页面内容 ❌
```

## Googlebot 的两波索引机制

```
Googlebot 渲染流程（两波索引）
═══════════════════════════════════════════════════════

第一波：抓取 HTML（Crawling）
  ├── Googlebot 请求 URL
  ├── 获取服务器返回的 HTML
  ├── 解析 HTML 中的链接、文字、meta 标签
  └── 如果 HTML 中已有完整内容 → 直接索引 ✅

第二波：执行 JavaScript（Rendering）
  ├── 将页面加入渲染队列
  ├── 等待 Google 的 Web Rendering Service（WRS）处理
  ├── WRS 基于 Chrome 渲染页面
  ├── 执行所有 JavaScript
  ├── 提取渲染后的 DOM 内容
  └── 更新索引

⚠️ 关键问题：
  • 第一波和第二波之间可能有 数小时到数天 的延迟
  • WRS 的资源有限，不是所有页面都会被渲染
  • CSR 页面的内容在第二波才可见 → 索引延迟或丢失
```

## CSR vs SSR vs SSG 对比

```
三种渲染方式对比
═══════════════════════════════════════════════════════

CSR（Client-Side Rendering）
  HTML 内容：空（只有 JS bundle）
  首屏速度：慢（需要下载 + 执行 JS）
  SEO：❌ 差（爬虫可能看不到内容）
  适用：后台管理系统、登录后的页面

SSR（Server-Side Rendering）
  HTML 内容：完整（每次请求在服务端渲染）
  首屏速度：快（直接返回 HTML）
  SEO：✅ 好（爬虫直接看到完整内容）
  适用：新闻网站、电商商品页、博客

SSG（Static Site Generation）
  HTML 内容：完整（构建时生成静态文件）
  首屏速度：最快（CDN 直接返回静态文件）
  SEO：✅ 最好（纯静态 HTML，爬虫最爱）
  适用：文档站、博客、营销页面
```

| 特性 | CSR | SSR | SSG |
|------|-----|-----|-----|
| HTML 内容 | 空 | 完整 | 完整 |
| 首屏速度 | 慢 | 快 | 最快 |
| SEO 友好度 | 差 | 好 | 最好 |
| 服务器压力 | 低 | 高 | 无（CDN） |
| 数据实时性 | 实时 | 实时 | 构建时 |
| 适用场景 | 后台管理 | 动态内容 | 静态内容 |

## 解决方案一：SSR（服务端渲染）

### Next.js SSR 示例

```tsx
// pages/article/[slug].tsx（Pages Router）
export async function getServerSideProps({ params }) {
  const article = await fetch(`https://api.example.com/articles/${params.slug}`)
    .then(res => res.json());

  // 服务端直接获取数据，渲染为完整 HTML
  return {
    props: { article },
  };
}

export default function ArticlePage({ article }) {
  return (
    <article>
      <h1>{article.title}</h1>
      <p>{article.content}</p>
    </article>
  );
}
```

### Next.js App Router SSR 示例

```tsx
// app/article/[slug]/page.tsx
export default async function ArticlePage({ params }) {
  const article = await fetch(`https://api.example.com/articles/${params.slug}`)
    .then(res => res.json());

  return (
    <article>
      <h1>{article.title}</h1>
      <p>{article.content}</p>
    </article>
  );
}

// 默认就是 Server Component，服务端渲染
```

## 解决方案二：SSG（静态站点生成）

### Next.js SSG 示例

```tsx
// pages/article/[slug].tsx（Pages Router）
export async function getStaticPaths() {
  const articles = await fetch('https://api.example.com/articles')
    .then(res => res.json());

  return {
    paths: articles.map(a => ({ params: { slug: a.slug } })),
    fallback: 'blocking', // 未预渲染的页面在请求时生成
  };
}

export async function getStaticProps({ params }) {
  const article = await fetch(`https://api.example.com/articles/${params.slug}`)
    .then(res => res.json());

  return {
    props: { article },
    revalidate: 3600, // ISR：每小时重新生成一次
  };
}
```

**ISR（增量静态再生）：** 结合 SSG 和 SSR 的优点，静态页面可以在后台更新，无需重新构建整个站点。

## 解决方案三：预渲染（Prerendering）

预渲染在构建时使用无头浏览器（Headless Chrome）访问页面，保存渲染后的 HTML。

```bash
# 使用 react-snap 预渲染
npm install react-snap

# package.json
{
  "scripts": {
    "postbuild": "react-snap"
  }
}
```

```json
// package.json 中的 react-snap 配置
{
  "reactSnap": {
    "source": "build",
    "include": ["/", "/about", "/articles/*"],
    "puppeteerArgs": ["--no-sandbox"]
  }
}
```

**原理：**
1. 构建 SPA 应用
2. react-snap 启动 Puppeteer
3. 访问每个路由，等待 JS 渲染完成
4. 保存渲染后的 HTML 到文件
5. 爬虫访问时直接返回预渲染的 HTML

**优点：** 不需要修改现有 CSR 代码
**缺点：** 只适用于静态内容，构建时间长，动态数据需要额外处理

## 解决方案四：动态渲染（Dynamic Rendering）

动态渲染根据请求的 User-Agent 决定返回 CSR 还是预渲染 HTML。

```
动态渲染原理
═══════════════════════════════════════════════════════

请求到达服务器
  ├── User-Agent 是爬虫？
  │   ├── 是 → 使用 Puppeteer 渲染 → 返回完整 HTML
  │   └── 否 → 返回正常 CSR HTML
  └── 浏览器执行 JS → 正常渲染

常用工具：
  • Rendertron（Google 开源）
  • Puppeteer
  • prerender.io（付费服务）
```

### Rendertron 部署示例

```javascript
// Express 中间件
const rendertron = require('rendertron-middleware');

app.use(
  rendertron.makeMiddleware({
    proxyUrl: 'http://rendertron.example.com/render',
    userAgentPattern: /bot|crawler|spider|preview/i,
  })
);

// 普通请求正常返回 CSR HTML
// 爬虫请求代理到 Rendertron 获取预渲染 HTML
```

**Google 的态度：** Google 官方文档将动态渲染列为一种"workaround"（临时方案），不推荐作为长期策略。优先建议使用 SSR 或 SSG。

## 各方案选择决策树

```
如何选择渲染方案？
═══════════════════════════════════════════════════════

你的页面内容是静态的吗？
  ├── 是 → SSG（Next.js SSG / Astro / Gatsby）
  │         最好的 SEO，最快的加载速度
  │
  └── 否（需要实时数据）
      ├── 能用 SSR 吗？
      │   ├── 是 → SSR（Next.js / Nuxt.js）
      │   │         好的 SEO，需要服务器
      │   └── 否（无法改造为 SSR）
      │       ├── 能用预渲染吗？
      │       │   ├── 是 → 预渲染（react-snap）
      │       │   └── 否 → 动态渲染（Rendertron）
      │       └── 最差选择：保持 CSR + 确保 Googlebot 能渲染
      └── 考虑 ISR（增量静态再生）
            SSG + 定时重新生成，兼顾性能和数据新鲜度
```

## Vue 生态的 SEO 方案

### Nuxt.js SSR

```vue
<!-- pages/article/[slug].vue -->
<script setup>
const route = useRoute();
const { data: article } = await useFetch(`/api/articles/${route.params.slug`);

// Nuxt 3 自动处理 SSR
useHead({
  title: article.value.title,
  meta: [
    { name: 'description', content: article.value.summary },
    { property: 'og:title', content: article.value.title },
  ],
});
</script>

<template>
  <article>
    <h1>{{ article.title }}</h1>
    <p>{{ article.content }}</p>
  </article>
</template>
```

### Nuxt.js SSG

```bash
# 静态生成
npx nuxi generate
```

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  // 静态生成模式
  ssr: true,
  nitro: {
    prerender: {
      routes: ['/about', '/contact'],
    },
  },
});
```

## 面试高频问题

| 问题 | 关键答案 |
|------|----------|
| CSR 为什么对 SEO 不友好？ | 服务器返回空 HTML，爬虫需要执行 JS 才能看到内容 |
| Googlebot 两波索引是什么？ | 第一波抓 HTML，第二波执行 JS 渲染；两波之间有延迟 |
| SSR 和 SSG 的核心区别？ | SSR 每次请求在服务端渲染，SSG 构建时生成静态文件 |
| 什么是 ISR？ | 增量静态再生，SSG + 定时后台重新生成 |
| 动态渲染 Google 推荐吗？ | 不推荐作为长期方案，是临时 workaround |
| 如何判断应该用 SSR 还是 SSG？ | 内容是否频繁变化：静态用 SSG，动态用 SSR |
| 预渲染和 SSR 的区别？ | 预渲染在构建时生成，SSR 在请求时生成 |
