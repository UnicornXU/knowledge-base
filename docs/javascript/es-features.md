---
sidebar_position: 5
title: "ES6+ 常用特性"
difficulty: "easy"
tags: ["javascript", "es6"]
---

# ES6+ 常用特性

## 解构赋值

```javascript
// 对象解构
const { name, age = 18 } = { name: 'Tom' };
console.log(name, age); // "Tom" 18

// 数组解构
const [first, ...rest] = [1, 2, 3];
console.log(first, rest); // 1 [2, 3]

// 嵌套解构
const { a: { b } } = { a: { b: 1 } };
console.log(b); // 1
```

## 展开运算符 vs 剩余参数

```javascript
// 展开运算符（Spread）：将数组/对象展开
const arr1 = [1, 2];
const arr2 = [...arr1, 3, 4]; // [1, 2, 3, 4]

// 剩余参数（Rest）：将剩余参数收集成数组
function sum(...nums) {
  return nums.reduce((a, b) => a + b, 0);
}
```

## 箭头函数 vs 普通函数

| 特性 | 箭头函数 | 普通函数 |
|------|---------|---------|
| `this` | 继承外层 | 调用时确定 |
| `arguments` | 没有 | 有 |
| `new` | 不能 | 能 |
| `prototype` | 没有 | 有 |

```javascript
const obj = {
  name: 'obj',
  regular() {
    return this.name; // "obj"
  },
  arrow: () => {
    return this.name; // undefined（继承外层 this）
  },
};
```

## Map vs Object

| 特性 | Map | Object |
|------|-----|--------|
| 键的类型 | 任意类型 | 字符串/Symbol |
| 顺序 | 有插入顺序 | 无序 |
| 大小 | `size` 属性 | 需手动计算 |
| 迭代 | 可直接迭代 | 需 `Object.keys()` |

```javascript
const map = new Map();
map.set(1, 'number');
map.set('1', 'string');
map.set(true, 'boolean');

console.log(map.size); // 3
```

## 可选链和空值合并

```javascript
// 可选链 ?.
const user = { address: { city: 'Beijing' } };
console.log(user?.address?.city);   // "Beijing"
console.log(user?.contact?.phone);  // undefined（不会报错）

// 空值合并 ??
const value = null ?? 'default';  // "default"
const value2 = 0 ?? 'default';    // 0（只判断 null/undefined）
const value3 = '' ?? 'default';   // ""
```

## 关键点

- `??` 只在左侧为 `null` 或 `undefined` 时取右侧值
- `||` 在左侧为 falsy 值时取右侧值（包括 `0`、`''`、`false`）
- 箭头函数没有自己的 `this`，不能用作构造函数
- `WeakMap`/`WeakSet` 的键是弱引用，适合存储 DOM 节点等
