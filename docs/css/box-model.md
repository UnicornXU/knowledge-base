---
title: "盒模型与选择器"
sidebar_position: 1
difficulty: "easy"
tags: ["css", "box-model", "selectors"]
---

# 盒模型与选择器

## 一、盒模型（Box Model）

### 1.1 标准盒模型与怪异盒模型

每个 HTML 元素都被视为一个矩形盒子，由四个区域组成：`content`、`padding`、`border`、`margin`。

CSS 通过 `box-sizing` 属性控制盒模型的计算方式：

```css
/* 标准盒模型（默认） */
.standard {
  box-sizing: content-box;
  width: 200px;       /* 内容宽度 = 200px */
  padding: 20px;      /* 总宽度 = 200 + 20*2 + border*2 */
  border: 2px solid;
}

/* 怪异盒模型（IE 盒模型） */
.weird {
  box-sizing: border-box;
  width: 200px;       /* 总宽度 = 200px（包含 padding 和 border） */
  padding: 20px;
  border: 2px solid;
  /* 内容宽度 = 200 - 20*2 - 2*2 = 156px */
}
```

**最佳实践**：全局使用 `border-box`，这是现代 CSS Reset 的标准做法：

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}
```

### 1.2 Margin 折叠（Margin Collaving）

相邻的垂直方向 margin 会合并为一个 margin，取较大值。这**仅发生在垂直方向**，水平方向不会折叠。

**触发条件**（满足任一即可）：
- 相邻的兄弟元素
- 父元素与第一个/最后一个子元素（无 border/padding/inline/清除浮动/BFC 隔离）
- 空块元素自身的 margin-top 与 margin-bottom

```css
/* 折叠示例 */
.box-a { margin-bottom: 30px; }
.box-b { margin-top: 20px; }
/* 最终间距 = max(30, 20) = 30px，不是 50px */
```

**避免 Margin 折叠的方法**：
- 父元素创建 BFC（如 `overflow: hidden`）
- 使用 padding 替代 margin
- 使用 Flexbox 或 Grid 布局（flex/grid 容器的子元素不发生 margin 折叠）

## 二、CSS 选择器

### 2.1 选择器类型

```css
/* 类型选择器 */
p { color: #333; }

/* 类选择器 */
.highlight { background: yellow; }

/* ID 选择器 */
#header { height: 60px; }

/* 属性选择器 */
input[type="text"] { border: 1px solid #ccc; }
a[href^="https"] { color: green; }      /* 以 https 开头 */
a[href$=".pdf"] { color: red; }         /* 以 .pdf 结尾 */
a[href*="example"] { color: blue; }     /* 包含 example */

/* 伪类选择器 */
a:hover { text-decoration: underline; }
li:first-child { font-weight: bold; }
input:focus { outline: 2px solid blue; }
p:nth-child(2n) { background: #f5f5f5; }
div:empty { display: none; }

/* 伪元素选择器 */
p::first-line { font-weight: bold; }
p::before { content: ">> "; }
p::after { content: ""; display: block; clear: both; }
input::placeholder { color: #999; }
```

### 2.2 选择器优先级（Specificity）

优先级从高到低：

| 优先级 | 类型 | 示例 |
|--------|------|------|
| 1-0-0-0 | `!important` | `color: red !important` |
| 0-1-0-0 | 内联样式 | `<div style="color: red">` |
| 0-0-1-0 | ID 选择器 | `#header` |
| 0-0-0-1 | 类/伪类/属性选择器 | `.nav` / `:hover` / `[type]` |
| 0-0-0-0 | 类型/伪元素选择器 | `div` / `::before` |

**计算规则**：

```css
/* 优先级: 0-1-1-1 */
#nav .list li { }

/* 优先级: 0-0-2-1 */
.nav .list .item { }  /* 更低，ID 选择器权重更高 */

/* 优先级: 0-0-1-1 */
.nav li { }
```

> **面试要点**：优先级是**逐级比较**，不是简单相加。`11` 个类选择器仍然低于 `1` 个 ID 选择器。

### 2.3 !important 的使用

```css
/* !important 会覆盖普通声明，包括内联样式 */
.override {
  color: red !important;
}
```

**使用原则**：尽量避免使用 `!important`。它会破坏正常的层叠规则，使调试困难。唯一合理场景是覆盖第三方库的样式。

## 三、CSS 继承

某些 CSS 属性会自动从父元素传递给子元素。

**可继承属性**（常用）：
- `color`、`font-family`、`font-size`、`font-weight`
- `line-height`、`letter-spacing`、`text-align`
- `visibility`、`cursor`、`list-style`

**不可继承属性**：
- `margin`、`padding`、`border`、`width`、`height`
- `display`、`position`、`overflow`
- `background`、`box-shadow`

**控制继承的关键字**：

```css
.child {
  color: inherit;    /* 显式继承父元素的 color */
  border: initial;   /* 恢复为浏览器默认值 */
  margin: unset;     /* 可继承属性 → inherit，不可继承属性 → initial */
}
```

## 面试要点

1. **必须掌握**：`content-box` 与 `border-box` 的区别及计算方式。
2. **高频考点**：选择器优先级的计算方法，能快速判断两个选择器谁的优先级更高。
3. **注意细节**：Margin 折叠只发生在垂直方向，Flex/Grid 容器的子元素不会发生 margin 折叠。
4. **理解继承**：知道哪些属性可继承，以及 `inherit`、`initial`、`unset` 的区别。

## 常见面试题

**Q：`content-box` 和 `border-box` 的区别？**

A：`content-box` 是标准盒模型，`width` 仅指内容区宽度，总宽度需加上 padding 和 border。`border-box` 下 `width` 包含 content + padding + border，设置宽度即为元素总宽度。现代开发推荐全局设置 `border-box`。

**Q：如何计算选择器优先级？**

A：按 `inline-ID-class-type` 四级统计数量，逐级比较，高位大者优先。如 `#nav .item` 的优先级为 `0-1-1-0`，高于 `.nav .list .item` 的 `0-0-3-0`。

**Q：哪些属性可以继承？**

A：主要是文字相关属性（`color`、`font-*`、`line-height`、`text-align` 等）和 `visibility`、`cursor`。盒模型属性（`margin`、`padding`、`border`）、定位属性（`position`）、尺寸属性（`width`、`height`）不可继承。

**Q：margin 折叠的规则是什么？如何避免？**

A：相邻垂直 margin 会合并取较大值。避免方法：(1) 父元素创建 BFC；(2) 用 padding 替代；(3) 使用 Flex 或 Grid 布局。
