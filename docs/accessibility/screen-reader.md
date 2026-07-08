---
title: "屏幕阅读器适配"
sidebar_position: 3
tags: ["accessibility", "screen-reader", "wcag", "aria"]
---

# 屏幕阅读器适配

## 一、什么是屏幕阅读器？

屏幕阅读器（Screen Reader）是一种辅助技术软件，将屏幕上的内容转换为**语音**或**盲文**输出，帮助视觉障碍用户使用计算机和互联网。

### 主流屏幕阅读器

| 阅读器 | 平台 | 费用 | 市场份额 |
|--------|------|------|----------|
| **NVDA** | Windows | 免费开源 | ~40% |
| **JAWS** | Windows | 付费（约 $1000） | ~35% |
| **VoiceOver** | macOS / iOS | 系统内置 | ~15% |
| **TalkBack** | Android | 系统内置 | ~8% |
| **Narrator** | Windows | 系统内置 | 较低 |

> 面试中，**NVDA + VoiceOver** 是最常被提及的组合，覆盖了 Windows 和 macOS 两大平台。

## 二、语义化 HTML：屏幕阅读器的基础

### 2.1 为什么语义化如此重要？

屏幕阅读器依赖 HTML 的**语义信息**来理解和传达页面结构。语义化 HTML 是无障碍的根基，无需额外 ARIA 就能提供完整的无障碍体验。

```html
<!-- 差：无语义的 div 堆叠 -->
<div class="header">
  <div class="nav">
    <div class="link" onclick="go('/home')">首页</div>
  </div>
</div>
<div class="main">
  <div class="title">文章标题</div>
  <div class="content">文章内容...</div>
</div>

<!-- 好：语义化 HTML -->
<header>
  <nav aria-label="主导航">
    <a href="/home">首页</a>
  </nav>
</header>
<main>
  <h1>文章标题</h1>
  <p>文章内容...</p>
</main>
```

### 2.2 语义化元素速查表

| 元素 | 语义 | 屏幕阅读器播报 |
|------|------|----------------|
| `<header>` | 页头 / 区域头部 | "banner" landmark |
| `<nav>` | 导航 | "navigation" landmark |
| `<main>` | 主要内容 | "main" landmark |
| `<aside>` | 侧边栏 | "complementary" landmark |
| `<footer>` | 页脚 | "contentinfo" landmark |
| `<section>` | 区域 | "region" + 可访问名称 |
| `<article>` | 独立文章 | "article" |
| `<h1>`-`<h6>` | 标题 | "heading level 1-6" |
| `<ul>` / `<ol>` | 列表 | "list, N items" |
| `<table>` | 表格 | 表格结构信息 |
| `<button>` | 按钮 | "button" |
| `<a href>` | 链接 | "link" |
| `<input type="...">` | 输入控件 | 控件类型 + 标签 |

### 2.3 标题层级

屏幕阅读器用户经常通过**标题导航**页面（类似目录跳转）：

```html
<!-- 正确：标题层级不跳级 -->
<h1>网站标题</h1>
  <h2>文章标题</h2>
    <h3>第一章</h3>
    <h3>第二章</h3>
  <h2>相关文章</h2>

<!-- 错误：从 h1 跳到 h4 -->
<h1>网站标题</h1>
<h4>文章标题</h4>  <!-- 跳级！屏幕阅读器用户会困惑 -->
```

### 2.4 表格无障碍

```html
<table>
  <caption>2024 年季度销售数据</caption>
  <thead>
    <tr>
      <th scope="col">季度</th>
      <th scope="col">销售额</th>
      <th scope="col">增长率</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Q1</th>
      <td>120 万</td>
      <td>+15%</td>
    </tr>
    <tr>
      <th scope="row">Q2</th>
      <td>150 万</td>
      <td>+25%</td>
    </tr>
  </tbody>
</table>
```

**关键要点：**
- `<caption>` 提供表格标题
- `<th scope="col">` 标记列标题
- `<th scope="row">` 标记行标题
- 屏幕阅读器会自动关联数据单元格与标题

### 2.5 表单无障碍

```html
<form>
  <!-- 关联 label 和 input -->
  <label for="email">邮箱地址</label>
  <input type="email" id="email" name="email"
         aria-required="true"
         aria-describedby="email-hint email-error" />
  <span id="email-hint">我们不会分享你的邮箱</span>
  <span id="email-error" role="alert" aria-live="assertive">
    <!-- 错误信息动态插入 -->
  </span>

  <!-- 分组相关控件 -->
  <fieldset>
    <legend>配送方式</legend>
    <label>
      <input type="radio" name="shipping" value="standard" /> 标准配送
    </label>
    <label>
      <input type="radio" name="shipping" value="express" /> 加急配送
    </label>
  </fieldset>

  <button type="submit">提交订单</button>
</form>
```

## 三、隐藏元素策略

在无障碍开发中，"对谁隐藏"是一个常见需求。以下是不同的隐藏策略：

### 3.1 隐藏方式对比

| 方式 | 视觉 | DOM | 辅助技术 | Tab 顺序 |
|------|------|-----|----------|----------|
| `display: none` | 隐藏 | 移除布局 | 隐藏 | 不可聚焦 |
| `visibility: hidden` | 隐藏 | 保留空间 | 隐藏 | 不可聚焦 |
| `opacity: 0` | 透明 | 保留 | **可见** | 可聚焦 |
| `clip-path: inset(50%)` | 隐藏 | 保留 | **可见** | 可聚焦 |
| `aria-hidden="true"` | 可见 | 保留 | **隐藏** | 可聚焦 |
| `<details hidden>` | 隐藏 | 移除 | 隐藏 | 不可聚焦 |

### 3.2 视觉隐藏但辅助技术可见（SR-Only）

```css
/* 经典 sr-only 类：视觉隐藏，屏幕阅读器可读 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* 现代方案（裁剪方式） */
.sr-only {
  clip-path: inset(50%);
  width: 1px;
  height: 1px;
  overflow: hidden;
  position: absolute;
  white-space: nowrap;
}
```

**使用场景：**

```html
<!-- 为图标按钮提供屏幕阅读器可读的标签 -->
<button>
  <svg aria-hidden="true"><!-- 搜索图标 --></svg>
  <span class="sr-only">搜索</span>
</button>

<!-- 为视觉用户省略"跳转到"等冗余文本 -->
<nav>
  <a href="/about">
    关于我们
    <span class="sr-only">页面</span>
  </a>
</nav>

<!-- 提供额外的上下文信息 -->
<span aria-hidden="true">3</span>
<span class="sr-only">购物车中有 3 件商品</span>
```

### 3.3 辅助技术隐藏但视觉可见

```html
<!-- aria-hidden="true"：纯装饰性内容 -->
<span aria-hidden="true">🎉🎊</span>

<!-- 装饰性图标 -->
<i class="icon-star" aria-hidden="true"></i>

<!-- 重复文本（避免屏幕阅读器重复播报） -->
<button>
  <span class="sr-only">播放</span>
  <svg aria-hidden="true">▶</svg>
  <span aria-hidden="true">播放</span>  <!-- 视觉文本，AT 已通过 sr-only 获取 -->
</button>
```

### 3.4 对所有人都隐藏

```html
<!-- 完全隐藏 -->
<div hidden>这个元素对所有人不可见</div>

<!-- 条件隐藏 -->
<div aria-hidden="true" style="display: none;">
  这个元素已从 DOM 和辅助技术中移除
</div>
```

## 四、屏幕阅读器测试指南

### 4.1 VoiceOver 测试（macOS / iOS）

**常用快捷键：**

| 快捷键 | 功能 |
|--------|------|
| `VO + →` / `VO + ←` | 逐个元素导航 |
| `VO + Space` | 激活当前元素 |
| `VO + U` | 打开 Rotor（快速导航菜单） |
| `VO + H` | 跳到下一个标题 |
| `VO + Cmd + H` | 跳到上一个标题 |
| `VO + Cmd + L` | 跳到下一个链接 |
| `VO + Cmd + T` | 跳到下一个表格 |

> `VO` 默认是 `Ctrl + Option`。

**测试流程：**
1. 启用 VoiceOver（`Cmd + F5`）
2. 用 `VO + →` 逐元素浏览页面
3. 用 Rotor（`VO + U`）检查标题、链接、Landmark 结构
4. 尝试用键盘完成核心任务（表单提交、导航切换等）

### 4.2 NVDA 测试（Windows）

**常用快捷键：**

| 快捷键 | 功能 |
|--------|------|
| `↓` / `↑` | 逐行浏览 |
| `Tab` | 跳到下一个可聚焦元素 |
| `H` | 跳到下一个标题 |
| `K` | 跳到下一个链接 |
| `T` | 跳到下一个表格 |
| `D` | 跳到下一个 Landmark |
| `NVDA + Space` | 切换浏览/焦点模式 |
| `NVDA + F7` | 元素列表（标题、链接、Landmark） |

> NVDA 的"浏览模式"类似鼠标浏览，"焦点模式"用于表单交互。

### 4.3 JAWS 测试（Windows）

**常用快捷键：**

| 快捷键 | 功能 |
|--------|------|
| `↓` / `↑` | 逐行浏览 |
| `Tab` | 跳到下一个可聚焦元素 |
| `H` | 跳到下一个标题 |
| `Insert + F3` | 打开虚拟光标菜单 |
| `Insert + F6` | 标题列表 |
| `Insert + F7` | 链接列表 |
| `Insert + Ctrl + T` | 表格列表 |

### 4.4 测试清单

```
屏幕阅读器测试清单：

结构与导航
  □ 页面标题有意义（<title>）
  □ 标题层级正确（h1-h6 不跳级）
  □ Landmark 区域可识别（nav、main、aside 等）
  □ Skip Link 可用且有效

交互组件
  □ 按钮播报为"button"
  □ 链接播报为"link"且目标清晰
  □ 表单控件有关联的 label
  □ 错误信息通过 Live Region 播报
  □ 自定义组件的角色和状态正确

动态内容
  □ 路由切换时焦点移动到新内容
  □ 加载状态有 Live Region 提示
  □ 模态框打开时焦点进入，关闭时焦点恢复
  □ 动态插入的内容通过 Live Region 通知

图片与媒体
  □ 信息性图片有替代文本
  □ 装饰性图片标记为 aria-hidden
  □ 视频有字幕和音频描述
  □ 图表有文本替代
```

## 五、最佳实践

### 5.1 可访问名称计算

屏幕阅读器为每个元素计算一个**可访问名称**，优先级如下：

```
1. aria-labelledby（最高优先级）
2. aria-label
3. 原生 label（<label for="...">）
4. 元素内容（如 button 内的文本）
5. title 属性
6. placeholder（最低优先级）
```

```html
<!-- 示例：不同命名方式 -->
<button aria-labelledby="btn-text">     <!-- 名称 = btn-text 元素的文本 -->
  <span id="btn-text">提交表单</span>
</button>

<button aria-label="提交表单并返回首页">  <!-- 名称 = aria-label 值 -->
  提交
</button>

<input type="text" title="搜索商品" />  <!-- 名称 = title 值 -->
```

### 5.2 常见屏幕阅读器问题与解决方案

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 图标按钮无名称 | 缺少文本 | 添加 `aria-label` 或 `sr-only` 文本 |
| 动态内容不播报 | 缺少 Live Region | 添加 `aria-live` 或 `role="alert"` |
| 重复播报 | 冗余文本 | 使用 `aria-hidden` 去重 |
| 自定义控件无角色 | 缺少 ARIA role | 添加正确的 `role` |
| 焦点丢失 | 路由切换后未管理焦点 | 路由切换时聚焦新内容 |

### 5.3 面试高频场景

**场景一：实现一个可访问的模态框**

```html
<!-- 触发按钮 -->
<button id="open-btn" aria-haspopup="dialog">打开对话框</button>

<!-- 模态框 -->
<div id="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" hidden>
  <h2 id="modal-title">确认删除</h2>
  <p>此操作不可撤销，确定要删除吗？</p>
  <button id="cancel">取消</button>
  <button id="confirm">确认删除</button>
</div>

<script>
const openBtn = document.getElementById('open-btn');
const modal = document.getElementById('modal');
const cancel = document.getElementById('cancel');

openBtn.addEventListener('click', () => {
  modal.hidden = false;
  cancel.focus(); // 焦点进入模态框
});

cancel.addEventListener('click', () => {
  modal.hidden = true;
  openBtn.focus(); // 焦点回到触发按钮
});
</script>
```

**场景二：实现可访问的 Toast 通知**

```html
<div id="toast-container" aria-live="polite" aria-atomic="true">
  <!-- 动态插入的 Toast 会被屏幕阅读器播报 -->
</div>

<script>
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.className = `toast toast-${type}`;
  container.appendChild(toast);

  // 3 秒后移除
  setTimeout(() => toast.remove(), 3000);
}

showToast('文件保存成功');
</script>
```

## 六、面试要点

| 问题 | 要点 |
|------|------|
| 语义化 HTML 对无障碍的意义？ | 提供原生角色、状态、名称，屏幕阅读器可自动识别 |
| `aria-hidden` 与 `sr-only` 的区别？ | aria-hidden 隐藏 AT 可见性；sr-only 隐藏视觉但保留 AT |
| 为什么要避免跳级标题？ | 屏幕阅读器用户依赖标题层级导航，跳级破坏结构 |
| `aria-live` 的三个值？ | off（不播报）、polite（排队播报）、assertive（立即播报） |
| 如何测试无障碍？ | 自动化工具（axe、Lighthouse）+ 屏幕阅读器手动测试 + 键盘测试 |
| 可访问名称的计算优先级？ | aria-labelledby > aria-label > label > 内容 > title > placeholder |
