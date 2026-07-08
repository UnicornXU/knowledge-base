---
sidebar_position: 10
title: 手写 Promise.all/race/allSettled
---

# ✍️ 手写 Promise.all / Promise.race / Promise.allSettled

## 题目描述

手动实现 `Promise.all`、`Promise.race` 和 `Promise.allSettled` 三个静态方法。

**功能说明：**
- `Promise.all` - 所有 Promise 都成功才返回结果数组，有一个失败就立即失败
- `Promise.race` - 返回第一个完成（无论成功或失败）的 Promise 结果
- `Promise.allSettled` - 等待所有 Promise 结束，返回每个的状态和结果

## 核心思路

### Promise.all

```
输入：[p1, p2, p3]
输出：[v1, v2, v3] 或 reject(reason)

实现要点：
1. 创建结果数组，长度与输入相同
2. 计数器跟踪已完成数量
3. 每个 Promise 完成时，将结果存入对应位置
4. 所有完成时，resolve 结果数组
5. 任一失败，立即 reject
```

### Promise.race

```
输入：[p1, p2, p3]
输出：第一个完成的结果

实现要点：
1. 遍历所有 Promise
2. 每个 Promise 完成时，调用 resolve 或 reject
3. 由于 resolve/reject 只能调用一次，自动实现"竞争"效果
```

### Promise.allSettled

```
输入：[p1, p2, p3]
输出：[{status: 'fulfilled', value: v1}, {status: 'rejected', reason: r2}, ...]

实现要点：
1. 创建结果数组，长度与输入相同
2. 计数器跟踪已完成数量
3. 每个 Promise 结束（无论成功失败），将状态存入对应位置
4. 所有结束时，resolve 结果数组
```

## 实现代码

### Promise.all

```javascript
/**
 * 实现 Promise.all
 * 所有 Promise 都成功才返回结果数组，有一个失败就立即失败
 * @param {Iterable} promises - Promise 数组
 * @returns {Promise} 返回新的 Promise
 */
function promiseAll(promises) {
  return new Promise((resolve, reject) => {
    // 将迭代器转为数组
    const promiseArray = Array.from(promises);
    const length = promiseArray.length;

    // 处理空数组
    if (length === 0) {
      resolve([]);
      return;
    }

    // 结果数组
    const results = new Array(length);
    // 已完成计数器
    let count = 0;

    promiseArray.forEach((promise, index) => {
      // 确保是 Promise
      Promise.resolve(promise).then(
        (value) => {
          // 存储结果（保持顺序）
          results[index] = value;
          count++;

          // 所有完成时 resolve
          if (count === length) {
            resolve(results);
          }
        },
        (reason) => {
          // 任一失败，立即 reject
          reject(reason);
        }
      );
    });
  });
}
```

### Promise.race

```javascript
/**
 * 实现 Promise.race
 * 返回第一个完成（无论成功或失败）的 Promise 结果
 * @param {Iterable} promises - Promise 数组
 * @returns {Promise} 返回新的 Promise
 */
function promiseRace(promises) {
  return new Promise((resolve, reject) => {
    const promiseArray = Array.from(promises);

    // 处理空数组（永远不会 resolve）
    if (promiseArray.length === 0) {
      return;
    }

    promiseArray.forEach((promise) => {
      // 确保是 Promise
      // 由于 resolve/reject 只能调用一次，自动实现"竞争"效果
      Promise.resolve(promise).then(resolve, reject);
    });
  });
}
```

### Promise.allSettled

```javascript
/**
 * 实现 Promise.allSettled
 * 等待所有 Promise 结束，返回每个的状态和结果
 * @param {Iterable} promises - Promise 数组
 * @returns {Promise} 返回新的 Promise，值为结果数组
 */
function promiseAllSettled(promises) {
  return new Promise((resolve, reject) => {
    const promiseArray = Array.from(promises);
    const length = promiseArray.length;

    // 处理空数组
    if (length === 0) {
      resolve([]);
      return;
    }

    // 结果数组
    const results = new Array(length);
    // 已完成计数器
    let count = 0;

    promiseArray.forEach((promise, index) => {
      Promise.resolve(promise).then(
        (value) => {
          // 成功状态
          results[index] = {
            status: 'fulfilled',
            value,
          };
          count++;

          if (count === length) {
            resolve(results);
          }
        },
        (reason) => {
          // 失败状态
          results[index] = {
            status: 'rejected',
            reason,
          };
          count++;

          if (count === length) {
            resolve(results);
          }
        }
      );
    });
  });
}
```

### Promise.any

```javascript
/**
 * 实现 Promise.any
 * 返回第一个成功的 Promise，全部失败则返回 AggregateError
 * @param {Iterable} promises - Promise 数组
 * @returns {Promise} 返回新的 Promise
 */
function promiseAny(promises) {
  return new Promise((resolve, reject) => {
    const promiseArray = Array.from(promises);
    const length = promiseArray.length;

    // 处理空数组
    if (length === 0) {
      reject(new AggregateError([], 'All promises were rejected'));
      return;
    }

    // 失败计数器
    const errors = new Array(length);
    let count = 0;

    promiseArray.forEach((promise, index) => {
      Promise.resolve(promise).then(
        (value) => {
          // 任一成功，立即 resolve
          resolve(value);
        },
        (reason) => {
          // 记录失败原因
          errors[index] = reason;
          count++;

          // 全部失败时 reject
          if (count === length) {
            reject(new AggregateError(errors, 'All promises were rejected'));
          }
        }
      );
    });
  });
}
```

## 使用示例

```javascript
// ===== Promise.all =====
const p1 = Promise.resolve(1);
const p2 = new Promise((resolve) => setTimeout(() => resolve(2), 100));
const p3 = Promise.resolve(3);

promiseAll([p1, p2, p3]).then((values) => {
  console.log(values); // [1, 2, 3]
});

// 有一个失败
const p4 = Promise.reject('error');

promiseAll([p1, p4, p3])
  .then((values) => {
    console.log('不会执行');
  })
  .catch((error) => {
    console.log(error); // "error"
  });

// 空数组
promiseAll([]).then((values) => {
  console.log(values); // []
});

// ===== Promise.race =====
const fast = new Promise((resolve) => setTimeout(() => resolve('fast'), 100));
const slow = new Promise((resolve) => setTimeout(() => resolve('slow'), 500));

promiseRace([slow, fast]).then((value) => {
  console.log(value); // "fast"
});

// 第一个失败
const fail = new Promise((_, reject) => setTimeout(() => reject('fail'), 50));
const success = new Promise((resolve) => setTimeout(() => resolve('ok'), 100));

promiseRace([success, fail])
  .then((value) => {
    console.log('不会执行');
  })
  .catch((error) => {
    console.log(error); // "fail"
  });

// ===== Promise.allSettled =====
const p5 = Promise.resolve(1);
const p6 = Promise.reject('error');
const p7 = Promise.resolve(3);

promiseAllSettled([p5, p6, p7]).then((results) => {
  console.log(results);
  // [
  //   { status: 'fulfilled', value: 1 },
  //   { status: 'rejected', reason: 'error' },
  //   { status: 'fulfilled', value: 3 }
  // ]
});

// ===== Promise.any =====
const p8 = Promise.reject('error1');
const p9 = new Promise((resolve) => setTimeout(() => resolve('success'), 100));
const p10 = Promise.reject('error3');

promiseAny([p8, p9, p10]).then((value) => {
  console.log(value); // "success"
});

// 全部失败
promiseAny([p8, p10])
  .then((value) => {
    console.log('不会执行');
  })
  .catch((error) => {
    console.log(error); // AggregateError: All promises were rejected
  });
```

## 边界情况

- **空数组**：
  - `Promise.all([])` 返回 `[]`
  - `Promise.race([])` 永远不 resolve（挂起）
  - `Promise.allSettled([])` 返回 `[]`
  - `Promise.any([])` 抛出 AggregateError

- **非 Promise 值**：使用 `Promise.resolve()` 包装，确保统一处理

- **顺序保证**：`Promise.all` 和 `Promise.allSettled` 的结果顺序与输入顺序一致

- **立即失败**：`Promise.race` 取第一个完成的结果（无论成功或失败）

- **错误类型**：`Promise.any` 全部失败时抛出 `AggregateError`

## 复杂度分析

- **时间复杂度**：O(n) —— n 为 Promise 数量
- **空间复杂度**：O(n) —— 需要存储结果数组

## 面试追问

1. **Promise.all、race、allSettled、any 的区别？**
   | 方法 | 成功条件 | 失败条件 | 结果 |
   |------|---------|---------|------|
   | all | 全部成功 | 任一失败 | 结果数组 |
   | race | 第一个完成 | 第一个完成 | 单个结果 |
   | allSettled | 全部结束 | 永不失败 | 状态数组 |
   | any | 任一成功 | 全部失败 | 单个结果 |

2. **如何实现一个可取消的 Promise.all？**
   ```javascript
   function cancellableAll(promises) {
     const controller = new AbortController();
     const wrapped = promises.map((p) =>
       Promise.race([p, new Promise((_, reject) => {
         controller.signal.addEventListener('abort', () => reject(new Error('Cancelled')));
       })])
     );
     const result = Promise.all(wrapped);
     result.cancel = () => controller.abort();
     return result;
   }
   ```

3. **Promise.all 的错误处理最佳实践？**
   ```javascript
   // 使用 allSettled 代替 all，可以获取所有结果
   const results = await Promise.allSettled(promises);
   const successes = results.filter((r) => r.status === 'fulfilled');
   const failures = results.filter((r) => r.status === 'rejected');

   // 或者给每个 Promise 添加 catch
   const safePromises = promises.map((p) => p.catch((e) => e));
   const results2 = await Promise.all(safePromises);
   ```

4. **如何限制 Promise.all 的并发数？**
   ```javascript
   async function asyncPool(limit, items, iteratorFn) {
     const results = [];
     const executing = [];

     for (const [index, item] of items.entries()) {
       const p = Promise.resolve().then(() => iteratorFn(item, index));
       results.push(p);

       if (limit <= items.length) {
         const e = p.then(() => executing.splice(executing.indexOf(e), 1));
         executing.push(e);

         if (executing.length >= limit) {
           await Promise.race(executing);
         }
       }
     }

     return Promise.all(results);
   }
   ```

5. **Promise.race 的常见应用场景？**
   - 请求超时控制
   - 多数据源竞争（取最快的一个）
   - 竞态条件处理

6. **为什么 Promise.all 能保证结果顺序？**
   - 因为使用了 `results[index] = value`，按索引存储
   - 而不是 push，所以即使 Promise 完成顺序不同，结果顺序仍然正确
