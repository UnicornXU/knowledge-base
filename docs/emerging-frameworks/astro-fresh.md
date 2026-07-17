---
sidebar_position: 3
title: "Astro 与 Islands 架构"
difficulty: "medium"
tags: ["Astro", "Islands", "零JS", "内容网站", "MPA"]
---

# Astro 与 Islands 架构

当大多数框架在"如何让 JavaScript 更快"上竞争时，Astro 提出了一个更根本的问题：**能不能根本不发送 JavaScript？**

---

## Islands 架构详解

### 什么是 Islands Architecture

Islands Architecture（岛屿架构）是一种 Web 架构模式：页面大部分是**静态 HTML**（"海洋"），其中嵌入若干独立的**可交互组件**（"岛屿"）。

```
┌─────────────────────────────────────────┐
│         Static HTML (海洋)               │
│  ┌──────────┐              ┌─────────┐  │
│  │ 交互岛屿  │   纯HTML     │ 交互岛屿 │  │
│  │ (React)  │   内容区域    │ (Vue)   │  │
│  └──────────┘              └─────────┘  │
│                                         │
│  纯HTML导航栏   纯HTML页脚               │
│  ┌──────────────────┐                   │
│  │   交互岛屿 (Svelte) │                  │
│  │   评论组件          │                  │
│  └──────────────────┘                   │
└─────────────────────────────────────────┘
```

每个岛屿：
- 独立水合（hydrate），互不影响
- 可以使用不同框架（React + Vue + Svelte 共存）
- 可以按不同策略加载（立即/空闲时/可见时）

### 核心优势

| 优势 | 说明 |
|------|------|
| 默认零 JS | 页面默认不包含任何 JavaScript |
| 按需加水 | 只有标记为交互的组件才加载 JS |
| 极致性能 | 大部分页面是纯 HTML，加载即完成 |
| 框架无关 | 不同岛屿可以用不同框架 |
| 渐进增强 | 即使 JS 失败，静态内容仍可用 |

:::tip 为什么叫"Islands"
这个比喻来自 Etsy 前端架构师 Katie Sylor-Miller 和 Preact 作者 Jason Miller 的 2020 年文章：静态 HTML 是"海洋"，交互组件是海洋中的"岛屿"。
:::

### 与传统架构对比

| 维度 | SPA | 传统 MPA | Islands (Astro) |
|------|-----|---------|-----------------|
| 首屏 JS | 大量（整个应用） | 少量 | 零/极少 |
| 页面切换 | 客户端路由（快） | 整页刷新 | 整页刷新/View Transitions |
| SEO | 需 SSR | 天然支持 | 天然支持 |
| 交互能力 | 完整 | 有限 | 局部完整 |
| 开发复杂度 | 高 | 低 | 中 |
| 适用场景 | Web 应用 | 简单网站 | 内容为主+局部交互 |

### 部分水合（Partial Hydration）原理

传统 SSR 的问题是"全量水合"：即使页面只有一个按钮需要交互，也要下载并执行整个应用的 JS 来恢复状态和事件。

**部分水合**只对需要交互的组件执行水合：

```
传统 SSR:
  服务端渲染 HTML → 客户端下载全部 JS → 水合整个页面 → 可交互

Islands/部分水合:
  服务端渲染 HTML → 页面立即可见 → 仅下载岛屿 JS → 单独水合各岛屿
```

:::info 性能影响
对于一个典型内容网站，传统 SSR 可能发送 200-500KB JS 用于水合。Islands 架构下，同样的页面可能只发送 20-50KB JS（仅交互部分）。
:::

---

## Astro 深入

### 核心特性

- **零 JS 默认**：组件默认只在服务端渲染，不发送 JS 到客户端
- **多框架支持**：同一项目中混用 React、Vue、Svelte、Solid 组件
- **内容集合**：类型安全的 Markdown/MDX 内容管理
- **中间件**：请求/响应拦截，适合认证、重定向等
- **View Transitions**：内置页面过渡动画 API
- **Server Islands**：服务端动态岛屿（Astro 4.x+）

### .astro 文件语法

Astro 组件使用独特的单文件格式：frontmatter 脚本 + 类 HTML 模板：

```astro
---
// Frontmatter: 服务端执行的 JavaScript/TypeScript
import Header from '../components/Header.astro';
import Counter from '../components/Counter.tsx'; // React 组件

const title = "My Page";
const posts = await fetch('https://api.example.com/posts').then(r => r.json());
---

<!-- 模板: 类 HTML，支持表达式 -->
<html>
<head>
  <title>{title}</title>
</head>
<body>
  <Header />
  
  <main>
    <h1>{title}</h1>
    {posts.map(post => (
      <article>
        <h2>{post.title}</h2>
        <p>{post.excerpt}</p>
      </article>
    ))}
  </main>
  
  <!-- 这个 React 组件会发送 JS 到客户端 -->
  <Counter client:visible />
</body>
</html>

<style>
  /* Scoped CSS，默认不泄漏 */
  h1 { color: navy; }
</style>
```

### 组件集成（多框架混用）

Astro 最独特的能力是在同一项目中混用多个框架：

```astro
---
import ReactNav from '../components/Nav.tsx';
import VueFooter from '../components/Footer.vue';
import SvelteSearch from '../components/Search.svelte';
import SolidChart from '../components/Chart.tsx'; // Solid JSX
---

<ReactNav client:load />

<main>
  <slot />  <!-- 页面内容 -->
</main>

<SvelteSearch client:idle />
<SolidChart client:visible data={chartData} />
<VueFooter />  <!-- 无 client: 指令 = 纯静态 HTML -->
```

:::warning 多框架代价
虽然可以混用框架，但每个框架都会增加 bundle 大小（React ~40KB, Vue ~30KB, Svelte ~2KB）。建议统一使用一个框架作为主力，仅在特殊情况下混用。
:::

### client:* 指令详解

这是 Astro Islands 的核心机制——控制组件何时水合：

| 指令 | 行为 | 适用场景 |
|------|------|----------|
| `client:load` | 页面加载后立即水合 | 关键交互（导航、搜索） |
| `client:idle` | 浏览器空闲时水合 | 非关键交互（侧边栏、推荐） |
| `client:visible` | 组件进入视口时水合 | 页面下方内容（评论、图表） |
| `client:media` | 满足媒体查询时水合 | 仅移动端/桌面端交互 |
| `client:only` | 不SSR，仅客户端渲染 | 依赖浏览器API的组件 |
| 无指令 | 不水合，纯静态 HTML | 无交互需求的展示组件 |

```astro
<!-- 立即加载：关键导航 -->
<Navigation client:load />

<!-- 空闲时加载：非紧急 -->
<Newsletter client:idle />

<!-- 可见时加载：性能优化 -->
<Comments client:visible />

<!-- 仅在移动端加载 -->
<MobileMenu client:media="(max-width: 768px)" />

<!-- 需要 window/document -->
<ThreeScene client:only="react" />
```

### 内容集合（Content Collections）

Astro 提供类型安全的内容管理：

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    tags: z.array(z.string()),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
```

```astro
---
// src/pages/blog/[...slug].astro
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.map(post => ({
    params: { slug: post.slug },
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content } = await post.render();
---

<article>
  <h1>{post.data.title}</h1>
  <Content />
</article>
```

---

## Astro vs Next.js vs Nuxt 对比

| 维度 | Astro | Next.js 14+ | Nuxt 3 |
|------|-------|-------------|--------|
| **默认 JS 量** | 0KB | ~80KB+ | ~50KB+ |
| **构建速度** | 极快（Vite） | 快（Turbopack） | 快（Vite/Nitro） |
| **适用场景** | 内容网站/博客/文档 | Web 应用/电商/SaaS | Web 应用/企业站 |
| **框架锁定** | 无（多框架） | React | Vue |
| **学习曲线** | 低 | 中高 | 中 |
| **数据获取** | frontmatter/loader | Server Components | useFetch/useAsyncData |
| **路由** | 文件系统 | 文件系统(App Router) | 文件系统 |
| **SSR/SSG** | 默认 SSG，可选 SSR | 混合 | 混合 |
| **边缘部署** | ✅ 适配器 | ✅ 原生支持 | ✅ Nitro |
| **交互能力** | 岛屿级 | 完整 SPA | 完整 SPA |
| **SEO** | 天然优秀 | 需要 RSC/SSR | 内置优化 |

:::tip 一句话总结
- **Astro**：内容第一，JS 尽可能少
- **Next.js**：应用第一，功能尽可能全
- **Nuxt**：Vue 生态的 Next.js 等价物
:::

---

## Fresh（Deno 生态）简介

Fresh 是 Deno 官方的全栈 Web 框架，同样采用 Islands 架构：

```typescript
// routes/index.tsx (Fresh)
import Counter from "../islands/Counter.tsx";

export default function Home() {
  return (
    <div>
      <h1>Welcome to Fresh</h1>
      <p>This is static HTML, no JS sent.</p>
      <Counter start={3} />  {/* 这是一个 Island */}
    </div>
  );
}

// islands/Counter.tsx
import { useSignal } from "@preact/signals";

export default function Counter({ start }: { start: number }) {
  const count = useSignal(start);
  return <button onClick={() => count.value++}>{count}</button>;
}
```

### Fresh vs Astro

| 维度 | Fresh | Astro |
|------|-------|-------|
| 运行时 | Deno | Node.js |
| UI 框架 | Preact（固定） | 任意框架 |
| Islands 定义 | `islands/` 目录 | `client:*` 指令 |
| 构建步骤 | 无（JIT 编译） | 需要构建 |
| 部署 | Deno Deploy | 多平台适配器 |
| 生态成熟度 | ⭐⭐ | ⭐⭐⭐⭐ |
| 适用场景 | Deno 生态项目 | 通用内容站 |

:::info Fresh 的定位
Fresh 更适合已经投入 Deno 生态的团队。对于大多数项目，Astro 的多框架支持和更成熟的生态是更安全的选择。
:::

---

## 选型建议

### 按项目类型推荐

```
项目类型                          推荐方案
──────────────────────────────────────────────────
博客/个人网站                   → Astro（纯静态，极快）
文档站/知识库                   → Astro 或 Docusaurus
企业官网/营销页                 → Astro + 少量交互岛屿
电商（内容+交互混合）            → Astro + React Islands
                                 或 Next.js（重交互时）
SaaS/Web 应用（重交互）         → Next.js / Nuxt / SvelteKit
Dashboard/后台管理               → Next.js / Nuxt
实时协作应用                     → Next.js + WebSocket
```

### 决策流程

1. **内容为主？** → Astro（90% 的内容网站选择）
2. **全栈 Web 应用？** → 按团队技术栈选 Next.js/Nuxt/SvelteKit
3. **混合型（内容+应用）？** → Astro + React/Vue Islands 处理交互部分
4. **极致首屏性能？** → Astro（静态）或 Qwik（动态）

:::warning 常见误区
不要因为"Astro 支持 React"就把它当做 React 框架用。如果页面中 80% 以上都是交互组件，说明你需要的是 Next.js/Remix 而不是 Astro。Astro 的优势在内容为主的场景。
:::

---

## 面试题

### Q1：解释 Islands Architecture 的工作原理，它解决了传统 SSR 的什么问题？

**参考答案：** 传统 SSR 的问题是"全量水合"——服务端渲染完 HTML 后，客户端需要下载并执行整个应用的 JavaScript 才能恢复交互。对于内容为主的页面，大部分 HTML 不需要交互，但仍要承担全量 JS 的下载和执行成本。Islands Architecture 解决方案：将页面视为静态 HTML "海洋"中嵌入的独立交互"岛屿"。每个岛屿独立水合，非交互部分保持纯 HTML。这实现了"部分水合"——只为需要交互的组件付出 JS 成本，大幅减少客户端 JS 量。

### Q2：Astro 的 `client:visible` 和 `client:idle` 分别在什么场景使用？如果一个组件同时在首屏且需要交互该用哪个？

**参考答案：** `client:visible` 在组件进入浏览器视口时触发水合，适合页面下方的组件（如评论区、推荐模块）——用户滚动到才加载。`client:idle` 在浏览器空闲时（requestIdleCallback）触发水合，适合当前视口内但非关键交互的组件（如侧边栏 toggle）。如果组件在首屏且需要立即交互（如搜索框、导航菜单），应使用 `client:load`。如果在首屏但交互不紧急（如"返回顶部"按钮），可以用 `client:idle`。

### Q3：为什么说 Astro 适合内容网站但不适合重交互应用？技术层面的限制是什么？

**参考答案：** 技术限制：1）Astro 默认是 MPA（多页应用），页面导航是整页加载而非客户端路由，频繁切换页面的应用体验不如 SPA；2）Islands 之间默认不共享状态，跨组件通信需要额外方案（nanostores/URL params）；3）每个 Island 独立水合意味着如果有 50 个交互组件，就有 50 次独立初始化，反而不如整体水合高效；4）View Transitions 虽然缓解了 MPA 体验，但复杂状态保持仍不如 SPA。当页面交互组件占比超过 50%，Islands 架构的优势消失，此时 Next.js/Nuxt 的整体化方案更合适。

### Q4：如何在 Astro 项目中实现跨 Island 状态共享？

**参考答案：** 由于 Islands 独立水合且可能使用不同框架，传统状态管理库（Redux/Pinia）无法直接使用。推荐方案：1）**nanostores**（推荐）：框架无关的原子状态库，提供 React/Vue/Svelte/Solid 适配器，多个 Island 订阅同一个 store；2）**Custom Events**：通过 DOM 事件通信，简单但不适合复杂状态；3）**URL/搜索参数**：适合路由级状态；4）**Web Storage API**：适合持久化状态。nanostores 示例：`const cartItems = atom([])`——React Island 和 Vue Island 都可以导入并响应式使用这个 store。
