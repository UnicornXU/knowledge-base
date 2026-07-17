---
sidebar_position: 5
title: "视口与单位系统"
difficulty: "medium"
tags: ["移动端", "viewport", "rem", "vw", "适配方案"]
---

# 视口与单位系统

移动端适配的核心在于理解视口（Viewport）概念和灵活运用 CSS 单位系统。本文从原理到实战，系统梳理各种适配方案。

## Viewport 概念详解

### 三种视口

| 视口类型 | 英文 | 描述 |
|---------|------|------|
| 布局视口 | Layout Viewport | 网页布局的基准视口，移动端默认约 980px |
| 视觉视口 | Visual Viewport | 用户当前看到的区域，可通过缩放改变 |
| 理想视口 | Ideal Viewport | 设备屏幕宽度，布局视口=理想视口时体验最佳 |

```javascript
// 获取各种视口信息
console.log('布局视口宽度:', document.documentElement.clientWidth);
console.log('视觉视口宽度:', window.visualViewport?.width || window.innerWidth);
console.log('理想视口宽度:', screen.width);
```

:::info 为什么需要 Layout Viewport？
早期移动浏览器为了正常显示 PC 网页，设定了一个约 980px 的默认布局视口。这样 PC 网页能完整展示（只是很小），用户可以通过缩放查看。通过 `meta viewport` 可以将布局视口设为理想视口大小。
:::

### meta viewport 配置

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover">
```

| 属性 | 含义 | 常用值 |
|------|------|--------|
| width | 布局视口宽度 | device-width / 具体数值 |
| initial-scale | 初始缩放比例 | 1.0 |
| maximum-scale | 最大缩放比例 | 1.0（禁止放大） |
| minimum-scale | 最小缩放比例 | 1.0（禁止缩小） |
| user-scalable | 是否允许用户缩放 | no |
| viewport-fit | 视口填充模式 | auto / contain / cover |

:::warning 无障碍注意
禁止用户缩放（user-scalable=no）会影响视障用户体验。除非有特殊需求，建议允许缩放或至少设置 `maximum-scale=5`。
:::

## CSS 单位系统对比

| 单位 | 类型 | 基准 | 适用场景 |
|------|------|------|----------|
| px | 绝对 | CSS像素 | 精确控制、边框 |
| em | 相对 | 父元素 font-size | 组件内部间距 |
| rem | 相对 | 根元素 font-size | 全局尺寸适配 |
| vw | 相对 | 视口宽度的1% | 宽度自适应 |
| vh | 相对 | 视口高度的1% | 全屏布局 |
| vmin | 相对 | vw/vh 较小值 | 横竖屏兼容 |
| vmax | 相对 | vw/vh 较大值 | 横竖屏兼容 |
| dvh | 相对 | 动态视口高度的1% | 解决地址栏问题 |
| svh | 相对 | 最小视口高度的1% | 保守布局 |
| lvh | 相对 | 最大视口高度的1% | 全屏背景 |

### 新视口单位详解（dvh/svh/lvh）

移动端浏览器地址栏会动态收起/展开，导致 `vh` 单位不可靠：

```
┌─────────────────┐
│   地址栏(展开)   │ ← svh 基准（最小视口 = 地址栏展开时）
├─────────────────┤
│                 │
│   页面内容      │
│                 │
└─────────────────┘

┌─────────────────┐
│   地址栏(收起)   │ ← lvh 基准（最大视口 = 地址栏收起时）
├─────────────────┤
│                 │
│   页面内容      │
│   (更多空间)    │
│                 │
└─────────────────┘

dvh = 动态变化，随地址栏状态实时更新
```

```css
/* 传统写法 - 地址栏展开时内容溢出 */
.hero {
  height: 100vh; /* 问题：不考虑地址栏 */
}

/* 现代写法 */
.hero {
  height: 100dvh; /* 动态适配地址栏 */
  height: 100svh; /* 降级：总是最小高度，安全不溢出 */
}

/* 全屏背景 - 使用 lvh 避免地址栏收起时出现空白 */
.fullscreen-bg {
  min-height: 100lvh;
}
```

## rem 适配方案

### flexible.js 原理

```javascript
// 简化版 flexible.js 核心逻辑
(function flexible(window, document) {
  const docEl = document.documentElement;
  const dpr = window.devicePixelRatio || 1;

  function setRemUnit() {
    // 将屏幕宽度分成10份，每份为1rem
    const rem = docEl.clientWidth / 10;
    docEl.style.fontSize = rem + 'px';
  }

  setRemUnit();
  window.addEventListener('resize', setRemUnit);
  window.addEventListener('pageshow', function(e) {
    if (e.persisted) setRemUnit();
  });
})();

// 设计稿 375px 宽时：
// 1rem = 37.5px
// 设计稿上 100px 的元素 = 100/37.5 = 2.667rem
```

### postcss-pxtorem 配置

```javascript
// postcss.config.js
module.exports = {
  plugins: {
    'postcss-pxtorem': {
      rootValue: 37.5,       // 设计稿宽度/10 (375/10)
      unitPrecision: 5,      // 小数点位数
      propList: ['*'],       // 需要转换的属性（*表示全部）
      selectorBlackList: ['.no-rem'], // 忽略的选择器
      replace: true,
      mediaQuery: false,
      minPixelValue: 1       // 小于1px不转换
    }
  }
};
```

```css
/* 输入 */
.header { height: 88px; font-size: 28px; }

/* 输出 */
.header { height: 2.34667rem; font-size: 0.74667rem; }
```

:::tip rem 方案优缺点
**优点：** 兼容性极好（iOS 6+, Android 2.1+）；等比缩放效果好

**缺点：** 需要引入 JS 动态设置 font-size；与第三方库 px 值冲突；大屏设备等比放大不一定是好体验
:::

## vw 适配方案

### postcss-px-to-viewport 配置

```javascript
// postcss.config.js
module.exports = {
  plugins: {
    'postcss-px-to-viewport-8-plugin': {
      viewportWidth: 375,      // 设计稿宽度
      unitPrecision: 5,        // 转换精度
      viewportUnit: 'vw',      // 目标单位
      selectorBlackList: ['.ignore'], // 忽略的类名
      minPixelValue: 1,        // 最小转换值
      mediaQuery: false,       // 是否转换媒体查询中的px
      landscape: false,        // 是否处理横屏
      exclude: [/node_modules/] // 排除文件
    }
  }
};
```

```css
/* 输入（设计稿 375px） */
.card { width: 345px; padding: 15px; font-size: 14px; }

/* 输出 */
.card { width: 92vw; padding: 4vw; font-size: 3.73333vw; }
```

### rem vs vw 方案对比

| 维度 | rem 方案 | vw 方案 |
|------|----------|---------|
| 依赖 JS | 需要（设置root font-size） | 不需要 |
| 兼容性 | iOS 6+, Android 2.1+ | iOS 8+, Android 4.4+ |
| 实现原理 | 动态修改根字号 | CSS 原生支持 |
| 第三方库兼容 | 可能冲突 | 排除 node_modules 即可 |
| 大屏适配 | 可设最大宽度 | 需要 clamp() 限制 |
| 精确度 | 高 | 高 |
| 推荐度 | 老项目维护 | 新项目首选 |

## 混合方案（rem + vw + clamp）

```css
/* 现代混合适配方案 */
:root {
  /* 基础字号：最小14px，理想4vw，最大18px */
  font-size: clamp(14px, 4vw, 18px);
}

.container {
  /* 宽度自适应但有上下限 */
  width: clamp(320px, 90vw, 750px);
  margin: 0 auto;
  padding: 0 clamp(12px, 3vw, 24px);
}

.title {
  /* 响应式字体 */
  font-size: clamp(1.25rem, 2vw + 1rem, 2rem);
  line-height: 1.4;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
  gap: clamp(12px, 2vw, 24px);
}
```

:::tip clamp() 函数
`clamp(min, preferred, max)` 三个参数分别是最小值、首选值、最大值。它让元素在一个范围内响应式变化，无需媒体查询即可实现平滑过渡。
:::

## 实战：从零配置移动端适配方案

### 方案选型：vw + rem 兜底 + clamp 限制

```javascript
// postcss.config.js - 推荐配置
module.exports = {
  plugins: {
    // 自动添加前缀
    autoprefixer: {},
    // px 转 vw
    'postcss-px-to-viewport-8-plugin': {
      viewportWidth: 375,
      unitPrecision: 5,
      viewportUnit: 'vw',
      selectorBlackList: ['.ignore', '.hairline'],
      minPixelValue: 1,
      mediaQuery: false,
      exclude: [/node_modules/]
    }
  }
};
```

```css
/* global.css - 全局适配基础样式 */
*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  /* vw方案下仍设置合理的 root font-size 作为 rem 基准 */
  font-size: clamp(14px, 3.733vw, 18px);
  -webkit-text-size-adjust: 100%;
  -webkit-tap-highlight-color: transparent;
}

body {
  margin: 0;
  /* 限制最大宽度，大屏居中 */
  max-width: 750px;
  margin-left: auto;
  margin-right: auto;
  min-height: 100dvh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
```

```json
// package.json 依赖
{
  "devDependencies": {
    "postcss": "^8.4.31",
    "autoprefixer": "^10.4.16",
    "postcss-px-to-viewport-8-plugin": "^1.2.5"
  }
}
```

## 面试高频题

### Q1：说说移动端视口（Viewport）的概念

**答：** 移动端有三种视口：布局视口（默认980px，决定网页布局区域）、视觉视口（用户实际看到的区域）、理想视口（设备屏幕宽度）。通过 `<meta name="viewport" content="width=device-width">` 可将布局视口设为理想视口。

### Q2：rem 和 vw 方案各自的优缺点？

**答：** rem 兼容性更好但依赖 JS 动态设置根字号；vw 是纯 CSS 方案无需 JS，但兼容性要求 iOS 8+ / Android 4.4+。rem 在大屏上可以方便地设置最大字号，vw 则需要配合 clamp() 或媒体查询限制。

### Q3：dvh、svh、lvh 分别是什么？解决了什么问题？

**答：** 它们是新视口单位，解决移动端浏览器地址栏动态收起/展开导致 vh 不准的问题。dvh 动态跟随地址栏变化；svh 取最小视口高度（地址栏展开时）；lvh 取最大视口高度（地址栏收起时）。

### Q4：postcss-px-to-viewport 怎么处理第三方库的样式？

**答：** 通过 `exclude` 配置排除 node_modules 目录，或使用 `selectorBlackList` 排除特定选择器前缀。对于需要适配的第三方库，可以单独设置 include 规则。

### Q5：如何处理移动端大屏（iPad/折叠屏）的适配？

**答：** 三种策略：①使用 `max-width` 限制内容最大宽度并居中；②使用 `clamp()` 限制元素尺寸范围；③通过媒体查询在大屏时切换为多栏布局。避免所有元素等比放大导致过于巨大。

### Q6：em 和 rem 有什么区别？各适用什么场景？

**答：** em 相对于父元素的 font-size，会层层叠加（嵌套陷阱）；rem 相对于根元素（html）的 font-size，全局统一。em 适合组件内部需要跟随字号变化的间距；rem 适合全局统一的尺寸适配。
