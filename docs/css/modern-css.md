---
title: "现代 CSS 新特性"
sidebar_position: 6
difficulty: "medium"
tags: ["css", "modern-css", "new-features"]
---

# 现代 CSS 新特性

## 一、CSS Nesting

原生 CSS 嵌套语法，不再需要预处理器。

```css
/* 传统写法 */
.card {
  background: white;
  border-radius: 8px;
}
.card .title {
  font-size: 1.25rem;
}
.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* CSS Nesting（现代浏览器已支持） */
.card {
  background: white;
  border-radius: 8px;

  & .title {
    font-size: 1.25rem;
  }

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  /* 嵌套媒体查询 */
  @media (min-width: 768px) {
    padding: 2rem;
  }
}
```

> **注意**：`&` 符号引用父选择器。嵌套规则不能以标识符开头（需用 `&` 前缀），这是与 Sass/Less 的关键区别。

## 二、:has() 选择器

被称为"父选择器"，CSS 中最被期待的特性之一。它可以根据子元素的状态来选择父元素。

```css
/* 包含图片的卡片 */
.card:has(img) {
  grid-column: span 2;
}

/* 输入框有值时改变标签样式 */
.form-group:has(input:not(:placeholder-shown)) label {
  transform: translateY(-20px);
  font-size: 0.75rem;
}

/* 选择后面的兄弟元素 */
h2:has(+ p) {
  margin-bottom: 0.5rem;
}

/* 根据子元素状态改变父元素 */
.form-group:has(input:focus) {
  border-color: #3498db;
}

/* 空列表提示 */
.list:has(:not(*))::after {
  content: "暂无数据";
}
```

> **实际应用**：`:has()` 可以替代很多以前需要 JavaScript 的场景，如表单验证状态联动、条件性样式等。

## 三、容器查询（@container）

```css
/* 定义容器 */
.card-wrapper {
  container-type: inline-size;
  container-name: card;
}

/* 基于容器宽度应用样式 */
@container card (min-width: 400px) {
  .card {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 1rem;
  }
}

@container card (max-width: 399px) {
  .card {
    display: flex;
    flex-direction: column;
  }
}

/* 查询容器类型 */
@container card (orientation: landscape) {
  .card__body { flex-direction: row; }
}

/* 容器查询单位 */
.card__title {
  font-size: max(1rem, 4cqi); /* cqi = 容器内联尺寸的 1% */
}
```

**容器查询长度单位**：

| 单位 | 含义 |
|------|------|
| `cqw` | 容器宽度的 1% |
| `cqh` | 容器高度的 1% |
| `cqi` | 容器内联尺寸的 1% |
| `cqb` | 容器块级尺寸的 1% |
| `cqmin` | cqi 和 cqb 中较小的 |
| `cqmax` | cqi 和 cqb 中较大的 |

## 四、Subgrid

子网格允许嵌套的 Grid 容器继承父 Grid 的轨道定义，实现跨组件对齐。

```css
/* 父网格 */
.page {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: 1rem;
}

/* 子网格继承父网格的列轨道 */
.card {
  display: grid;
  grid-column: span 3;
  grid-template-columns: subgrid; /* 继承父级列 */
}

.card__header {
  grid-column: 1 / -1;  /* 跨满所有列 */
}
.card__body {
  grid-column: 1 / 3;
}
.card__sidebar {
  grid-column: 3;
}
```

> **实际价值**：Subgrid 让不同组件内部的元素可以精确对齐到同一个网格系统中，解决了以前 Grid 嵌套后无法对齐的痛点。

## 五、color-mix()

在 CSS 中混合两种颜色。

```css
:root {
  --primary: #3498db;

  /* 生成浅色变体 */
  --primary-light: color-mix(in srgb, var(--primary) 30%, white);
  /* 30% 主色 + 70% 白色 */

  /* 生成深色变体 */
  --primary-dark: color-mix(in srgb, var(--primary) 80%, black);

  /* 透明度变体 */
  --primary-alpha: color-mix(in srgb, var(--primary) 50%, transparent);
}

.button {
  background: var(--primary);
}
.button:hover {
  background: var(--primary-dark);  /* 自动生成悬停色 */
}
```

> **实用场景**：自动生成主题色的明暗变体、hover 状态色、遮罩层透明色，无需手动计算。

## 六、:is() 和 :where()

### :is() — 简化选择器列表

```css
/* 以前 */
header p,
main p,
footer p {
  line-height: 1.6;
}

/* 使用 :is() 简化 */
:is(header, main, footer) p {
  line-height: 1.6;
}

/* 更多用法 */
:is(h1, h2, h3):hover {
  color: var(--primary);
}
```

> **注意**：`:is()` 的优先级等于其参数中优先级最高的选择器。

### :where() — 零优先级选择器

```css
/* :where() 的优先级始终为 0，便于覆盖 */
:where(.card, .panel) {
  padding: 1rem;         /* 优先级: 0 */
}

.card {
  padding: 2rem;         /* 轻松覆盖 :where 的样式 */
}
```

`:is()` vs `:where()` 区别：两者语法相同，区别在于优先级。`:is()` 取参数中最高优先级，`:where()` 始终为 0。`:where()` 适合写可被覆盖的基础样式（如 Reset）。

## 七、逻辑属性（Logical Properties）

使用逻辑方向（inline/block）替代物理方向（left/right/top/bottom），更好地支持多语言（如 RTL 从右到左）。

```css
/* 物理属性 → 逻辑属性 */
margin-left          →  margin-inline-start
margin-right         →  margin-inline-end
margin-top           →  margin-block-start
margin-bottom        →  margin-block-end

/* 简写 */
margin: 10px 20px;          /* 物理 */
margin-block: 10px;         /* 上下 */
margin-inline: 20px;        /* 左右（自动适配 RTL） */

padding-left         →  padding-inline-start
border-top           →  border-block-start

width                →  inline-size
height               →  block-size

/* 定位 */
top                  →  inset-block-start
left                 →  inset-inline-start
inset: 0;                  /* 全方向 = top/right/bottom/left: 0 */
```

## 八、View Transitions API

页面或组件间切换时实现平滑过渡。

```css
/* 页面级过渡（SPA） */
@view-transition {
  navigation: auto;
}

/* 自定义过渡动画 */
::view-transition-old(root) {
  animation: fade-out 0.3s ease-out;
}
::view-transition-new(root) {
  animation: fade-in 0.3s ease-in;
}

/* 针对特定元素 */
::view-transition-old(hero-image) {
  animation: scale-down 0.4s ease-in-out;
}
::view-transition-new(hero-image) {
  animation: scale-up 0.4s ease-in-out;
}
```

```js
// 需要 JavaScript 触发
document.startViewTransition(() => {
  // 更新 DOM
  updatePage();
});
```

## 九、@layer（Cascade Layers）

控制样式层叠顺序，解决第三方样式冲突。

```css
/* 定义层级顺序（越后面的优先级越高） */
@layer reset, base, components, utilities;

@layer reset {
  * { margin: 0; padding: 0; box-sizing: border-box; }
}

@layer base {
  body { font-family: system-ui; color: #333; }
}

@layer components {
  .button { padding: 0.5rem 1rem; border-radius: 4px; }
}

@layer utilities {
  .hidden { display: none; }
  .text-center { text-align: center; }
}

/* 第三方库样式也可以纳入层 */
@layer third-party {
  @import url("third-party-lib.css");
}
```

> **实际价值**：`@layer` 让你能明确控制样式优先级，第三方库的样式即使使用高优先级选择器，只要在低优先级层中，就可以被上层样式轻松覆盖。不再需要与 `!important` 和选择器权重作斗争。

## 面试要点

1. **必须了解**：`:has()` 父选择器的概念和实际用途。
2. **高频考点**：`:is()` 和 `:where()` 的区别——优先级不同。
3. **加分项**：容器查询与媒体查询的区别和互补关系。
4. **前沿知识**：`@layer` 如何解决样式优先级混乱的问题。
5. **实用能力**：`color-mix()` 生成颜色变体、逻辑属性支持国际化。

## 常见面试题

**Q：`:has()` 有什么用？为什么被称为"父选择器"？**

A：`:has()` 可以根据元素的子元素、后续兄弟元素等来选择该元素。以前 CSS 只能"向下"选择子元素，无法"向上"选择父元素。有了 `:has()`，可以根据子元素状态（如 `input:focus`、`img` 是否存在）来样式化父元素，替代了很多以前需要 JavaScript 的场景。

**Q：`:is()` 和 `:where()` 的区别？**

A：语法相同，区别在于优先级。`:is()` 的优先级等于其参数中最高优先级的选择器，`:where()` 的优先级始终为 0。`:where()` 适合写基础/重置样式，便于被后续样式覆盖。

**Q：`@layer` 解决了什么问题？**

A：`@layer`（级联层）让你定义样式的层叠优先级顺序，无需依赖选择器权重或 `!important`。比如将样式分为 reset、base、components、utilities 层，utilities 层自动覆盖 base 层的样式。第三方库的样式可以放在较低优先级层，避免与项目样式冲突。

**Q：逻辑属性有什么实际价值？**

A：逻辑属性使用 inline/block 方向替代物理的 left/right/top/bottom，自动适配不同书写方向（LTR/RTL）。对于需要国际化的项目，切换到阿拉伯语（RTL）时无需修改样式，CSS 自动翻转方向。
