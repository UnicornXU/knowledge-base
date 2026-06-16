---
title: "Flexbox 与 Grid 布局"
sidebar_position: 3
difficulty: "medium"
tags: ["css", "flexbox", "grid"]
---

# Flexbox 与 Grid 布局

## 一、Flexbox 弹性布局

### 1.1 Flex 容器属性

```css
.container {
  display: flex;            /* 块级弹性容器 */
  /* display: inline-flex;  行内弹性容器 */

  /* 主轴方向 */
  flex-direction: row;            /* 默认：从左到右 */
  /* flex-direction: row-reverse;   从右到左 */
  /* flex-direction: column;        从上到下 */
  /* flex-direction: column-reverse; 从下到上 */

  /* 换行 */
  flex-wrap: nowrap;              /* 默认：不换行 */
  /* flex-wrap: wrap;               换行 */
  /* flex-wrap: wrap-reverse;       反向换行 */

  /* 主轴对齐 */
  justify-content: flex-start;    /* 默认：起点对齐 */
  /* flex-end | center | space-between | space-around | space-evenly */

  /* 交叉轴对齐（单行） */
  align-items: stretch;           /* 默认：拉伸填满 */
  /* flex-start | flex-end | center | baseline */

  /* 交叉轴对齐（多行） */
  align-content: stretch;
  /* flex-start | flex-end | center | space-between | space-around */

  /* 间距（推荐，替代 margin 方案） */
  gap: 16px;              /* 行列间距一致 */
  row-gap: 20px;          /* 行间距 */
  column-gap: 16px;       /* 列间距 */
}
```

### 1.2 Flex 子项属性

```css
.item {
  /* 放大比例（默认 0，不放大） */
  flex-grow: 1;

  /* 缩小比例（默认 1，空间不足时缩小） */
  flex-shrink: 0;

  /* 初始大小（分配剩余空间前的基础尺寸） */
  flex-basis: auto;       /* 默认：看 width/height */
  /* flex-basis: 200px; */

  /* 推荐简写顺序：grow shrink basis */
  flex: 0 1 auto;         /* 默认值 */
  flex: 1;                /* 等同于 1 1 0% */
  flex: none;             /* 等同于 0 0 auto（不伸缩） */
  flex: auto;             /* 等同于 1 1 auto */

  /* 单独控制交叉轴对齐 */
  align-self: center;

  /* 排列顺序（默认 0） */
  order: -1;              /* 数值越小越靠前 */
}
```

> **面试重点**：`flex: 1` 等同于 `flex-grow: 1; flex-shrink: 1; flex-basis: 0%`，表示等分剩余空间。`flex: auto` 等同于 `flex-grow: 1; flex-shrink: 1; flex-basis: auto`，表示基于内容大小分配空间。

### 1.3 常见 Flex 布局模式

**水平垂直居中**：

```css
.center {
  display: flex;
  justify-content: center;
  align-items: center;
}
```

**等分列（等宽）**：

```css
.equal-columns .item {
  flex: 1;
}
```

**固定 + 自适应（圣杯布局简化版）**：

```css
.layout {
  display: flex;
  min-height: 100vh;
}
.sidebar {
  flex: 0 0 250px;       /* 固定宽度，不伸缩 */
}
.main {
  flex: 1;               /* 占满剩余空间 */
}
```

**Sticky Footer**：

```css
body {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.content {
  flex: 1;               /* 撑开中间区域 */
}
footer {
  /* 始终在底部 */
}
```

**换行均匀分布**：

```css
.grid-flex {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
.grid-flex .item {
  flex: 0 1 calc(33.333% - 11px); /* 三列等宽 */
}
```

## 二、Grid 网格布局

### 2.1 Grid 容器属性

```css
.container {
  display: grid;

  /* 定义列 */
  grid-template-columns: 200px 1fr 2fr;        /* 固定 + 比例 */
  grid-template-columns: repeat(3, 1fr);        /* 三等分 */
  grid-template-columns: repeat(4, minmax(100px, 1fr)); /* 响应式 */

  /* 定义行 */
  grid-template-rows: 80px 1fr 60px;

  /* 使用区域模板（语义化布局） */
  grid-template-areas:
    "header  header  header"
    "sidebar content aside"
    "footer  footer  footer";

  /* 间距 */
  gap: 16px;
  row-gap: 20px;
  column-gap: 16px;

  /* 内容对齐 */
  justify-items: center;    /* 水平方向（格子内） */
  align-items: center;      /* 垂直方向（格子内） */

  /* 整体对齐 */
  justify-content: center;  /* 水平方向（容器内） */
  align-content: center;    /* 垂直方向（容器内） */
}
```

### 2.2 Grid 子项属性

```css
.item {
  /* 列线定位 */
  grid-column: 1 / 3;          /* 从第1列线到第3列线（跨2列） */
  grid-column: 1 / span 2;     /* 同上，另一种写法 */
  grid-column: 1 / -1;         /* 从第1列到最后一列（跨满） */

  /* 行线定位 */
  grid-row: 2 / 4;             /* 从第2行线到第4行线（跨2行） */

  /* 使用区域名称 */
  grid-area: header;

  /* 单独对齐 */
  justify-self: end;
  align-self: start;
}
```

### 2.3 常见 Grid 布局模式

**圣杯布局（Holy Grail）**：

```css
.holy-grail {
  display: grid;
  grid-template-areas:
    "header header header"
    "nav    main   aside"
    "footer footer footer";
  grid-template-rows: 60px 1fr 50px;
  grid-template-columns: 200px 1fr 200px;
  min-height: 100vh;
}
.header { grid-area: header; }
.nav    { grid-area: nav; }
.main   { grid-area: main; }
.aside  { grid-area: aside; }
.footer { grid-area: footer; }
```

**响应式网格（无需媒体查询）**：

```css
/* auto-fill：尽可能多地创建列 */
.auto-fill {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

/* auto-fit：折叠空轨道，填满容器 */
.auto-fit {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}
```

> **auto-fill vs auto-fit 区别**：`auto-fill` 会保留空轨道（即使没有内容），`auto-fit` 会折叠空轨道让已有元素撑满容器。实际开发中 `auto-fit` 更常用。

**居中单个元素**：

```css
.center-grid {
  display: grid;
  place-items: center;   /* justify-items + align-items 简写 */
}
```

## 三、Flex vs Grid 选择指南

| 场景 | 推荐方案 |
|------|---------|
| 一维布局（行或列） | Flexbox |
| 二维布局（行和列同时控制） | Grid |
| 内容驱动的对齐 | Flexbox |
| 布局驱动的区域划分 | Grid |
| 导航栏、按钮组 | Flexbox |
| 整体页面布局 | Grid |
| 动态数量的等宽元素 | Flex 或 Grid（均适用） |

## 面试要点

1. **必须掌握**：Flex 的主轴/交叉轴概念、`justify-content` 和 `align-items` 的所有取值。
2. **高频考点**：`flex: 1` 和 `flex: auto` 的区别——前者 `flex-basis` 为 `0%`，后者为 `auto`。
3. **进阶能力**：Grid 的 `auto-fill` 与 `auto-fit` 区别、`grid-template-areas` 语义化布局。
4. **实战场景**：能用 Flex 实现 sticky footer、等分列、圣杯布局。

## 常见面试题

**Q：`flex: 1` 和 `flex: auto` 有什么区别？**

A：`flex: 1` 等同于 `1 1 0%`，元素基于 0% 分配剩余空间，结果是等分。`flex: auto` 等同于 `1 1 auto`，元素基于自身内容大小分配剩余空间，内容多的元素会占据更多空间。

**Q：如何用 Flex 实现 Sticky Footer？**

A：容器设为 `display: flex; flex-direction: column; min-height: 100vh`，中间内容区设为 `flex: 1`，footer 自然位于底部。

**Q：Grid 的 `auto-fill` 和 `auto-fit` 有什么区别？**

A：`auto-fill` 会尽可能多地创建列轨道（包括空轨道），`auto-fit` 会折叠空轨道，让已有元素撑满整个容器。当元素数量不足以填满一行时，`auto-fit` 的元素会自动拉伸至容器宽度。

**Q：什么时候用 Flex，什么时候用 Grid？**

A：一维布局（单行或单列）用 Flex，如导航栏、按钮组。二维布局（行列同时控制）用 Grid，如页面整体布局、卡片网格。两者可以结合使用——Grid 管大布局，Flex 管小组件内部排列。
