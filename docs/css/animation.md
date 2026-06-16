---
title: "过渡与动画"
sidebar_position: 5
difficulty: "medium"
tags: ["css", "animation", "transition"]
---

# 过渡与动画

## 一、CSS 过渡（transition）

### 1.1 基本语法

```css
.button {
  background-color: #3498db;
  color: white;

  /* 分别设置 */
  transition-property: background-color, transform;
  transition-duration: 0.3s;
  transition-timing-function: ease;
  transition-delay: 0s;

  /* 简写（推荐） */
  transition: background-color 0.3s ease, transform 0.3s ease;
}

.button:hover {
  background-color: #2980b9;
  transform: translateY(-2px);
}
```

### 1.2 时间函数（timing-function）

```css
/* 预设值 */
.ease         /* 默认：先慢后快再慢 */
.linear       /* 匀速 */
.ease-in      /* 加速 */
.ease-out     /* 减速 */
.ease-in-out  /* 加速后减速 */

/* 贝塞尔曲线（自定义） */
transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);

/* 阶梯函数 */
transition: all 0.3s steps(5);   /* 5 步完成 */
```

### 1.3 过渡的注意事项

```css
/* 不能过渡的属性 */
.box {
  /* display: none → block 不支持过渡 */
  /* 用 visibility + opacity 替代实现淡入淡出 */
  transition: opacity 0.3s, visibility 0.3s;
}
.box.hidden {
  opacity: 0;
  visibility: hidden;   /* 不可交互 */
}

/* auto 值无法过渡 */
.container {
  /* height: 0 → height: auto 无法过渡 */
  /* 解决方案：使用 max-height 或 grid/fr */
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}
.container.open {
  max-height: 500px; /* 需要预估一个足够大的值 */
}

/* 更好的方案：使用 grid */
.wrapper {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.3s ease;
}
.wrapper.open {
  grid-template-rows: 1fr;
}
.wrapper > .content {
  overflow: hidden;
}
```

## 二、CSS 动画（animation）

### 2.1 @keyframes 定义

```css
/* 两种写法 */
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes slideUp {
  0%   { transform: translateY(100%); opacity: 0; }
  60%  { opacity: 1; }
  100% { transform: translateY(0); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.05); }
}
```

### 2.2 animation 属性

```css
.animated {
  /* 分别设置 */
  animation-name: fadeIn;
  animation-duration: 0.5s;
  animation-timing-function: ease-out;
  animation-delay: 0.2s;
  animation-iteration-count: 1;     /* infinite 无限循环 */
  animation-direction: normal;      /* alternate 交替反向 */
  animation-fill-mode: forwards;    /* 动画结束后保持最终状态 */
  animation-play-state: running;    /* paused 暂停 */

  /* 简写 */
  animation: fadeIn 0.5s ease-out 0.2s forwards;

  /* 多个动画 */
  animation:
    fadeIn 0.5s ease-out forwards,
    slideUp 0.5s ease-out forwards;
}
```

### 2.3 animation-fill-mode 理解

| 值 | 动画前 | 动画后 |
|---|--------|--------|
| `none` | 默认样式 | 默认样式 |
| `forwards` | 默认样式 | 保持结束帧 |
| `backwards` | 应用延迟期间的起始帧 | 默认样式 |
| `both` | 应用延迟期间的起始帧 | 保持结束帧 |

## 三、Transform 变换

```css
.box {
  /* 2D 变换 */
  transform: translateX(20px);       /* 水平移动 */
  transform: translateY(-10px);      /* 垂直移动 */
  transform: translate(20px, -10px); /* 同时设置 */
  transform: rotate(45deg);          /* 旋转 */
  transform: scale(1.5);             /* 缩放 */
  transform: scaleX(0.8);            /* 水平缩放 */
  transform: skew(10deg);            /* 倾斜 */

  /* 组合（注意顺序，变换从右到左应用） */
  transform: translateX(50px) rotate(45deg) scale(1.2);

  /* 3D 变换 */
  transform: perspective(1000px) rotateY(45deg);
  transform: translate3d(0, 0, 0); /* 触发 GPU 加速 */
}
```

> **变换顺序很重要**：`translateX(50px) rotate(45deg)` 先平移后旋转，效果与 `rotate(45deg) translateX(50px)` 完全不同。变换从右到左依次应用。

## 四、性能优化

### 4.1 浏览器渲染流程

```
JavaScript → Style → Layout → Paint → Composite
             计算样式   布局    绘制    合成
```

### 4.2 属性性能等级

| 等级 | 属性 | 触发阶段 | 性能 |
|------|------|---------|------|
| 最佳 | `transform`、`opacity` | 仅 Composite | GPU 加速，不影响布局 |
| 次之 | `color`、`background` | Paint + Composite | 触发重绘 |
| 最差 | `width`、`height`、`margin`、`top` | Layout + Paint + Composite | 触发重排 |

```css
/* 好：只触发合成 */
.animate-good {
  transition: transform 0.3s, opacity 0.3s;
}
.animate-good:hover {
  transform: translateY(-4px);
  opacity: 0.8;
}

/* 差：触发布局和重绘 */
.animate-bad {
  transition: margin-top 0.3s, width 0.3s;
}
.animate-bad:hover {
  margin-top: -4px;
  width: 110%;
}
```

### 4.3 will-change

```css
/* 提示浏览器提前优化 */
.animated-element {
  will-change: transform, opacity;
}

/* 重要：用完后移除 */
.animated-element.animation-done {
  will-change: auto;
}
```

> **不要滥用 `will-change`**：每个声明都会创建合成层，消耗 GPU 内存。只在动画即将开始时添加，结束后移除。

### 4.4 硬件加速

```css
/* 强制开启 GPU 加速（慎用） */
.force-gpu {
  transform: translateZ(0);
  /* 或 */
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden; /* 可以减少闪烁 */
}
```

**硬件加速原理**：将元素提升为独立的合成层（compositing layer），由 GPU 处理，避免占用主线程的布局和绘制。

### 4.5 CSS 动画 vs JavaScript 动画

| 维度 | CSS 动画 | JS 动画（rAF） |
|------|---------|---------------|
| 适用场景 | 简单过渡、状态切换 | 复杂交互、物理效果 |
| 性能 | 可在合成线程运行 | 在主线程运行 |
| 控制力 | 有限（播放/暂停） | 完全控制 |
| 兼容性 | 需要前缀 | 更灵活 |

## 五、实战示例

### 5.1 Loading 动画

```css
@keyframes spin {
  to { transform: rotate(360deg); }
}
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #eee;
  border-top-color: #3498db;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
```

### 5.2 入场动画

```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
}
```

## 面试要点

1. **必须掌握**：`transition` 和 `animation` 的区别——前者需要触发条件（如 hover），后者自动播放。
2. **高频考点**：哪些 CSS 属性动画性能最好？答：`transform` 和 `opacity`，因为它们仅触发合成阶段。
3. **理解原理**：浏览器渲染流程（Layout → Paint → Composite），以及不同属性触发哪些阶段。
4. **注意事项**：`will-change` 不要滥用，`display` 不能过渡。

## 常见面试题

**Q：`transition` 和 `animation` 的区别？**

A：`transition` 需要触发条件（如 `:hover`、class 切换），只能定义起止状态。`animation` 使用 `@keyframes` 定义关键帧，可自动播放，支持多阶段、循环、方向控制。

**Q：如何优化 CSS 动画性能？**

A：(1) 只动画 `transform` 和 `opacity`（仅触发合成，不触发重排/重绘）；(2) 使用 `will-change` 提前通知浏览器（用后移除）；(3) 避免动画 `width`/`height`/`margin` 等触发布局的属性；(4) 使用 `transform: translateZ(0)` 提升为合成层（慎用）。

**Q：`display: none` 能过渡吗？如何实现淡入淡出？**

A：`display` 属性不支持过渡。实现淡入淡出使用 `opacity` + `visibility`：`opacity: 0; visibility: hidden` 实现淡出，`opacity: 1; visibility: visible` 实现淡入。

**Q：`height: 0` 到 `height: auto` 如何过渡？**

A：传统方案使用 `max-height`（需预估最大值，不精确）。现代方案使用 CSS Grid：`grid-template-rows: 0fr` 到 `1fr`，内部子元素设 `overflow: hidden`，可以实现平滑过渡。
