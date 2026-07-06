---
sidebar_position: 3
title: 搜索与遍历算法
difficulty: medium
tags:
  - algorithms
  - binary-search
  - dfs
  - bfs
  - backtracking
---

# 🔍 搜索与遍历算法

> **"搜索是解决问题的通用武器"** —— 大部分算法问题最终都可以归结为搜索问题。

## 一、二分查找（Binary Search）

### 1.1 基本原理

```
二分查找过程
═══════════════════════════════════════════════════════

在 [1, 3, 5, 7, 9, 11, 13] 中查找 7

第1步: left=0, right=6, mid=3 → arr[3]=7 ✅ 找到！

在 [1, 3, 5, 7, 9, 11, 13] 中查找 9

第1步: left=0, right=6, mid=3 → arr[3]=7 < 9 → left=4
第2步: left=4, right=6, mid=5 → arr[5]=11 > 9 → right=4
第3步: left=4, right=4, mid=4 → arr[4]=9 ✅ 找到！

关键：每次排除一半，O(log n)
```

### 1.2 实现

```js
// 基础二分查找
function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }

  return -1; // 未找到
}

// 查找左边界（第一个等于 target 的位置）
function searchLeft(arr, target) {
  let left = 0;
  let right = arr.length - 1;
  let result = -1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) {
      result = mid;
      right = mid - 1; // 继续往左找
    } else if (arr[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return result;
}

// 查找右边界（最后一个等于 target 的位置）
function searchRight(arr, target) {
  let left = 0;
  let right = arr.length - 1;
  let result = -1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) {
      result = mid;
      left = mid + 1; // 继续往右找
    } else if (arr[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return result;
}
```

### 1.3 二分查找的变体

```js
// 在旋转排序数组中查找
// [4, 5, 6, 7, 0, 1, 2] 中查找 0
function searchRotated(arr, target) {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;

    // 判断哪半边是有序的
    if (arr[left] <= arr[mid]) {
      // 左半边有序
      if (target >= arr[left] && target < arr[mid]) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    } else {
      // 右半边有序
      if (target > arr[mid] && target <= arr[right]) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
  }

  return -1;
}
```

## 二、DFS（深度优先搜索）

### 2.1 树的 DFS

```
DFS 遍历顺序
═══════════════════════════════════════════════════════

          1
        /   \
       2     3
      / \     \
     4   5     6

前序(根左右): 1 → 2 → 4 → 5 → 3 → 6
中序(左根右): 4 → 2 → 5 → 1 → 3 → 6
后序(左右根): 4 → 5 → 2 → 6 → 3 → 1
```

```js
// 递归 DFS
function dfs(root) {
  if (!root) return;
  console.log(root.val);    // 前序位置
  dfs(root.left);
  // console.log(root.val); // 中序位置
  dfs(root.right);
  // console.log(root.val); // 后序位置
}

// 迭代 DFS（用栈模拟）
function dfsIterative(root) {
  if (!root) return;
  const stack = [root];
  while (stack.length) {
    const node = stack.pop();
    console.log(node.val);
    if (node.right) stack.push(node.right); // 先右后左，栈是 LIFO
    if (node.left) stack.push(node.left);
  }
}
```

### 2.2 图的 DFS

```js
// 图的 DFS（需要记录已访问节点）
function dfsGraph(graph, start, visited = new Set()) {
  visited.add(start);
  console.log(start);

  for (const neighbor of graph[start]) {
    if (!visited.has(neighbor)) {
      dfsGraph(graph, neighbor, visited);
    }
  }
}
```

## 三、BFS（广度优先搜索）

### 3.1 树的 BFS（层序遍历）

```
BFS 遍历顺序
═══════════════════════════════════════════════════════

          1          ← 第 1 层
        /   \
       2     3       ← 第 2 层
      / \     \
     4   5     6     ← 第 3 层

BFS: 1 → 2 → 3 → 4 → 5 → 6（按层从左到右）
```

```js
function bfs(root) {
  if (!root) return [];
  const result = [];
  const queue = [root];

  while (queue.length) {
    const levelSize = queue.length;
    const level = [];

    for (let i = 0; i < levelSize; i++) {
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

### 3.2 图的 BFS

```js
function bfsGraph(graph, start) {
  const visited = new Set([start]);
  const queue = [start];
  const result = [];

  while (queue.length) {
    const node = queue.shift();
    result.push(node);

    for (const neighbor of graph[node]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return result;
}

// BFS 求最短路径（无权图）
function shortestPath(graph, start, end) {
  const visited = new Set([start]);
  const queue = [[start]]; // 存储路径

  while (queue.length) {
    const path = queue.shift();
    const node = path[path.length - 1];

    if (node === end) return path;

    for (const neighbor of graph[node]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([...path, neighbor]);
      }
    }
  }

  return null; // 不可达
}
```

### 3.3 DFS vs BFS 对比

```
DFS vs BFS
═══════════════════════════════════════════════════════

DFS（深度优先）              BFS（广度优先）
──────────────              ──────────────
用栈（递归调用栈/显式栈）    用队列
深入到底再回溯               逐层扩展
空间 O(h)（h 为深度）       空间 O(w)（w 为宽度）
不保证最短路径               ✅ 保证最短路径（无权图）

适用场景：
DFS → 路径问题、排列组合、连通性检测
BFS → 最短路径、层序遍历、拓扑排序
```

## 四、回溯算法（Backtracking）

### 4.1 核心思想

```
回溯算法框架
═══════════════════════════════════════════════════════

function backtrack(路径, 选择列表):
    if 满足结束条件:
        result.add(路径)
        return

    for 选择 in 选择列表:
        做选择          ← 将选择加入路径
        backtrack(路径, 选择列表)
        撤销选择        ← 将选择从路径移除（回溯核心）
```

### 4.2 全排列

```js
function permute(nums) {
  const result = [];

  function backtrack(path, used) {
    if (path.length === nums.length) {
      result.push([...path]);
      return;
    }

    for (let i = 0; i < nums.length; i++) {
      if (used[i]) continue;  // 跳过已使用的

      path.push(nums[i]);     // 做选择
      used[i] = true;
      backtrack(path, used);
      path.pop();             // 撤销选择
      used[i] = false;
    }
  }

  backtrack([], new Array(nums.length).fill(false));
  return result;
}
```

### 4.3 N 皇后问题

```js
function solveNQueens(n) {
  const result = [];

  function backtrack(row, board) {
    if (row === n) {
      result.push(board.map(r => r.join('')));
      return;
    }

    for (let col = 0; col < n; col++) {
      if (!isValid(board, row, col)) continue;

      board[row][col] = 'Q';     // 放置皇后
      backtrack(row + 1, board);
      board[row][col] = '.';     // 回溯
    }
  }

  function isValid(board, row, col) {
    for (let i = 0; i < row; i++) {
      if (board[i][col] === 'Q') return false;           // 同列
      if (board[i][col - (row - i)] === 'Q') return false; // 左对角
      if (board[i][col + (row - i)] === 'Q') return false; // 右对角
    }
    return true;
  }

  const board = Array.from({ length: n }, () => Array(n).fill('.'));
  backtrack(0, board);
  return result;
}
```

## 五、双指针技巧

```js
// 两数之和（已排序数组）
function twoSum(arr, target) {
  let left = 0;
  let right = arr.length - 1;

  while (left < right) {
    const sum = arr[left] + arr[right];
    if (sum === target) return [left, right];
    if (sum < target) left++;
    else right--;
  }

  return [-1, -1];
}

// 反转字符串
function reverseString(s) {
  let left = 0;
  let right = s.length - 1;
  while (left < right) {
    [s[left], s[right]] = [s[right], s[left]];
    left++;
    right--;
  }
}

// 判断回文
function isPalindrome(s) {
  let left = 0;
  let right = s.length - 1;
  while (left < right) {
    if (s[left] !== s[right]) return false;
    left++;
    right--;
  }
  return true;
}
```

## 六、滑动窗口

```js
// 最长无重复子串
function lengthOfLongestSubstring(s) {
  const map = new Map();
  let left = 0;
  let maxLen = 0;

  for (let right = 0; right < s.length; right++) {
    if (map.has(s[right])) {
      left = Math.max(left, map.get(s[right]) + 1);
    }
    map.set(s[right], right);
    maxLen = Math.max(maxLen, right - left + 1);
  }

  return maxLen;
}

// 最小覆盖子串
function minWindow(s, t) {
  const need = new Map();
  for (const c of t) need.set(c, (need.get(c) || 0) + 1);

  let left = 0;
  let valid = 0;
  let start = 0;
  let minLen = Infinity;

  const window = new Map();
  for (let right = 0; right < s.length; right++) {
    const c = s[right];
    if (need.has(c)) {
      window.set(c, (window.get(c) || 0) + 1);
      if (window.get(c) === need.get(c)) valid++;
    }

    while (valid === need.size) {
      if (right - left + 1 < minLen) {
        start = left;
        minLen = right - left + 1;
      }
      const d = s[left];
      left++;
      if (need.has(d)) {
        if (window.get(d) === need.get(d)) valid--;
        window.set(d, window.get(d) - 1);
      }
    }
  }

  return minLen === Infinity ? '' : s.slice(start, start + minLen);
}
```

## 七、常见面试题

**Q1: DFS 和 BFS 的区别？什么场景用哪个？**

A: DFS 用栈，深入到底再回溯，空间 O(h)；BFS 用队列，逐层扩展，空间 O(w)。求最短路径用 BFS，路径/组合问题用 DFS。树的前中后序遍历是 DFS，层序遍历是 BFS。

**Q2: 二分查找的前提条件？**

A: 数组必须有序（通常升序）。时间复杂度 O(log n)，空间复杂度 O(1)。注意边界条件：`left <= right` 还是 `left < right`，取决于是否需要查找具体位置。

**Q3: 回溯算法和 DFS 的区别？**

A: 回溯是 DFS 的一种应用——在 DFS 基础上增加了"撤销选择"的操作，用于穷举所有可能的解。回溯的核心是选择 → 递归 → 撤销选择。
