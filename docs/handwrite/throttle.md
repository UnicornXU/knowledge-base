---
sidebar_position: 3
title: 手写节流
---

# ✍️ 手写节流（Throttle）

## 题目描述

实现一个节流函数 `throttle`，规定在一个单位时间内，只能触发一次函数。如果这个单位时间内触发多次函数，只有一次生效。

**典型应用场景：**
- 滚动加载（scroll 事件监听）
- 拖拽移动（mousemove 事件）
- 射击游戏（限制射击频率）
- 搜索联想（限制请求频率）

## 核心思路

```
事件触发 → 检查是否在节流期内 → 不在则执行 + 记录时间 → 在则跳过
```

```
时间线（节流周期为 200ms）：
|--触发(100ms)--触发(150ms)--触发(250ms)--触发(350ms)--|
|   执行✓       跳过✗        执行✓        执行✓        |
```

两种实现方式：
1. **时间戳实现**：首次立即执行，停止触发后不再执行
2. **定时器实现**：首次延迟执行，停止触发后还会执行一次

## 实现代码

### 时间戳实现（首次立即执行）

```javascript
/**
 * 时间戳版节流函数
 * 使用时间戳判断是否执行，首次触发立即执行
 * @param {Function} fn - 需要节流的函数
 * @param {number} interval - 节流间隔（毫秒）
 * @returns {Function} 节流后的函数
 */
function throttle(fn, interval) {
  // 记录上次执行的时间戳
  let lastTime = 0;

  return function (...args) {
    // 获取当前时间戳
    const now = Date.now();

    // 如果距离上次执行时间超过间隔，可以执行
    if (now - lastTime >= interval) {
      fn.apply(this, args);
      // 更新上次执行时间
      lastTime = now;
    }
  };
}
```

### 定时器实现（最后一次会执行）

```javascript
/**
 * 定时器版节流函数
 * 使用定时器延迟执行，停止触发后会执行最后一次
 * @param {Function} fn - 需要节流的函数
 * @param {number} interval - 节流间隔（毫秒）
 * @returns {Function} 节流后的函数
 */
function throttle(fn, interval) {
  let timer = null;

  return function (...args) {
    // 如果定时器存在，说明还在节流期内，跳过
    if (timer) {
      return;
    }

    // 创建定时器，延迟执行
    timer = setTimeout(() => {
      fn.apply(this, args);
      // 执行完毕后清空定时器
      timer = null;
    }, interval);
  };
}
```

### 终极版（支持首次/末次 + 取消）

```javascript
/**
 * 终极版节流函数
 * 支持配置首次和末次是否执行，以及取消功能
 * @param {Function} fn - 需要节流的函数
 * @param {number} interval - 节流间隔（毫秒）
 * @param {Object} options - 配置选项
 * @param {boolean} options.leading - 是否在节流开始时立即执行（默认 true）
 * @param {boolean} options.trailing - 是否在节流结束后执行一次（默认 true）
 * @returns {Function} 节流后的函数（带 cancel 方法）
 */
function throttle(fn, interval, options = {}) {
  let timer = null;
  let lastTime = 0;
  const { leading = true, trailing = true } = options;

  // 节流函数
  const throttled = function (...args) {
    const now = Date.now();

    // 如果不需要首次执行，且是第一次调用
    if (!leading && lastTime === 0) {
      lastTime = now;
    }

    // 计算剩余等待时间
    const remaining = interval - (now - lastTime);

    if (remaining <= 0) {
      // 可以执行
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }

      lastTime = now;
      fn.apply(this, args);
    } else if (!timer && trailing) {
      // 设置定时器，确保最后一次触发也能执行
      timer = setTimeout(() => {
        lastTime = leading ? Date.now() : 0;
        timer = null;
        fn.apply(this, args);
      }, remaining);
    }
  };

  // 取消方法
  throttled.cancel = function () {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    lastTime = 0;
  };

  return throttled;
}
```

## 使用示例

```javascript
// 基础用法：滚动节流
const handleScroll = throttle(() => {
  console.log('滚动位置:', window.scrollY);
  // 更新进度条、懒加载等
}, 200);

window.addEventListener('scroll', handleScroll);

// 拖拽移动
const handleMouseMove = throttle((e) => {
  console.log('鼠标位置:', e.clientX, e.clientY);
  // 更新拖拽元素位置
}, 16); // 约 60fps

element.addEventListener('mousemove', handleMouseMove);

// 只要末次执行（适合搜索联想）
const handleSearch = throttle(
  (keyword) => {
    fetch(`/api/search?q=${keyword}`);
  },
  500,
  { leading: false, trailing: true }
);

// 按钮点击：首次立即执行，末次不执行
const handleClick = throttle(
  () => {
    console.log('提交!');
    submitForm();
  },
  2000,
  { leading: true, trailing: false }
);

button.addEventListener('click', handleClick);

// 组件卸载时取消
// handleScroll.cancel();
```

## 边界情况

- **this 上下文**：使用 `apply` 确保 `this` 指向正确
- **参数传递**：透传所有参数给原函数
- **首次执行**：时间戳版首次立即执行，定时器版首次延迟执行
- **最后一次触发**：时间戳版不执行，定时器版会执行
- **时间精度**：`Date.now()` 精度足够，但高频调用时可能有微小偏差
- **内存泄漏**：组件销毁时需调用 `cancel` 清理定时器

## 复杂度分析

- **时间复杂度**：O(1) —— 每次调用只是时间比较或设置定时器
- **空间复杂度**：O(1) —— 只存储时间戳和定时器 ID

## 面试追问

1. **防抖和节流的本质区别是什么？**
   - 防抖：将多次执行变为**最后一次执行**（延迟执行）
   - 节流：将多次执行变为**每隔一段时间执行**（稀释执行）

2. **如何实现一个支持取消和立即执行的节流函数？**
   - 参考上面的「终极版」实现
   - `cancel()` 方法清除定时器
   - 通过 `leading` 和 `trailing` 选项控制行为

3. **requestAnimationFrame 可以替代节流吗？**
   ```javascript
   function rafThrottle(fn) {
     let ticking = false;
     return function (...args) {
       if (!ticking) {
         ticking = true;
         requestAnimationFrame(() => {
           fn.apply(this, args);
           ticking = false;
         });
       }
     };
   }
   ```
   - 适合动画场景，保证 60fps
   - 不适合非动画场景（如网络请求节流）

4. **在 React 中如何正确使用节流？**
   - 使用 `useMemo` 或 `useRef` 存储节流函数
   - 组件卸载时调用 `cancel`
   - 注意闭包陷阱（依赖项变化时需重建）

5. **lodash 的 throttle 和 debounce 有什么关系？**
   ```javascript
   // lodash 内部实现：throttle = debounce + maxWait
   _.throttle(fn, 200) ≈ _.debounce(fn, 200, { maxWait: 200 })
   ```

6. **如何实现一个返回 Promise 的节流函数？**
   ```javascript
   function throttleAsync(fn, interval) {
     let lastTime = 0;
     return function (...args) {
       const now = Date.now();
       if (now - lastTime >= interval) {
         lastTime = now;
         return Promise.resolve(fn.apply(this, args));
       }
       return Promise.resolve(null);
     };
   }
   ```
