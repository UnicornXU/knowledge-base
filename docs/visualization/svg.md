---
sidebar_position: 2
title: SVG 原理与应用
difficulty: medium
tags:
  - svg
  - 矢量图形
  - 动画
  - 可视化
---

# ✏️ SVG 原理与应用

> **"SVG 是 Web 上的矢量图形标准，它让图形像 DOM 元素一样可交互、可样式化、可动画化"**

SVG（Scalable Vector Graphics）基于 XML 的矢量图形格式，是前端可视化中不可或缺的技术，尤其在图标、地图、交互式图表等场景中表现出色。

## 一、SVG 基础

### 1.1 SVG 与 Canvas 的本质区别

```
SVG vs Canvas：渲染模型对比
══════════════════════════════════════════════════

  SVG（保留模式 / Retained Mode）
  ┌─────────────────────────────────┐
  │  <circle cx="50" cy="50" r="30" │  ← 图形是 DOM 节点
  │    fill="red" />                │  ← 可独立绑定事件
  │                                 │  ← 可用 CSS 样式化
  │  浏览器维护一个"场景图"          │  ← 修改属性自动重绘
  └─────────────────────────────────┘

  Canvas（即时模式 / Immediate Mode）
  ┌─────────────────────────────────┐
  │  ctx.beginPath();               │  ← 绘制后不可修改
  │  ctx.arc(50, 50, 30, 0, 2π);   │  ← 只是一堆像素
  │  ctx.fill();                    │  ← 交互需手动计算
  └─────────────────────────────────┘
```

### 1.2 SVG 基本元素

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
  <!-- 矩形 -->
  <rect x="10" y="10" width="100" height="80" rx="8" fill="#4F46E5" />

  <!-- 圆形 -->
  <circle cx="200" cy="50" r="40" fill="#EF4444" opacity="0.8" />

  <!-- 椭圆 -->
  <ellipse cx="320" cy="50" rx="60" ry="30" fill="#10B981" />

  <!-- 线段 -->
  <line x1="10" y1="120" x2="390" y2="120" stroke="#6B7280" stroke-width="2" />

  <!-- 折线 -->
  <polyline points="10,150 100,200 200,140 300,180 390,130"
    fill="none" stroke="#8B5CF6" stroke-width="2" />

  <!-- 多边形 -->
  <polygon points="200,160 250,250 150,250" fill="#F59E0B" />

  <!-- 路径（最强大） -->
  <path d="M 10 280 Q 200 200 390 280" fill="none" stroke="#EC4899" stroke-width="3" />
</svg>
```

### 1.3 viewBox 详解

```
viewBox 坐标映射
══════════════════════════════════════════════════

  viewBox="minX minY width height"
                ↓
  定义了 SVG 内部的"虚拟坐标系"

  <svg width="200" height="200" viewBox="0 0 400 400">
  ┌──────────────────────────────┐
  │  viewBox: 0 0 400 400        │  ← 内部坐标系
  │                              │
  │    (0,0) ──────── (400,0)    │
  │      │              │        │
  │      │   实际绘制区域  │        │
  │      │              │        │
  │    (0,400) ──── (400,400)    │
  │                              │
  │  映射到 width=200, height=200 │  ← 实际显示大小
  │  等比缩放 2 倍               │
  └──────────────────────────────┘
```

```javascript
// viewBox 的常见用法

// 1. 自适应缩放：保持宽高比
// viewBox 定义内部坐标，width/height 定义显示大小
// SVG 会自动等比缩放
`<svg viewBox="0 0 100 100" width="200" height="200">`

// 2. preserveAspectRatio 控制对齐方式
`<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">`
// xMin / xMid / xMax  → 水平对齐
// YMin / YMid / YMax  → 垂直对齐
// meet → 保持宽高比，完全显示（类似 contain）
// slice → 保持宽高比，填满容器（类似 cover）
// none → 拉伸填满（不保持宽高比）

// 3. 动态修改 viewBox 实现"缩放平移"
const svg = document.querySelector('svg');
svg.setAttribute('viewBox', `${x} ${y} ${width} ${height}`);
```

---

## 二、SVG 路径（Path）

### 2.1 路径命令

```
SVG Path 命令速查
══════════════════════════════════════════════════

  命令    含义                示例
  ────    ────                ────
  M x,y   移动到 (Move To)    M 10 20
  L x,y   直线到 (Line To)    L 100 200
  H x     水平线              H 200
  V y     垂直线              V 150
  Q       二次贝塞尔          Q 50 10 100 50
  C       三次贝塞尔          C 20 80 95 10 180 60
  A       弧线 (Arc)          A rx ry x-rot large sweep x y
  Z       闭合路径            Z

  大写 = 绝对坐标，小写 = 相对坐标
```

### 2.2 路径实战：绘制图标

```xml
<!-- 用路径绘制一个心形 -->
<svg viewBox="0 0 100 100" width="200" height="200">
  <path d="
    M 50 90
    C 25 70, 0 50, 0 30
    C 0 10, 20 0, 50 20
    C 80 0, 100 10, 100 30
    C 100 50, 75 70, 50 90
    Z
  " fill="#EF4444" />
</svg>
```

---

## 三、SVG 动画

### 3.1 SMIL 动画（原生 SVG 动画）

```xml
<svg viewBox="0 0 200 200" width="200" height="200">
  <circle cx="100" cy="100" r="30" fill="#4F46E5">
    <!-- 属性动画 -->
    <animate attributeName="r" values="30;50;30" dur="2s" repeatCount="indefinite" />
    <animate attributeName="fill" values="#4F46E5;#EF4444;#4F46E5" dur="2s" repeatCount="indefinite" />
  </circle>

  <!-- 路径动画：让元素沿路径运动 -->
  <circle r="8" fill="#F59E0B">
    <animateMotion dur="3s" repeatCount="indefinite"
      path="M 10 80 Q 95 10 180 80" />
  </circle>
</svg>
```

### 3.2 CSS 动画

```css
/* SVG 元素支持 CSS 动画 */
.svg-rect {
  fill: #4F46E5;
  transition: fill 0.3s ease, transform 0.3s ease;
}

.svg-rect:hover {
  fill: #EF4444;
  transform: scale(1.1);
  transform-origin: center;
}

/* 旋转动画 */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-spinner {
  animation: spin 1s linear infinite;
  transform-origin: center;
}

/* 描边动画（画线效果） */
.draw-line {
  stroke-dasharray: 300;     /* 虚线总长 */
  stroke-dashoffset: 300;    /* 初始偏移（完全隐藏） */
  transition: stroke-dashoffset 1s ease;
}

.draw-line.active {
  stroke-dashoffset: 0;      /* 完全显示 */
}
```

### 3.3 JavaScript 动画

```javascript
// 使用 JavaScript 控制 SVG 动画
function animateSVGCircle(circle, targetRadius, duration) {
  const startRadius = parseFloat(circle.getAttribute('r'));
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // easeOutCubic 缓动函数
    const eased = 1 - Math.pow(1 - progress, 3);

    const currentRadius = startRadius + (targetRadius - startRadius) * eased;
    circle.setAttribute('r', currentRadius);

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

// GSAP 库也可以直接操作 SVG 属性
// gsap.to('.svg-circle', { attr: { r: 50 }, duration: 1 });
```

---

## 四、SVG 交互与事件

### 4.1 SVG 元素事件

```javascript
// SVG 元素支持标准 DOM 事件
const circle = document.querySelector('svg circle');

circle.addEventListener('click', (e) => {
  // e.target 是被点击的 SVG 元素
  const cx = e.target.getAttribute('cx');
  const cy = e.target.getAttribute('cy');
  console.log(`点击了圆心在 (${cx}, ${cy}) 的圆`);
});

circle.addEventListener('mouseenter', () => {
  circle.setAttribute('fill', '#EF4444');
});

circle.addEventListener('mouseleave', () => {
  circle.setAttribute('fill', '#4F46E5');
});

// 事件委托：在 SVG 根元素上监听
const svg = document.querySelector('svg');
svg.addEventListener('click', (e) => {
  if (e.target.tagName === 'rect') {
    // 处理矩形点击
  } else if (e.target.tagName === 'circle') {
    // 处理圆形点击
  }
});
```

### 4.2 SVG 与 CSS 的结合

```css
/* SVG 可以使用 CSS 选择器和样式 */
.chart-bar {
  fill: #4F46E5;
  cursor: pointer;
  transition: opacity 0.2s;
}

.chart-bar:hover {
  opacity: 0.8;
}

.chart-bar.active {
  stroke: #1F2937;
  stroke-width: 2;
}

/* 使用 CSS 变量实现主题切换 */
:root {
  --chart-primary: #4F46E5;
  --chart-secondary: #10B981;
}

.chart-line {
  stroke: var(--chart-primary);
}
```

---

## 五、SVG 性能优化

### 5.1 性能考量

```
SVG 性能优化策略
══════════════════════════════════════════════════

  📌 减少 DOM 节点数量
  ├── 超过 1000 个元素考虑用 Canvas 替代
  ├── 使用 <use> 复用重复图形
  └── 合并路径数据

  📌 优化渲染
  ├── 避免频繁修改触发重排的属性
  ├── 使用 CSS transform 代替 x/y 属性修改
  ├── 对动画元素使用 will-change: transform
  └── 避免在 SVG 上使用 filter（性能开销大）

  📌 按需渲染
  ├── 使用 visibility: hidden 代替 display: none
  ├── 虚拟滚动：只渲染可视区域内的元素
  └── 使用 IntersectionObserver 控制动画启停
```

### 5.2 SVG use 复用

```xml
<svg>
  <defs>
    <!-- 定义可复用的图形 -->
    <symbol id="icon-star" viewBox="0 0 24 24">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87
        1.18 6.88L12 17.77l-6.18 3.25L7 14.14
        2 9.27l6.91-1.01L12 2z" />
    </symbol>
  </defs>

  <!-- 复用 -->
  <use href="#icon-star" x="10" y="10" width="24" height="24" fill="#F59E0B" />
  <use href="#icon-star" x="50" y="10" width="24" height="24" fill="#EF4444" />
  <use href="#icon-star" x="90" y="10" width="24" height="24" fill="#10B981" />
</svg>
```

---

## 六、面试要点

### 高频面试题

**Q1: SVG 和 Canvas 怎么选？**

> - 少量元素（< 1000）+ 需要交互 → SVG
> - 大量元素 + 像素操作 → Canvas
> - 需要缩放不失真 → SVG
> - 复杂动画 + 高帧率 → Canvas / WebGL
> - 可访问性要求高 → SVG（语义化 DOM）

**Q2: viewBox 的作用是什么？**

> viewBox 定义了 SVG 内部的虚拟坐标系，通过 `minX minY width height` 四个值确定。它实现了"内部坐标"和"实际显示大小"的解耦，使得 SVG 可以自适应容器大小而不失真。

**Q3: 如何实现 SVG 路径描边动画？**

> 利用 `stroke-dasharray` 和 `stroke-dashoffset` 两个属性。`stroke-dasharray` 设置虚线模式的长度，`stroke-dashoffset` 设置偏移量。将 dasharray 设为路径总长，dashoffset 从总长过渡到 0，即可实现"画线"效果。

**Q4: SVG 的性能瓶颈在哪？**

> SVG 是 DOM 节点，当元素数量超过 1000 时，DOM 操作和重排开销急剧增加。解决方法：减少节点数、使用 use 复用、复杂场景改用 Canvas、对静态区域做扁平化处理。

**Q5: SVG 在响应式设计中的最佳实践？**

> 1. 使用 viewBox 而非固定 width/height
> 2. 设置 width="100%" 让 SVG 自适应容器
> 3. 用 preserveAspectRatio 控制对齐和缩放策略
> 4. 对于图标，考虑使用 symbol + use 的 sprite 方案
