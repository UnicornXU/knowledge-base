---
title: "ARIA 规范详解"
sidebar_position: 1
tags: ["accessibility", "aria", "wcag"]
---

# ARIA 规范详解

## 一、ARIA 是什么？

ARIA（Accessible Rich Internet Applications）是一套由 W3C 制定的属性规范，用于增强 Web 内容和 Web 应用对残障用户的可访问性。它通过为 HTML 元素添加**语义信息**，帮助辅助技术（如屏幕阅读器）理解页面结构和交互逻辑。

### 核心原则：第一规则

> **"No ARIA is better than bad ARIA"**（没有 ARIA 比错误的 ARIA 更好）

使用 ARIA 的第一规则是：**如果能用原生 HTML 元素实现，就不要用 ARIA**。原生元素自带完整的无障碍语义和交互行为。

```html
<!-- 好：使用原生 button -->
<button>提交</button>

<!-- 差：用 div 模拟按钮，缺少原生语义 -->
<div class="btn" onclick="submit()">提交</div>

<!-- 可接受：不得已时用 ARIA 补充 -->
<div role="button" tabindex="0" aria-label="提交"
     onclick="submit()" onkeydown="handleKey(event)">提交</div>
```

## 二、ARIA 角色（Role）

角色定义了元素的**类型**或**用途**，告诉辅助技术"这个元素是什么"。

### 2.1 Widget 角色

用于定义交互型 UI 组件：

```html
<!-- 自定义选项卡 -->
<div role="tablist">
  <button role="tab" aria-selected="true" aria-controls="panel-1">标签一</button>
  <button role="tab" aria-selected="false" aria-controls="panel-2">标签二</button>
</div>
<div role="tabpanel" id="panel-1">内容一</div>
<div role="tabpanel" id="panel-2" hidden>内容二</div>
```

| 角色 | 用途 | 原生替代 |
|------|------|----------|
| `button` | 按钮 | `<button>` |
| `checkbox` | 复选框 | `<input type="checkbox">` |
| `radio` | 单选按钮 | `<input type="radio">` |
| `tab` / `tablist` / `tabpanel` | 选项卡 | 无原生替代 |
| `dialog` | 对话框 | `<dialog>` |
| `slider` | 滑块 | `<input type="range">` |
| `menu` / `menuitem` | 菜单 | 无原生替代 |
| `tree` / `treeitem` | 树形结构 | 无原生替代 |

### 2.2 文档结构角色

用于描述页面结构：

```html
<header role="banner">网站头部</header>
<nav role="navigation">导航</nav>
<main role="main">主要内容</main>
<aside role="complementary">侧边栏</aside>
<footer role="contentinfo">页脚</footer>
```

> **提示**：使用 HTML5 语义标签（如 `<header>`、`<nav>`、`<main>`）时，**不需要**重复添加对应的 landmark role，浏览器会自动隐式设置。

### 2.3 状态与属性角色

| 角色 | 用途 |
|------|------|
| `alert` | 重要提示信息 |
| `log` | 日志区域 |
| `status` | 状态消息 |
| `timer` | 计时器 |
| `progressbar` | 进度条 |
| `tooltip` | 工具提示 |

## 三、ARIA 属性（aria-*）

ARIA 属性为元素提供**额外的语义信息**，补充 HTML 属性无法表达的含义。

### 3.1 标签与描述

```html
<!-- aria-label：提供不可见的标签 -->
<button aria-label="关闭对话框">
  <svg><!-- X 图标 --></svg>
</button>

<!-- aria-labelledby：引用其他元素作为标签 -->
<h2 id="dialog-title">确认删除</h2>
<div role="dialog" aria-labelledby="dialog-title">
  确定要删除这条记录吗？
</div>

<!-- aria-describedby：提供额外描述 -->
<input type="password" aria-describedby="pwd-hint" />
<span id="pwd-hint">密码至少 8 位，包含大小写字母和数字</span>
```

### 3.2 关系属性

```html
<!-- aria-controls：控制关系 -->
<button aria-controls="dropdown-menu" aria-expanded="false">
  菜单
</button>
<ul id="dropdown-menu" hidden>
  <li>选项一</li>
  <li>选项二</li>
</ul>

<!-- aria-owns：DOM 之外的父子关系 -->
<div aria-owns="child1 child2">
  <!-- 实际子元素可能在 DOM 的其他位置 -->
</div>

<!-- aria-flowto：自定义阅读顺序 -->
<div aria-flowto="section3">第一部分</div>
<div id="section2">第二部分</div>
<div id="section3">第三部分</div>
```

### 3.3 实时区域（Live Region）

Live Region 用于通知屏幕阅读器**动态变化的内容**，无需用户聚焦即可播报。

```html
<!-- aria-live：定义播报优先级 -->
<div aria-live="polite">您的购物车已更新，共 3 件商品</div>

<!-- aria-atomic：是否播报整个区域 -->
<div aria-live="polite" aria-atomic="true">
  当前时间：<span id="clock">14:30</span>
</div>

<!-- role="alert"：等同于 aria-live="assertive" -->
<div role="alert">表单提交失败，请检查输入</div>

<!-- role="status"：等同于 aria-live="polite" -->
<div role="status">搜索结果：共 42 条</div>
```

**Live Region 播报优先级：**

| 优先级 | 值 | 行为 | 适用场景 |
|--------|-----|------|----------|
| 高 | `assertive` | 立即打断当前播报 | 错误提示、紧急通知 |
| 低 | `polite` | 等当前播报结束后再说 | 状态更新、搜索结果 |
| 无 | `off` | 不播报 | 仅视觉更新 |

### 3.4 ARIA 状态

```html
<!-- aria-expanded：展开/折叠状态 -->
<button aria-expanded="false" aria-controls="menu1">
  展开菜单
</button>

<!-- aria-selected：选中状态 -->
<div role="tablist">
  <div role="tab" aria-selected="true">Tab 1</div>
  <div role="tab" aria-selected="false">Tab 2</div>
</div>

<!-- aria-checked：复选/单选状态 -->
<div role="checkbox" aria-checked="true" tabindex="0">同意条款</div>

<!-- aria-disabled：禁用状态（仍可见但不可操作） -->
<button aria-disabled="true">暂不可用</button>

<!-- aria-hidden：对辅助技术隐藏 -->
<span aria-hidden="true">🎉</span>

<!-- aria-invalid：输入验证状态 -->
<input aria-invalid="true" aria-errormessage="err1" />
<span id="err1" role="alert">请输入有效的邮箱地址</span>
```

## 四、ARIA 最佳实践

### 4.1 五条规则

1. **优先使用原生 HTML**：`<button>` 优于 `role="button"`
2. **不要改变原生语义**：不要在 `<h2>` 上加 `role="tab"`
3. **所有交互元素必须可键盘操作**：`role="button"` 必须支持 Enter/Space
4. **不要在可聚焦元素上使用 `role="presentation"`**
5. **所有交互元素必须有可访问名称**：`aria-label` 或 `aria-labelledby`

### 4.2 常见错误

```html
<!-- 错误：重复角色 -->
<button role="button">提交</button>  <!-- button 已有隐式 role -->

<!-- 错误：aria-hidden 遮挡可聚焦元素 -->
<div aria-hidden="true">
  <a href="/link">这个链接对屏幕阅读器不可见但仍可聚焦</a>
</div>

<!-- 错误：缺少键盘支持 -->
<div role="button" onclick="doSomething()">
  点击我（键盘用户无法操作）
</div>

<!-- 正确：完整的可访问按钮 -->
<div role="button" tabindex="0"
     onclick="doSomething()"
     onkeydown="if(event.key==='Enter'||event.key===' '){doSomething();event.preventDefault()}">
  点击我
</div>
```

### 4.3 自定义组件无障碍实现模式

```html
<!-- 模式：可折叠面板（Accordion） -->
<div class="accordion">
  <h3>
    <button aria-expanded="true" aria-controls="panel-content">
      常见问题
      <span aria-hidden="true" class="icon">▼</span>
    </button>
  </h3>
  <div id="panel-content" role="region" aria-labelledby="panel-header">
    <p>这里是回答内容...</p>
  </div>
</div>
```

## 五、面试要点

| 问题 | 要点 |
|------|------|
| ARIA 的第一规则是什么？ | 能用原生 HTML 就不用 ARIA |
| `aria-label` 和 `aria-labelledby` 的区别？ | 直接文本 vs 引用其他元素 |
| `aria-live="polite"` 和 `assertive` 的区别？ | 播报优先级：低 vs 高 |
| `aria-hidden="true"` 与 `display: none` 的区别？ | aria-hidden 只对辅助技术隐藏，仍可见；display: none 对所有人隐藏 |
| 什么时候需要 ARIA？ | 自定义组件（选项卡、树形菜单等）无原生 HTML 对应时 |
