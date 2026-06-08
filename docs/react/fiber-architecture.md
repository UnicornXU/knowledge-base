---
sidebar_position: 2
title: "Fiber 架构"
difficulty: "hard"
tags: ["react", "fiber", "reconciliation"]
---

# Fiber 架构

## 为什么需要 Fiber？

React 15 的 Stack Reconciler 是同步递归的，大型更新会长时间占用主线程，导致页面卡顿。Fiber 架构（React 16+）实现了**可中断的异步渲染**。

## Fiber 节点结构

```typescript
interface Fiber {
  tag: number;           // 节点类型（FunctionComponent、ClassComponent 等）
  key: string | null;
  type: any;             // 组件类型
  stateNode: any;        // DOM 节点或组件实例

  // 链表结构
  return: Fiber | null;  // 父 Fiber
  child: Fiber | null;   // 第一个子 Fiber
  sibling: Fiber | null; // 下一个兄弟 Fiber
  index: number;

  // 状态
  pendingProps: any;
  memoizedState: any;
  memoizedProps: any;

  // 副作用
  flags: number;         // 标记需要执行的 DOM 操作
  updateQueue: any;
}
```

## 双缓存机制（Double Buffering）

```
// 两棵 Fiber 树交替工作
current Fiber 树（屏幕上的 UI）
  ↕ 交替
workInProgress Fiber 树（正在构建的新 UI）

// 完成后切换指针
root.current = finishedWork;
```

## 协调过程（Reconciliation）

```
1. beginWork     → 从根节点向下遍历，处理每个 Fiber 节点
2. completeWork  → 到达叶子节点后向上回溯，收集副作用
3. commitWork    → 将所有 DOM 变更一次性提交到真实 DOM
```

## 优先级调度（Lane 模型）

```typescript
// React 18 的优先级
const SyncLane           = 0b0000000000000000000000000000001;
const InputContinuousLane = 0b0000000000000000000000000000100;
const DefaultLane        = 0b0000000000000000000000000010000;
const TransitionLane     = 0b0000000000000000000000001000000;
const IdleLane           = 0b0100000000000000000000000000000;
```

## 并发特性

```javascript
// useTransition - 标记低优先级更新
const [isPending, startTransition] = useTransition();

function handleSearch(query) {
  // 高优先级：输入框立即响应
  setInputValue(query);

  // 低优先级：搜索结果可以延迟
  startTransition(() => {
    setSearchResults(filterData(query));
  });
}

// useDeferredValue - 延迟更新值
const deferredValue = useDeferredExpensiveValue(expensiveValue);
```

## 关键点

- Fiber 是 React 的最小工作单元，每个组件对应一个 Fiber 节点
- 双缓存机制让 React 可以在内存中构建新树，完成后一次性替换
- 时间切片（Time Slicing）让渲染可以中断，不阻塞用户交互
- `startTransition` 和 `useDeferredValue` 是并发模式的核心 API
