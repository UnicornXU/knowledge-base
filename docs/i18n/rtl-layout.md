---
sidebar_position: 2
title: RTL 布局适配
description: CSS 逻辑属性、dir 属性、镜像图标、RTL 测试策略全面解析
keywords: [RTL, CSS Logical Properties, dir属性, 阿拉伯语, 布局镜像, margin-inline-start]
---

# RTL 布局适配

## 什么是 RTL

RTL（Right-to-Left，从右到左）是指文字和布局从右侧开始、向左延伸的排版方向。全球约有 **20+ 亿人** 使用 RTL 语言，包括阿拉伯语、希伯来语、波斯语、乌尔都语等。

### LTR vs RTL 对比

```text
LTR（英文/中文）:          RTL（阿拉伯语）:
┌─────────────────┐       ┌─────────────────┐
│ Logo    [菜单]  │       │  [菜单]    Logo │
│                 │       │                 │
│ Content →       │       │       ← Content │
│ [返回]  [继续]  │       │  [继续]  [返回] │
└─────────────────┘       └─────────────────┘
```

---

## dir 属性

### HTML dir 属性

```html
<!-- 整个页面设置为 RTL -->
<html dir="rtl" lang="ar">
  <body>
    <p>هذا نص عربي</p>
  </body>
</html>

<!-- 局部 RTL -->
<div dir="rtl">
  <p>这部分内容从右到左排列</p>
</div>
```

### dir 属性值

| 值 | 含义 | 使用场景 |
|-----|------|----------|
| `ltr` | 从左到右 | 默认值，英文/中文等 |
| `rtl` | 从右到左 | 阿拉伯语/希伯来语 |
| `auto` | 自动检测 | 根据第一个强方向字符决定 |

### React 中的 dir

```jsx
function App() {
  const { locale } = useIntl();
  const dir = ['ar', 'he', 'fa', 'ur'].includes(locale) ? 'rtl' : 'ltr';

  return (
    <html dir={dir} lang={locale}>
      <body>{children}</body>
    </html>
  );
}
```

### Vue 中的 dir

```vue
<template>
  <html :dir="direction" :lang="locale">
    <router-view />
  </html>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { locale } = useI18n();
const rtlLocales = ['ar', 'he', 'fa', 'ur'];
const direction = computed(() =>
  rtlLocales.includes(locale.value) ? 'rtl' : 'ltr'
);
</script>
```

---

## CSS 逻辑属性

CSS 逻辑属性是 RTL 适配的核心技术。它将物理方向（left/right）替换为逻辑方向（start/end），自动根据 `dir` 属性调整。

### 物理属性 vs 逻辑属性

| 物理属性（不推荐） | 逻辑属性（推荐） | 说明 |
|---------------------|-------------------|------|
| `margin-left` | `margin-inline-start` | 行内方向起始边距 |
| `margin-right` | `margin-inline-end` | 行内方向结束边距 |
| `padding-left` | `padding-inline-start` | 行内方向起始内边距 |
| `padding-right` | `padding-inline-end` | 行内方向结束内边距 |
| `border-left` | `border-inline-start` | 行内方向起始边框 |
| `text-align: left` | `text-align: start` | 文本对齐 |
| `float: left` | `float: inline-start` | 浮动方向 |
| `left` | `inset-inline-start` | 定位偏移 |
| `right` | `inset-inline-end` | 定位偏移 |
| `width` | `inline-size` | 行内方向尺寸 |
| `height` | `block-size` | 块方向尺寸 |

### 代码示例

```css
/* 传统写法（LTR 固定） */
.sidebar {
  margin-left: 20px;
  padding-left: 16px;
  border-left: 2px solid #333;
  float: left;
  width: 250px;
}

/* 逻辑属性写法（RTL 自适应） */
.sidebar {
  margin-inline-start: 20px;
  padding-inline-start: 16px;
  border-inline-start: 2px solid #333;
  float: inline-start;
  inline-size: 250px;
}
```

### 简写属性

```css
/* 四个方向的简写 */
.box {
  /* margin: top right bottom left → margin: block-start inline-end block-end inline-start */
  margin-inline: 16px;    /* 行内方向两侧等距 */
  margin-block: 8px;      /* 块方向两侧等距 */

  padding-inline-start: 24px;
  padding-inline-end: 12px;
}
```

---

## Flexbox 与 Grid 的 RTL 行为

### Flexbox

```css
/* Flexbox 默认就是逻辑方向的 */
.nav {
  display: flex;
  /* flex-direction: row 在 RTL 下自动反转 */
  /* flex-direction: row-reverse 在 RTL 下也自动反转 */
}

/* 不推荐：使用物理方向 */
.nav {
  flex-direction: row; /* 不需要写 row-reverse */
}
```

### Grid

```css
/* Grid 也是逻辑方向的 */
.layout {
  display: grid;
  grid-template-columns: 250px 1fr; /* RTL 下自动反转 */
  gap: 16px;
}
```

---

## 需要镜像的元素

### 图标

不是所有图标都需要镜像。需要根据图标的语义决定：

| 图标类型 | 是否镜像 | 示例 |
|----------|----------|------|
| 方向箭头 | 是 | 返回箭头 `<-` → `->` |
| 前进/后退 | 是 | 播放器控制 |
| 对话气泡 | 是 | 消息列表 |
| 进度条 | 是 | 从右到左填充 |
| Logo | 否 | 品牌标识 |
| 勾选/叉号 | 否 | 状态图标 |
| 电话/邮件 | 否 | 通用图标 |
| 音量/设置 | 否 | 工具图标 |

### CSS 镜像实现

```css
/* 自动镜像方案 */
[dir="rtl"] .icon-mirror {
  transform: scaleX(-1);
}

/* 更精确的控制 */
[dir="rtl"] .arrow-left {
  transform: scaleX(-1); /* 左箭头 → 右箭头 */
}

/* 不镜像 */
[dir="rtl"] .logo {
  /* 保持原样 */
}
```

### SVG 图标镜像

```jsx
function Icon({ name, mirror, ...props }) {
  const dir = document.documentElement.dir;
  const shouldMirror = mirror && dir === 'rtl';

  return (
    <svg
      className={clsx('icon', shouldMirror && 'icon-mirrored')}
      {...props}
    >
      <use href={`/icons.svg#${name}`} />
    </svg>
  );
}
```

---

## 表单与输入框

### 输入框对齐

```css
/* 输入框标签对齐 */
.form-group label {
  text-align: start; /* 自动适应 LTR/RTL */
}

/* 输入框内文本方向 */
input[type="text"],
textarea {
  text-align: start;
}

/* 数字输入框保持 LTR */
input[type="number"],
input[type="tel"] {
  direction: ltr; /* 数字始终从左到右 */
  text-align: start;
}
```

### 搜索框

```css
.search-box {
  position: relative;
}

.search-box .search-icon {
  position: absolute;
  inset-inline-start: 12px; /* LTR 左侧，RTL 右侧 */
}

.search-box input {
  padding-inline-start: 40px; /* 为图标留出空间 */
}
```

---

## RTL 测试策略

### 1. 手动测试

在浏览器开发者工具中添加 `dir="rtl"` 属性：

```js
// 快速切换 RTL
document.documentElement.dir = document.documentElement.dir === 'rtl' ? 'ltr' : 'rtl';
```

### 2. 自动化视觉回归测试

```js
// Playwright 截图对比
test('RTL layout screenshot', async ({ page }) => {
  await page.goto('/dashboard');
  await page.evaluate(() => {
    document.documentElement.dir = 'rtl';
  });
  await page.waitForTimeout(500); // 等待重排
  await expect(page).toHaveScreenshot('dashboard-rtl.png');
});
```

### 3. CSS 逻辑属性检查

```js
// ESLint 规则：禁止使用物理属性
// eslint-plugin-css-logical-properties
{
  "rules": {
    "css-logical-properties/no-physical-properties": "error"
  }
}
```

### 4. 测试清单

- [ ] 所有文本内容从右到左排列
- [ ] 图标正确镜像（方向性图标）
- [ ] 表单输入框对齐正确
- [ ] 滚动条位置正确
- [ ] 动画方向正确
- [ ] 弹出菜单/下拉框方向正确
- [ ] 进度条方向正确
- [ ] 面包屑导航方向正确
- [ ] 表格列顺序正确
- [ ] 日期格式符合 RTL 习惯

---

## 常见 RTL 问题与解决方案

### 问题 1：绝对定位元素错位

```css
/* 问题 */
.badge {
  position: absolute;
  right: 10px; /* RTL 下会跑到左边 */
}

/* 解决 */
.badge {
  position: absolute;
  inset-inline-end: 10px; /* 自动适应 */
}
```

### 问题 2：背景图片位置偏移

```css
/* 问题 */
.box {
  background-position: left center; /* RTL 下不会自动翻转 */
}

/* 解决 */
.box {
  background-position: start center; /* 逻辑值 */
}

/* 或手动处理 */
[dir="rtl"] .box {
  background-position: right center;
}
```

### 问题 3：阴影方向

```css
/* 问题 */
.card {
  box-shadow: 5px 0 10px rgba(0,0,0,0.1); /* 阴影方向固定 */
}

/* 解决：使用对称阴影 */
.card {
  box-shadow: 0 2px 10px rgba(0,0,0,0.1); /* 上下对称 */
}
```

### 问题 4：过渡动画

```css
/* 问题 */
.slide-in {
  animation: slideInLeft 0.3s;
}

/* 解决：使用逻辑方向 */
@keyframes slideInFromStart {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}

[dir="rtl"] .slide-in {
  animation-name: slideInFromEnd;
}

@keyframes slideInFromEnd {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
```

---

## 面试高频问题

1. **RTL 布局适配的核心技术是什么？**
   - CSS 逻辑属性替代物理属性
   - `dir="rtl"` 属性控制方向
   - 方向性图标镜像

2. **`margin-inline-start` 和 `margin-left` 的区别？**
   - `margin-left` 是物理属性，始终指左侧
   - `margin-inline-start` 是逻辑属性，在 LTR 下是左侧，RTL 下是右侧

3. **哪些 CSS 属性需要手动处理 RTL？**
   - `background-position` 的非对称值
   - `box-shadow` 的水平偏移
   - 定位相关的 `left`/`right`

4. **如何测试 RTL 布局？**
   - 开发者工具切换 `dir` 属性
   - Playwright 截图对比
   - ESLint 禁止物理属性规则

5. **哪些图标需要镜像？**
   - 方向性图标（箭头、返回、前进）
   - 进度指示器
   - 不需要镜像：Logo、状态图标、通用工具图标
