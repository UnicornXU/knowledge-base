---
sidebar_position: 4
title: '像素适配完全指南'
difficulty: 'medium'
tags: ['移动端', '像素', 'Retina', '1px', '适配']
---

# 像素适配完全指南

移动端开发中，像素适配是最基础也最容易被忽视的问题。理解像素概念体系，是解决高清屏显示模糊、1px 边框过粗等问题的前提。

## 像素概念体系

### 四种像素概念

| 概念         | 英文                           | 含义                     |
| ------------ | ------------------------------ | ------------------------ |
| 物理像素     | Physical Pixel                 | 屏幕上最小的物理发光单元 |
| CSS像素      | CSS Pixel                      | Web 编程中的逻辑像素单位 |
| 设备独立像素 | DIP (Device Independent Pixel) | 操作系统定义的虚拟像素   |
| 设备像素比   | DPR (Device Pixel Ratio)       | 物理像素 / 设备独立像素  |

:::info 核心关系
**DPR = 物理像素 / 设备独立像素**

在未缩放的页面中，1个CSS像素 = 1个设备独立像素 = DPR个物理像素
:::

### DPR 设备对照表

| 设备              | 屏幕尺寸 | 物理分辨率 | DPR   | CSS像素分辨率 |
| ----------------- | -------- | ---------- | ----- | ------------- |
| iPhone SE         | 4.7"     | 750×1334   | 2     | 375×667       |
| iPhone 14         | 6.1"     | 1170×2532  | 3     | 390×844       |
| iPhone 14 Pro Max | 6.7"     | 1290×2796  | 3     | 430×932       |
| iPhone 15 Pro     | 6.1"     | 1179×2556  | 3     | 393×852       |
| Samsung S24       | 6.2"     | 1080×2340  | 2.625 | 411×891       |
| Pixel 8           | 6.2"     | 1080×2400  | 2.625 | 411×914       |
| 小米14            | 6.36"    | 1200×2670  | 2.75  | 436×971       |

```javascript
// 获取设备 DPR
const dpr = window.devicePixelRatio;
console.log(`当前设备DPR: ${dpr}`);
```

## 1px 问题详解

### 问题根因

当 DPR=2 时，CSS 中 `1px` 实际对应 2 个物理像素。在 Retina 屏上，设计稿中的 1px 细线会显得比预期粗一倍。

```
DPR=1: 1px CSS → 1px 物理像素 ✓
DPR=2: 1px CSS → 2px 物理像素 ✗ (看起来比设计稿粗)
DPR=3: 1px CSS → 3px 物理像素 ✗ (更粗)
```

### 解决方案一：transform scale

```css
/* 单边框 */
.border-bottom-1px {
  position: relative;
}
.border-bottom-1px::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 1px;
  background: #000;
  transform: scaleY(0.5);
  transform-origin: 0 0;
}

/* 四边框 */
.border-1px {
  position: relative;
}
.border-1px::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 200%;
  height: 200%;
  border: 1px solid #000;
  transform: scale(0.5);
  transform-origin: 0 0;
  box-sizing: border-box;
  pointer-events: none;
}
```

### 解决方案二：viewport 缩放

```html
<script>
  const scale = 1 / window.devicePixelRatio;
  const viewport = document.querySelector('meta[name="viewport"]');
  viewport.setAttribute(
    'content',
    `width=device-width,initial-scale=${scale},maximum-scale=${scale},minimum-scale=${scale},user-scalable=no`,
  );
</script>
```

### 解决方案三：border-image

```css
.border-image-1px {
  border-width: 1px 0;
  border-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1' height='1'><rect width='1' height='0.5' fill='%23000'/></svg>")
    2 0 stretch;
}
```

### 解决方案四：box-shadow

```css
.box-shadow-1px {
  box-shadow: 0 0.5px 0 0 #000;
}
```

### 解决方案五：SVG 背景

```css
.svg-1px {
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='1'><line x1='0' y1='0.5' x2='100%' y2='0.5' stroke='%23000'/></svg>");
  background-repeat: no-repeat;
  background-position: bottom;
  background-size: 100% 1px;
}
```

### 解决方案六：postcss-write-svg

```css
/* 使用 postcss-write-svg 插件 */
@svg 1px-border {
  width: 4px;
  height: 4px;
  @rect {
    fill: transparent;
    width: 100%;
    height: 100%;
    stroke-width: 25%;
    stroke: var(--color, black);
  }
}
.example {
  border: 1px solid transparent;
  border-image: svg(1px-border param(--color #000)) 2 stretch;
}
```

### 方案对比表

| 方案              | 兼容性 | 圆角支持 | 实现复杂度 | 推荐度     |
| ----------------- | ------ | -------- | ---------- | ---------- |
| transform scale   | 极好   | ✓        | 中         | ⭐⭐⭐⭐⭐ |
| viewport 缩放     | 好     | ✓        | 低         | ⭐⭐⭐     |
| border-image      | 一般   | ✗        | 中         | ⭐⭐       |
| box-shadow        | 好     | ✗        | 低         | ⭐⭐⭐     |
| SVG 背景          | 好     | ✗        | 中         | ⭐⭐⭐     |
| postcss-write-svg | 好     | ✓        | 低(需插件) | ⭐⭐⭐⭐   |

:::tip 最佳实践
项目中推荐使用 **transform scale** 方案配合 Sass/Less mixin 封装，兼容性最好且支持圆角。对于新项目也可以使用 postcss 插件自动处理。
:::

## Retina 屏图片适配

### 多倍图方案

```css
/* 基础写法 */
.logo {
  background-image: url('./logo.png');
  background-size: 100px 100px;
}

/* DPR=2 设备 */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .logo {
    background-image: url('./logo@2x.png');
  }
}

/* DPR=3 设备 */
@media (-webkit-min-device-pixel-ratio: 3), (min-resolution: 288dpi) {
  .logo {
    background-image: url('./logo@3x.png');
  }
}
```

### srcset + sizes

```html
<img
  src="image-400w.jpg"
  srcset="image-400w.jpg 400w, image-800w.jpg 800w, image-1200w.jpg 1200w"
  sizes="
    (max-width: 480px) 100vw,
    (max-width: 768px) 50vw,
    33vw
  "
  alt="响应式图片"
/>

<!-- 基于DPR的srcset -->
<img src="photo.jpg" srcset="photo.jpg 1x, photo@2x.jpg 2x, photo@3x.jpg 3x" alt="多倍图" />
```

### image-set() CSS 函数

```css
.hero {
  background-image: url('./hero.png');
  /* 渐进增强 */
  background-image: -webkit-image-set(url('./hero.png') 1x, url('./hero@2x.png') 2x, url('./hero@3x.png') 3x);
  background-image: image-set(url('./hero.png') 1x, url('./hero@2x.png') 2x, url('./hero@3x.png') 3x);
}
```

### SVG 矢量方案

```html
<!-- SVG 天然适配所有DPR -->
<img src="icon.svg" alt="矢量图标" />

<!-- 内联 SVG -->
<svg viewBox="0 0 24 24" width="24" height="24">
  <path d="M12 2L2 7l10 5 10-5-10-5z" />
</svg>
```

:::warning 注意
SVG 适合图标和简单图形，但不适合照片类图片。照片类内容仍需使用多倍图方案。
:::

## 实战：完整像素适配配置

```scss
// _pixel-border.scss - 1px 边框 Mixin 封装
@mixin border-1px($color: #e5e5e5, $position: bottom, $radius: 0) {
  position: relative;

  &::after {
    content: '';
    position: absolute;
    pointer-events: none;
    box-sizing: border-box;

    @if $position == bottom {
      left: 0;
      bottom: 0;
      width: 100%;
      height: 1px;
      background: $color;
      transform: scaleY(0.5);
      transform-origin: 0 100%;
    } @else if $position == top {
      left: 0;
      top: 0;
      width: 100%;
      height: 1px;
      background: $color;
      transform: scaleY(0.5);
      transform-origin: 0 0;
    } @else if $position == all {
      top: 0;
      left: 0;
      width: 200%;
      height: 200%;
      border: 1px solid $color;
      border-radius: $radius * 2;
      transform: scale(0.5);
      transform-origin: 0 0;
    }
  }
}

// 使用示例
.list-item {
  @include border-1px(#ddd, bottom);
}

.card {
  @include border-1px(#e0e0e0, all, 8px);
}
```

```javascript
// image-loader.js - 自动加载多倍图
function getImageUrl(basePath) {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const suffix = dpr > 2 ? '@3x' : dpr > 1 ? '@2x' : '';
  const ext = basePath.split('.').pop();
  const name = basePath.replace(`.${ext}`, '');
  return `${name}${suffix}.${ext}`;
}

// 使用
const imgSrc = getImageUrl('/assets/banner.png');
// DPR=2 → /assets/banner@2x.png
// DPR=3 → /assets/banner@3x.png
```

## 面试高频题

### Q1：什么是设备像素比（DPR）？如何获取？

**答：** DPR 是物理像素与设备独立像素的比值。`window.devicePixelRatio` 可获取当前设备的 DPR。iPhone 6/7/8 DPR=2，iPhone X 及以上 DPR=3。

### Q2：为什么移动端会出现 1px 问题？

**答：** 因为 DPR>1 的设备中，CSS 的 1px 会映射为多个物理像素（DPR=2 时为 2 个物理像素），导致边框看起来比设计稿中的 1 物理像素要粗。

### Q3：你在项目中是如何解决 1px 问题的？

**答：** 常用 transform scale 方案，通过伪元素绘制 1px 边框后 `scaleY(0.5)` 或 `scale(0.5)`。封装为 Sass mixin 复用，支持单边和四边，兼容性极好。

### Q4：Retina 屏下图片模糊怎么解决？

**答：** 四种方案：①使用 @2x/@3x 多倍图配合 media query；②使用 `<img srcset>` 让浏览器自动选择；③CSS `image-set()` 函数；④尽量使用 SVG 矢量图。

### Q5：Canvas 在 Retina 屏下为什么模糊？如何解决？

**答：** Canvas 默认按 CSS 像素绘制，在高 DPR 设备上被拉伸导致模糊。解决方法是将 canvas 的 width/height 属性设为 CSS 尺寸 × DPR，再通过 CSS 限制显示尺寸，最后用 `ctx.scale(dpr, dpr)` 缩放绘制上下文。

```javascript
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
const dpr = window.devicePixelRatio || 1;
const rect = canvas.getBoundingClientRect();

canvas.width = rect.width * dpr;
canvas.height = rect.height * dpr;
canvas.style.width = rect.width + 'px';
canvas.style.height = rect.height + 'px';
ctx.scale(dpr, dpr);
```

### Q6：img 的 srcset 和 sizes 属性分别有什么作用？

**答：** `srcset` 定义可选的图片资源及其描述符（宽度 `w` 或像素密度 `x`）。`sizes` 定义在不同视口条件下图片的展示宽度，浏览器根据 sizes 和 srcset 自动选择最合适的图片加载。
