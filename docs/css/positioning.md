---
title: "定位与层叠上下文"
sidebar_position: 2
difficulty: "medium"
tags: ["css", "positioning", "stacking-context"]
---

# 定位与层叠上下文

## 一、定位方式（position）

### 1.1 五种定位取值

```css
/* 1. static — 默认值，不脱离文档流 */
.static { position: static; }

/* 2. relative — 相对于自身原始位置偏移，不脱离文档流 */
.relative {
  position: relative;
  top: 10px;
  left: 20px;
}

/* 3. absolute — 相对于最近的定位祖先元素，脱离文档流 */
.absolute {
  position: absolute;
  top: 0;
  right: 0;
}

/* 4. fixed — 相对于视口定位，脱离文档流 */
.fixed {
  position: fixed;
  bottom: 20px;
  right: 20px;
}

/* 5. sticky — 粘性定位，混合 relative 和 fixed */
.sticky {
  position: sticky;
  top: 0; /* 滚动到顶部时粘住 */
}
```

### 1.2 各定位方式对比

| 取值 | 脱离文档流 | 参照物 | 是否创建层叠上下文 |
|------|-----------|--------|-------------------|
| `static` | 否 | 无 | 否 |
| `relative` | 否 | 自身原始位置 | 是（当 z-index 不为 auto 时） |
| `absolute` | 是 | 最近的定位祖先 | 是 |
| `fixed` | 是 | 视口（或最近的 transform 祖先） | 是 |
| `sticky` | 否 | 最近滚动祖先 | 是 |

### 1.3 包含块（Containing Block）

包含块是确定元素尺寸和定位的参考矩形。

- **static / relative**：包含块为最近的块级祖先的内容区
- **absolute**：包含块为最近的 `position` 不为 `static` 的祖先的 padding 区
- **fixed**：包含块通常为视口

```html
<div style="position: relative; width: 400px; padding: 20px;">
  <div style="position: absolute; right: 0; bottom: 0;">
    <!-- 相对于父元素的 padding 区域右下角 -->
  </div>
</div>
```

> **经典陷阱**：`transform` 不为 `none` 的元素会成为 `fixed` 定位子元素的包含块，导致 `fixed` 不再相对于视口。

```css
/* 此时 .child 的 fixed 定位相对于 .parent 而非视口 */
.parent {
  transform: translateZ(0); /* 创建了新的包含块 */
}
.child {
  position: fixed;
  top: 0; /* 相对于 .parent，而非视口 */
}
```

## 二、层叠上下文（Stacking Context）

### 2.1 创建条件

以下任一条件都会创建新的层叠上下文：

1. 文档根元素（`<html>`）
2. `position` 为 `relative`/`absolute`/`fixed`/`sticky` 且 `z-index` 不为 `auto`
3. `position` 为 `fixed` 或 `sticky`
4. `opacity` 值小于 1
5. `transform`、`filter`、`perspective` 不为 `none`
6. `isolation: isolate`
7. Flex/Grid 容器的子元素且 `z-index` 不为 `auto`

### 2.2 层叠顺序

在同一个层叠上下文中，元素从后到前的顺序：

```
1. 层叠上下文的背景和边框
2. z-index < 0
3. 块级盒子（文档流中的非定位元素）
4. 浮动盒子
5. 行内盒子（文档流中的非定位行内元素）
6. z-index: 0 / auto（定位元素）
7. z-index > 0
```

```html
<!-- 面试经典题：z-index 谁在上面？ -->
<div style="position: relative; z-index: 1;">
  <div style="position: absolute; z-index: 9999; background: red;">
    A（z-index: 9999）
  </div>
</div>
<div style="position: relative; z-index: 2;">
  <div style="position: absolute; z-index: 1; background: blue;">
    B（z-index: 1）
  </div>
</div>
<!-- B 在 A 上面！因为父级 z-index: 2 > z-index: 1 -->
```

> **关键理解**：`z-index` 只在同一层叠上下文内比较。子元素的 `z-index` 无论多大，都无法突破父级层叠上下文的限制。

## 三、BFC（块级格式化上下文）

### 3.1 触发条件

```css
/* 以下任一条件均可触发 BFC */
.bfc {
  overflow: hidden;         /* 最常用 */
  overflow: auto;
  display: flow-root;       /* 最推荐，无副作用 */
  float: left/right;
  position: absolute/fixed;
  display: inline-block;
  display: flex/inline-flex;
  display: grid/inline-grid;
}
```

### 3.2 BFC 的特性

1. **内部的盒子垂直排列**：块级元素从上到下依次排列
2. **Margin 不折叠**：BFC 内部的 margin 不会与外部的 margin 折叠
3. **包含浮动**：BFC 会计算其内部浮动元素的高度
4. **不与浮动重叠**：BFC 区域不会与浮动元素重叠

```css
/* 经典应用：清除浮动 */
.parent::after {
  content: "";
  display: block; /* 或 display: table */
  clear: both;
}

/* 更现代的方案 */
.parent {
  display: flow-root; /* 一个属性搞定 BFC */
}
```

```css
/* 经典应用：阻止 margin 折叠 */
.wrapper {
  overflow: hidden; /* 创建 BFC，阻止子元素 margin 穿透 */
}

/* 经典应用：自适应两栏布局 */
.sidebar {
  float: left;
  width: 200px;
}
.main {
  overflow: hidden; /* BFC 不与浮动重叠，形成自适应宽度 */
}
```

## 四、浮动（float）

虽然现代布局首选 Flex/Grid，但了解浮动仍有面试价值：

```css
/* 浮动元素脱离文档流，但仍在行内格式化上下文中 */
.float-left {
  float: left;
}

/* 清除浮动的三种方式 */
.clearfix::after {
  content: "";
  display: table;  /* 或 block */
  clear: both;
}

/* 使用 overflow */
.parent {
  overflow: hidden;
}

/* 使用 display: flow-root（推荐） */
.parent {
  display: flow-root;
}
```

## 面试要点

1. **高频考点**：`z-index` 在层叠上下文中的比较规则——子元素无法突破父级上下文。
2. **必须理解**：BFC 的概念、触发条件和实际应用场景（清除浮动、阻止 margin 折叠）。
3. **容易忽略**：`transform` 会影响 `fixed` 定位的参照物。
4. **进阶知识**：`display: flow-root` 是创建 BFC 的最佳方式，无副作用。

## 常见面试题

**Q：`position: sticky` 和 `fixed` 的区别？**

A：`fixed` 始终相对于视口定位，完全脱离文档流。`sticky` 是相对定位和固定定位的混合，元素在滚动到指定阈值前保持在文档流中（表现如 `relative`），到达阈值后"粘住"（表现如 `fixed`），但始终在其包含块范围内。

**Q：为什么 `z-index: 9999` 的元素仍然被遮挡？**

A：最可能的原因是该元素的某个祖先创建了独立的层叠上下文（设置了 `z-index`、`opacity`、`transform` 等），且该祖先的层叠层级低于遮挡元素的祖先。`z-index` 只在同一层叠上下文内比较。

**Q：什么是 BFC？有哪些应用？**

A：BFC 是一个独立的渲染区域，内部元素的布局不影响外部。触发条件包括 `overflow: hidden`、`display: flow-root` 等。应用场景：(1) 清除浮动；(2) 阻止 margin 折叠；(3) 自适应两栏布局。推荐使用 `display: flow-root` 创建 BFC。

**Q：`float` 的元素有什么特点？如何清除浮动？**

A：浮动元素脱离文档流，但仍影响行内内容的排列。清除浮动推荐使用 `display: flow-root` 或 `clearfix` 伪元素方案。
