---
sidebar_position: 7
title: "编译优化原理"
difficulty: "hard"
tags: ["vue", "compiler", "optimization"]
---

# 编译优化原理

## Template 编译流程

```
Template 源码
    ↓ Parse（解析）
AST（抽象语法树）
    ↓ Transform（转换优化）
Transformed AST
    ↓ Generate（代码生成）
Render Function
```

## 静态提升（Hoist Static）

```javascript
// 编译前 Template
// <div>
//   <p>Static</p>
//   <span>{{ dynamic }}</span>
// </div>

// 编译后（Vue 3 优化）
const _hoisted_1 = /*#__PURE__*/ createElementVNode('p', null, 'Static');

function render(_ctx) {
  return createElementVNode('div', null, [
    _hoisted_1,                    // 静态节点只创建一次
    createElementVNode('span', null, toDisplayString(_ctx.dynamic), 1 /* TEXT */),
  ]);
}
```

## Patch Flags（补丁标记）

```javascript
// 编译器标记动态内容类型
export const PatchFlags = {
  TEXT:       1,       // 动态文本内容
  CLASS:      1 << 1,  // 动态 class
  STYLE:      1 << 2,  // 动态 style
  PROPS:      1 << 3,  // 动态非 class/style 属性
  FULL_PROPS: 1 << 4,  // 有动态 key 的属性
  NEED_HYDRATION: 1 << 5,
  STABLE_FRAGMENT: 1 << 6,
  KEYED_FRAGMENT: 1 << 7,
  UNKEYED_FRAGMENT: 1 << 8,
  NEED_PATCH: 1 << 9,  // 非 prop 的动态绑定（ref, directives）
  DYNAMIC_SLOTS: 1 << 10,
  // 组合标记
  HOISTED: -1,
  BAIL: -2,
};

// Diff 时根据标记跳过比较
if (patchFlag & PatchFlags.TEXT) {
  // 只比较文本内容
  if (oldNode.children !== newNode.children) {
    hostSetElementText(el, newNode.children);
  }
  return; // 跳过其他属性比较
}
```

## Block Tree（块树）

```javascript
// Block 是一个特殊的 VNode，会收集子节点中的动态节点
// 普通 VNode：需要递归遍历整棵树找动态节点
// Block：动态节点被扁平化收集，直接遍历

// Template
// <div>
//   <p>Static</p>
//   <span :class="dynamicClass">{{ text }}</span>
//   <img :src="dynamicSrc" />
// </div>

// Block 结构
{
  tag: 'div',
  dynamicChildren: [
    // 扁平化的动态节点数组，跳过静态节点
    { tag: 'span', patchFlag: 3 /* TEXT | CLASS */ },
    { tag: 'img', patchFlag: 4 /* PROPS */ },
  ],
}

// Diff 时只比较 dynamicChildren，无需遍历整棵树
```

## 事件缓存（Cache Handler）

```javascript
// 编译前
// <button @click="handleClick">Click</button>

// 编译后（无缓存）
createElementVNode('button', { onClick: _ctx.handleClick }, 'Click');

// 编译后（有缓存）
createElementVNode('button', {
  onClick: _cache[0] || (_cache[0] = (...args) => _ctx.handleClick(...args))
}, 'Click');

// 缓存后函数引用不变，避免子组件不必要的重渲染
```

## v-if 的 Block 管理

```javascript
// Template
// <div>
//   <div v-if="ok">A</div>
//   <div v-else>B</div>
// </div>

// 编译后
function render(_ctx) {
  return createElementVNode('div', null, [
    _ctx.ok
      ? (openBlock(), createElementBlock('div', { key: 0 }, 'A'))
      : (openBlock(), createElementBlock('div', { key: 1 }, 'B'))
  ]);
}

// v-if 的每个分支都是一个 Block
// 切换时整个 Block 替换，无需 diff 子节点
```

## v-for 的 Block 管理

```javascript
// Template
// <div>
//   <div v-for="item in list" :key="item.id">{{ item.name }}</div>
// </div>

// 编译后 — Fragment Block
function render(_ctx) {
  return createElementVNode('div', null, [
    (openBlock(true), createElementBlock(Fragment, null,
      renderList(_ctx.list, (item) => {
        return createElementBlock('div', { key: item.id }, toDisplayString(item.name), 1);
      }),
      128 /* KEYED_FRAGMENT */
    ))
  ]);
}

// 每个 v-for 项是带 key 的 Fragment
// 切换时使用最长递增子序列算法优化移动
```

## 编译器优化汇总

| 优化技术 | 效果 |
|---------|------|
| 静态提升 | 静态节点只创建一次 |
| Patch Flags | 跳过静态属性比较，只处理动态部分 |
| Block Tree | 扁平化动态节点，跳过静态子树遍历 |
| 事件缓存 | 保持函数引用稳定，减少子组件重渲染 |
| Block Fragment | v-if/v-for 切换时整块替换 |

## 关键点

- Vue 3 的编译优化是性能提升的核心原因
- Template 比 JSX 有更多优化空间（编译器可以静态分析）
- Patch Flags 是位运算标记，高效且可组合
- Block Tree 将 O(n) 的树遍历优化为 O(1) 的动态节点列表
- 这些优化对开发者透明，无需手动处理
