---
sidebar_position: 5
title: React 最新源码解析
tags:
  - React
  - 源码
  - Fiber
  - 原理
---

# React 最新源码解析

## 🟢 基础篇

### 1. React 19 的主要变化有哪些？

**答：**

React 19 带来了多项重大改进：

**1. Actions（异步状态管理）**
```javascript
// 新的 useActionState Hook
const [state, formAction] = useActionState(submitForm, initialState)

// useOptimistic Hook
const [optimisticState, addOptimistic] = useOptimistic(state, updateFn)
```

**2. use() Hook**
```javascript
// 可以在条件语句中使用
function Component({ promise }) {
  const data = use(promise)  // 读取 Promise/Context
  return <div>{data}</div>
}
```

**3. ref 作为 prop**
```javascript
// 不再需要 forwardRef
function Input({ ref }) {
  return <input ref={ref} />
}
```

**4. 文档元数据支持**
```javascript
function BlogPost({ post }) {
  return (
    <article>
      <title>{post.title}</title>
      <meta name="author" content="Author" />
      <h1>{post.title}</h1>
    </article>
  )
}
```

---

### 2. React Fiber 架构是什么？

**答：**

Fiber 是 React 16 引入的**协调引擎**，核心思想是**可中断的渲染**：

```typescript
// Fiber 节点结构
interface Fiber {
  tag: WorkTag           // 组件类型
  key: null | string
  elementType: any
  type: any              // 组件函数/类
  stateNode: any         // DOM 节点

  // Fiber 树
  return: Fiber | null   // 父 Fiber
  child: Fiber | null    // 第一个子节点
  sibling: Fiber | null  // 下一个兄弟节点
  index: number

  // 状态
  pendingProps: any
  memoizedState: any     // hooks 链表
  updateQueue: any

  // 副作用
  flags: Flags           // 标记（插入、更新、删除）
  subtreeFlags: Flags
  deletions: Array<Fiber> | null
}
```

**Fiber 树结构：**
```
Root
 └─ App (Fiber)
     ├─ Header (Fiber)
     │   └─ Title (Fiber)
     └─ Content (Fiber)
         ├─ List (Fiber)
         └─ Footer (Fiber)
```

---

### 3. 双缓存机制是如何工作的？

**答：**

React 维护两棵 Fiber 树：

- **current 树**：当前屏幕显示的内容
- **workInProgress 树**：正在构建的新树

```typescript
// 构建 workInProgress
function createWorkInProgress(current, pendingProps) {
  let workInProgress = current.alternate
  
  if (workInProgress === null) {
    // 首次渲染：创建新 Fiber
    workInProgress = createFiber(current.tag, pendingProps, current.key)
    workInProgress.alternate = current
    current.alternate = workInProgress
  } else {
    // 更新：复用 Fiber
    workInProgress.pendingProps = pendingProps
    workInProgress.flags = NoFlags
    workInProgress.subtreeFlags = NoFlags
  }
  
  return workInProgress
}
```

**切换时机：**
- commit 阶段完成后
- `current = finishedWork`

---

## 🟡 进阶篇

### 4. React 的工作循环是如何实现的？

**答：**

React 使用 **requestIdleCallback** 的 polyfill 实现时间切片：

```typescript
// packages/react-reconciler/src/ReactFiberWorkLoop.ts

let workInProgress: Fiber | null = null

function workLoopSync() {
  // 同步模式：一次性完成
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress)
  }
}

function workLoopConcurrent() {
  // 并发模式：时间切片
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress)
  }
}

function performUnitOfWork(unitOfWork: Fiber) {
  const current = unitOfWork.alternate
  
  // 1. 递：处理当前节点
  let next = beginWork(current, unitOfWork)
  
  unitOfWork.memoizedProps = unitOfWork.pendingProps
  
  if (next === null) {
    // 2. 归：完成当前节点
    completeUnitOfWork(unitOfWork)
  } else {
    workInProgress = next
  }
}
```

---

### 5. Hooks 是如何在 Fiber 中存储的？

**答：**

Hooks 以**链表**形式存储在 Fiber 的 `memoizedState` 上：

```typescript
// Hook 结构
interface Hook {
  memoizedState: any      // 当前值
  baseState: any
  baseQueue: Update<any> | null
  queue: UpdateQueue<any> | null
  next: Hook | null       // 下一个 Hook
}

// 当前渲染的 Fiber 和 Hook
let currentlyRenderingFiber: Fiber = null
let workInProgressHook: Hook | null = null
let currentHook: Hook | null = null

// useState 实现
function useState(initialState) {
  return useReducer(basicStateReducer, initialState)
}

function useReducer(reducer, initialArg, init?) {
  // 获取或创建 Hook
  const hook = updateWorkInProgressHook()
  
  if (isReRender) {
    // 重渲染：从 queue 中取出更新
    const dispatch = hook.queue.dispatch
    return [hook.memoizedState, dispatch]
  } else {
    // 首次渲染
    hook.memoizedState = init ? init(initialArg) : initialArg
    const dispatch = dispatchReducerAction.bind(null, currentlyRenderingFiber, hook.queue)
    return [hook.memoizedState, dispatch]
  }
}
```

---

### 6. useEffect 和 useLayoutEffect 的区别？

**答：**

```typescript
// useEffect - 异步执行
function commitHookEffectListMount(flags, finishedWork) {
  const updateQueue = finishedWork.updateQueue
  const lastEffect = updateQueue.lastEffect
  
  // 在 commit 之后异步执行
  const effect = lastEffect.next
  do {
    if (effect.tag & HookPassive) {
      // 使用 Scheduler 调度
      scheduleCallback(NormalSchedulerPriority, () => {
        effect.destroy = effect.create()
      })
    }
    effect = effect.next
  } while (effect !== lastEffect.next)
}

// useLayoutEffect - 同步执行
function commitHookEffectListMount(flags, finishedWork) {
  const updateQueue = finishedWork.updateQueue
  const lastEffect = updateQueue.lastEffect
  
  // 在 commit 阶段同步执行
  const effect = lastEffect.next
  do {
    if (effect.tag & HookLayout) {
      effect.destroy = effect.create()
    }
    effect = effect.next
  } while (effect !== lastEffect.next)
}
```

**执行顺序：**
1. DOM 更新
2. useLayoutEffect（同步）
3. 浏览器绘制
4. useEffect（异步）

---

### 7. 并发特性是如何实现的？

**答：**

**1. 优先级系统：**
```typescript
// 5 种优先级
export const NoPriority = 0
export const ImmediatePriority = 1
export const UserBlockingPriority = 2
export const NormalPriority = 3
export const LowPriority = 4
export const IdlePriority = 5
```

**2. 时间切片：**
```typescript
function shouldYieldToHost() {
  const timeElapsed = getCurrentTime() - startTime
  // 每 5ms 让出一次控制权
  if (timeElapsed < 5) return false
  return true
}
```

**3. Suspense 实现：**
```typescript
function Suspense({ children, fallback }) {
  return {
    $$typeof: REACT_SUSPENSE_TYPE,
    props: { children, fallback }
  }
}

// 挂起处理
function throwException(root, returnFiber, sourceFiber) {
  // 找到最近的 Suspense 边界
  let suspenseBoundary = getNearestSuspenseBoundary(returnFiber)
  
  // 将 fallback 挂载到 Suspense
  suspenseBoundary.child = fallback
}
```

---

## 🔴 高级篇

### 8. React Server Components 是如何工作的？

**答：**

RSC 实现了**服务端与客户端的混合渲染**：

```typescript
// 服务端组件 - 只在服务端运行
async function ServerComponent() {
  const data = await db.query('SELECT * FROM posts')
  return <div>{data.map(post => <Post key={post.id} post={post} />)}</div>
}

// 客户端组件 - 可以使用 hooks
'use client'
function ClientComponent() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}
```

**RSC 流协议：**
```
M1:{"id":"./src/App.js","chunks":["chunk1"],"name":""}
J0:["$","div",null,{"children":"Hello"}]
```

---

### 9. React 的批处理更新是如何实现的？

**答：**

React 18+ 默认对所有事件进行批处理：

```typescript
// 批处理上下文
let executionContext = NoContext

function batchedUpdates(fn) {
  const prevExecutionContext = executionContext
  executionContext |= BatchedContext
  
  try {
    return fn()
  } finally {
    executionContext = prevExecutionContext
    // 批处理完成后刷新队列
    if (executionContext === NoContext) {
      flushSyncCallbacks()
    }
  }
}

// 更新入队
function enqueueUpdate(fiber, update) {
  const updateQueue = fiber.updateQueue
  updateQueue.shared.pending = update
  
  // 标记需要调度
  scheduleUpdateOnFiber(fiber)
}
```

---

### 10. 如何阅读 React 源码？

**答：**

**推荐阅读顺序：**

```
1. packages/react/src/React.js          # 入口
2. packages/react-reconciler/            # 核心协调器
   ├── ReactFiberWorkLoop.ts            # 工作循环
   ├── ReactFiberBeginWork.ts           # 递阶段
   ├── ReactFiberCompleteWork.ts        # 归阶段
   └── ReactFiberHooks.ts               # Hooks 实现
3. packages/react-dom/                   # DOM 渲染
4. packages/scheduler/                   # 调度器
```

**调试技巧：**
```javascript
// 在源码中添加日志
console.log('Current fiber:', fiber)
console.log('Hook state:', hook.memoizedState)

// 使用 React DevTools Profiler
// 观察组件的渲染时间和次数
```

---

## 🎯 高频面试题

### 11. 为什么 React 要用虚拟 DOM？

**答：**

| 原因 | 说明 |
|------|------|
| 跨平台 | 虚拟 DOM 可以渲染到不同平台（Web、Native） |
| 性能优化 | 批量更新，减少 DOM 操作 |
| 声明式 | 让开发者关注状态而非 DOM 操作 |
| 可预测性 | 数据驱动视图，状态可追溯 |

---

### 12. React 性能优化的方法有哪些？

**答：**

```javascript
// 1. memo - 避免不必要的重渲染
const MemoizedComponent = React.memo(MyComponent)

// 2. useMemo - 缓存计算结果
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b])

// 3. useCallback - 缓存函数引用
const memoizedCallback = useCallback(() => {
  doSomething(a, b)
}, [a, b])

// 4. React.lazy - 代码分割
const LazyComponent = React.lazy(() => import('./Component'))

// 5. 虚拟列表 - 大数据渲染
import { FixedSizeList } from 'react-window'
```

---

## 💡 学习建议

1. **先理解概念**：Fiber、并发模式、优先级系统
2. **动手调试**：在 Chrome DevTools 中跟踪 React 源码
3. **画图理解**：Fiber 树、工作循环、Hooks 链表
4. **阅读 PR**：GitHub 上的 RFC 和 PR 能理解设计决策

---

## 📚 推荐资源

- [React 官方文档](https://react.dev/)
- [React 源码](https://github.com/facebook/react)
- [React 技术揭秘](https://react.iamkasong.com/)
- [Just React](https://just-react.vercel.app/)
