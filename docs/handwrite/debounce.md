---
sidebar_position: 2
title: 手写防抖
---

# ✍️ 手写防抖（Debounce）

## 题目描述

实现一个防抖函数 `debounce`，在事件被触发 n 秒后再执行回调，如果在这 n 秒内又被触发，则重新计时。

**典型应用场景：**
- 搜索框输入联想（用户停止输入后再请求）
- 窗口 resize 重新布局
- 按钮防重复点击

## 核心思路

```
事件触发 → 清除之前的定时器 → 创建新的定时器 → 延迟执行回调
```

```
时间线：
|--触发--触发--触发------等待期结束------|
|  重置   重置   重置    → 执行回调      |
```

关键点：
1. 使用 `setTimeout` 实现延迟执行
2. 每次触发时清除上一次的定时器（`clearTimeout`）
3. 通过 `apply` 绑定正确的 `this` 上下文和参数

## 实现代码

### 基础版

```javascript
/**
 * 基础版防抖函数
 * @param {Function} fn - 需要防抖的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
function debounce(fn, delay) {
  // 用于存储定时器ID
  let timer = null;

  return function (...args) {
    // 如果存在定时器，说明上次触发还未执行，需要清除
    if (timer) {
      clearTimeout(timer);
    }

    // 创建新的定时器
    timer = setTimeout(() => {
      // 使用 apply 确保 this 指向正确，并传入参数
      fn.apply(this, args);
      // 执行完毕后清空定时器引用
      timer = null;
    }, delay);
  };
}
```

### 进阶版（支持立即执行）

```javascript
/**
 * 进阶版防抖函数
 * @param {Function} fn - 需要防抖的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @param {boolean} immediate - 是否立即执行（首次触发时）
 * @returns {Function} 防抖后的函数
 */
function debounce(fn, delay, immediate = false) {
  let timer = null;

  return function (...args) {
    // 如果定时器存在，清除它
    if (timer) {
      clearTimeout(timer);
    }

    // 是否需要立即执行
    if (immediate) {
      // 如果定时器不存在，说明是首次触发或上次已执行完毕
      const callNow = !timer;

      // 设置定时器，delay 后将 timer 置为 null
      // 这样在 delay 时间内的后续触发不会立即执行
      timer = setTimeout(() => {
        timer = null;
      }, delay);

      // 首次触发时立即执行
      if (callNow) {
        fn.apply(this, args);
      }
    } else {
      // 延迟执行模式
      timer = setTimeout(() => {
        fn.apply(this, args);
        timer = null;
      }, delay);
    }
  };
}
```

### 终极版（支持取消）

```javascript
/**
 * 终极版防抖函数
 * @param {Function} fn - 需要防抖的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @param {Object} options - 配置选项
 * @param {boolean} options.immediate - 是否立即执行
 * @returns {Function} 防抖后的函数（带 cancel 方法）
 */
function debounce(fn, delay, options = {}) {
  let timer = null;
  const { immediate = false } = options;

  // 防抖函数
  const debounced = function (...args) {
    // 如果定时器存在，清除它
    if (timer) {
      clearTimeout(timer);
    }

    if (immediate) {
      const callNow = !timer;

      timer = setTimeout(() => {
        timer = null;
      }, delay);

      if (callNow) {
        fn.apply(this, args);
      }
    } else {
      timer = setTimeout(() => {
        fn.apply(this, args);
        timer = null;
      }, delay);
    }
  };

  // 取消方法：清除定时器，不再执行
  debounced.cancel = function () {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return debounced;
}
```

## 使用示例

```javascript
// 基础用法
const handleSearch = debounce((keyword) => {
  console.log('搜索:', keyword);
  // fetch(`/api/search?q=${keyword}`)
}, 300);

input.addEventListener('input', (e) => {
  handleSearch(e.target.value);
});

// 立即执行版本
const handleClick = debounce(
  () => {
    console.log('提交表单');
  },
  1000,
  true
);

button.addEventListener('click', handleClick);

// 带取消功能
const handleResize = debounce(() => {
  console.log('重新布局');
}, 200);

window.addEventListener('resize', handleResize);

// 组件卸载时取消
// componentWillUnmount() {
//   handleResize.cancel();
// }
```

## 边界情况

- **this 上下文**：使用 `apply` 或 `call` 确保回调函数中的 `this` 指向事件触发元素
- **参数传递**：需要透传事件对象和自定义参数
- **定时器清理**：组件销毁时应调用 `cancel` 方法防止内存泄漏
- **返回值**：防抖函数不返回原函数的返回值（若需要返回值，需用 Promise 包装）
- **连续调用**：在延迟期间连续调用，只有最后一次生效

## 复杂度分析

- **时间复杂度**：O(1) —— 每次调用只是设置/清除定时器
- **空间复杂度**：O(1) —— 只存储一个定时器 ID

## 面试追问

1. **防抖和节流的区别？各自的使用场景？**
   - 防抖：延迟执行，重新触发时重新计时。适合搜索联想等「最终状态」场景
   - 节流：固定频率执行。适合滚动、拖拽等「过程」场景

2. **如何实现一个返回 Promise 的防抖函数？**
   ```javascript
   function debounceAsync(fn, delay) {
     let timer = null;
     return function (...args) {
       clearTimeout(timer);
       return new Promise((resolve) => {
         timer = setTimeout(() => {
           resolve(fn.apply(this, args));
         }, delay);
       });
     };
   }
   ```

3. **React 中如何正确使用防抖？需要注意什么？**
   - 使用 `useCallback` 包裹防抖函数，避免每次渲染重新创建
   - 使用 `useRef` 存储定时器 ID
   - 组件卸载时调用 `cancel` 清理

4. **如果需要获取防抖函数最后一次执行的返回值，如何实现？**

5. **lodash 的 debounce 实现了哪些额外功能？**
   - `leading` 和 `trailing` 选项
   - `maxWait` 最大等待时间
   - `cancel` 和 `flush` 方法
