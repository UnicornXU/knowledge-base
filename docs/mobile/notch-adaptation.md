---
sidebar_position: 7
title: "刘海屏与安全区域适配"
difficulty: "medium"
tags: ["移动端", "刘海屏", "安全区域", "env()"]
---

# 刘海屏与安全区域适配

随着 iPhone X 引入刘海屏设计，移动端开发者需要额外处理异形屏的安全区域问题。本文系统讲解从概念到落地的完整适配方案。

## 异形屏发展历程

| 时间 | 设备 | 异形类型 | 特点 |
|------|------|---------|------|
| 2017 | iPhone X | 刘海屏（Notch） | 顶部凹槽 + 底部横条 |
| 2019 | Samsung S10 | 挖孔屏（Punch-hole） | 摄像头圆形开孔 |
| 2020 | 各 Android | 水滴屏/药丸屏 | 缩小的刘海区域 |
| 2022 | iPhone 14 Pro | 灵动岛（Dynamic Island） | 可交互的药丸区域 |
| 2023 | 折叠屏 | 多屏异形 | 折叠铰链 + 不规则显示区域 |

## 安全区域概念

安全区域（Safe Area）是指屏幕上不会被系统 UI（状态栏、导航栏、圆角、刘海）遮挡的可用矩形区域。

```
┌──────────────────────────┐
│      ┌─────┐             │ ← safe-area-inset-top
│      │刘海 │             │
├──────┴─────┴─────────────┤
│                          │
│    ┌──────────────┐      │
│    │              │      │
│    │   安全区域    │      │ ← 内容应在此区域内
│    │              │      │
│    └──────────────┘      │
│                          │
├──────────────────────────┤
│    ════════════════       │ ← safe-area-inset-bottom (Home Indicator)
└──────────────────────────┘
  ↑                      ↑
  safe-area-inset-left   safe-area-inset-right (横屏时有值)
```

:::info 四个安全区域变量
- `safe-area-inset-top`：顶部安全距离（刘海/状态栏）
- `safe-area-inset-right`：右侧安全距离（横屏时的刘海侧）
- `safe-area-inset-bottom`：底部安全距离（Home Indicator 横条）
- `safe-area-inset-left`：左侧安全距离（横屏时的刘海侧）
:::

## env() 与 constant() 函数

### 基本用法

```css
/* iOS 11.2+ 使用 env() */
padding-top: env(safe-area-inset-top);

/* iOS 11.0-11.1 使用 constant() */
padding-top: constant(safe-area-inset-top);

/* 兼容性写法 - 两行都写，浏览器会用最后一个识别的 */
padding-top: constant(safe-area-inset-top);
padding-top: env(safe-area-inset-top);
```

### 与 calc() 组合使用

```css
/* 在安全区域基础上再加额外间距 */
.header {
  padding-top: calc(env(safe-area-inset-top) + 12px);
}

.footer {
  padding-bottom: calc(env(safe-area-inset-bottom) + 16px);
  /* constant 兼容写法 */
  padding-bottom: calc(constant(safe-area-inset-bottom) + 16px);
  padding-bottom: calc(env(safe-area-inset-bottom) + 16px);
}
```

### 搭配 max() 函数

```css
/* 确保至少有一定的间距 */
.content {
  padding-left: max(16px, env(safe-area-inset-left));
  padding-right: max(16px, env(safe-area-inset-right));
}
```

## viewport-fit=cover 配置

:::warning 前提条件
`env(safe-area-inset-*)` 只在 `viewport-fit=cover` 时才生效。默认 `viewport-fit=auto` 时，浏览器会自动将内容限制在安全区域内，此时 env() 值为 0。
:::

```html
<!-- 必须设置 viewport-fit=cover -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
```

| viewport-fit 值 | 行为 |
|----------------|------|
| auto / contain | 页面内容在安全区域内，不触及刘海/底部横条 |
| cover | 页面覆盖全屏，开发者自行处理安全区域 |

## 实战适配方案

### 顶部状态栏适配

```css
/* 固定顶部导航栏 */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  /* 导航栏高度 + 安全区域顶部 */
  height: calc(44px + constant(safe-area-inset-top));
  height: calc(44px + env(safe-area-inset-top));
  /* 内容区域向下偏移 */
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
  background: #ffffff;
  z-index: 100;
}

/* 页面内容需要留出导航栏空间 */
.page-content {
  padding-top: calc(44px + constant(safe-area-inset-top));
  padding-top: calc(44px + env(safe-area-inset-top));
}
```

### 底部导航栏适配（iPhone 底部横条）

```css
/* 底部 TabBar */
.tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  /* TabBar 高度 + 底部安全区域 */
  height: calc(50px + constant(safe-area-inset-bottom));
  height: calc(50px + env(safe-area-inset-bottom));
  /* 底部填充 */
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
  background: #ffffff;
  display: flex;
  align-items: flex-start; /* 图标文字在上方 */
}

/* 底部操作按钮 */
.bottom-action {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px;
  padding-bottom: calc(12px + constant(safe-area-inset-bottom));
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -1px 4px rgba(0, 0, 0, 0.1);
}
```

### 全面屏手势区域

```css
/* 底部手势区域避让（某些 Android 全面屏手势） */
.swipeable-area {
  margin-bottom: constant(safe-area-inset-bottom);
  margin-bottom: env(safe-area-inset-bottom);
}

/* 侧边栏滑动 - 避免与系统返回手势冲突 */
.sidebar {
  padding-left: max(20px, env(safe-area-inset-left));
}
```

### 横屏场景适配

```css
/* 横屏时刘海在侧面 */
@media (orientation: landscape) {
  .content {
    padding-left: max(16px, env(safe-area-inset-left));
    padding-right: max(16px, env(safe-area-inset-right));
  }

  .fullscreen-video {
    /* 视频播放器横屏时的安全区域 */
    margin-left: env(safe-area-inset-left);
    margin-right: env(safe-area-inset-right);
  }
}
```

## iOS vs Android 差异对比

| 特性 | iOS (iPhone) | Android |
|------|-------------|---------|
| 刘海形态 | 标准刘海/灵动岛 | 挖孔/水滴/药丸 |
| 底部横条 | Home Indicator（固定34pt） | 无（虚拟导航栏可选） |
| env() 支持 | iOS 11.2+ | Android Chrome 69+ |
| 默认行为 | 自动避让安全区域 | 部分机型不避让 |
| 横屏安全区 | 刘海侧有 inset 值 | 多数设备为 0 |
| 圆角处理 | 系统自动裁剪 | 需要手动处理 |

:::tip Android 适配要点
Android 设备碎片化严重，部分机型的安全区域值不准确。建议：
1. 使用 `env()` 作为基础适配
2. 对关键 UI 设置 `min-padding` 兜底
3. 实机测试主流品牌旗舰机型
:::

## CSS 媒体查询检测异形屏

```css
/* 检测是否为圆角显示屏（有安全区域的设备） */
@supports (padding: env(safe-area-inset-top)) {
  .header {
    padding-top: calc(env(safe-area-inset-top) + 8px);
  }
}

/* 检测设备是否有底部安全区域 */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .footer {
    padding-bottom: env(safe-area-inset-bottom);
  }
}

/* 横竖屏切换 */
@media (orientation: portrait) {
  .layout { /* 竖屏适配 */ }
}
@media (orientation: landscape) {
  .layout { /* 横屏适配 */ }
}
```

## 实战：安全区域 CSS 工具类封装

```css
/* safe-area.css - 安全区域工具类 */

/* === 基础内边距 === */
.safe-top {
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
}

.safe-bottom {
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

.safe-left {
  padding-left: constant(safe-area-inset-left);
  padding-left: env(safe-area-inset-left);
}

.safe-right {
  padding-right: constant(safe-area-inset-right);
  padding-right: env(safe-area-inset-right);
}

.safe-x {
  padding-left: constant(safe-area-inset-left);
  padding-left: env(safe-area-inset-left);
  padding-right: constant(safe-area-inset-right);
  padding-right: env(safe-area-inset-right);
}

.safe-y {
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

.safe-all {
  padding: env(safe-area-inset-top) env(safe-area-inset-right) 
           env(safe-area-inset-bottom) env(safe-area-inset-left);
}

/* === 固定定位组件 === */
.fixed-top-safe {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
}

.fixed-bottom-safe {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

/* === CSS 变量方式（更灵活） === */
:root {
  --safe-top: env(safe-area-inset-top, 0px);
  --safe-right: env(safe-area-inset-right, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-left: env(safe-area-inset-left, 0px);

  /* 常用组合值 */
  --header-height: calc(44px + var(--safe-top));
  --tabbar-height: calc(50px + var(--safe-bottom));
}

/* 使用 CSS 变量 */
.app-header {
  height: var(--header-height);
  padding-top: var(--safe-top);
}

.app-tabbar {
  height: var(--tabbar-height);
  padding-bottom: var(--safe-bottom);
}

.app-content {
  padding-top: var(--header-height);
  padding-bottom: var(--tabbar-height);
  min-height: 100dvh;
}
```

```javascript
// JS 获取安全区域值（用于动态计算）
function getSafeAreaInsets() {
  const div = document.createElement('div');
  div.style.cssText = `
    position: fixed;
    top: env(safe-area-inset-top);
    right: env(safe-area-inset-right);
    bottom: env(safe-area-inset-bottom);
    left: env(safe-area-inset-left);
    pointer-events: none;
    visibility: hidden;
  `;
  document.body.appendChild(div);

  const rect = div.getBoundingClientRect();
  const insets = {
    top: rect.top,
    right: window.innerWidth - rect.right,
    bottom: window.innerHeight - rect.bottom,
    left: rect.left
  };

  document.body.removeChild(div);
  return insets;
}
```

## 面试高频题

### Q1：什么是安全区域？env() 函数怎么用？

**答：** 安全区域是屏幕上不会被刘海、圆角、底部横条遮挡的矩形区域。通过 `env(safe-area-inset-top/right/bottom/left)` 获取各方向的安全距离。前提是设置 `viewport-fit=cover`，否则 env() 值为 0。

### Q2：viewport-fit 属性的作用是什么？

**答：** `viewport-fit` 控制页面内容如何填充异形屏。`auto/contain` 时内容自动在安全区域内；`cover` 时内容覆盖全屏，开发者需要用 env() 自行处理避让。

### Q3：如何兼容旧版 iOS 的 constant() 和新版的 env()？

**答：** 同时写两行声明，浏览器会使用最后一个识别的值：
```css
padding: constant(safe-area-inset-bottom); /* iOS 11.0-11.1 */
padding: env(safe-area-inset-bottom);      /* iOS 11.2+ */
```

### Q4：底部固定按钮在 iPhone 上被横条遮挡怎么办？

**答：** 设置 `viewport-fit=cover`，然后给固定按钮添加 `padding-bottom: env(safe-area-inset-bottom)` 或使用 `calc()` 在原有间距基础上加上安全距离。确保按钮区域不与 Home Indicator 重叠。
