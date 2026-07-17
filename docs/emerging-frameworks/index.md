---
sidebar_position: 1
title: "新兴前端框架概览"
difficulty: "medium"
tags: ["框架", "Signals", "编译时", "2024-2026"]
---

# 新兴前端框架概览

## 2024-2026 前端框架演进趋势

前端框架正在经历第三次重大范式转移。从 jQuery 时代的命令式 DOM 操作，到 React/Vue 时代的声明式虚拟 DOM，再到如今的**编译时优化**与**细粒度响应式**。

### 两大核心趋势

**从虚拟 DOM 到细粒度响应式：**

虚拟 DOM 曾是革命性创新，但其 diff 算法带来的运行时开销正在成为性能瓶颈。新一代框架（Solid.js、Svelte 5、Angular Signals）选择直接追踪依赖关系，精确更新变化的 DOM 节点，无需 diff 整棵虚拟树。

**从运行时到编译时：**

Svelte 和 Angular 的新编译器证明：将框架逻辑从浏览器运行时转移到构建阶段，可以大幅减少产物体积与执行开销。编译器拥有全局视图，能做出运行时无法实现的优化。

:::info 行业信号
2024年 React 团队也开始拥抱编译时（React Compiler），2025年 Vue Vapor Mode 进入稳定版——传统运行时框架也在向编译时靠拢。
:::

---

## 框架代际对比

| 维度 | 第一代 (jQuery) | 第二代 (React/Vue/Angular) | 第三代 (Svelte/Solid/Qwik) |
|------|----------------|---------------------------|---------------------------|
| 时代 | 2006-2013 | 2013-2023 | 2019-至今 |
| 核心范式 | 命令式 DOM 操作 | 声明式 + 虚拟 DOM | 编译时 / 细粒度响应式 |
| 更新粒度 | 手动管理 | 组件级 diff | DOM 节点级精确更新 |
| 运行时大小 | ~90KB | 30-60KB | 0-8KB |
| 心智模型 | "操作 DOM" | "UI = f(state)" | "UI = 编译后的响应图" |
| 代表框架 | jQuery, Backbone | React, Vue 2/3, Angular | Svelte 5, Solid.js, Qwik |

---

## Signals 响应式范式

### 什么是 Signals

Signals 是一种**细粒度响应式的统一抽象**。它表示一个可观察的值，当值变化时自动通知所有订阅者，无需手动管理依赖关系。

```javascript
// Signals 的核心概念
const count = signal(0);        // 创建一个可响应值
const doubled = computed(() => count() * 2);  // 派生计算
effect(() => console.log(doubled()));         // 副作用自动追踪

count.set(1); // 自动触发：doubled=2，effect输出2
```

### TC39 Signals 提案

2024年，TC39 接受了 Signals 提案进入 Stage 1，标志着响应式原语有望成为 JavaScript 语言标准：

- **目标**：提供标准化的 Signal/Computed/Effect 原语
- **动机**：消除各框架重复实现响应式系统的碎片化现状
- **状态**：2025年进入 Stage 2，预计 2027 年进入 Stage 3

### 各框架 Signals 实现对比

```javascript
// Solid.js
const [count, setCount] = createSignal(0);
const doubled = createMemo(() => count() * 2);

// Vue 3 (Composition API)
const count = ref(0);
const doubled = computed(() => count.value * 2);

// Angular Signals (v16+)
const count = signal(0);
const doubled = computed(() => count() * 2);

// Preact Signals
const count = signal(0);
const doubled = computed(() => count.value * 2);

// Svelte 5 Runes
let count = $state(0);
let doubled = $derived(count * 2);
```

| 框架 | API 风格 | 自动追踪 | 组件外使用 | 细粒度更新 |
|------|----------|----------|-----------|-----------|
| Solid.js | 函数调用 `count()` | ✅ | ✅ | ✅ DOM级 |
| Vue 3 | `.value` 访问 | ✅ | ✅ | ⚠️ 组件级 |
| Angular | 函数调用 `count()` | ✅ | ✅ | ✅ DOM级 |
| Preact | `.value` 访问 | ✅ | ✅ | ✅ DOM级 |
| Svelte 5 | 编译器魔法 `$state` | ✅ | ❌ | ✅ DOM级 |

---

## 编译时 vs 运行时框架对比

| 维度 | 运行时框架 (React/Vue) | 编译时框架 (Svelte/Solid) |
|------|----------------------|-------------------------|
| Bundle 基础大小 | 30-50KB | 2-8KB |
| 组件增长曲线 | 线性增长 | 次线性增长 |
| 首屏 TTI | 中等 | 极快 |
| 更新性能 | O(tree) diff | O(1) 精确更新 |
| 开发体验 | 成熟工具链 | 需专用编译器 |
| 调试难度 | 源码即逻辑 | 编译产物需 source map |
| 学习成本 | 低（广泛资料） | 中（新心智模型） |
| 生态成熟度 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

:::tip 选择建议
编译时框架并非一定更好。大型团队项目中，生态成熟度和人才储备往往比原始性能更重要。
:::

---

## 渲染策略演进

```
CSR → SSR → SSG → ISR → Streaming → Resumability
```

| 策略 | 首屏速度 | SEO | 交互延迟 | 服务器成本 | 代表 |
|------|---------|-----|---------|-----------|------|
| CSR | 慢 | ❌ | 低 | 低 | CRA |
| SSR | 快 | ✅ | 高(水合) | 高 | Next.js |
| SSG | 极快 | ✅ | 低 | 极低 | Astro |
| ISR | 极快 | ✅ | 低 | 中 | Next.js ISR |
| Streaming | 快 | ✅ | 渐进式 | 中 | React 18 |
| Resumability | 极快 | ✅ | 零延迟 | 低 | Qwik |

:::warning 注意
Resumability（可恢复性）是 Qwik 提出的激进策略：完全跳过水合（hydration），序列化应用状态到 HTML，按需懒加载事件处理器。虽然理念先进，但生态仍不成熟。
:::

---

## 主流新兴框架定位

按**性能**、**开发体验（DX）**、**生态成熟度**三个维度：

| 框架 | 性能 | DX | 生态 | 最佳场景 |
|------|------|-----|------|----------|
| Svelte 5 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 中小型应用、追求极致DX |
| Solid.js | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | 高性能交互应用 |
| Qwik | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | 大型内容站、极致首屏 |
| Astro | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 内容网站、博客、文档 |
| Fresh | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | Deno生态项目 |

---

## 技术选型决策树

```
你的项目是什么类型？
│
├─ 内容为主（博客/文档/营销页）
│  ├─ 需要交互岛屿？→ Astro
│  └─ 纯静态？→ Astro / 11ty
│
├─ Web 应用（高交互）
│  ├─ 团队熟悉 React？→ Next.js / Remix
│  ├─ 追求极致性能？→ Solid.js + SolidStart
│  ├─ 追求最佳 DX？→ Svelte + SvelteKit
│  └─ 超大型应用？→ Angular（Signals模式）
│
├─ 电商/企业级
│  ├─ SEO 关键？→ Next.js / Nuxt
│  └─ 首屏极致？→ Qwik
│
└─ 混合型（内容+应用）
   └─ Astro + React/Vue/Solid Islands
```

:::tip 务实建议
2025-2026年，React/Vue 仍是安全选择。选择新兴框架前，评估三个关键因素：团队学习成本、生态依赖覆盖度、长期维护信心。
:::

---

## 面试题

### Q1：为什么说虚拟 DOM 不再是银弹？新一代框架如何解决其局限性？

**参考答案：** 虚拟 DOM 的核心问题是需要 O(n) 复杂度的 diff 算法比较两棵树。对于细粒度状态变更（如单个计数器+1），仍需遍历组件子树找出差异。新框架通过两种路径解决：1）编译时分析（Svelte）：编译器在构建阶段确定每个状态变化影响哪些 DOM 节点，生成直接更新代码；2）细粒度响应式（Solid）：运行时通过依赖追踪精确知道哪个信号影响哪个 DOM 节点，O(1) 精确更新。

### Q2：解释 TC39 Signals 提案的动机和预期影响

**参考答案：** 动机：当前每个框架都实现了自己的响应式系统（Vue ref、Solid signals、Angular signals等），导致生态碎片化、互操作性差。TC39 Signals 提案旨在将响应式原语标准化到语言层面，使库代码可以跨框架共享。预期影响：统一响应式模型、减少框架 bundle 大小、提升互操作性、降低学习成本。

### Q3：Resumability 和 Hydration 有什么区别？各自适用什么场景？

**参考答案：** Hydration：服务端渲染 HTML 后，客户端需要重新执行组件代码、重建事件监听和状态——相当于"重放"整个应用初始化。Resumability（Qwik）：将应用状态和事件绑定序列化到 HTML 中，客户端无需重新执行即可"恢复"交互——按需加载事件处理器。Hydration 适合交互密集型应用（代码迟早全部执行），Resumability 适合大型内容站（大部分代码可能永远不执行）。

### Q4：如果你要启动一个新的内容型网站项目，为什么选 Astro 而不是 Next.js？

**参考答案：** 1）默认零 JS：Astro 默认不向客户端发送 JavaScript，Next.js 即使静态页也包含框架运行时；2）框架无关：Astro 允许混用 React/Vue/Svelte 组件，不被单一框架锁定；3）Islands 架构：仅交互部分加载 JS，非交互部分纯 HTML；4）构建速度快：无需处理客户端 bundle 依赖图。但如果项目未来需要大量客户端交互、复杂状态管理，Next.js 更合适。

### Q5：从 React 项目迁移到 Solid.js，最大的心智模型转变是什么？

**参考答案：** 最大转变是**组件函数只执行一次**。React 中组件函数在每次状态变化时重新执行（重渲染），所以 Hooks 有严格规则（不能条件调用、依赖数组等）。Solid 中组件函数仅作为"setup"执行一次，后续更新由 Signal 的依赖图直接驱动 DOM 变更。这意味着：不需要 useMemo/useCallback 做优化、不需要依赖数组、条件逻辑需要用 `<Show>`/`<Switch>` 组件而非 JSX 内 if/else。
