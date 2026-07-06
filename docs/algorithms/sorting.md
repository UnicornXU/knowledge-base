---
sidebar_position: 2
title: 排序算法
difficulty: medium
tags:
  - algorithms
  - sorting
  - quicksort
  - mergesort
---

# 🔄 排序算法

> **"排序是算法世界的 Hello World"** —— 排序算法的思想（分治、递归、贪心）贯穿整个算法学习。

## 一、排序算法总览

```
排序算法对比
═══════════════════════════════════════════════════════════════

算法        平均        最坏        空间      稳定性
──────────  ──────────  ──────────  ────────  ──────
冒泡排序    O(n²)       O(n²)       O(1)      ✅ 稳定
选择排序    O(n²)       O(n²)       O(1)      ❌ 不稳定
插入排序    O(n²)       O(n²)       O(1)      ✅ 稳定
归并排序    O(n log n)  O(n log n)  O(n)      ✅ 稳定
快速排序    O(n log n)  O(n²)       O(log n)  ❌ 不稳定
堆排序      O(n log n)  O(n log n)  O(1)      ❌ 不稳定
计数排序    O(n + k)    O(n + k)    O(k)      ✅ 稳定
```

## 二、冒泡排序（Bubble Sort）

### 2.1 算法思路

```
冒泡排序过程（每轮把最大的"冒泡"到末尾）
═══════════════════════════════════════════════════════

原始:  [5, 3, 8, 4, 2]

第1轮:  [3, 5, 4, 2, 8]   ← 8 冒泡到末尾
         ↗  ↗  ↗  ↗
第2轮:  [3, 4, 2, 5, 8]   ← 5 冒泡到倒数第二
         ↗  ↗  ↗
第3轮:  [3, 2, 4, 5, 8]   ← 4 冒泡到倒数第三
         ↗  ↗
第4轮:  [2, 3, 4, 5, 8]   ← 完成
         ↗
```

### 2.2 实现

```js
function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - 1 - i; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swapped = true;
      }
    }
    if (!swapped) break; // 优化：没有交换说明已排序
  }
  return arr;
}
```

## 三、快速排序（Quick Sort）

### 3.1 算法思路

```
快速排序 —— 分治思想
═══════════════════════════════════════════════════════

选择基准值（pivot）→ 分区（partition）→ 递归排序

原始:  [5, 3, 8, 4, 2, 7, 1, 6]
选 pivot = 5

分区:  [3, 4, 2, 1] | 5 | [8, 7, 6]
       < 5          pivot  > 5

递归:  [1, 2, 3, 4] | 5 | [6, 7, 8]

结果:  [1, 2, 3, 4, 5, 6, 7, 8]
```

### 3.2 实现

```js
// 方式一：原地排序（推荐）
function quickSort(arr, low = 0, high = arr.length - 1) {
  if (low < high) {
    const pivotIndex = partition(arr, low, high);
    quickSort(arr, low, pivotIndex - 1);
    quickSort(arr, pivotIndex + 1, high);
  }
  return arr;
}

function partition(arr, low, high) {
  const pivot = arr[high];
  let i = low - 1;
  for (let j = low; j < high; j++) {
    if (arr[j] <= pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
  return i + 1;
}

// 方式二：简洁写法（额外空间）
function quickSortSimple(arr) {
  if (arr.length <= 1) return arr;
  const pivot = arr[0];
  const left = arr.slice(1).filter(x => x <= pivot);
  const right = arr.slice(1).filter(x => x > pivot);
  return [...quickSortSimple(left), pivot, ...quickSortSimple(right)];
}
```

### 3.3 复杂度分析

| 情况 | 时间复杂度 | 说明 |
|------|-----------|------|
| 最优 | O(n log n) | 每次 pivot 均分 |
| 平均 | O(n log n) | 随机数据 |
| 最差 | O(n²) | 已排序数组 + 取首元素为 pivot |

## 四、归并排序（Merge Sort）

### 4.1 算法思路

```
归并排序 —— 分治 + 合并
═══════════════════════════════════════════════════════

         [5, 3, 8, 4, 2, 7]
              /          \
       [5, 3, 8]      [4, 2, 7]
       /     \         /     \
     [5]   [3, 8]   [4]   [2, 7]
           /   \           /   \
         [3]   [8]       [2]   [7]

    ← 合并阶段（两两归并）→

         [3, 5, 8]      [2, 4, 7]
              \          /
       [2, 3, 4, 5, 7, 8]
```

### 4.2 实现

```js
function mergeSort(arr) {
  if (arr.length <= 1) return arr;

  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));

  return merge(left, right);
}

function merge(left, right) {
  const result = [];
  let i = 0, j = 0;

  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) {
      result.push(left[i++]);
    } else {
      result.push(right[j++]);
    }
  }

  return result.concat(left.slice(i)).concat(right.slice(j));
}
```

## 五、堆排序（Heap Sort）

### 5.1 堆的概念

```
最大堆结构
═══════════════════════════════════════════════════════

数组: [9, 7, 8, 3, 5, 6, 2, 1, 4]

树形表示:
              9          ← 根节点最大
           /     \
         7        8
        / \      / \
       3   5    6   2
      / \
     1   4

性质: parent(i) = (i-1)/2, left(i) = 2i+1, right(i) = 2i+2
```

### 5.2 实现

```js
function heapSort(arr) {
  const n = arr.length;

  // 建堆（从最后一个非叶子节点开始）
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    heapify(arr, n, i);
  }

  // 逐个取出最大值
  for (let i = n - 1; i > 0; i--) {
    [arr[0], arr[i]] = [arr[i], arr[0]];
    heapify(arr, i, 0);
  }

  return arr;
}

function heapify(arr, size, root) {
  let largest = root;
  const left = 2 * root + 1;
  const right = 2 * root + 2;

  if (left < size && arr[left] > arr[largest]) largest = left;
  if (right < size && arr[right] > arr[largest]) largest = right;

  if (largest !== root) {
    [arr[root], arr[largest]] = [arr[largest], arr[root]];
    heapify(arr, size, largest);
  }
}
```

## 六、插入排序（Insertion Sort）

```js
function insertionSort(arr) {
  for (let i = 1; i < arr.length; i++) {
    const key = arr[i];
    let j = i - 1;
    while (j >= 0 && arr[j] > key) {
      arr[j + 1] = arr[j];  // 后移
      j--;
    }
    arr[j + 1] = key;  // 插入正确位置
  }
  return arr;
}
```

```
插入排序过程
═══════════════════════════════════════════════════════

[5, 3, 8, 4, 2]
 ↑  ↑
 已排序区  待插入

[3, 5, 8, 4, 2]   ← 3 插入到 5 前
    ↑  ↑
[3, 5, 8, 4, 2]   ← 8 位置不变
       ↑  ↑
[3, 4, 5, 8, 2]   ← 4 插入到 5 前
          ↑  ↑
[2, 3, 4, 5, 8]   ← 2 插入到最前
```

## 七、排序算法选择

```
如何选择排序算法？
═══════════════════════════════════════════════════════

数据量小（n < 50）   → 插入排序（常数因子小）
数据量大、要求稳定   → 归并排序
数据量大、不要求稳定 → 快速排序（平均最快）
内存受限             → 堆排序（O(1) 空间）
数据范围小           → 计数排序 / 基数排序

实际工程中：
  - JS 的 Array.sort() 用 TimSort（归并 + 插入的混合）
  - V8 对小数组用插入排序，大数组用快排
```

## 八、常见面试题

**Q1: 快排和归并的区别？**

A: 都是分治思想。快排先分区再递归（自顶向下），归并先递归再合并（自底向上）。快排原地排序但不稳定，归并稳定但需要额外空间。快排的 cache 友好性更好。

**Q2: 如何优化快排？**

A: 1）三数取中选 pivot；2）小数组切换插入排序；3）三路快排处理大量重复元素；4）随机化 pivot。

**Q3: 为什么快排平均比归并快？**

A: 虽然都是 O(n log n)，但快排的常数因子更小——它在原地交换，cache 命中率高；归并需要额外空间和数组拷贝。
