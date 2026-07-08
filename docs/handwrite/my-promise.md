---
sidebar_position: 9
title: 手写 Promise
---

# ✍️ 手写 Promise

## 题目描述

实现一个符合 Promise/A+ 规范的 Promise 类。

**Promise 的三种状态：**
- `pending`（待定）：初始状态
- `fulfilled`（已兑现）：操作成功
- `rejected`（已拒绝）：操作失败

**状态转换规则：**
- `pending` → `fulfilled`
- `pending` → `rejected`
- 状态一旦改变，不可逆

## 核心思路

```
状态机模型：

       then()
pending ──────→ fulfilled ──────→ value
  │                                  ↑
  │ catch()                          │
  ↓                                  │
rejected ──────→ reason ────────────┘
       (通过 then 的第二个参数或 catch)

关键实现点：
1. 状态机：管理 pending/fulfilled/rejected 状态转换
2. then 方法：注册回调，支持链式调用
3. 微任务：使用 queueMicrotask 或 MutationObserver 模拟
4. 值穿透：then 的参数如果不是函数，透传给下一个 then
```

```
链式调用原理：
promise1.then(fn1).then(fn2).then(fn3)

每个 then 返回一个新的 Promise
fn1 的返回值作为 fn2 的输入
fn2 的返回值作为 fn3 的输入
```

## 实现代码

### 完整 Promise 实现

```javascript
/**
 * 手写 Promise（符合 Promise/A+ 规范核心）
 */
class MyPromise {
  // 状态常量
  static PENDING = 'pending';
  static FULFILLED = 'fulfilled';
  static REJECTED = 'rejected';

  /**
   * @param {Function} executor - 执行器函数 (resolve, reject) => {}
   */
  constructor(executor) {
    // 初始状态
    this.status = MyPromise.PENDING;
    // 终值
    this.value = undefined;
    // 拒因
    this.reason = undefined;
    // 成功回调队列
    this.onFulfilledCallbacks = [];
    // 失败回调队列
    this.onRejectedCallbacks = [];

    // resolve 函数
    const resolve = (value) => {
      // 如果 resolve 的值是 Promise，则递归解析
      if (value instanceof MyPromise) {
        value.then(resolve, reject);
        return;
      }

      // 只有 pending 状态才能转换
      if (this.status === MyPromise.PENDING) {
        this.status = MyPromise.FULFILLED;
        this.value = value;
        // 执行所有成功回调
        this.onFulfilledCallbacks.forEach((callback) => callback());
      }
    };

    // reject 函数
    const reject = (reason) => {
      if (this.status === MyPromise.PENDING) {
        this.status = MyPromise.REJECTED;
        this.reason = reason;
        // 执行所有失败回调
        this.onRejectedCallbacks.forEach((callback) => callback());
      }
    };

    // 立即执行 executor
    try {
      executor(resolve, reject);
    } catch (error) {
      // 如果 executor 抛出错误，直接 reject
      reject(error);
    }
  }

  /**
   * then 方法
   * @param {Function} onFulfilled - 成功回调
   * @param {Function} onRejected - 失败回调
   * @returns {MyPromise} 返回新的 Promise，支持链式调用
   */
  then(onFulfilled, onRejected) {
    // 值穿透：如果不是函数，创建默认函数
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : (value) => value;
    onRejected = typeof onRejected === 'function' ? onRejected : (reason) => { throw reason; };

    // 返回新的 Promise
    const promise2 = new MyPromise((resolve, reject) => {
      // 封装处理函数
      const handleFulfilled = () => {
        // 使用微任务模拟异步
        queueMicrotask(() => {
          try {
            // 获取回调的返回值
            const x = onFulfilled(this.value);
            // 解析返回值（可能是 Promise 或普通值）
            resolvePromise(promise2, x, resolve, reject);
          } catch (error) {
            reject(error);
          }
        });
      };

      const handleRejected = () => {
        queueMicrotask(() => {
          try {
            const x = onRejected(this.reason);
            resolvePromise(promise2, x, resolve, reject);
          } catch (error) {
            reject(error);
          }
        });
      };

      // 根据状态执行对应的回调
      if (this.status === MyPromise.FULFILLED) {
        handleFulfilled();
      } else if (this.status === MyPromise.REJECTED) {
        handleRejected();
      } else if (this.status === MyPromise.PENDING) {
        // pending 状态，将回调存入队列
        this.onFulfilledCallbacks.push(handleFulfilled);
        this.onRejectedCallbacks.push(handleRejected);
      }
    });

    return promise2;
  }

  /**
   * catch 方法
   * @param {Function} onRejected - 失败回调
   * @returns {MyPromise}
   */
  catch(onRejected) {
    return this.then(null, onRejected);
  }

  /**
   * finally 方法
   * @param {Function} callback - 无论成功失败都会执行
   * @returns {MyPromise}
   */
  finally(callback) {
    return this.then(
      (value) => {
        // 等待 finally 回调执行完毕后，返回原值
        return MyPromise.resolve(callback()).then(() => value);
      },
      (reason) => {
        return MyPromise.resolve(callback()).then(() => { throw reason; });
      }
    );
  }

  // ===== 静态方法 =====

  /**
   * Promise.resolve
   * @param {*} value
   * @returns {MyPromise}
   */
  static resolve(value) {
    if (value instanceof MyPromise) {
      return value;
    }
    return new MyPromise((resolve) => resolve(value));
  }

  /**
   * Promise.reject
   * @param {*} reason
   * @returns {MyPromise}
   */
  static reject(reason) {
    return new MyPromise((_, reject) => reject(reason));
  }

  /**
   * Promise.all
   * @param {Iterable} promises
   * @returns {MyPromise}
   */
  static all(promises) {
    return new MyPromise((resolve, reject) => {
      const results = [];
      let count = 0;
      const promiseArray = Array.from(promises);

      if (promiseArray.length === 0) {
        resolve(results);
        return;
      }

      promiseArray.forEach((promise, index) => {
        MyPromise.resolve(promise).then(
          (value) => {
            results[index] = value;
            count++;
            if (count === promiseArray.length) {
              resolve(results);
            }
          },
          (reason) => {
            reject(reason);
          }
        );
      });
    });
  }

  /**
   * Promise.race
   * @param {Iterable} promises
   * @returns {MyPromise}
   */
  static race(promises) {
    return new MyPromise((resolve, reject) => {
      const promiseArray = Array.from(promises);

      if (promiseArray.length === 0) {
        return;
      }

      promiseArray.forEach((promise) => {
        MyPromise.resolve(promise).then(resolve, reject);
      });
    });
  }
}

/**
 * 解析 Promise（处理 then 返回值）
 * 这是 Promise/A+ 规范的核心
 * @param {MyPromise} promise2 - then 返回的新 Promise
 * @param {*} x - then 回调的返回值
 * @param {Function} resolve - promise2 的 resolve
 * @param {Function} reject - promise2 的 reject
 */
function resolvePromise(promise2, x, resolve, reject) {
  // 防止循环引用
  if (promise2 === x) {
    return reject(new TypeError('Chaining cycle detected for promise'));
  }

  // 标记是否已经调用过 resolve/reject（防止多次调用）
  let called = false;

  // 如果 x 是对象或函数（可能是 Promise）
  if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
    try {
      // 获取 x 的 then 方法
      const then = x.then;

      if (typeof then === 'function') {
        // x 是一个 thenable 对象，按照 Promise 处理
        then.call(
          x,
          (y) => {
            if (called) return;
            called = true;
            // 递归解析（y 可能也是 Promise）
            resolvePromise(promise2, y, resolve, reject);
          },
          (r) => {
            if (called) return;
            called = true;
            reject(r);
          }
        );
      } else {
        // x 是普通对象
        if (called) return;
        called = true;
        resolve(x);
      }
    } catch (error) {
      if (called) return;
      called = true;
      reject(error);
    }
  } else {
    // x 是普通值，直接 resolve
    resolve(x);
  }
}
```

## 使用示例

```javascript
// ===== 基本用法 =====
const promise = new MyPromise((resolve, reject) => {
  setTimeout(() => {
    resolve('成功！');
  }, 1000);
});

promise.then((value) => {
  console.log(value); // 1秒后输出："成功！"
});

// ===== 链式调用 =====
new MyPromise((resolve) => resolve(1))
  .then((value) => {
    console.log(value); // 1
    return value + 1;
  })
  .then((value) => {
    console.log(value); // 2
    return new MyPromise((resolve) => resolve(value * 2));
  })
  .then((value) => {
    console.log(value); // 4
  });

// ===== 错误处理 =====
new MyPromise((resolve, reject) => {
  reject('出错了');
})
  .then((value) => {
    console.log('不会执行');
  })
  .catch((error) => {
    console.log(error); // "出错了"
  });

// ===== finally =====
new MyPromise((resolve) => resolve('成功'))
  .finally(() => {
    console.log('finally 执行');
  })
  .then((value) => {
    console.log(value); // "成功"（finally 不影响值）
  });

// ===== Promise.all =====
const p1 = MyPromise.resolve(1);
const p2 = MyPromise.resolve(2);
const p3 = MyPromise.resolve(3);

MyPromise.all([p1, p2, p3]).then((values) => {
  console.log(values); // [1, 2, 3]
});

// ===== Promise.race =====
const fast = new MyPromise((resolve) => setTimeout(() => resolve('fast'), 100));
const slow = new MyPromise((resolve) => setTimeout(() => resolve('slow'), 500));

MyPromise.race([fast, slow]).then((value) => {
  console.log(value); // "fast"
});
```

## 边界情况

- **状态不可逆**：一旦状态从 pending 变为 fulfilled 或 rejected，就不能再改变
- **循环引用**：如果 then 返回的值就是 promise2 本身，需要抛出 TypeError
- **thenable 对象**：如果返回值有 then 方法，需要按 Promise 方式处理
- **多次调用**：resolve 和 reject 只能调用一次，后续调用应忽略
- **异步执行**：then 的回调应该是异步执行的（使用微任务）
- **值穿透**：如果 then 的参数不是函数，应该透传给下一个 then
- **错误捕获**：executor 中抛出的错误应该被 reject 捕获

## 复杂度分析

- **时间复杂度**：O(n) —— n 为 then 链的长度
- **空间复杂度**：O(n) —— 需要存储回调队列

## 面试追问

1. **Promise 的状态有哪些？为什么状态一旦改变就不可逆？**
   - 三种状态：pending、fulfilled、rejected
   - 状态不可逆是为了保证 Promise 的行为可预测
   - 一旦 resolve 或 reject 被调用，结果就确定了

2. **then 为什么可以链式调用？**
   - 因为 then 方法返回一个新的 Promise
   - 新 Promise 的值由 then 回调的返回值决定
   - 通过 resolvePromise 函数处理返回值（可能是 Promise 或普通值）

3. **什么是微任务？为什么用微任务而不是宏任务？**
   - 微任务：Promise.then、MutationObserver、queueMicrotask
   - 宏任务：setTimeout、setInterval、I/O
   - 微任务在当前宏任务结束后立即执行，优先级更高
   - Promise 规范要求回调在当前执行栈清空后立即执行

4. **如何实现 Promise.all？如果有一个失败怎么办？**
   - 创建计数器，记录已完成的 Promise 数量
   - 每个 Promise 完成时，将结果存入对应位置
   - 当所有 Promise 都完成时，resolve 结果数组
   - 如果有一个 reject，立即 reject

5. **Promise 和 async/await 的关系？**
   ```javascript
   // async 函数返回 Promise
   async function foo() {
     return 1;
   }
   foo().then(console.log); // 1

   // await 等待 Promise 完成
   async function bar() {
     const result = await foo();
     console.log(result); // 1
   }
   ```

6. **如何取消一个 Promise？**
   ```javascript
   // 使用 AbortController
   const controller = new AbortController();
   const promise = fetch(url, { signal: controller.signal });

   // 取消请求
   controller.abort();

   // 或者封装一个可取消的 Promise
   function cancellablePromise(executor) {
     let cancel;
     const promise = new Promise((resolve, reject) => {
       cancel = () => reject(new Error('Cancelled'));
       executor(resolve, reject);
     });
     promise.cancel = cancel;
     return promise;
   }
   ```

7. **手写 Promise 和原生 Promise 有什么区别？**
   - 原生 Promise 由引擎优化，性能更好
   - 原生 Promise 支持更完整的错误处理（如 unhandledrejection 事件）
   - 手写版本主要用于理解原理
   - 实际开发应使用原生 Promise
