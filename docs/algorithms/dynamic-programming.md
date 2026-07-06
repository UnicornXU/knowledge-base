---
sidebar_position: 4
title: 动态规划
difficulty: hard
tags:
  - algorithms
  - dynamic-programming
  - dp
  - knapsack
---

# 📐 动态规划

> **"动态规划是算法面试的终极 Boss"** —— 掌握 DP，就掌握了解决最优化问题的通用方法。

## 一、核心概念

### 1.1 什么是动态规划？

```
动态规划三要素
═══════════════════════════════════════════════════════

1. 最优子结构：问题的最优解包含子问题的最优解
2. 重叠子问题：子问题被重复计算多次
3. 状态转移方程：定义状态之间的递推关系

DP vs 递归 vs 贪心
═══════════════════════════════════════════════════════

递归：自顶向下，可能重复计算
    fib(5) = fib(4) + fib(3)
    fib(4) = fib(3) + fib(2)  ← fib(3) 被重复计算

DP：自底向上（或带备忘录的递归），避免重复计算
    fib(1)=1, fib(2)=1
    fib(3)=fib(2)+fib(1)=2
    fib(4)=fib(3)+fib(2)=3
    fib(5)=fib(4)+fib(3)=5

贪心：每步选局部最优，不回退（DP 考虑全局最优）
```

### 1.2 DP 解题步骤

```
DP 解题框架
═══════════════════════════════════════════════════════

1. 定义状态：dp[i] 或 dp[i][j] 代表什么？
2. 写状态转移方程：dp[i] 和 dp[i-1] 的关系
3. 确定初始条件：dp[0]、dp[1] 的值
4. 确定遍历顺序：正序还是倒序
5. 推导验证：用小数据验证 dp 表
```

## 二、斐波那契数列

### 2.1 递归 → 备忘录 → DP

```js
// ❌ 朴素递归：O(2^n) —— 大量重复计算
function fib(n) {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
}

// ✅ 备忘录递归：O(n)
function fibMemo(n, memo = new Map()) {
  if (n <= 1) return n;
  if (memo.has(n)) return memo.get(n);
  const result = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
  memo.set(n, result);
  return result;
}

// ✅ DP 表：O(n) 时间，O(n) 空间
function fibDP(n) {
  if (n <= 1) return n;
  const dp = [0, 1];
  for (let i = 2; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];
  }
  return dp[n];
}

// ✅ 空间优化：O(n) 时间，O(1) 空间
function fibOptimized(n) {
  if (n <= 1) return n;
  let prev2 = 0, prev1 = 1;
  for (let i = 2; i <= n; i++) {
    const curr = prev1 + prev2;
    prev2 = prev1;
    prev1 = curr;
  }
  return prev1;
}
```

## 三、爬楼梯

### 3.1 问题描述

```
爬楼梯（LeetCode 70）
═══════════════════════════════════════════════════════

假设你正在爬楼梯，需要 n 阶才能到达楼顶。
每次你可以爬 1 或 2 个台阶，请问有多少种不同的方法可以爬到楼顶？

例：n = 3
方法 1: 1 + 1 + 1
方法 2: 1 + 2
方法 3: 2 + 1
输出: 3
```

### 3.2 DP 解法

```js
function climbStairs(n) {
  if (n <= 2) return n;

  // dp[i] = dp[i-1] + dp[i-2]
  // 到第 i 阶的方法 = 到第 i-1 阶的方法 + 到第 i-2 阶的方法
  let prev2 = 1, prev1 = 2;
  for (let i = 3; i <= n; i++) {
    const curr = prev1 + prev2;
    prev2 = prev1;
    prev1 = curr;
  }

  return prev1;
}
```

## 四、最长递增子序列（LIS）

### 4.1 问题描述

```
最长递增子序列（LeetCode 300）
═══════════════════════════════════════════════════════

给定数组 [10, 9, 2, 5, 3, 7, 101, 18]
最长递增子序列: [2, 3, 7, 101] 或 [2, 3, 7, 18]
长度: 4
```

### 4.2 DP 解法

```js
// O(n²) DP
function lengthOfLIS(nums) {
  const n = nums.length;
  const dp = new Array(n).fill(1); // dp[i] = 以 nums[i] 结尾的 LIS 长度

  for (let i = 1; i < n; i++) {
    for (let j = 0; j < i; j++) {
      if (nums[j] < nums[i]) {
        dp[i] = Math.max(dp[i], dp[j] + 1);
      }
    }
  }

  return Math.max(...dp);
}

// O(n log n) 贪心 + 二分查找
function lengthOfLISOptimized(nums) {
  const tails = []; // tails[i] = 长度为 i+1 的 LIS 的最小末尾

  for (const num of nums) {
    let left = 0, right = tails.length;
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (tails[mid] < num) left = mid + 1;
      else right = mid;
    }
    tails[left] = num;
  }

  return tails.length;
}
```

## 五、背包问题

### 5.1 0-1 背包

```
0-1 背包问题
═══════════════════════════════════════════════════════

有 N 件物品和容量为 W 的背包，每件物品只能用一次。
第 i 件物品重量 w[i]，价值 v[i]。
求最大总价值。

例：W=4, 物品 [(1,1), (2,3), (3,4)]
选物品 2 和 3：重量 2+3=5 > 4 ❌
选物品 1 和 2：重量 1+2=3 ≤ 4，价值 1+3=4 ✅
选物品 1 和 3：重量 1+3=4 ≤ 4，价值 1+4=5 ✅ 最优
```

```js
// 0-1 背包（二维 DP）
function knapsack01(W, weights, values) {
  const n = weights.length;
  // dp[i][w] = 前 i 件物品、容量 w 时的最大价值
  const dp = Array.from({ length: n + 1 }, () => new Array(W + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= W; w++) {
      if (weights[i - 1] <= w) {
        dp[i][w] = Math.max(
          dp[i - 1][w],                          // 不选第 i 件
          dp[i - 1][w - weights[i - 1]] + values[i - 1]  // 选第 i 件
        );
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }

  return dp[n][W];
}

// 空间优化（一维滚动数组）
function knapsack01Optimized(W, weights, values) {
  const n = weights.length;
  const dp = new Array(W + 1).fill(0);

  for (let i = 0; i < n; i++) {
    for (let w = W; w >= weights[i]; w--) {  // 倒序遍历！
      dp[w] = Math.max(dp[w], dp[w - weights[i]] + values[i]);
    }
  }

  return dp[W];
}
```

### 5.2 完全背包

```js
// 完全背包（每件物品可以无限次使用）
function knapsackComplete(W, weights, values) {
  const n = weights.length;
  const dp = new Array(W + 1).fill(0);

  for (let i = 0; i < n; i++) {
    for (let w = weights[i]; w <= W; w++) {  // 正序遍历！
      dp[w] = Math.max(dp[w], dp[w - weights[i]] + values[i]);
    }
  }

  return dp[W];
}
```

## 六、经典 DP 问题

### 6.1 最长公共子序列（LCS）

```js
function longestCommonSubsequence(text1, text2) {
  const m = text1.length;
  const n = text2.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (text1[i - 1] === text2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp[m][n];
}
```

### 6.2 编辑距离

```js
function minDistance(word1, word2) {
  const m = word1.length;
  const n = word2.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  // 初始化边界
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (word1[i - 1] === word2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]; // 字符相同，无需操作
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // 删除
          dp[i][j - 1],     // 插入
          dp[i - 1][j - 1]  // 替换
        );
      }
    }
  }

  return dp[m][n];
}
```

### 6.3 零钱兑换

```js
function coinChange(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;

  for (let i = 1; i <= amount; i++) {
    for (const coin of coins) {
      if (coin <= i && dp[i - coin] !== Infinity) {
        dp[i] = Math.min(dp[i], dp[i - coin] + 1);
      }
    }
  }

  return dp[amount] === Infinity ? -1 : dp[amount];
}
```

## 七、常见面试题

**Q1: DP 和贪心的区别？**

A: 贪心每步选局部最优，不回退；DP 考虑所有子问题，取全局最优。能用贪心的一定能用 DP，反之不行。贪心更快但需要证明局部最优 = 全局最优。

**Q2: 如何确定 DP 的状态转移方程？**

A: 1）明确 dp[i] 代表什么；2）考虑最后一步的选择；3）用最后一步的选择来表示 dp[i]。例如爬楼梯：最后一步走 1 阶或 2 阶，所以 dp[i] = dp[i-1] + dp[i-2]。

**Q3: 0-1 背包和完全背包的区别？**

A: 0-1 背包每件物品只能用一次，遍历时倒序（保证每件物品只被计算一次）；完全背包每件物品可以用无限次，遍历时正序（允许重复选择）。
