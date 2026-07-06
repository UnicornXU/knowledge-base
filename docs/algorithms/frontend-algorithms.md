---
sidebar_position: 5
title: 前端算法实战
difficulty: hard
tags:
  - algorithms
  - frontend
  - diff-algorithm
  - ast
  - lru
  - topological-sort
---

# 🖥️ 前端算法实战

> **"算法不是纸上谈兵"** —— 前端框架和工具链中大量使用了经典算法，理解它们能帮你写出更好的代码。

## 一、虚拟 DOM Diff 算法

### 1.1 为什么需要 Diff？

```
暴力对比 vs Diff 算法
═══════════════════════════════════════════════════════

暴力对比：O(n³) —— 1000 个节点需要 10 亿次比较 ❌
Diff 算法：O(n)   —— 1000 个节点只需 1000 次比较 ✅

Diff 的策略：
1. 只比较同层节点（不跨层级移动）
2. 同类型节点才深入比较
3. 用 key 标识同一节点
```

### 1.2 React Diff 核心逻辑

```js
// 简化的 React Diff 算法
function reconcileChildren(parentFiber, newChildren) {
  let oldFiber = parentFiber.child;
  let index = 0;

  // 单节点 diff
  if (!Array.isArray(newChildren)) {
    if (oldFiber && sameType(oldFiber, newChildren)) {
      // 类型相同，更新
      return { ...oldFiber, props: newChildren.props };
    } else {
      // 类型不同，替换
      return createFiber(newChildren);
    }
  }

  // 多节点 diff
  const existingChildren = mapRemainingChildren(oldFiber);
  let lastPlacedIndex = 0;

  for (; index < newChildren.length; index++) {
    const newChild = newChildren[index];
    const existing = existingChildren.get(newChild.key);

    if (existing && sameType(existing, newChild)) {
      // 复用：类型和 key 都相同
      existingChildren.delete(newChild.key);
      lastPlacedIndex = placeChild(existing, lastPlacedIndex, index);
    } else {
      // 新建
      const fiber = createFiber(newChild);
      placeChild(fiber, lastPlacedIndex, index);
    }
  }

  // 删除剩余的旧节点
  existingChildren.forEach(child => deleteChild(child));
}
```

### 1.3 Vue Diff 核心逻辑

```js
// 简化的 Vue3 Diff（双端 + 最长递增子序列）
function patchKeyedChildren(c1, c2, container) {
  let i = 0;
  let e1 = c1.length - 1;
  let e2 = c2.length - 1;

  // 1. 从头部开始对比
  while (i <= e1 && i <= e2 && sameVNode(c1[i], c2[i])) {
    patch(c1[i], c2[i]);
    i++;
  }

  // 2. 从尾部开始对比
  while (i <= e1 && i <= e2 && sameVNode(c1[e1], c2[e2])) {
    patch(c1[e1], c2[e2]);
    e1--;
    e2--;
  }

  // 3. 新节点比旧节点多 → 插入
  if (i > e1) {
    while (i <= e2) {
      insert(c2[i++]);
    }
  }
  // 4. 旧节点比新节点多 → 删除
  else if (i > e2) {
    while (i <= e1) {
      remove(c1[i++]);
    }
  }
  // 5. 中间乱序部分
  else {
    const keyToNewIndex = new Map();
    for (let j = i; j <= e2; j++) {
      keyToNewIndex.set(c2[j].key, j);
    }

    // 建立映射 + patch
    const newIndexToOld = new Array(e2 - i + 1).fill(-1);
    for (let j = i; j <= e1; j++) {
      const newIndex = keyToNewIndex.get(c1[j].key);
      if (newIndex !== undefined) {
        patch(c1[j], c2[newIndex]);
        newIndexToOld[newIndex - i] = j;
      } else {
        remove(c1[j]);
      }
    }

    // 最长递增子序列优化移动
    const increasing = lis(newIndexToOld);
    let j = increasing.length - 1;
    for (let k = newIndexToOld.length - 1; k >= 0; k--) {
      if (newIndexToOld[k] === -1) {
        insert(c2[k + i]);
      } else if (k !== increasing[j]) {
        move(c2[k + i]);
      } else {
        j--;
      }
    }
  }
}
```

## 二、AST（抽象语法树）

### 2.1 AST 结构

```
AST 示例
═══════════════════════════════════════════════════════

代码: const x = 1 + 2

AST:
{
  type: "Program",
  body: [{
    type: "VariableDeclaration",
    declarations: [{
      type: "VariableDeclarator",
      id: { type: "Identifier", name: "x" },
      init: {
        type: "BinaryExpression",
        operator: "+",
        left: { type: "Literal", value: 1 },
        right: { type: "Literal", value: 2 }
      }
    }],
    kind: "const"
  }]
}
```

### 2.2 简易 Parser 实现

```js
// 词法分析器（Tokenizer）
function tokenize(code) {
  const tokens = [];
  let i = 0;

  while (i < code.length) {
    // 跳过空白
    if (/\s/.test(code[i])) { i++; continue; }

    // 数字
    if (/\d/.test(code[i])) {
      let num = '';
      while (i < code.length && /\d/.test(code[i])) num += code[i++];
      tokens.push({ type: 'NUMBER', value: Number(num) });
      continue;
    }

    // 运算符
    if ('+-*/'.includes(code[i])) {
      tokens.push({ type: 'OPERATOR', value: code[i++] });
      continue;
    }

    // 标识符
    if (/[a-zA-Z_$]/.test(code[i])) {
      let id = '';
      while (i < code.length && /[a-zA-Z0-9_$]/.test(code[i])) id += code[i++];
      tokens.push({ type: 'IDENTIFIER', value: id });
      continue;
    }

    i++;
  }

  return tokens;
}

// 语法分析器（Parser）—— 简化的表达式解析
function parse(tokens) {
  let pos = 0;

  function parseExpression() {
    let left = parsePrimary();
    while (pos < tokens.length && tokens[pos].type === 'OPERATOR') {
      const op = tokens[pos++].value;
      const right = parsePrimary();
      left = { type: 'BinaryExpression', operator: op, left, right };
    }
    return left;
  }

  function parsePrimary() {
    const token = tokens[pos++];
    if (token.type === 'NUMBER') {
      return { type: 'Literal', value: token.value };
    }
    if (token.type === 'IDENTIFIER') {
      return { type: 'Identifier', name: token.value };
    }
  }

  return { type: 'Program', body: [parseExpression()] };
}
```

### 2.3 AST 的应用场景

```
AST 在前端中的应用
═══════════════════════════════════════════════════════

1. Babel 转译
   ES6+ 代码 → AST → 转换 → ES5 AST → 生成代码

2. ESLint 检查
   代码 → AST → 遵循规则的遍历检查 → 报告问题

3. Prettier 格式化
   代码 → AST → 重新生成格式化后的代码

4. Webpack/Vite 打包
   代码 → AST → 分析 import/export → 依赖图

5. TypeScript 类型检查
   TS 代码 → AST → 类型推断 → 报告类型错误

6. 模板编译（Vue/React）
   模板 → AST → 优化 → 生成渲染函数
```

## 三、拓扑排序

### 3.1 应用场景

```
拓扑排序 —— 处理有向无环图(DAG)的依赖关系
═══════════════════════════════════════════════════════

依赖关系：
  module-a → module-b → module-d
  module-a → module-c → module-d
  module-b → module-e

拓扑排序结果（可能的解之一）：
  a → c → b → e → d

前端中的应用：
1. Webpack 模块依赖排序
2. Monorepo 包的构建顺序
3. 任务调度（先编译依赖项）
4. TypeScript 项目引用
```

### 3.2 Kahn 算法实现

```js
function topologicalSort(graph) {
  // 计算每个节点的入度
  const inDegree = new Map();
  for (const node of Object.keys(graph)) {
    if (!inDegree.has(node)) inDegree.set(node, 0);
    for (const neighbor of graph[node]) {
      inDegree.set(neighbor, (inDegree.get(neighbor) || 0) + 1);
    }
  }

  // 将入度为 0 的节点入队
  const queue = [];
  for (const [node, degree] of inDegree) {
    if (degree === 0) queue.push(node);
  }

  const result = [];
  while (queue.length) {
    const node = queue.shift();
    result.push(node);

    for (const neighbor of graph[node] || []) {
      inDegree.set(neighbor, inDegree.get(neighbor) - 1);
      if (inDegree.get(neighbor) === 0) {
        queue.push(neighbor);
      }
    }
  }

  // 检测环
  if (result.length !== Object.keys(graph).length) {
    throw new Error('存在循环依赖！');
  }

  return result;
}

// 示例：Monorepo 构建顺序
const packages = {
  'core': ['utils'],
  'utils': [],
  'components': ['core', 'utils'],
  'app': ['components', 'core'],
};

console.log(topologicalSort(packages));
// ['utils', 'core', 'components', 'app']
```

## 四、LRU 缓存

### 4.1 LRU 原理

```
LRU（Least Recently Used）缓存
═══════════════════════════════════════════════════════

容量为 3 的 LRU 缓存：
  put(1, 'a')  → [1]
  put(2, 'b')  → [2, 1]
  put(3, 'c')  → [3, 2, 1]
  get(1)       → 'a', 缓存变为 [1, 3, 2]  ← 1 被访问，移到最前
  put(4, 'd')  → [4, 1, 3]                ← 2 被淘汰（最久未使用）

前端中的 LRU：
1. 浏览器 HTTP 缓存淘汰策略
2. Vue 的 KeepAlive 组件缓存
3. React 的 memo 缓存
4. 图片懒加载的缓存池
```

### 4.2 手写 LRU（Map 实现）

```js
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map(); // Map 保持插入顺序
  }

  get(key) {
    if (!this.cache.has(key)) return -1;

    // 移到最新位置
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // 删除最久未使用的（Map 的第一个元素）
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}
```

### 4.3 LRU 链表实现

```js
class LRUNode {
  constructor(key = 0, value = 0) {
    this.key = key;
    this.value = value;
    this.prev = null;
    this.next = null;
  }
}

class LRUCacheLinkedList {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map();
    // 哨兵节点简化边界操作
    this.head = new LRUNode();
    this.tail = new LRUNode();
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  _remove(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }

  _addToFront(node) {
    node.next = this.head.next;
    node.prev = this.head;
    this.head.next.prev = node;
    this.head.next = node;
  }

  get(key) {
    if (!this.map.has(key)) return -1;
    const node = this.map.get(key);
    this._remove(node);
    this._addToFront(node);
    return node.value;
  }

  put(key, value) {
    if (this.map.has(key)) {
      const node = this.map.get(key);
      node.value = value;
      this._remove(node);
      this._addToFront(node);
    } else {
      if (this.map.size >= this.capacity) {
        const lru = this.tail.prev;
        this._remove(lru);
        this.map.delete(lru.key);
      }
      const node = new LRUNode(key, value);
      this.map.set(key, node);
      this._addToFront(node);
    }
  }
}
```

## 五、节流与防抖

```js
// 防抖：最后一次调用后等待 delay 才执行
function debounce(fn, delay) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// 节流：每 delay 时间最多执行一次
function throttle(fn, delay) {
  let lastTime = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastTime >= delay) {
      lastTime = now;
      fn.apply(this, args);
    }
  };
}

// 带 leading + trailing 的节流
function throttleAdvanced(fn, delay, { leading = true, trailing = true } = {}) {
  let lastTime = 0;
  let timer = null;
  return function (...args) {
    const now = Date.now();
    if (!leading && lastTime === 0) lastTime = now;
    const remaining = delay - (now - lastTime);

    if (remaining <= 0) {
      clearTimeout(timer);
      timer = null;
      lastTime = now;
      fn.apply(this, args);
    } else if (!timer && trailing) {
      timer = setTimeout(() => {
        lastTime = leading ? Date.now() : 0;
        timer = null;
        fn.apply(this, args);
      }, remaining);
    }
  };
}
```

## 六、常见面试题

**Q1: 虚拟 DOM 的 Diff 算法时间复杂度是多少？为什么？**

A: O(n)。通过三个策略将 O(n³) 降到 O(n)：1）只比较同层节点；2）同类型节点才深入比较；3）用 key 标识节点。

**Q2: Vue3 的 Diff 比 Vue2 快在哪里？**

A: Vue3 使用最长递增子序列（LIS）优化了中间乱序节点的移动——只需要移动不在 LIS 中的节点，减少了 DOM 操作次数。Vue2 是双端比较，移动操作较多。

**Q3: LRU 缓存用 Map 和链表+哈希表的区别？**

A: Map 利用其有序性天然支持 LRU，代码简洁；链表+哈希表是经典实现，get/put 都是 O(1)，面试中更常考手写链表版本。
