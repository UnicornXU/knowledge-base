---
title: "键盘导航与焦点管理"
sidebar_position: 2
tags: ["accessibility", "keyboard", "focus", "wcag"]
---

# 键盘导航与焦点管理

## 一、为什么键盘导航如此重要？

键盘可访问性是无障碍的**基石**。许多用户依赖键盘而非鼠标操作网页：

- **视觉障碍用户**：使用屏幕阅读器 + 键盘
- **运动障碍用户**：可能无法精确操作鼠标
- **高级用户**：键盘操作效率更高
- **临时性损伤**：手臂骨折、鼠标损坏等

> **WCAG 2.1 要求**：所有功能必须可通过键盘操作（2.1.1 Keyboard），且不得存在键盘陷阱（2.1.2 No Keyboard Trap）。

## 二、Tab 顺序与 tabindex

### 2.1 默认 Tab 顺序

浏览器按照 DOM 顺序依次聚焦**可聚焦元素**：

```
可聚焦元素包括：
<a href>、<button>、<input>、<select>、<textarea>
<details>、<summary>、<audio controls>、<video controls>
[tabindex="0"] 的元素
```

```html
<!-- 默认 Tab 顺序：从上到下，从左到右（DOM 顺序） -->
<input type="text" placeholder="第一个" />
<a href="/about">第二个</a>
<button>第三个</button>
```

### 2.2 tabindex 属性详解

| 值 | 行为 | 适用场景 |
|-----|------|----------|
| `tabindex="-1"` | 可通过 JS 聚焦，但不在 Tab 顺序中 | 编程式焦点管理（模态框、错误提示） |
| `tabindex="0"` | 加入 Tab 顺序，按 DOM 位置排列 | 自定义交互元素（div 按钮、自定义组件） |
| `tabindex="1+"` | **强制优先**于自然 Tab 顺序 | **强烈不推荐**，会破坏自然流程 |

```html
<!-- tabindex="0"：使非交互元素可聚焦 -->
<div tabindex="0" role="button" onclick="handleClick()">
  自定义按钮
</div>

<!-- tabindex="-1"：编程式聚焦 -->
<div id="error-summary" tabindex="-1" role="alert">
  表单有 3 个错误，请修正后重新提交
</div>
<script>
  // 提交失败时，将焦点移到错误摘要
  document.getElementById('error-summary').focus();
</script>

<!-- 不推荐：正 tabindex 打乱自然顺序 -->
<input tabindex="1" />  <!-- 永远第一个聚焦 -->
<input tabindex="2" />  <!-- 永远第二个聚焦 -->
```

### 2.3 Tab 顺序最佳实践

1. **保持 DOM 顺序与视觉顺序一致**
2. **避免使用正 tabindex**（`tabindex > 0`）
3. **合理使用 `tabindex="-1"`** 做编程式焦点管理
4. **测试方法**：按 Tab 键遍历整个页面，确认顺序合理

## 三、Focus Trap（焦点陷阱）

### 3.1 什么是 Focus Trap？

焦点陷阱将键盘焦点**限制在特定区域内**，防止用户通过 Tab 键跳出该区域。典型应用场景：

- 模态对话框（Modal / Dialog）
- 下拉菜单（Dropdown）
- 侧边抽屉（Drawer）

### 3.2 手动实现 Focus Trap

```html
<div id="modal" class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <h2 id="modal-title">确认操作</h2>
  <p>确定要删除这条记录吗？</p>
  <button id="cancel-btn">取消</button>
  <button id="confirm-btn">确认删除</button>
</div>

<script>
class FocusTrap {
  constructor(container) {
    this.container = container;
    this.focusableSelectors = [
      'a[href]', 'button:not([disabled])', 'input:not([disabled])',
      'select:not([disabled])', 'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',');
  }

  getFocusableElements() {
    return [...this.container.querySelectorAll(this.focusableSelectors)];
  }

  activate() {
    const focusable = this.getFocusableElements();
    if (focusable.length === 0) return;

    // 初始聚焦第一个元素
    focusable[0].focus();

    this.container.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus(); // Shift+Tab 从第一个跳到最后一个
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus(); // Tab 从最后一个跳到第一个
      }
    });
  }
}

// 使用
const trap = new FocusTrap(document.getElementById('modal'));
trap.activate();
</script>
```

### 3.3 使用 inert 属性（现代方案）

```html
<!-- inert 属性使元素及其子元素不可聚焦、不可交互 -->
<main inert>
  <!-- 主内容区域不可交互 -->
</main>
<div class="modal" role="dialog" aria-modal="true">
  <!-- 模态框内容可交互 -->
</div>
```

```javascript
// 打开模态框
function openModal() {
  const main = document.querySelector('main');
  const modal = document.getElementById('modal');

  main.inert = true;          // 主内容不可交互
  modal.hidden = false;        // 显示模态框
  modal.querySelector('button').focus(); // 聚焦第一个按钮
}

// 关闭模态框
function closeModal() {
  const main = document.querySelector('main');
  const modal = document.getElementById('modal');

  modal.hidden = true;
  main.inert = false;
  document.getElementById('trigger-btn').focus(); // 焦点回到触发按钮
}
```

## 四、Roving TabIndex 模式

### 4.1 什么是 Roving TabIndex？

Roving TabIndex 是一种在**一组元素中管理焦点**的模式。只有一个元素在 Tab 顺序中（`tabindex="0"`），其余元素设为 `tabindex="-1"`，通过方向键在组内切换。

### 4.2 适用场景

- 选项卡（Tab）
- 工具栏（Toolbar）
- 菜单（Menu）
- 单选按钮组（Radio Group）

### 4.3 实现示例：选项卡

```html
<div role="tablist" aria-label="示例选项卡">
  <button role="tab" id="tab-1" aria-selected="true" aria-controls="panel-1" tabindex="0">
    标签一
  </button>
  <button role="tab" id="tab-2" aria-selected="false" aria-controls="panel-2" tabindex="-1">
    标签二
  </button>
  <button role="tab" id="tab-3" aria-selected="false" aria-controls="panel-3" tabindex="-1">
    标签三
  </button>
</div>
<div role="tabpanel" id="panel-1" aria-labelledby="tab-1">内容一</div>
<div role="tabpanel" id="panel-2" aria-labelledby="tab-2" hidden>内容二</div>
<div role="tabpanel" id="panel-3" aria-labelledby="tab-3" hidden>内容三</div>

<script>
class TabList {
  constructor(container) {
    this.container = container;
    this.tabs = [...container.querySelectorAll('[role="tab"]')];
    this.panels = this.tabs.map(tab =>
      document.getElementById(tab.getAttribute('aria-controls'))
    );
    this.currentIndex = 0;

    this.container.addEventListener('keydown', this.handleKeyDown.bind(this));
    this.tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => this.selectTab(i));
    });
  }

  selectTab(index) {
    // 取消当前选中
    this.tabs[this.currentIndex].setAttribute('aria-selected', 'false');
    this.tabs[this.currentIndex].setAttribute('tabindex', '-1');
    this.panels[this.currentIndex].hidden = true;

    // 设置新选中
    this.currentIndex = index;
    this.tabs[index].setAttribute('aria-selected', 'true');
    this.tabs[index].setAttribute('tabindex', '0');
    this.tabs[index].focus();
    this.panels[index].hidden = false;
  }

  handleKeyDown(e) {
    let newIndex;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        newIndex = (this.currentIndex + 1) % this.tabs.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        newIndex = (this.currentIndex - 1 + this.tabs.length) % this.tabs.length;
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = this.tabs.length - 1;
        break;
      default:
        return;
    }
    e.preventDefault();
    this.selectTab(newIndex);
  }
}

new TabList(document.querySelector('[role="tablist"]'));
</script>
```

### 4.4 Roving TabIndex 的关键要点

| 要点 | 说明 |
|------|------|
| 只有活动项 `tabindex="0"` | 其余全部 `tabindex="-1"` |
| 方向键切换焦点 | 左右键（水平）或上下键（垂直） |
| Home/End 支持 | 跳到第一个/最后一个 |
| 焦点跟随选中 | 选中的项就是可 Tab 聚焦的项 |
| wrap 环绕 | 从最后一个按右键跳回第一个 |

## 五、快捷键设计

### 5.1 Access Key（访问键）

```html
<!-- accesskey 定义快捷键 -->
<button accesskey="s">保存 (Alt+S)</button>
<a href="/" accesskey="h">首页 (Alt+H)</a>
```

> **注意**：accesskey 的修饰键因浏览器/操作系统而异，且容易与浏览器快捷键冲突，**不推荐大规模使用**。

### 5.2 自定义键盘快捷键

```javascript
class KeyboardShortcutManager {
  constructor() {
    this.shortcuts = new Map();
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  register(shortcut, callback, description) {
    this.shortcuts.set(shortcut, { callback, description });
  }

  handleKeyDown(e) {
    // 构建快捷键字符串
    const parts = [];
    if (e.ctrlKey) parts.push('ctrl');
    if (e.altKey) parts.push('alt');
    if (e.shiftKey) parts.push('shift');
    if (e.metaKey) parts.push('meta');
    parts.push(e.key.toLowerCase());
    const shortcut = parts.join('+');

    const handler = this.shortcuts.get(shortcut);
    if (handler) {
      e.preventDefault();
      handler.callback();
    }
  }
}

// 使用示例
const shortcuts = new KeyboardShortcutManager();
shortcuts.register('ctrl+s', () => saveDocument(), '保存文档');
shortcuts.register('ctrl+/', () => showHelp(), '显示帮助');
shortcuts.register('escape', () => closeModal(), '关闭弹窗');
```

### 5.3 快捷键设计原则

1. **可发现性**：在 UI 中提示快捷键（tooltip、帮助文档）
2. **可关闭性**：允许用户禁用或自定义快捷键
3. **不冲突**：避免与浏览器、操作系统、屏幕阅读器快捷键冲突
4. **一致性**：遵循平台惯例（Ctrl+S 保存、Escape 关闭）

## 六、焦点管理最佳实践

### 6.1 焦点可见性

```css
/* 移除默认 outline 是最常见的无障碍错误 */
/* 错误 */
*:focus { outline: none; }

/* 正确：提供清晰的自定义焦点样式 */
*:focus-visible {
  outline: 3px solid #4A90D9;
  outline-offset: 2px;
  border-radius: 2px;
}

/* 仅在键盘导航时显示焦点环（:focus-visible） */
button:focus-visible {
  box-shadow: 0 0 0 3px rgba(74, 144, 217, 0.5);
}
```

### 6.2 焦点移动策略

| 场景 | 焦点移动到 |
|------|-----------|
| 打开模态框 | 模态框内第一个可聚焦元素 |
| 关闭模态框 | 回到触发按钮 |
| 删除列表项 | 下一个列表项或上一个 |
| 页面路由切换 | 新页面的 main 或 h1 |
| 表单提交失败 | 错误摘要或第一个错误字段 |

### 6.3 跳过导航链接

```html
<!-- Skip Link：允许键盘用户跳过重复的导航 -->
<a href="#main-content" class="skip-link">
  跳过导航，直接到主要内容
</a>
<nav>...</nav>
<main id="main-content" tabindex="-1">
  <!-- 主要内容 -->
</main>

<style>
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  padding: 8px 16px;
  background: #000;
  color: #fff;
  z-index: 100;
  transition: top 0.2s;
}

.skip-link:focus {
  top: 0; /* 聚焦时显示 */
}
</style>
```

## 七、面试要点

| 问题 | 要点 |
|------|------|
| `tabindex` 的三个值分别是什么行为？ | -1（编程聚焦）、0（自然顺序）、1+（强制优先，不推荐） |
| 什么是 Focus Trap？何时使用？ | 将焦点限制在区域内，用于模态框、下拉菜单 |
| 什么是 Roving TabIndex？ | 组内只有一个元素在 Tab 顺序，方向键切换焦点 |
| 如何实现 Skip Link？ | 锚点链接 + 视觉隐藏 + 聚焦时显示 |
| `:focus` 和 `:focus-visible` 的区别？ | focus-visible 仅在键盘导航时触发，鼠标点击不触发 |
| 为什么不能 `outline: none`？ | 破坏键盘用户的焦点可见性，违反 WCAG 2.4.7 |
