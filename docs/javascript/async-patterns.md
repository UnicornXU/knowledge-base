---
sidebar_position: 3
title: "异步编程"
difficulty: "medium"
tags: ["javascript", "async", "promise"]
---

# 异步编程

## Promise 基础

```javascript
const promise = new Promise((resolve, reject) => {
  setTimeout(() => resolve('done'), 1000);
});

promise.then(console.log); // "done"
```

## 手写 Promise.all

```javascript
function promiseAll(promises) {
  return new Promise((resolve, reject) => {
    const results = [];
    let count = 0;

    if (promises.length === 0) {
      resolve(results);
      return;
    }

    promises.forEach((p, i) => {
      Promise.resolve(p).then(
        (value) => {
          results[i] = value;
          if (++count === promises.length) {
            resolve(results);
          }
        },
        (reason) => reject(reason)
      );
    });
  });
}
```

## async/await 执行顺序

```javascript
async function foo() {
  console.log('1');
  await bar();
  console.log('2'); // 微任务
}

async function bar() {
  console.log('3');
}

console.log('4');
foo();
console.log('5');

// 输出顺序：4 → 1 → 3 → 5 → 2
```

### 解析

1. `4` — 同步代码先执行
2. `1` — 进入 `foo()`，执行同步部分
3. `3` — `await bar()` 执行 `bar()` 的同步部分
4. `5` — `await` 后面的代码被放入微任务队列，继续执行同步代码
5. `2` — 同步代码执行完毕，执行微任务

## 事件循环（Event Loop）

```
┌───────────────────────────┐
│         宏任务队列          │
│  setTimeout / setInterval │
│  I/O / UI rendering       │
└───────────┬───────────────┘
            │ 取一个宏任务执行
            ▼
┌───────────────────────────┐
│         微任务队列          │
│  Promise.then / catch     │
│  MutationObserver         │
│  queueMicrotask           │
└───────────┬───────────────┘
            │ 清空所有微任务
            ▼
      渲染（如果需要）
            │
            ▼
      取下一个宏任务
```

## 关键点

- `Promise` 构造函数中的代码是同步执行的
- `await` 后面的代码相当于放在 `.then()` 中（微任务）
- `process.nextTick` 优先级高于 `Promise.then`
- 宏任务每次取一个执行，微任务每次清空全部
