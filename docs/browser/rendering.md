---
sidebar_position: 1
title: 浏览器渲染流程
difficulty: hard
tags:
  - browser
  - rendering
  - critical-rendering-path
---

# 🎨 浏览器渲染流程

> **"理解渲染流程，就掌握了性能优化的钥匙"**

从用户输入 URL 到页面像素上屏，浏览器经历了一系列精密的步骤。掌握这些步骤是前端性能优化的基石。

## 一、关键渲染路径（Critical Rendering Path）

### 1.1 整体流程概览

```
关键渲染路径（CRP）
═══════════════════════════════════════════════════════════════

  HTML 字节 → 字符 → Token → 节点 → DOM 树
                                      │
                                      ▼
                              ┌───────────────┐
  CSS  字节 → 字符 → Token → 节点 → CSSOM 树 ─┤
                              └───────┬───────┘
                                      │
                                      ▼
                               ┌─────────────┐
                               │  Render Tree │  （合并 DOM + CSSOM）
                               └──────┬──────┘
                                      │
                                      ▼
                               ┌─────────────┐
                               │    Layout    │  （计算位置和大小）
                               └──────┬──────┘
                                      │
                                      ▼
                               ┌─────────────┐
                               │    Paint     │  （生成绘制指令）
                               └──────┬──────┘
                                      │
                                      ▼
                               ┌─────────────┐
                               │  Composite   │  （图层合成上屏）
                               └─────────────┘
```

### 1.2 构建 DOM 树

浏览器收到 HTML 字节流后，通过以下步骤构建 DOM：

```html
<!-- 浏览器收到的 HTML -->
<html>
  <head>
    <title>示例</title>
  </head>
  <body>
    <p>Hello</p>
    <div>World</div>
  </body>
</html>
```

```
DOM 树结构：
  Document
    └── html
        ├── head
        │   └── title
        │       └── "示例"
        └── body
            ├── p
            │   └── "Hello"
            └── div
                └── "World"
```

**关键点：** DOM 构建是增量的 -- 浏览器不必等待整个 HTML 下载完毕才开始解析，而是边下载边解析。

### 1.3 构建 CSSOM 树

CSS 解析与 HTML 解析**并行**进行，但 CSSOM 的构建会阻塞渲染：

```
CSSOM 树结构：
  Style
    └── body     (font-size: 16px)
        ├── p    (font-size: 16px, color: red)
        └── div  (font-size: 16px, font-weight: bold)
```

**注意：** CSS 是渲染阻塞资源。浏览器必须等待 CSSOM 构建完成后才能进入渲染阶段。

### 1.4 构建渲染树（Render Tree）

```
渲染树构建规则：
═══════════════════════════════════════════════

  DOM 树节点          CSSOM 样式          渲染树结果
  ──────────         ──────────         ──────────
  <html>             visible            ✅ 包含
  <head>             display: none      ❌ 排除（不渲染）
  <body>             visible            ✅ 包含
  <p>                visible            ✅ 包含
  <div>              visibility: hidden ✅ 包含（占位，但不可见）
  <script>           display: none      ❌ 排除
```

**关键区别：**
- `display: none` -- 不在渲染树中（不占位）
- `visibility: hidden` -- 在渲染树中（占位，只是不可见）

### 1.5 布局（Layout / Reflow）

布局阶段计算每个节点的**精确位置和大小**：

```js
// 布局计算示例
// 假设视口 1400px，body 宽度 100%
// p 元素的布局结果可能是：
{
  x: 8,        // 左边距（margin + padding）
  y: 8,
  width: 1384, // 1400 - 8*2
  height: 24,  // 行高
  style: { /* computed styles */ }
}
```

### 1.6 绘制（Paint）

布局完成后，浏览器将渲染树转换为**绘制指令列表**：

```
绘制记录示例：
═══════════════════════════════════
1. drawRect(0, 0, 1400, 800, white)   // 背景
2. drawText("Hello", 8, 24, red)       // p 元素
3. drawRect(0, 32, 1400, 24, none)     // div 容器
4. drawText("World", 8, 56, black)     // div 内容
```

### 1.7 合成（Composite）

当页面存在**多个图层**时，合成器（Compositor）将各图层按正确的顺序合成为最终图像：

```
合成过程：
═══════════════════════════════════

  图层 1（背景层）    图层 2（内容层）    图层 3（固定定位）
  ┌──────────┐       ┌──────────┐       ┌──────────┐
  │  背景色   │   +   │  文字内容  │   +   │  弹窗/Toast│
  └──────────┘       └──────────┘       └──────────┘
        │                  │                   │
        └──────────────────┴───────────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  最终图像    │  → 显示到屏幕上
                    └─────────────┘
```

## 二、重排（Reflow）与重绘（Repaint）

### 2.1 触发条件对比

```
触发条件对比
═══════════════════════════════════════════════════════════════

重排（Reflow）—— 最昂贵 ❌
──────────────────────────
触发条件：改变了元素的几何属性
• 添加/删除可见 DOM 元素
• 元素尺寸改变（width、height、padding、border、margin）
• 内容变化（文字、图片尺寸改变导致计算宽度变化）
• 浏览器窗口大小改变（resize）
• 读取布局属性（offsetTop、scrollTop、clientWidth 等）
• 设置 style 属性改变布局

重绘（Repaint）—— 较便宜 ⚠️
──────────────────────────
触发条件：改变了元素的外观但不影响布局
• color、background-color 改变
• visibility 改变
• outline、box-shadow 改变
• border-style 改变

只触发合成（Composite）—— 最便宜 ✅
──────────────────────────
触发条件：只影响合成层
• transform 改变
• opacity 改变
• filter 改变（注意：filter 可能触发重绘）
```

### 2.2 避免强制同步布局

```js
// ❌ 错误：读写交替触发强制同步布局
function resizeAll() {
  const boxes = document.querySelectorAll('.box');
  boxes.forEach(box => {
    // 写 → 读 → 写 → 读... 每次读都强制重新计算布局
    box.style.width = box.offsetWidth + 10 + 'px';
  });
}

// ✅ 正确：先批量读，再批量写
function resizeAllOptimized() {
  const boxes = document.querySelectorAll('.box');
  // 第一步：批量读取
  const widths = Array.from(boxes).map(box => box.offsetWidth);
  // 第二步：批量写入
  boxes.forEach((box, i) => {
    box.style.width = widths[i] + 10 + 'px';
  });
}
```

### 2.3 使用 FastDOM 批处理读写操作

```js
// 使用 requestAnimationFrame 来批处理
const readQueue = [];
const writeQueue = [];

function fastDom(callback, type) {
  if (type === 'read') readQueue.push(callback);
  else writeQueue.push(callback);

  requestAnimationFrame(flush);
}

function flush() {
  // 先执行所有读操作
  const reads = readQueue.splice(0);
  reads.forEach(fn => fn());

  // 再执行所有写操作
  const writes = writeQueue.splice(0);
  writes.forEach(fn => fn());
}
```

## 三、GPU 合成与图层

### 3.1 合成层的创建条件

```
哪些元素会提升为独立合成层？
═══════════════════════════════════════

1. 3D 变换
   transform: translateZ(0) / translate3d(0,0,0)

2. will-change 属性
   will-change: transform / opacity

3. video / canvas / iframe 元素

4. 通过 animation / transition 触发的 transform / opacity
   （在动画期间创建合成层）

5. position: fixed 元素
```

### 3.2 层爆炸问题

```css
/* ❌ 危险：层爆炸 */
.parent {
  /* 父元素创建了合成层 */
  transform: translateZ(0);
}

/* 所有子元素会被提升到独立层！ */
.parent > * {
  /* 即使没写 transform，也会因父元素而提升 */
}

/* ✅ 正确做法：只提升需要动画的元素 */
.animated-element {
  will-change: transform;
}

/* 动画结束后移除 */
.animated-element.animation-done {
  will-change: auto;
}
```

## 四、requestAnimationFrame 与渲染生命周期

### 4.1 渲染帧的生命周期

```
一帧的生命周期（16.67ms @ 60fps）
═══════════════════════════════════════════════════════

  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
  │  输入事件    │→ │  JS 执行     │→ │  rAF 回调   │
  │ (click等)   │  │ (主线程)    │  │             │
  └─────────────┘  └─────────────┘  └──────┬──────┘
                                            │
  ┌─────────────┐  ┌─────────────┐  ┌──────▼──────┐
  │  合成上屏    │← │  Paint      │← │  Layout     │
  │ (Compositor)│  │  绘制       │  │  布局计算    │
  └─────────────┘  └─────────────┘  └─────────────┘
```

### 4.2 requestAnimationFrame 使用

```js
// ✅ 使用 rAF 进行动画
function animate() {
  element.style.transform = `translateX(${position}px)`;
  position += 2;

  if (position < 500) {
    requestAnimationFrame(animate);
  }
}

requestAnimationFrame(animate);

// ✅ 使用 rAF 实现节流
function throttledRAF(callback) {
  let ticking = false;
  return function (...args) {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        callback.apply(this, args);
        ticking = false;
      });
    }
  };
}

// 用于滚动事件
window.addEventListener('scroll', throttledRAF(() => {
  // 处理滚动逻辑
}));
```

## 五、脚本加载与渲染的关系

### 5.1 script 标签的加载模式

```
三种 script 加载方式对比
═══════════════════════════════════════════════════════

1. <script src="app.js">
   下载: 阻塞 HTML 解析
   执行: 下载完立即执行（阻塞）
   顺序: 按文档顺序

2. <script async src="app.js">
   下载: 与 HTML 解析并行
   执行: 下载完立即执行（可能阻塞）
   顺序: 不保证顺序（谁先下完谁先执行）

3. <script defer src="app.js">
   下载: 与 HTML 解析并行
   执行: DOM 解析完成后，DOMContentLoaded 之前
   顺序: 保持文档顺序
```

```
时间线对比：
═══════════════════════════════════════════════════════

普通 script:
  HTML解析 ──── 暂停 ──── 下载JS ──── 执行JS ──── 恢复HTML ──── DOMContentLoaded

async script:
  HTML解析 ──────────────────┐
       下载JS ────────────┐  │
                          执行JS  HTML暂停 → DOMContentLoaded

defer script:
  HTML解析 ─────────────────────────────────→ DOMContentLoaded
       下载JS ─────────────→ 执行JS ──────↑
```

### 5.2 资源预加载

```html
<!-- 预加载关键资源（高优先级） -->
<link rel="preload" href="critical.css" as="style">
<link rel="preload" href="main-font.woff2" as="font" crossorigin>
<link rel="preload" href="hero.webp" as="image">

<!-- 预获取可能需要的资源（低优先级） -->
<link rel="prefetch" href="/next-page.js">

<!-- DNS 预解析 -->
<link rel="dns-prefetch" href="//cdn.example.com">

<!-- 预连接（DNS + TCP + TLS） -->
<link rel="preconnect" href="https://api.example.com">

<!-- 预渲染整个页面（已废弃，改用 Speculation Rules API） -->
<script type="speculationrules">
{
  "prerender": [
    { "source": "list", "urls": ["/about", "/contact"] }
  ]
}
</script>
```

### 5.3 预解析（Speculative Parsing）

```
浏览器的预解析机制：
═══════════════════════════════════════════════════════

主解析器在执行 <script> 时会暂停
  ↓
但浏览器会启动"预解析器"继续扫描 HTML
  ↓
预解析器提前发现 <script>、<img>、<link> 等资源
  ↓
并行下载这些资源，减少总加载时间

⚠️ 注意：defer 和 async 的脚本也能被预解析器发现并提前下载
```

## 六、面试要点

- 关键渲染路径的 **6 个步骤** 必须能完整复述
- 重排和重绘的**触发条件**和**优化方法**是高频考点
- `transform` 和 `opacity` 为什么性能最好 -- 因为只触发合成
- `async` 和 `defer` 的**区别**几乎每次面试都会问
- `requestAnimationFrame` 的作用和**执行时机**
- 合成层的概念和 `will-change` 的正确使用

## 七、常见面试题

**Q1: 从输入 URL 到页面渲染，浏览器经历了哪些步骤？**

A: DNS 解析 → TCP 连接 → HTTP 请求 → 服务器响应 → 解析 HTML 构建 DOM → 解析 CSS 构建 CSSOM → 合并为渲染树 → 布局计算 → 绘制 → 合成上屏。

**Q2: 为什么 CSS 放在 `<head>` 中？**

A: CSS 是渲染阻塞资源。浏览器必须等 CSSOM 构建完成才能生成渲染树。放在 head 中可以让 CSS 尽早开始下载和解析，减少首次渲染的白屏时间。

**Q3: 重排和重绘的区别？如何优化？**

A: 重排（Reflow）改变元素的几何属性，需要重新计算布局；重绘（Repaint）只改变外观，不涉及布局。优化方法：批量读写操作、使用 `transform`/`opacity` 替代 layout 属性、使用 `will-change` 提升合成层、避免频繁 DOM 操作。

**Q4: `display: none` 和 `visibility: hidden` 的区别？**

A: `display: none` 会让元素从渲染树中移除，不占据空间，触发重排；`visibility: hidden` 元素仍在渲染树中，占据空间，只触发重绘。

**Q5: 什么是层爆炸？如何避免？**

A: 当一个合成层的祖先元素也是合成层时，浏览器可能会将该元素的所有后代都提升为独立图层，导致过多的图层消耗 GPU 内存。避免方法：不要滥用 `transform: translateZ(0)` 或 `will-change`，只在需要动画的元素上使用。
