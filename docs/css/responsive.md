---
title: "响应式设计"
sidebar_position: 4
difficulty: "medium"
tags: ["css", "responsive", "media-query"]
---

# 响应式设计

## 一、viewport 基础

```html
<!-- 必须设置 viewport meta 标签 -->
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

`width=device-width`：视口宽度等于设备宽度。`initial-scale=1.0`：初始缩放比例为 1。没有这个标签，移动端浏览器会默认以 980px 宽度渲染页面。

## 二、媒体查询（Media Queries）

### 2.1 基本语法

```css
/* min-width：最小宽度（移动优先） */
@media (min-width: 768px) {
  .container { max-width: 720px; }
}

/* max-width：最大宽度（桌面优先） */
@media (max-width: 767px) {
  .sidebar { display: none; }
}

/* 组合条件 */
@media (min-width: 768px) and (max-width: 1024px) {
  .grid { grid-template-columns: repeat(2, 1fr); }
}

/* 方向 */
@media (orientation: landscape) {
  .header { height: 50px; }
}

/* 暗色模式偏好 */
@media (prefers-color-scheme: dark) {
  :root {
    --bg-color: #1a1a2e;
    --text-color: #eee;
  }
}

/* 减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 2.2 移动优先 vs 桌面优先

**移动优先（推荐）**：基础样式为移动端，通过 `min-width` 向上增强。

```css
/* 基础：移动端（单列） */
.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

/* 平板：两列 */
@media (min-width: 768px) {
  .grid { grid-template-columns: repeat(2, 1fr); }
}

/* 桌面：三列 */
@media (min-width: 1024px) {
  .grid { grid-template-columns: repeat(3, 1fr); }
}
```

**桌面优先**：基础样式为桌面端，通过 `max-width` 向下适配。

```css
/* 基础：桌面端 */
.grid { grid-template-columns: repeat(3, 1fr); }

/* 平板 */
@media (max-width: 1023px) {
  .grid { grid-template-columns: repeat(2, 1fr); }
}

/* 移动端 */
@media (max-width: 767px) {
  .grid { grid-template-columns: 1fr; }
}
```

> **面试关键**：移动优先更符合渐进增强的理念，CSS 从简单到复杂，性能更好。同时它也更契合现代移动互联网的流量占比。

## 三、响应式单位

### 3.1 相对单位

| 单位 | 参照物 | 说明 |
|------|--------|------|
| `em` | 父元素的 font-size | 用于 `font-size` 时相对于父元素，用于其他属性时相对于自身 `font-size` |
| `rem` | 根元素（`html`）的 font-size | 全局一致，推荐用于间距和字体 |
| `vw` | 视口宽度的 1% | `100vw` = 视口满宽 |
| `vh` | 视口高度的 1% | `100vh` = 视口满高（注意移动端地址栏问题） |
| `vmin` | vw 和 vh 中较小的值 | |
| `vmax` | vw 和 vh 中较大的值 | |

```css
/* rem 用于字体和间距，保证全局一致性 */
body { font-size: 16px; }        /* 1rem = 16px */
h1   { font-size: 2rem; }        /* 32px */
.card { padding: 1.5rem; }       /* 24px */

/* vh 问题：移动端 100vh 包含地址栏高度 */
.hero {
  min-height: 100vh;
  /* 或使用 dvh（动态视口高度） */
  min-height: 100dvh;   /* 现代浏览器支持 */
}
```

### 3.2 clamp()、min()、max() 函数

```css
/* clamp(最小值, 首选值, 最大值) */
h1 {
  font-size: clamp(1.5rem, 4vw, 3rem);
  /* 字体最小 1.5rem，最大 3rem，首选视口宽度的 4% */
}

.container {
  width: min(90%, 1200px);
  /* 取 90% 和 1200px 的较小值 */
}

.section {
  padding: max(1rem, 5vw);
  /* 取 1rem 和 5vw 的较大值，保证最小间距 */
}

/* 实用：响应式容器 */
.wrapper {
  width: clamp(320px, 90%, 1200px);
  margin-inline: auto;  /* 使用逻辑属性实现居中 */
}
```

## 四、容器查询（Container Queries）

容器查询让子元素根据**父容器**而非视口来调整样式，是组件化开发的理想方案。

```css
/* 定义容器 */
.card-wrapper {
  container-type: inline-size;  /* 基于宽度查询 */
  container-name: card;
}

/* 查询容器尺寸 */
@container card (min-width: 400px) {
  .card {
    display: flex;
    gap: 1rem;
  }
  .card__image {
    width: 200px;
  }
}

@container card (max-width: 399px) {
  .card {
    display: block;
  }
  .card__image {
    width: 100%;
  }
}
```

> **与媒体查询的区别**：媒体查询基于视口，适合页面级布局；容器查询基于父容器，适合组件级适配。两者互补，不是替代关系。

## 五、响应式图片

### 5.1 srcset 和 sizes

```html
<!-- 根据视口宽度选择不同分辨率的图片 -->
<img
  src="photo-800.jpg"
  srcset="
    photo-400.jpg  400w,
    photo-800.jpg  800w,
    photo-1200.jpg 1200w
  "
  sizes="
    (max-width: 600px) 100vw,
    (max-width: 1200px) 50vw,
    33vw
  "
  alt="响应式图片"
>
<!-- 浏览器根据 sizes 描述的宽度和 srcset 中的宽度描述符，
     自动选择最合适的图片 -->
```

### 5.2 picture 元素

```html
<!-- 根据条件选择不同格式或裁剪 -->
<picture>
  <!-- WebP 优先 -->
  <source srcset="photo.avif" type="image/avif">
  <source srcset="photo.webp" type="image/webp">
  <!-- 不同视口下使用不同裁剪 -->
  <source
    media="(min-width: 768px)"
    srcset="photo-desktop.jpg"
  >
  <source
    media="(max-width: 767px)"
    srcset="photo-mobile.jpg"
  >
  <img src="photo.jpg" alt="响应式图片">
</picture>
```

### 5.3 响应式图片 CSS 技巧

```css
/* 保持宽高比，避免布局偏移 */
.image-container {
  aspect-ratio: 16 / 9;
  overflow: hidden;
}
.image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;     /* 裁剪填充 */
  /* object-fit: contain;  完整显示 */
}
```

## 面试要点

1. **必须掌握**：媒体查询的语法、`min-width` vs `max-width` 的使用场景。
2. **高频考点**：`rem` 和 `em` 的区别，`clamp()` 函数的用法。
3. **加分项**：容器查询的概念和使用场景——基于组件而非视口适配。
4. **实战能力**：`srcset` 和 `<picture>` 的使用场景及区别。

## 常见面试题

**Q：`rem` 和 `em` 的区别？**

A：`rem` 始终基于根元素（`<html>`）的 `font-size`，全局一致，便于控制。`em` 基于父元素的 `font-size`（用于 `font-size` 属性时）或自身 `font-size`（用于其他属性时），多层嵌套时会逐级累积，容易失控。推荐使用 `rem` 管理间距和字体。

**Q：什么是移动优先？和桌面优先有什么区别？**

A：移动优先是以移动端样式为基础，通过 `min-width` 媒体查询逐步增强。桌面优先反之。移动优先更符合渐进增强理念，基础样式更轻量，性能更好。

**Q：如何解决移动端 `100vh` 超出视口的问题？**

A：移动端浏览器的地址栏/工具栏会挤压实际视口，导致 `100vh` 超出可见区域。解决方案：(1) 使用 `100dvh`（动态视口高度，现代浏览器支持）；(2) 使用 JS 获取 `window.innerHeight` 设置 CSS 变量。

**Q：容器查询和媒体查询有什么区别？**

A：媒体查询基于视口尺寸，适合全局页面布局；容器查询基于父容器尺寸，适合组件级响应式设计。容器查询让组件能独立于页面上下文自适应，是组件化开发的理想方案。
