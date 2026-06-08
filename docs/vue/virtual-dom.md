---
sidebar_position: 3
title: "虚拟 DOM 与 Diff 算法"
difficulty: "hard"
tags: ["vue", "virtual-dom", "diff"]
---

# 虚拟 DOM 与 Diff 算法

## 什么是虚拟 DOM？

虚拟 DOM 是用 JavaScript 对象描述真实 DOM 结构的轻量表示。

```javascript
// 真实 DOM
<div class="container">
  <p>Hello</p>
</div>

// 虚拟 DOM
{
  tag: 'div',
  props: { class: 'container' },
  children: [
    { tag: 'p', props: null, children: ['Hello'] }
  ]
}
```

## Vue 3 的 Diff 算法优化

### 1. 静态提升（Static Hoisting）

```javascript
// 编译前
function render() {
  return h('div', [
    h('p', 'Hello'),
    h('span', dynamic),
  ]);
}

// 编译后（静态节点被提升）
const _hoisted_1 = h('p', 'Hello'); // 只创建一次

function render() {
  return h('div', [
    _hoisted_1,
    h('span', dynamic),
  ]);
}
```

### 2. 补丁标记（Patch Flags）

```javascript
// 编译器标记动态内容类型
h('div', [
  h('p', 'static'),           // 无标记，跳过比较
  h('span', dynamicText, 1),  // TEXT 标记
  h('span', { class: dynamicClass }, 2), // CLASS 标记
  h('span', { style: dynamicStyle }, 4), // STYLE 标记
]);
```

### 3. 最长递增子序列

```javascript
// Vue 3 的双端 + 最长递增子序列算法
function patchKeyedChildren(c1, c2, container) {
  // 1. 头部比较
  // 2. 尾部比较
  // 3. 处理新增节点
  // 4. 处理删除节点
  // 5. 中间乱序部分：使用最长递增子序列优化移动
}
```

## Vue 3 vs Vue 2 Diff 算法

| 特性 | Vue 2 | Vue 3 |
|------|-------|-------|
| 比较策略 | 双端比较 | 最长递增子序列 |
| 静态节点 | 跳过（有限） | 静态提升 + 树打平 |
| 编译优化 | 无 | Patch Flags |
| 事件缓存 | 无 | 事件缓存 |

## Template vs JSX 编译优化

```vue
<!-- Template（编译器可以分析静态结构） -->
<template>
  <div>
    <p>Static</p>
    <span>{{ dynamic }}</span>
  </div>
</template>

<!-- JSX（编译器无法分析，需要运行时 diff） -->
<script setup>
const vnode = (
  <div>
    <p>Static</p>
    <span>{dynamic}</span>
  </div>
);
</script>
```

## 关键点

- 虚拟 DOM 的核心价值：声明式编程 + 最小化 DOM 操作
- Vue 3 通过编译时优化减少了运行时比较的工作量
- Patch Flags 让 diff 算法可以跳过静态内容
- 最长递增子序列算法减少了节点移动次数
- Template 比 JSX 有更多的编译优化空间
