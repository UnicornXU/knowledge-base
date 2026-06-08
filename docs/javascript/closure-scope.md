---
sidebar_position: 1
title: "闭包与作用域"
difficulty: "medium"
tags: ["javascript", "closure", "scope"]
---

# 闭包与作用域

## 什么是闭包？

闭包（Closure）是指一个函数能够访问其外部函数作用域中变量的能力，即使外部函数已经执行完毕。

```javascript
function createCounter() {
  let count = 0;
  return {
    increment: () => ++count,
    getCount: () => count,
  };
}

const counter = createCounter();
counter.increment();
counter.increment();
console.log(counter.getCount()); // 2
```

## 经典面试题：循环中的闭包

### 问题

```javascript
for (var i = 0; i < 5; i++) {
  setTimeout(() => console.log(i), 100);
}
// 输出什么？如何修复？
```

### 答案

输出 `5 5 5 5 5`，因为 `var` 声明的 `i` 是函数级作用域，所有回调共享同一个 `i`。

**修复方案 1：使用 `let`**

```javascript
for (let i = 0; i < 5; i++) {
  setTimeout(() => console.log(i), 100);
}
// 0 1 2 3 4
```

**修复方案 2：IIFE 创建闭包**

```javascript
for (var i = 0; i < 5; i++) {
  (function (j) {
    setTimeout(() => console.log(j), 100);
  })(i);
}
```

## 作用域链

JavaScript 采用词法作用域（静态作用域），作用域链在函数定义时确定，而非调用时。

```javascript
const x = 10;

function foo() {
  console.log(x);
}

function bar() {
  const x = 20;
  foo();
}

bar(); // 输出 10，而非 20
```

## 关键点

- 闭包 = 函数 + 外部作用域的引用
- 闭包会持有外部变量的引用，可能导致内存泄漏
- `let`/`const` 的块级作用域可以避免大部分闭包陷阱
- 闭包常用于：数据私有化、函数工厂、柯里化
