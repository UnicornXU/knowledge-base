---
title: Suspense 与并发模式
description: 并发渲染原理、Suspense 机制、Transition 与 useDeferredValue 深度解析
keywords: [Suspense, 并发模式, useTransition, useDeferredValue, Concurrent Rendering]
---

# Suspense 与并发模式

并发模式（Concurrent Mode）是 React 18 引入的核心渲染机制，允许 React 在渲染过程中中断、暂停和恢复更新，配合 Suspense 实现优雅的异步 UI 处理。

## 并发渲染原理

### React 渲染模式演进

```mermaid
graph LR
    subgraph 演进["React 渲染模式演进"]
        direction TB
        V1["React 15<br/>Stack Reconciler<br/>同步递归渲染<br/>不可中断"]
        V2["React 16-17<br/>Fiber Reconciler<br/>可中断渲染<br/>时间切片"]
        V3["React 18+<br/>Concurrent Mode<br/>优先级调度<br/>并发更新"]
    end

    V1 -->|"重构为 Fiber"| V2 -->|"启用并发"| V3

    style V1 fill:#e0e0e0,stroke:#616161
    style V2 fill:#bbdefb,stroke:#2196f3
    style V3 fill:#c8e6c9,stroke:#43a047
```

### Fiber 架构与时间切片

```mermaid
graph TB
    subgraph FIBER["Fiber 时间切片机制"]
        direction TB

        subgraph BEFORE["传统同步渲染"]
            direction LR
            B1["开始"] --> B2["渲染整个树"] --> B3["提交 DOM"] --> B4["结束"]
            NOTE1["一次性完成<br/>长时间阻塞主线程"]
        end

        subgraph AFTER["Fiber 可中断渲染"]
            direction LR
            A1["开始"] --> A2["渲染单元 1"]
            A2 --> A3["让出主线程"]
            A3 --> A4["渲染单元 2"]
            A4 --> A5["让出主线程"]
            A5 --> A6["..."]
            A6 --> A7["全部完成"] --> A8["提交 DOM"]
            NOTE2["分片完成<br/>保持 UI 响应"]
        end
    end

    style BEFORE fill:#ffcdd2,stroke:#e53935
    style AFTER fill:#c8e6c9,stroke:#43a047
```

**Fiber 节点结构**：

```typescript
// Fiber 节点简化结构
interface Fiber {
  tag: number;           // 组件类型（函数组件、类组件、原生 DOM）
  type: any;             // 组件函数/类或 DOM 标签名
  key: string | null;
  stateNode: any;        // DOM 节点或组件实例

  // Fiber 树结构
  child: Fiber | null;   // 第一个子节点
  sibling: Fiber | null; // 下一个兄弟节点
  return: Fiber | null;  // 父节点

  // 工作单元
  pendingProps: any;     // 新 props
  memoizedProps: any;    // 上次渲染的 props
  memoizedState: any;    // 上次渲染的 state

  // 副作用
  flags: number;         // 标记需要执行的副作用
  updateQueue: any;      // 更新队列
}
```

## 优先级调度系统

```mermaid
graph TB
    subgraph SCHEDULER["React 调度器优先级模型"]
        direction TB

        P1["🔴 SyncLane<br/>同步优先级<br/>click, input, focus"]
        P2["🟠 InputContinuousLane<br/>连续输入优先级<br/>mousemove, scroll"]
        P3["🟡 DefaultLane<br/>默认优先级<br/>setState, render"]
        P4["🟢 TransitionLane<br/>过渡优先级<br/>useTransition"]
        P5["🔵 IdleLane<br/>空闲优先级<br/>offscreen 预渲染"]
    end

    P1 --> P2 --> P3 --> P4 --> P5

    Note1["高优先级更新可以<br/>中断低优先级渲染"]

    style P1 fill:#e53935,color:#fff
    style P2 fill:#ff9800,color:#fff
    style P3 fill:#fbc02d,color:#000
    style P4 fill:#43a047,color:#fff
    style P5 fill:#1e88e5,color:#fff
```

### 并发更新流程

```mermaid
sequenceDiagram
    participant User as 用户交互
    participant React as React 调度器
    participant Fiber as Fiber 工作循环
    participant DOM as DOM 更新

    User->>React: 低优先级更新（setState）
    React->>Fiber: 开始渲染

    Note over Fiber: 渲染中...
    User->>React: 高优先级更新（click）
    React->>Fiber: 中断当前渲染
    Fiber-->>React: 丢弃未完成的工作

    React->>Fiber: 开始高优先级渲染
    Fiber->>DOM: 提交高优先级更新
    Note over DOM: 用户立即看到响应

    React->>Fiber: 重新开始低优先级渲染
    Fiber->>DOM: 提交低优先级更新
```

## Suspense 深度解析

### Suspense 工作原理

```mermaid
graph TB
    subgraph SUSPENSE_MECHANISM["Suspense 工作机制"]
        direction TB

        START["组件渲染"] --> CHECK{是否抛出 Promise?}

        CHECK -->|"是"| PENDING["挂起状态<br/>显示 fallback"]
        CHECK -->|"否"| RENDER["正常渲染"]

        PENDING --> WAIT["等待 Promise resolve"]
        WAIT --> RETRY["重新渲染该子树"]
        RETRY --> RENDER

        RENDER --> DONE["完成"]
    end

    style START fill:#e3f2fd,stroke:#2196f3
    style PENDING fill:#fff3e0,stroke:#ff9800
    style RENDER fill:#c8e6c9,stroke:#43a047
```

### Suspense 的三种使用模式

```tsx
import { Suspense } from 'react';

// 模式 1：数据获取（配合 RSC / lazy）
function App() {
  return (
    <Suspense fallback={<Loading />}>
      <UserProfile />
    </Suspense>
  );
}

// 模式 2：代码分割（lazy）
const HeavyChart = lazy(() => import('./HeavyChart'));

function Dashboard() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <HeavyChart data={chartData} />
    </Suspense>
  );
}

// 模式 3：嵌套 Suspense — 渐进式加载
function Page() {
  return (
    <>
      <h1>Dashboard</h1>
      <Suspense fallback={<HeaderSkeleton />}>
        <Header />
      </Suspense>
      <Suspense fallback={<ContentSkeleton />}>
        <Content />
      </Suspense>
      <Suspense fallback={<SidebarSkeleton />}>
        <Sidebar />
      </Suspense>
    </>
  );
}
```

## useTransition

`useTransition` 允许将状态更新标记为"过渡"（Transition），使其不阻塞用户交互。

### 核心用法

```tsx
import { useTransition, useState } from 'react';

function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isPending, startTransition] = useTransition();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value); // 高优先级：输入框立即更新

    // 低优先级：搜索结果延迟更新
    startTransition(() => {
      setResults(performSearch(value));
    });
  };

  return (
    <div>
      <input value={query} onChange={handleSearch} />
      {isPending && <Spinner />}
      <SearchResults results={results} />
    </div>
  );
}
```

### useTransition 执行流程

```mermaid
sequenceDiagram
    participant User as 用户输入
    participant Input as 输入框
    participant Transition as startTransition
    participant Results as 搜索结果

    User->>Input: 输入 "react"
    Input->>Input: 立即更新显示 "react"（高优先级）
    Input->>Transition: startTransition(搜索)

    Note over Transition: 渲染搜索结果（低优先级）

    User->>Input: 继续输入 " hooks"
    Input->>Input: 立即更新显示 "react hooks"
    Transition->>Transition: 中断上次搜索渲染
    Transition->>Transition: 重新开始搜索 "react hooks"

    Transition->>Results: 完成 → 显示结果
```

### useTransition vs 直接 setState

```tsx
// ❌ 直接 setState — 所有更新同等优先级
function Bad() {
  const [tab, setTab] = useState('home');
  const [data, setData] = useState(null);

  const switchTab = (newTab: string) => {
    setTab(newTab);          // 阻塞 UI
    setData(loadData(newTab)); // 也阻塞 UI
  };
}

// ✅ useTransition — tab 切换不被数据加载阻塞
function Good() {
  const [tab, setTab] = useState('home');
  const [data, setData] = useState(null);
  const [isPending, startTransition] = useTransition();

  const switchTab = (newTab: string) => {
    setTab(newTab); // 高优先级，立即更新
    startTransition(() => {
      setData(loadData(newTab)); // 低优先级，可中断
    });
  };
}
```

## useDeferredValue

`useDeferredValue` 创建一个值的延迟版本，用于优化频繁变化的输入。

### 核心用法

```tsx
import { useDeferredValue, useState, useMemo } from 'react';

function SearchApp() {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  // 基于延迟值计算结果 — 不会阻塞输入
  const filteredList = useMemo(
    () => filterItems(items, deferredQuery),
    [deferredQuery]
  );

  const isStale = query !== deferredQuery;

  return (
    <div>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      <div style={{ opacity: isStale ? 0.7 : 1 }}>
        <FilteredList items={filteredList} />
      </div>
    </div>
  );
}
```

### useDeferredValue vs useTransition

```mermaid
graph TB
    subgraph COMPARISON["useDeferredValue vs useTransition"]
        direction TB

        subgraph TRANSITION["useTransition"]
            T1["在状态更新处标记"]
            T2["控制整个状态更新的优先级"]
            T3["有 isPending 状态"]
            T4["适合：Tab 切换、路由导航"]
        end

        subgraph DEFERRED["useDeferredValue"]
            D1["在值消费处延迟"]
            D2["延迟值的传播"]
            D3["通过比较判断是否过期"]
            D4["适合：搜索框、实时过滤"]
        end
    end

    style TRANSITION fill:#e3f2fd,stroke:#2196f3
    style DEFERRED fill:#e8f5e9,stroke:#4caf50
```

| 场景 | 推荐方案 | 原因 |
|------|---------|------|
| 输入框实时搜索 | useDeferredValue | 源自外部 props，无法控制更新 |
| Tab 切换加载数据 | useTransition | 自己控制状态更新 |
| 列表筛选过滤 | useDeferredValue | 值来自父组件 |
| 路由跳转 | useTransition | 主动触发的状态变更 |
| 大列表渲染优化 | useDeferredValue | 可以延迟渲染 |

## 综合实战：搜索页面

```tsx
'use client';

import { useState, useTransition, useDeferredValue, Suspense } from 'react';

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [isPending, startTransition] = useTransition();
  const deferredQuery = useDeferredValue(query);

  // 类别切换用 Transition（主动控制）
  const handleCategoryChange = (newCategory: string) => {
    startTransition(() => {
      setCategory(newCategory);
    });
  };

  return (
    <div>
      {/* 搜索框 */}
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="搜索..."
      />

      {/* 类别标签 */}
      <div>
        {['all', 'posts', 'users', 'tags'].map(cat => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            style={{ opacity: isPending ? 0.6 : 1 }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 结果区 — 使用 deferredQuery 实现防抖效果 */}
      <Suspense fallback={<ResultsSkeleton />}>
        <SearchResults
          query={deferredQuery}
          category={category}
        />
      </Suspense>
    </div>
  );
}

// Server Component — 独立加载
async function SearchResults({ query, category }: Props) {
  const results = await searchAPI(query, category);
  return (
    <ul>
      {results.map(item => (
        <li key={item.id}>{item.title}</li>
      ))}
    </ul>
  );
}
```

## 并发模式最佳实践

1. **区分紧急更新和过渡更新** — 输入框反馈是紧急的，搜索结果是过渡的
2. **Suspense 边界要合理** — 太粗会导致整页 loading，太细会增加复杂度
3. **isPending 用于即时反馈** — 让用户知道后台在工作
4. **useDeferredValue 处理外部值** — 当你无法控制更新来源时使用
5. **避免在 Transition 中做同步计算** — Transition 用于异步/昂贵操作

## 面试要点

1. **Fiber 架构解决了什么问题？** — 将递归渲染改为可中断的循环，实现时间切片和优先级调度
2. **Suspense 的本质是什么？** — 捕获子组件抛出的 Promise，显示 fallback，Promise resolve 后重新渲染
3. **useTransition 的工作原理？** — 将回调内的状态更新标记为低优先级（TransitionLane），可被高优先级更新中断
4. **useDeferredValue 和防抖的区别？** — 防抖是固定延迟，useDeferredValue 是 React 根据渲染情况动态调度
5. **并发模式下 React 如何保证一致性？** — 高优先级更新中断低优先级渲染后，以最新状态重新开始
6. **为什么 React 要引入并发模式？** — 解决大型应用中"CPU 密集型渲染阻塞用户交互"的问题

---

> **相关章节**：[React Server Components](./server-components.md) | [React 19 新特性](./react-19.md)
