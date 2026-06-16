---
sidebar_position: 2
title: 事件循环
difficulty: hard
tags:
  - browser
  - event-loop
  - async
---

# 🔄 事件循环

> **"事件循环是 JavaScript 异步编程的基石，不理解它就无法预测代码的执行顺序"**

JavaScript 是单线程的，但通过事件循环机制实现了非阻塞的异步操作。理解事件循环是掌握 Promise、async/await、定时器等异步 API 的关键。

## 一、核心概念

### 1.1 调用栈（Call Stack）

调用栈是一个 LIFO（后进先出）的数据结构，用于追踪函数的执行：

```
调用栈示例：
═══════════════════════════════════════

function a() { b(); }
function b() { c(); }
function c() { console.log('hi'); }
a();

执行过程：
  调用栈变化：
  [a]          → a() 被调用
  [a, b]       → b() 被调用
  [a, b, c]    → c() 被调用
  [a, b, c, log] → console.log 执行
  [a, b, c]    → log 弹出
  [a, b]       → c 完成
  [a]          → b 完成
  []           → a 完成，栈清空
```

### 1.2 Web APIs

浏览器提供的异步 API，运行在浏览器环境中，不在 JS 引擎内部：

```
常见的 Web APIs：
═══════════════════════════════════════

• setTimeout / setInterval    → 计时器线程
• fetch / XMLHttpRequest     → 网络线程
• addEventListener            → 事件触发线程
• requestAnimationFrame       → 动画帧线程
• IntersectionObserver        → 交叉观察线程
• MutationObserver            → DOM 变化观察
```

### 1.3 任务队列

```
任务队列结构：
═══════════════════════════════════════

                ┌──────────────────────┐
                │      调用栈 (LIFO)    │
                └──────────┬───────────┘
                           │
                    Web APIs 处理完成
                           │
           ┌───────────────┼───────────────┐
           ▼                               ▼
  ┌─────────────────┐            ┌─────────────────┐
  │  宏任务队列       │            │  微任务队列       │
  │  (Task Queue)   │            │  (Microtask Q)  │
  │                 │            │                 │
  │  • setTimeout   │            │  • Promise.then │
  │  • setInterval  │            │  • async/await  │
  │  • I/O          │            │  • MutationObs. │
  │  • UI rendering │            │  • queueMicro.  │
  │  • MessageCh.   │            │  • process.*    │
  └─────────────────┘            └─────────────────┘
```

## 二、事件循环算法

### 2.1 浏览器事件循环步骤

```
事件循环算法（每一轮称为一个 Tick）：
═══════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────┐
  │  1. 从宏任务队列取出一个任务执行              │
  └──────────────────┬──────────────────────────┘
                     │
  ┌──────────────────▼──────────────────────────┐
  │  2. 执行该任务中产生的所有微任务              │
  │     （清空微任务队列，包括微任务中产生的微任务）│
  └──────────────────┬──────────────────────────┘
                     │
  ┌──────────────────▼──────────────────────────┐
  │  3. 是否需要渲染？                            │
  │     是 → 执行 rAF → 浏览器渲染 → rIC         │
  │     否 → 跳过                                │
  └──────────────────┬──────────────────────────┘
                     │
                     └──→ 回到步骤 1
```

### 2.2 微任务优先级

```
微任务执行顺序（在同一轮中）：
═══════════════════════════════════════

  优先级从高到低：
  1. queueMicrotask()     → 最先入队
  2. Promise.then/catch   → PromiseJob
  3. MutationObserver     → 微任务
  4. async/await          → 本质是 Promise

  ⚠️ 注意：实际实现中微任务队列是 FIFO
  同一种微任务按入队顺序执行
  不同类型的微任务之间执行顺序可能因浏览器实现而异
```

## 三、经典代码执行顺序分析

### 3.1 基础题

```js
console.log('1');

setTimeout(() => {
  console.log('2');
}, 0);

Promise.resolve().then(() => {
  console.log('3');
});

console.log('4');

// 输出顺序：1 → 4 → 3 → 2
// 分析：
// 1. 同步代码：打印 1、4
// 2. 微任务：Promise.then → 打印 3
// 3. 宏任务：setTimeout → 打印 2
```

### 3.2 进阶题：async/await 执行顺序

```js
async function async1() {
  console.log('async1 start');
  await async2();
  console.log('async1 end');
  // 等价于：async2().then(() => console.log('async1 end'))
}

async function async2() {
  console.log('async2');
}

console.log('script start');

setTimeout(() => {
  console.log('setTimeout');
}, 0);

async1();

new Promise((resolve) => {
  console.log('promise1');
  resolve();
}).then(() => {
  console.log('promise2');
});

console.log('script end');

// 输出顺序：
// script start → async1 start → async2 → promise1
// → script end → async1 end → promise2 → setTimeout
```

### 3.3 高级题：嵌套微任务

```js
Promise.resolve()
  .then(() => {
    console.log('then1');
    // 微任务中创建新的微任务
    Promise.resolve().then(() => {
      console.log('then1-1');
    });
  })
  .then(() => {
    console.log('then2');
  });

Promise.resolve()
  .then(() => {
    console.log('then3');
  });

// 输出顺序：then1 → then3 → then1-1 → then2
// 分析：
// 第一个 Promise 的第一个 then 入队：[then1]
// 第二个 Promise 的第一个 then 入队：[then1, then3]
// 执行 then1：打印 then1，入队 then1-1，入队 then2
//   队列变为：[then3, then1-1, then2]
// 执行 then3：打印 then3
// 执行 then1-1：打印 then1-1
// 执行 then2：打印 then2
```

### 3.4 setTimeout 与 setInterval 的精度问题

```js
// setTimeout 的最小延迟
// HTML 规范：嵌套 5 层以上 setTimeout 后最小间隔为 4ms

let count = 0;
const start = performance.now();

function tick() {
  count++;
  if (count < 10) {
    setTimeout(tick, 0); // 实际间隔约 4ms
  } else {
    console.log(`总耗时: ${performance.now() - start}ms`);
    // 约 40ms（不是 0ms）
  }
}

tick();
```

## 四、Node.js 事件循环

### 4.1 Node.js 事件循环的阶段

```
Node.js 事件循环阶段：
═══════════════════════════════════════════════════════

  ┌───────────────────────────┐
  │         timers            │  ← setTimeout / setInterval 回调
  └─────────────┬─────────────┘
                │
  ┌─────────────▼─────────────┐
  │       pending callbacks   │  ← 系统级回调（TCP 错误等）
  └─────────────┬─────────────┘
                │
  ┌─────────────▼─────────────┐
  │         idle, prepare     │  ← 内部使用
  └─────────────┬─────────────┘
                │
  ┌─────────────▼─────────────┐
  │          poll              │  ← I/O 回调（文件读写、网络）
  │                            │    计算应该阻塞多久
  └─────────────┬─────────────┘
                │
  ┌─────────────▼─────────────┐
  │          check             │  ← setImmediate 回调
  └─────────────┬─────────────┘
                │
  ┌─────────────▼─────────────┐
  │      close callbacks      │  ← socket.on('close') 等
  └─────────────┬─────────────┘
                │
                └──→ 回到 timers
```

### 4.2 浏览器 vs Node.js 的关键差异

```
浏览器 vs Node.js：
═══════════════════════════════════════

                浏览器               Node.js
                ──────               ───────
微任务队列      一个                  多个（按类型分）
微任务执行时机  每个宏任务后          每个阶段切换间
setImmediate    不支持                支持（check 阶段）
process.*       不支持                支持
UI 渲染         有渲染阶段            无
queueMicrotask  支持                  支持
```

### 4.3 process.nextTick vs Promise

```js
// process.nextTick 优先级高于 Promise
process.nextTick(() => console.log('nextTick1'));
Promise.resolve().then(() => console.log('promise1'));
process.nextTick(() => console.log('nextTick2'));

// 输出：nextTick1 → nextTick2 → promise1
// nextTick 队列在微任务队列之前执行
```

## 五、requestIdleCallback 与 rAF 的时机

### 5.1 在一帧中的位置

```
一帧 16.67ms 的时间分配：
═══════════════════════════════════════════════════════

  |←── 事件处理 ──→|← JS →|← rAF →|← Layout →|← Paint →|← idle →|
  |                |       |        |          |         |         |
  0ms              4ms     8ms     12ms       14ms     16ms    剩余时间

  • requestAnimationFrame: 在 Layout 之前执行
  • requestIdleCallback:   在帧末尾的空闲时间执行
```

### 5.2 requestIdleCallback 使用

```js
// 低优先级任务在空闲时执行
function processLargeList(deadline) {
  // deadline.timeRemaining() 返回当前帧剩余时间（ms）
  while (deadline.timeRemaining() > 0 && tasks.length > 0) {
    const task = tasks.shift();
    processTask(task);
  }

  // 如果还有任务，请求下一帧空闲时继续
  if (tasks.length > 0) {
    requestIdleCallback(processLargeList);
  }
}

requestIdleCallback(processLargeList);

// ⚠️ 注意：requestIdleCallback 不保证被调用
// 如果页面一直很忙，可能永远不执行
// React 的时间切片就是类似思路，但用 MessageChannel 实现
```

## 六、面试要点

- 事件循环的**完整步骤**必须能清晰描述
- 宏任务和微任务的**分类**和**优先级**
- `async/await` 的本质是 **Promise 语法糖**，`await` 后面的代码相当于 `.then` 回调
- Node.js 事件循环的**六个阶段**及其作用
- `process.nextTick` 优先级**高于** `Promise.then`
- 经典代码执行顺序题要能**手写分析过程**

## 七、常见面试题

**Q1: 宏任务和微任务分别有哪些？执行顺序是什么？**

A: 宏任务：setTimeout、setInterval、I/O、UI rendering、MessageChannel。微任务：Promise.then、MutationObserver、queueMicrotask。每执行完一个宏任务，就清空所有微任务（包括微任务中新增的微任务），然后执行下一个宏任务。

**Q2: async/await 的执行顺序是什么？**

A: `await` 后面的代码相当于放在 `.then` 回调中，是微任务。`async` 函数在 `await` 之前的代码是同步执行的。注意 `await` 本身是同步执行的，它会将后面的代码放入微任务队列。

**Q3: setTimeout(fn, 0) 和 Promise.resolve().then(fn) 谁先执行？**

A: Promise 先执行。`setTimeout` 是宏任务，`Promise.then` 是微任务。微任务在当前宏任务结束后、下一个宏任务之前执行。

**Q4: requestAnimationFrame 和 setTimeout 谁先执行？**

A: `requestAnimationFrame` 在渲染前执行，`setTimeout` 是宏任务。如果在同一帧中，`setTimeout` 的回调作为宏任务先执行，然后才到渲染阶段的 `rAF`。但要注意，`rAF` 的回调在渲染循环中，而 `setTimeout` 在任务队列中，它们属于不同的调度机制。

**Q5: Node.js 中 setImmediate 和 setTimeout(fn, 0) 谁先执行？**

A: 不确定。在 I/O 回调中调用时 `setImmediate` 总是先执行；在主模块中调用时取决于事件循环的启动时机，顺序不确定。
