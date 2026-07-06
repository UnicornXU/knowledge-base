---
sidebar_position: 1
title: 常见数据结构
difficulty: medium
tags:
  - algorithms
  - data-structures
  - array
  - linked-list
  - tree
---

# 📦 常见数据结构

> **"程序 = 数据结构 + 算法"** —— 选择合适的数据结构，问题就解决了一半。

## 一、复杂度分析

### 1.1 时间复杂度

```
常见时间复杂度（从快到慢）
═══════════════════════════════════════════════════════

O(1)        常数     ── 哈希表查找、数组下标访问
O(log n)    对数     ── 二分查找、平衡二叉搜索树
O(n)        线性     ── 遍历数组、链表
O(n log n)  线性对数 ── 快排、归并排序
O(n²)       平方     ── 冒泡排序、嵌套循环
O(2ⁿ)       指数     ── 递归斐波那契（未优化）
O(n!)       阶乘     ── 全排列
```

### 1.2 空间复杂度

```js
// O(1) 空间 —— 只用常量变量
function sum(arr) {
  let total = 0;          // 一个变量
  for (let i = 0; i < arr.length; i++) {
    total += arr[i];
  }
  return total;
}

// O(n) 空间 —— 创建了等长数组
function double(arr) {
  return arr.map(x => x * 2);  // 新数组
}

// O(n) 空间 —— 递归调用栈
function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);  // n 层调用栈
}
```

## 二、数组（Array）

### 2.1 特性

```
数组的内存布局
═══════════════════════════════════════════════════════

  内存地址:  0x00  0x04  0x08  0x0C  0x10
            ┌─────┬─────┬─────┬─────┬─────┐
  数组:     │  1  │  2  │  3  │  4  │  5  │
            └─────┴─────┴─────┴─────┴─────┘
              [0]   [1]   [2]   [3]   [4]

  ✅ 随机访问 O(1)：地址 = 基地址 + 下标 × 元素大小
  ❌ 插入/删除 O(n)：需要移动后续元素
```

### 2.2 JavaScript 数组的特殊性

```js
// JS 数组本质是对象，下标是字符串键
const arr = [1, 2, 3];
arr[0];           // 等价于 arr['0']
typeof arr;       // 'object'
Array.isArray(arr); // true

// 稀疏数组 —— 不连续存储，性能下降
const sparse = [];
sparse[0] = 'a';
sparse[1000] = 'b';
sparse.length;    // 1001，但只有 2 个元素

// 密集数组 vs 稀疏数组
const dense = new Array(1000).fill(0);  // ✅ 密集，连续内存
const sparse2 = []; sparse2[999] = 0;   // ❌ 稀疏，哈希表存储
```

### 2.3 常用操作复杂度

| 操作 | 时间复杂度 | 说明 |
|------|-----------|------|
| 访问 `arr[i]` | O(1) | 随机访问 |
| 搜索 `arr.indexOf(x)` | O(n) | 线性扫描 |
| 尾部插入 `arr.push(x)` | O(1) | 均摊 |
| 头部插入 `arr.unshift(x)` | O(n) | 需移动所有元素 |
| 尾部删除 `arr.pop()` | O(1) | |
| 头部删除 `arr.shift()` | O(n) | 需移动所有元素 |
| 排序 `arr.sort()` | O(n log n) | TimSort |

## 三、链表（Linked List）

### 3.1 结构

```
单链表
═══════════════════════════════════════════════════════

  ┌───┬───┐    ┌───┬───┐    ┌───┬───┐    ┌───┬─────┐
  │ 1 │ ──┼───→│ 2 │ ──┼───→│ 3 │ ──┼───→│ 4 │ null│
  └───┴───┘    └───┴───┘    └───┴───┘    └───┴─────┘
   head                                   tail

  数据域 | 指针域

双向链表
═══════════════════════════════════════════════════════

  null←┌───┬───┬───┐    ┌───┬───┬───┐    ┌───┬───┬───┐→null
       │   │ 1 │ ──┼───→│   │ 2 │ ──┼───→│   │ 3 │   │
       └───┴───┼───┘←───┼───┴───┼───┘←───┼───┴───┘
               │        │       │        │
            prev       prev    prev     prev
```

### 3.2 手写单链表

```js
class ListNode {
  constructor(val, next = null) {
    this.val = val;
    this.next = next;
  }
}

class LinkedList {
  constructor() {
    this.head = null;
    this.size = 0;
  }

  // 头部插入 O(1)
  prepend(val) {
    this.head = new ListNode(val, this.head);
    this.size++;
  }

  // 尾部插入 O(n)
  append(val) {
    const node = new ListNode(val);
    if (!this.head) {
      this.head = node;
    } else {
      let curr = this.head;
      while (curr.next) curr = curr.next;
      curr.next = node;
    }
    this.size++;
  }

  // 删除指定值 O(n)
  delete(val) {
    if (!this.head) return;
    if (this.head.val === val) {
      this.head = this.head.next;
      this.size--;
      return;
    }
    let curr = this.head;
    while (curr.next) {
      if (curr.next.val === val) {
        curr.next = curr.next.next;
        this.size--;
        return;
      }
      curr = curr.next;
    }
  }

  // 反转链表 O(n)
  reverse() {
    let prev = null;
    let curr = this.head;
    while (curr) {
      const next = curr.next;
      curr.next = prev;
      prev = curr;
      curr = next;
    }
    this.head = prev;
  }
}
```

### 3.3 数组 vs 链表对比

| 特性 | 数组 | 链表 |
|------|------|------|
| 内存布局 | 连续 | 分散 |
| 随机访问 | O(1) | O(n) |
| 头部插入 | O(n) | O(1) |
| 尾部插入 | O(1) 均摊 | O(n) / O(1) 带 tail |
| 内存效率 | 高（无额外开销） | 低（指针开销） |
| 缓存友好 | ✅ 连续内存 | ❌ 跳跃访问 |

## 四、栈（Stack）与队列（Queue）

### 4.1 栈 —— 后进先出（LIFO）

```
栈的操作
═══════════════════════════════════════════════════════

  push(4)        pop()
     ↓             ↑
  ┌─────┐       ┌─────┐
  │  4  │ ← top │  4  │ ← 弹出
  ├─────┤       ├─────┤
  │  3  │       │  3  │ ← 新的 top
  ├─────┤       ├─────┤
  │  2  │       │  2  │
  ├─────┤       ├─────┤
  │  1  │       │  1  │
  └─────┘       └─────┘
```

```js
// 用数组实现栈
class Stack {
  constructor() { this.items = []; }
  push(val) { this.items.push(val); }
  pop() { return this.items.pop(); }
  peek() { return this.items[this.items.length - 1]; }
  isEmpty() { return this.items.length === 0; }
  get size() { return this.items.length; }
}

// 前端中的栈应用：
// 1. 函数调用栈
// 2. 撤销/重做（Undo/Redo）
// 3. 浏览器历史记录（前进/后退）
// 4. 括号匹配
// 5. 表达式求值（逆波兰表达式）
```

### 4.2 队列 —— 先进先出（FIFO）

```
队列的操作
═══════════════════════════════════════════════════════

  入队 →  ┌─────┬─────┬─────┬─────┐  → 出队
          │  1  │  2  │  3  │  4  │
          └─────┴─────┴─────┴─────┘
          front                rear

  enqueue(5) → 加到 rear 后面
  dequeue()  → 从 front 弹出
```

```js
// 用数组实现队列（注意：shift() 是 O(n)）
class Queue {
  constructor() { this.items = []; }
  enqueue(val) { this.items.push(val); }
  dequeue() { return this.items.shift(); }  // O(n)！
  front() { return this.items[0]; }
  isEmpty() { return this.items.length === 0; }
}

// 更高效的队列：用链表或循环数组实现
// 前端中的队列应用：
// 1. 事件循环的任务队列（宏任务/微任务）
// 2. BFS（广度优先搜索）
// 3. 消息队列
// 4. 请求限流
```

## 五、哈希表（Hash Table）

### 5.1 原理

```
哈希表的工作原理
═══════════════════════════════════════════════════════

  key → hashFunction(key) → index → 存储位置

  例：hash("apple") = 2
      hash("banana") = 5

  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐
  │     │     │apple│     │     │banana│     │
  └─────┴─────┴─────┴─────┴─────┴─────┴─────┘
    [0]   [1]   [2]   [3]   [4]   [5]   [6]

  查找 O(1)：key → hash → 直接定位
```

### 5.2 冲突解决

```
链地址法（Chaining）
═══════════════════════════════════════════════════════

  hash("apple") = 2
  hash("grape") = 2  ← 冲突！

  ┌─────┐
  │  2  │ → apple → grape → null
  └─────┘

开放寻址法（Open Addressing）
═══════════════════════════════════════════════════════

  hash("apple") = 2  → 位置 2 为空，放入
  hash("grape") = 2  → 位置 2 已占用，探测位置 3 → 放入

  ┌─────┬─────┬─────┬─────┐
  │     │     │apple│grape│
  └─────┴─────┴─────┴─────┘
    [0]   [1]   [2]   [3]
```

### 5.3 JavaScript 中的哈希表

```js
// Map —— 保持插入顺序，支持任意键类型
const map = new Map();
map.set('name', 'Alice');
map.set(42, 'answer');
map.set({}, 'object key');  // 对象也可以做键

// Object —— 字符串键，有原型链干扰
const obj = {};
obj['name'] = 'Alice';
obj[42] = 'answer';  // 转为字符串 '42'

// Set —— 唯一值集合
const set = new Set([1, 2, 3, 2, 1]);
// Set(3) {1, 2, 3}

// 手写简易哈希表
class HashTable {
  constructor(size = 53) {
    this.buckets = new Array(size);
  }

  _hash(key) {
    let total = 0;
    const PRIME = 31;
    for (let i = 0; i < Math.min(key.length, 100); i++) {
      const char = key[i];
      const value = char.charCodeAt(0) - 96;
      total = (total * PRIME + value) % this.buckets.length;
    }
    return total;
  }

  set(key, value) {
    const index = this._hash(key);
    if (!this.buckets[index]) this.buckets[index] = [];
    this.buckets[index].push([key, value]);
  }

  get(key) {
    const index = this._hash(key);
    const bucket = this.buckets[index];
    if (!bucket) return undefined;
    const pair = bucket.find(([k]) => k === key);
    return pair ? pair[1] : undefined;
  }
}
```

## 六、树（Tree）

### 6.1 二叉树基础

```
二叉树的形态
═══════════════════════════════════════════════════════

满二叉树：           完全二叉树：          二叉搜索树(BST)：
    1                    1                      4
   / \                  / \                    /   \
  2   3                2   3                  2     6
 / \ / \              / \                    / \   / \
4  5 6  7            4   5                  1   3 5   7

每个节点最多2个子   除最后一层外满       左 < 根 < 右
                    最后一层左对齐
```

### 6.2 二叉树遍历

```js
class TreeNode {
  constructor(val, left = null, right = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

// 前序遍历：根 → 左 → 右
function preorder(root) {
  if (!root) return [];
  return [root.val, ...preorder(root.left), ...preorder(root.right)];
}

// 中序遍历：左 → 根 → 右（BST 中返回有序序列）
function inorder(root) {
  if (!root) return [];
  return [...inorder(root.left), root.val, ...inorder(root.right)];
}

// 后序遍历：左 → 右 → 根
function postorder(root) {
  if (!root) return [];
  return [...postorder(root.left), ...postorder(root.right), root.val];
}

// 层序遍历（BFS）
function levelOrder(root) {
  if (!root) return [];
  const result = [];
  const queue = [root];
  while (queue.length) {
    const level = [];
    const size = queue.length;
    for (let i = 0; i < size; i++) {
      const node = queue.shift();
      level.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    result.push(level);
  }
  return result;
}
```

### 6.3 二叉搜索树操作

```js
class BST {
  constructor() { this.root = null; }

  insert(val) {
    const node = new TreeNode(val);
    if (!this.root) {
      this.root = node;
      return this;
    }
    let curr = this.root;
    while (true) {
      if (val < curr.val) {
        if (!curr.left) { curr.left = node; return this; }
        curr = curr.left;
      } else {
        if (!curr.right) { curr.right = node; return this; }
        curr = curr.right;
      }
    }
  }

  search(val) {
    let curr = this.root;
    while (curr) {
      if (val === curr.val) return curr;
      curr = val < curr.val ? curr.left : curr.right;
    }
    return null;
  }
}
```

## 七、图（Graph）

### 7.1 表示方式

```js
// 邻接表（常用）
const graph = {
  A: ['B', 'C'],
  B: ['A', 'D'],
  C: ['A', 'D'],
  D: ['B', 'C'],
};

// 邻接矩阵
//     A  B  C  D
// A [ 0, 1, 1, 0 ]
// B [ 1, 0, 0, 1 ]
// C [ 1, 0, 0, 1 ]
// D [ 0, 1, 1, 0 ]
```

### 7.2 前端中的图

```
前端中的图结构
═══════════════════════════════════════════════════════

1. 依赖关系
   package-a → package-b → package-c
            ↘ package-d

2. 组件关系
   App → Header
       → Content → Sidebar
                 → Main

3. 状态机
   idle → loading → success
                  → error → idle
```

## 八、常见面试题

**Q1: 数组和链表的区别？各自适用什么场景？**

A: 数组连续存储、随机访问 O(1)、缓存友好；链表分散存储、插入删除 O(1)（已知位置时）。数组适合频繁读取、已知大小的场景；链表适合频繁增删、大小不确定的场景。

**Q2: 为什么 JS 的 `Map` 比 `Object` 更适合做哈希表？**

A: `Map` 支持任意键类型（对象、函数等）、保持插入顺序、无原型链干扰、`size` 属性直接获取大小。`Object` 只能用字符串/Symbol 做键，有原型链干扰。

**Q3: 二叉搜索树的时间复杂度？**

A: 平均 O(log n)（平衡时），最坏 O(n)（退化为链表）。解决方案：AVL 树、红黑树等自平衡树。

**Q4: 如何判断一个链表是否有环？**

A: 快慢指针法——慢指针每次走 1 步，快指针每次走 2 步，如果相遇则有环。
