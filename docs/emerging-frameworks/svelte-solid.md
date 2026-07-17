---
sidebar_position: 2
title: "Svelte 与 Solid.js"
difficulty: "hard"
tags: ["Svelte", "Solid.js", "编译时", "细粒度响应式"]
---

# Svelte 与 Solid.js

两个最具代表性的"后 React 时代"框架：Svelte 选择编译时魔法，Solid 选择运行时细粒度响应式。它们殊途同归——都消除了虚拟 DOM，实现了 DOM 级精确更新。

---

## Svelte 深入

### 核心理念

Svelte 的哲学是：**框架不应该存在于浏览器中**。它是一个编译器，将声明式组件代码编译为高效的命令式 DOM 操作代码。

- **无虚拟 DOM**：编译器直接生成 `element.textContent = value` 这类代码
- **极小运行时**：产物中几乎不包含框架代码（~2KB 运行时辅助）
- **真正的反应式**：编译器追踪赋值语句，自动生成更新逻辑

:::info Svelte 的本质
Svelte 不是一个你"引入"的库，而是一个"消失的框架"——它在编译阶段完成工作，运行时只留下你的业务逻辑。
:::

### Svelte 5 Runes（新响应式系统）

Svelte 5 引入 Runes，用显式的响应式原语替代了之前的隐式 `$:` 语法：

```svelte
<script>
  // $state - 声明响应式状态
  let count = $state(0);
  
  // $derived - 派生计算值
  let doubled = $derived(count * 2);
  
  // $effect - 副作用
  $effect(() => {
    console.log(`count is now ${count}`);
  });
  
  function increment() {
    count++;  // 直接赋值触发更新
  }
</script>

<button onclick={increment}>
  {count} × 2 = {doubled}
</button>
```

**Runes vs 旧语法对比：**

```svelte
<!-- Svelte 4 (旧) -->
<script>
  let count = 0;
  $: doubled = count * 2;  // 隐式响应式，编译器魔法
</script>

<!-- Svelte 5 (新 Runes) -->
<script>
  let count = $state(0);
  let doubled = $derived(count * 2);  // 显式声明，更清晰
</script>
```

### 组件写法对比

```svelte
<!-- Svelte -->
<script>
  let count = $state(0);
</script>
<button onclick={() => count++}>Count: {count}</button>
```

```jsx
// React
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>;
}
```

```vue
<!-- Vue 3 -->
<script setup>
import { ref } from 'vue';
const count = ref(0);
</script>
<template>
  <button @click="count++">Count: {{ count }}</button>
</template>
```

:::tip Svelte 的简洁性
Svelte 代码量通常比 React 少 30-40%，因为它不需要导入任何东西、不需要函数包装、不需要 JSX 语法糖。
:::

### SvelteKit 全栈框架

SvelteKit 是 Svelte 的官方全栈框架，类似于 Next.js 之于 React：

```javascript
// src/routes/blog/[slug]/+page.server.js
export async function load({ params }) {
  const post = await db.getPost(params.slug);
  return { post };
}

// src/routes/blog/[slug]/+page.svelte
// <script>
//   let { data } = $props();
// </script>
// <h1>{data.post.title}</h1>
```

核心特性：
- 基于文件系统的路由
- 服务端/客户端数据加载分离
- 表单 Actions（渐进增强）
- 适配器系统（部署到 Node/Vercel/Cloudflare 等）

### Svelte 优缺点

| 优点 | 缺点 |
|------|------|
| 极致简洁的语法 | 生态小于 React/Vue |
| 零运行时开销 | 自定义编译器，工具链特殊 |
| 学习曲线平缓 | 大型项目实践案例较少 |
| 出色的动画支持 | TypeScript 支持在追赶中 |
| 极小的 bundle 体积 | IDE 支持不如 React 成熟 |

---

## Solid.js 深入

### 核心理念

Solid.js 看起来像 React（使用 JSX），但执行模型完全不同。它实现了**真正的细粒度响应式**：

- **无虚拟 DOM**：通过编译时模板分析 + 运行时 Signal 追踪直接更新 DOM
- **组件只执行一次**：组件函数是 setup 函数，不会像 React 那样重复调用
- **零开销抽象**：不需要 useMemo、useCallback，因为没有重渲染

### 响应式原语

```jsx
import { createSignal, createMemo, createEffect } from "solid-js";

function Counter() {
  // createSignal 返回 [getter, setter]
  const [count, setCount] = createSignal(0);
  
  // createMemo 创建缓存计算值
  const doubled = createMemo(() => count() * 2);
  
  // createEffect 自动追踪依赖并在变化时执行
  createEffect(() => {
    console.log("Count changed:", count());
  });
  
  return (
    <button onClick={() => setCount(c => c + 1)}>
      {count()} × 2 = {doubled()}
    </button>
  );
}
```

:::warning 关键区别
`count` 是一个 **getter 函数**，必须用 `count()` 调用才能读取值。这不是多余的——正是通过函数调用，Solid 才能追踪谁在读取这个值。
:::

### 与 React Hooks 对比

```jsx
// React - 组件每次状态变化都重新执行
function ReactComponent() {
  const [count, setCount] = useState(0);
  // 每次渲染都会执行这里的代码
  const expensive = useMemo(() => heavyCalc(count), [count]);
  const handler = useCallback(() => setCount(c => c + 1), []);
  
  useEffect(() => {
    document.title = `Count: ${count}`;
  }, [count]); // 必须手动声明依赖
  
  return <button onClick={handler}>{count}</button>;
}

// Solid - 组件函数只执行一次
function SolidComponent() {
  const [count, setCount] = createSignal(0);
  // 这行代码只执行一次
  const expensive = createMemo(() => heavyCalc(count()));
  const handler = () => setCount(c => c + 1); // 不需要 useCallback
  
  createEffect(() => {
    document.title = `Count: ${count()}`; // 自动追踪依赖
  });
  
  return <button onClick={handler}>{count()}</button>;
}
```

**执行模型对比：**

| 维度 | React | Solid.js |
|------|-------|----------|
| 组件函数执行 | 每次状态变化重新执行 | 只执行一次（setup） |
| 优化手段 | useMemo/useCallback | 不需要（默认最优） |
| 依赖追踪 | 手动声明依赖数组 | 自动追踪 |
| 更新范围 | 组件子树重渲染 | 精确到 DOM 节点 |
| 条件渲染 | JSX 内 `&&` / 三元 | `<Show>` / `<Switch>` |
| 列表渲染 | `.map()` + key | `<For>` / `<Index>` |

### 组件不重新执行

这是从 React 转向 Solid 最重要的心智模型转变：

```jsx
// Solid - 条件渲染必须用组件
function App() {
  const [loggedIn, setLoggedIn] = createSignal(false);
  
  return (
    <Show when={loggedIn()} fallback={<LoginPage />}>
      <Dashboard />
    </Show>
  );
  // 不能用: {loggedIn() ? <Dashboard /> : <LoginPage />}
  // 因为这会在 setup 时就求值，之后不会更新
}
```

### SolidStart 全栈框架

```jsx
// routes/blog/[slug].tsx
import { createAsync, RouteDefinition } from "@solidjs/router";

export const route: RouteDefinition = {
  load: ({ params }) => getPost(params.slug)
};

export default function BlogPost() {
  const post = createAsync(() => getPost(params.slug));
  return <article innerHTML={post()?.content} />;
}
```

### Solid.js 优缺点

| 优点 | 缺点 |
|------|------|
| 顶级性能（benchmark 常居第一） | 生态系统较小 |
| JSX 语法，React 开发者易上手 | 心智模型转变有成本 |
| 自动依赖追踪，无需手动优化 | 不能用常规 JSX 条件/循环 |
| 极小 bundle（~7KB） | SolidStart 仍在成熟中 |
| 优秀的 TypeScript 支持 | 社区规模有限 |

---

## Svelte vs Solid.js 全面对比

| 对比维度 | Svelte 5 | Solid.js |
|----------|----------|----------|
| **响应式模型** | 编译器转换 Runes | 运行时 Signal 依赖图 |
| **模板语法** | 自定义模板（.svelte） | JSX |
| **包体积（Hello World）** | ~2.5KB | ~7KB |
| **包体积（真实应用）** | 通常更小 | 组件多时增长更慢 |
| **运行时性能** | 极快（编译优化） | 极快（细粒度追踪） |
| **学习曲线** | 低（接近原生 HTML） | 中（类 React 但需理解 Signals） |
| **TypeScript** | 通过预处理支持 | 原生 JSX/TSX |
| **生态成熟度** | ⭐⭐⭐（较好） | ⭐⭐（成长中） |
| **SSR 方案** | SvelteKit（成熟） | SolidStart（稳定中） |
| **动画支持** | 内置 transition/animate | 需第三方库 |
| **CSS 方案** | 内置 scoped CSS | 任意 CSS-in-JS |
| **IDE 支持** | VS Code 插件良好 | 标准 JSX/TSX 支持 |

---

## 性能基准对比

基于 JS Framework Benchmark（krausest）2025 数据：

| 测试项 | Solid.js | Svelte 5 | React 19 | Vue 3.5 |
|--------|----------|----------|----------|---------|
| 创建 1000 行 | 1.02x | 1.05x | 1.45x | 1.30x |
| 更新每 10 行 | 1.01x | 1.08x | 1.52x | 1.25x |
| 交换行 | 1.03x | 1.06x | 1.48x | 1.20x |
| 删除行 | 1.01x | 1.04x | 1.32x | 1.15x |
| 选择行 | 1.00x | 1.02x | 1.38x | 1.12x |
| 启动时间 | 1.01x | 1.00x | 1.65x | 1.35x |
| 内存占用 | 1.02x | 1.01x | 1.80x | 1.45x |

> 注：1.00x 表示接近原生 vanilla JS 性能，数值越大表示越慢。

:::info 解读
Solid 和 Svelte 5 的性能非常接近原生 JavaScript，比传统虚拟 DOM 框架快 30-50%。但在真实应用中，框架性能差异通常被网络延迟、数据库查询等因素掩盖。
:::

---

## 从 React/Vue 迁移评估

### 迁移到 Svelte

| 评估维度 | 说明 |
|----------|------|
| 迁移成本 | 中等。语法差异大，需重写组件，但概念简单 |
| 适用场景 | 中小型项目、追求 DX、团队愿意学习新范式 |
| 团队准备 | 需 1-2 周学习，HTML/CSS/JS 基础好的工程师适应快 |
| 渐进策略 | 不支持渐进迁移，需整体切换 |
| 生态替代 | 大部分 React/Vue 库没有 Svelte 版本，但基础库可用 |

### 迁移到 Solid.js

| 评估维度 | 说明 |
|----------|------|
| 迁移成本 | 中低。JSX 语法相似，但执行模型不同需要调整思维 |
| 适用场景 | 性能敏感应用、React 团队想要更好性能 |
| 团队准备 | React 开发者 3-5 天可上手，但需要 1-2 周理解深层差异 |
| 渐进策略 | 可在新模块中试点，逐步扩展 |
| 生态替代 | 部分 React 库有 Solid 移植版，基础设施完善 |

:::warning 迁移风险
不要因为 benchmark 数字而盲目迁移。评估清楚：你的应用瓶颈真的是框架渲染性能吗？还是网络请求、数据处理、或架构问题？
:::

---

## 面试题

### Q1：Svelte 5 的 Runes 相比 Svelte 4 的 `$:` 语法有什么改进？为什么要做这个变更？

**参考答案：** Svelte 4 的 `$:` 是隐式响应式——编译器自动追踪赋值语句，但这带来几个问题：1）不够显式，新开发者难以理解什么是响应式什么不是；2）无法在组件外使用响应式状态（如共享 store）；3）`$:` 的语义不明确（是计算值还是副作用？）。Runes（`$state/$derived/$effect`）通过显式标记解决这些问题：语义清晰、可在任何地方使用、更好的 TypeScript 推断、更可预测的行为。

### Q2：为什么 Solid.js 使用 JSX 但性能远超 React？它的 JSX 编译产物有什么不同？

**参考答案：** React 的 JSX 编译为 `createElement()` 调用创建虚拟 DOM 对象，每次渲染都重新创建整棵树。Solid 的 JSX 编译方式完全不同：静态部分编译为 HTML template 字符串（通过 `<template>` 元素 clone），动态部分编译为细粒度的 effect 绑定。组件函数只执行一次创建 DOM，之后 Signal 变化直接更新对应 DOM 节点，无需 diff。本质上 Solid 把 JSX 当作编译时模板语言，而非运行时虚拟 DOM 描述。

### Q3：Solid.js 中为什么不能用 `{show() && <Component />}` 做条件渲染？

**参考答案：** 因为 Solid 组件函数只执行一次。JSX 表达式在 setup 阶段求值后就固定了——`&&` 右侧的 `<Component />` 会在 setup 时立即执行（或不执行），之后 `show()` 变化不会重新求值这个表达式。必须使用 `<Show when={show()}><Component /></Show>` 组件，因为 `<Show>` 内部通过 effect 监听 `when` 的变化来控制渲染。这是"组件不重新执行"模型的直接后果。

### Q4：如果团队目前用 Vue 3，什么情况下值得考虑迁移到 Svelte？

**参考答案：** 考虑迁移的场景：1）新项目且团队对 DX 有极高要求（Svelte 代码量更少、样板更少）；2）对 bundle 大小极度敏感（移动端弱网环境）；3）团队较小、项目中等规模（生态依赖少）。不建议迁移的场景：1）大型已有项目（迁移成本高、无法渐进）；2）重度依赖 Vue 生态（Vuetify/Element Plus/VueUse 等无替代）；3）团队成员频繁轮换（Vue 人才池更大）。折中方案：新模块试点，评估后再决定。

### Q5：比较 Svelte 的编译时响应式和 Solid 的运行时响应式，各自的技术取舍是什么？

**参考答案：** Svelte 编译时：优势是可以在编译阶段做全局优化（死代码消除、静态提升），产物中不需要响应式运行时；代价是需要自定义编译器和文件格式（.svelte），无法在普通 JS/TS 文件中使用响应式。Solid 运行时：优势是标准 JSX/TSX，可以在任何 JS 文件中使用 Signal，工具链兼容性好；代价是需要包含 Signal 运行时（~7KB），理论上编译器能做的静态优化更少。两者在性能上几乎持平，选择更多取决于团队对语法风格的偏好。
