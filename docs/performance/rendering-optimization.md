---
sidebar_position: 3
title: 渲染性能优化
tags:
  - 性能优化
  - 渲染
  - 重排重绘
---

# 🖥️ 渲染性能优化

> **"60fps = 每帧 16.67ms，超过这个时间用户就会感到卡顿"**

渲染性能直接影响用户体验。让我们深入了解浏览器渲染机制，以及如何让页面丝般顺滑。

## 一、浏览器渲染流程

### 1.1 关键渲染路径（CRP）

```
关键渲染路径
───────────────────────────────────────────────────────────

HTML ──→ DOM ──┐
               ├──→ Render Tree ──→ Layout ──→ Paint ──→ Composite
CSS  ──→ CSSOM ┘

详细过程：
1. 解析 HTML → 构建 DOM 树
2. 解析 CSS  → 构建 CSSOM 树
3. 合并      → 构建 Render Tree
4. 布局（Layout）→ 计算元素位置和大小
5. 绘制（Paint） → 填充像素
6. 合成（Composite）→ 合成图层 → 显示
```

### 1.2 不同属性的渲染开销

```
渲染开销对比（从低到高）
────────────────────────────────────────────────────

✅ 最便宜（只触发 Composite）
├── transform
├── opacity
└── filter

⚠️ 中等（触发 Paint + Composite）
├── color
├── background-color
├── box-shadow
└── outline

❌ 最贵（触发 Layout + Paint + Composite）
├── width / height
├── margin / padding
├── border
├── top / left / right / bottom
├── display
├── position
└── font-size
```

---

## 二、重排（Reflow）与重绘（Repaint）

### 2.1 什么是重排？

重排就是重新计算元素的**位置和大小**。

```
触发重排的操作
────────────────────────────────────────────────────

📐 几何属性变化
├── width, height
├── margin, padding
├── border
└── position

📝 内容变化
├── 文字内容
├── 图片尺寸
└── 字体大小

🏗️ 结构变化
├── 添加/删除 DOM 元素
└── display: none

🔄 强制重排
├── 读取 offset/scroll/client 系列属性
├── 读取 getComputedStyle
└── 读取 getBoundingClientRect
```

### 2.2 什么是重绘？

重绘就是重新绘制元素的**视觉样式**（不影响布局）。

```
触发重绘的操作
────────────────────────────────────────────────────

🎨 视觉属性变化
├── color
├── background-color
├── visibility
├── box-shadow
├── outline
└── border-radius
```

### 2.3 避免强制同步布局

```javascript
// ❌ 错误：读写交替，触发强制同步布局
function badLayout() {
  const elements = document.querySelectorAll('.item');
  elements.forEach(el => {
    // 读取 → 触发重排
    const width = el.offsetWidth;
    // 写入 → 触发重排
    el.style.width = width + 10 + 'px';
  });
}

// ✅ 正确：批量读取，批量写入
function goodLayout() {
  const elements = document.querySelectorAll('.item');
  
  // 批量读取
  const widths = Array.from(elements).map(el => el.offsetWidth);
  
  // 批量写入
  elements.forEach((el, i) => {
    el.style.width = widths[i] + 10 + 'px';
  });
}
```

### 2.4 使用 FastDOM 优化

```javascript
import fastdom from 'fastdom';

// FastDOM 自动批量处理读写操作
function optimizedLayout() {
  const elements = document.querySelectorAll('.item');
  
  elements.forEach(el => {
    fastdom.measure(() => {
      // 读取操作
      const width = el.offsetWidth;
      
      fastdom.mutate(() => {
        // 写入操作
        el.style.width = width + 10 + 'px';
      });
    });
  });
}
```

---

## 三、CSS 动画优化

### 3.1 使用 transform 和 opacity

```css
/* ❌ 性能差：触发 Layout */
.bad-animation {
  transition: left 0.3s, top 0.3s;
}

.bad-animation:hover {
  left: 100px;
  top: 100px;
}

/* ✅ 性能好：只触发 Composite */
.good-animation {
  transition: transform 0.3s;
  will-change: transform;
}

.good-animation:hover {
  transform: translate(100px, 100px);
}
```

### 3.2 GPU 加速

```css
/* 提升到合成层 */
.accelerated {
  /* 方法1：will-change */
  will-change: transform;
  
  /* 方法2：transform: translateZ(0) */
  transform: translateZ(0);
  
  /* 方法3：backface-visibility */
  backface-visibility: hidden;
}
```

**合成层的优势：**
- 合成层的重绘不会影响其他层
- 合成层的 transform/opacity 动画由 GPU 处理
- 合成层可以独立于主线程更新

### 3.3 使用 CSS contain

```css
/* contain 属性告诉浏览器元素的边界 */
.isolated-component {
  /* 布局隔离：内部布局不影响外部 */
  contain: layout;
  
  /* 样式隔离：计数器等不影响外部 */
  contain: style;
  
  /* 绘制隔离：内容不超出边界 */
  contain: paint;
  
  /* 完全隔离（推荐用于组件） */
  contain: strict;
  
  /* 内容隔离（常用） */
  contain: content;
}
```

### 3.4 requestAnimationFrame

```javascript
// ❌ 错误：使用 setTimeout 做动画
function badAnimation() {
  let position = 0;
  
  function move() {
    position += 2;
    element.style.left = position + 'px';
    
    if (position < 300) {
      setTimeout(move, 16); // 不同步浏览器刷新率
    }
  }
  
  move();
}

// ✅ 正确：使用 requestAnimationFrame
function goodAnimation() {
  let position = 0;
  let startTime = null;
  
  function move(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    
    // 基于时间的动画（帧率无关）
    position = Math.min((elapsed / 1000) * 200, 300);
    element.style.transform = `translateX(${position}px)`;
    
    if (position < 300) {
      requestAnimationFrame(move);
    }
  }
  
  requestAnimationFrame(move);
}
```

---

## 四、JavaScript 执行优化

### 4.1 长任务拆分

```javascript
// ❌ 长任务阻塞主线程
function processLargeArray(items) {
  items.forEach(item => {
    // 耗时操作
    heavyComputation(item);
  });
}

// ✅ 使用时间切片
function processLargeArrayAsync(items, chunkSize = 100) {
  let index = 0;
  
  function processChunk() {
    const chunk = items.slice(index, index + chunkSize);
    chunk.forEach(item => heavyComputation(item));
    index += chunkSize;
    
    if (index < items.length) {
      // 让出主线程，下一帧继续
      requestAnimationFrame(processChunk);
      // 或者使用 scheduler.yield()
      // scheduler.yield().then(processChunk);
    }
  }
  
  processChunk();
}
```

### 4.2 使用 requestIdleCallback

```javascript
// 在浏览器空闲时执行非关键任务
function processIdleTasks(tasks) {
  let taskIndex = 0;
  
  function processNextTask(deadline) {
    // 当有空闲时间且还有任务时
    while (deadline.timeRemaining() > 0 && taskIndex < tasks.length) {
      const task = tasks[taskIndex];
      task();
      taskIndex++;
    }
    
    // 如果还有任务，等待下一个空闲期
    if (taskIndex < tasks.length) {
      requestIdleCallback(processNextTask);
    }
  }
  
  requestIdleCallback(processNextTask);
}

// 使用
const tasks = [
  () => console.log('任务1'),
  () => console.log('任务2'),
  () => console.log('任务3'),
];

processIdleTasks(tasks);
```

### 4.3 Web Worker

```javascript
// main.js - 主线程
const worker = new Worker('worker.js');

worker.postMessage({ data: largeDataset });

worker.onmessage = (event) => {
  const result = event.data;
  updateUI(result);
};
```

```javascript
// worker.js - 工作线程
self.onmessage = (event) => {
  const { data } = event;
  
  // 耗时计算放在 Worker 中
  const result = heavyComputation(data);
  
  self.postMessage(result);
};
```

---

## 五、列表渲染优化

### 5.1 虚拟列表

```javascript
// React 虚拟列表（使用 react-window）
import { FixedSizeList } from 'react-window';

function VirtualList({ items }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      {items[index].name}
    </div>
  );

  return (
    <FixedSizeList
      height={600}
      width="100%"
      itemCount={items.length}
      itemSize={50}
    >
      {Row}
    </FixedSizeList>
  );
}
```

### 5.2 Vue 虚拟列表

```vue
<template>
  <RecycleScroller
    :items="items"
    :item-size="50"
    key-field="id"
  >
    <template #default="{ item }">
      <div class="list-item">
        {{ item.name }}
      </div>
    </template>
  </RecycleScroller>
</template>

<script>
import { RecycleScroller } from 'vue-virtual-scroller';

export default {
  components: { RecycleScroller },
  data() {
    return {
      items: Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
      })),
    };
  },
};
</script>
```

---

## 六、事件处理优化

### 6.1 事件委托

```javascript
// ❌ 为每个元素绑定事件
function badEventHandling() {
  const items = document.querySelectorAll('.list-item');
  items.forEach(item => {
    item.addEventListener('click', handleClick);
  });
}

// ✅ 事件委托
function goodEventHandling() {
  const list = document.querySelector('.list');
  
  list.addEventListener('click', (event) => {
    // 判断点击的是否是目标元素
    if (event.target.matches('.list-item')) {
      handleClick(event);
    }
  });
}
```

### 6.2 防抖与节流

```javascript
// 防抖：等待一段时间后执行
function debounce(fn, delay) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

// 节流：固定时间间隔执行
function throttle(fn, interval) {
  let lastTime = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastTime >= interval) {
      lastTime = now;
      fn.apply(this, args);
    }
  };
}

// 使用
const handleScroll = throttle(() => {
  // 滚动处理
}, 16); // 60fps

window.addEventListener('scroll', handleScroll);
```

---

## 七、内存优化

### 7.1 避免内存泄漏

```javascript
// ❌ 常见内存泄漏

// 1. 未清理的事件监听器
function setup() {
  window.addEventListener('resize', handleResize);
  // 组件卸载时忘记移除
}

// 2. 未清理的定时器
function startPolling() {
  setInterval(() => {
    fetchData();
  }, 1000);
  // 组件卸载时忘记清理
}

// 3. 闭包引用
function createHeavyObject() {
  const largeData = new Array(1000000);
  
  return function () {
    // 闭包引用了 largeData，无法释放
    console.log(largeData.length);
  };
}

// ✅ 正确处理

// 1. 清理事件监听器
function setup() {
  window.addEventListener('resize', handleResize);
  
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}

// 2. 清理定时器
function startPolling() {
  const timer = setInterval(() => {
    fetchData();
  }, 1000);
  
  return () => {
    clearInterval(timer);
  };
}

// 3. 及时释放引用
function process() {
  let largeData = new Array(1000000);
  
  // 处理完后释放
  largeData = null;
}
```

### 7.2 WeakMap 和 WeakRef

```javascript
// 使用 WeakMap 避免内存泄漏
const cache = new WeakMap();

function processObject(obj) {
  if (cache.has(obj)) {
    return cache.get(obj);
  }
  
  const result = heavyComputation(obj);
  cache.set(obj, result);
  
  // 当 obj 被垃圾回收时，缓存自动清除
  return result;
}

// 使用 WeakRef（ES2021）
let weakRef = new WeakRef(largeObject);

// 使用时检查是否还存在
function useObject() {
  const obj = weakRef.deref();
  
  if (obj) {
    // 对象仍然存在
    return obj;
  } else {
    // 对象已被回收，重新创建
    return createNewObject();
  }
}
```

---

## 八、实战案例

### 案例：滚动列表优化

**优化前：**
```javascript
// 每次滚动都触发大量计算
window.addEventListener('scroll', () => {
  const items = document.querySelectorAll('.item');
  items.forEach(item => {
    const rect = item.getBoundingClientRect();
    if (rect.top < window.innerHeight) {
      item.classList.add('visible');
    }
  });
});
```

**优化后：**
```javascript
// 1. 使用 Intersection Observer
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { rootMargin: '100px' }
);

document.querySelectorAll('.item').forEach(item => {
  observer.observe(item);
});

// 2. 如果必须监听滚动，使用节流
const handleScroll = throttle(() => {
  // 批量处理
  requestAnimationFrame(() => {
    // 更新视图
  });
}, 16);

window.addEventListener('scroll', handleScroll);
```

---

## 🎯 高频面试题

### 1. 重排和重绘的区别？如何避免？

**答：**

```
重排（Reflow）：重新计算元素位置和大小
├── 触发：修改几何属性、DOM 结构变化
├── 开销：大（需要重新计算整个渲染树）
└── 避免：批量修改、使用 transform、脱离文档流

重绘（Repaint）：重新绘制元素外观
├── 触发：修改视觉属性（颜色、背景等）
├── 开销：中（不需要重新计算布局）
└── 避免：减少 DOM 操作、使用 CSS 类切换
```

### 2. 如何优化 CSS 动画性能？

**答：**

```css
/* 1. 使用 transform 和 opacity */
.animated {
  /* ✅ 只触发 Composite */
  transform: translateX(100px);
  opacity: 0.5;
  
  /* ❌ 触发 Layout */
  left: 100px;
  width: 200px;
}

/* 2. 提升到合成层 */
.animated {
  will-change: transform;
  /* 或 */
  transform: translateZ(0);
}

/* 3. 使用 contain 隔离 */
.component {
  contain: layout style paint;
}
```

### 3. 什么是长任务？如何处理？

**答：**

长任务是指**执行时间超过 50ms** 的 JavaScript 任务，会阻塞主线程，导致页面卡顿。

```javascript
// 处理长任务的方法：

// 1. 时间切片
function processInChunks(items) {
  const chunkSize = 100;
  let index = 0;
  
  function process() {
    const chunk = items.slice(index, index + chunkSize);
    chunk.forEach(item => doWork(item));
    index += chunkSize;
    
    if (index < items.length) {
      requestAnimationFrame(process);
    }
  }
  
  process();
}

// 2. 使用 scheduler.yield()（新 API）
async function process() {
  for (const item of items) {
    doWork(item);
    
    // 每处理一项就让出主线程
    await scheduler.yield();
  }
}

// 3. 使用 Web Worker
const worker = new Worker('processor.js');
worker.postMessage(largeDataset);
```

---

## 📚 推荐资源

- [Rendering Performance - web.dev](https://web.dev/rendering-performance/)
- [Inside look at modern web browser](https://developer.chrome.com/blog/inside-browser-part3/)
- [CSS Triggers](https://csstriggers.com/) - 查看哪些 CSS 属性会触发重排/重绘
- [Frame Timing API](https://developer.mozilla.org/en-US/docs/Web/API/Frame_Timing_API)
