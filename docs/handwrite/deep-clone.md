---
sidebar_position: 4
title: 手写深拷贝
---

# ✍️ 手写深拷贝（Deep Clone）

## 题目描述

实现一个深拷贝函数 `deepClone`，能够对对象进行深拷贝，支持常见数据类型，处理循环引用和特殊对象。

**需要支持的类型：**
- 基本类型（直接返回）
- 普通对象和数组
- Date、RegExp、Map、Set
- 循环引用

## 核心思路

```
原始值 → 直接返回
对象   → 创建新容器 → 递归拷贝每个属性 → 处理循环引用
特殊类型 → Date/RegExp/Map/Set 各自创建新实例
```

```
原始对象          深拷贝结果
┌─────────┐      ┌─────────┐
│ a: 1    │      │ a: 1    │
│ b: [1,2]│  →   │ b: [1,2]│  ← 新数组
│ c: {d:3}│      │ c: {d:3}│  ← 新对象
└─────────┘      └─────────┘
  内存地址不同，修改互不影响
```

关键点：
1. 使用 `WeakMap` 解决循环引用问题
2. 通过 `Object.getPrototypeOf` 获取原型链
3. 使用 `Object.create` 创建正确原型的对象
4. 针对不同内置类型使用对应的构造函数

## 实现代码

```javascript
/**
 * 深拷贝函数
 * 支持常见数据类型和循环引用
 * @param {*} source - 要拷贝的对象
 * @param {WeakMap} hash - 用于存储已拷贝对象的映射（解决循环引用）
 * @returns {*} 深拷贝后的对象
 */
function deepClone(source, hash = new WeakMap()) {
  // 1. 基本类型直接返回
  if (source === null || typeof source !== 'object') {
    return source;
  }

  // 2. 检查是否已经拷贝过（处理循环引用）
  if (hash.has(source)) {
    return hash.get(source);
  }

  // 3. 处理特殊对象类型
  // Date
  if (source instanceof Date) {
    return new Date(source);
  }

  // RegExp
  if (source instanceof RegExp) {
    return new RegExp(source.source, source.flags);
  }

  // Map
  if (source instanceof Map) {
    const mapClone = new Map();
    hash.set(source, mapClone);
    source.forEach((value, key) => {
      mapClone.set(deepClone(key, hash), deepClone(value, hash));
    });
    return mapClone;
  }

  // Set
  if (source instanceof Set) {
    const setClone = new Set();
    hash.set(source, setClone);
    source.forEach((value) => {
      setClone.add(deepClone(value, hash));
    });
    return setClone;
  }

  // 4. 处理普通对象和数组
  // 获取构造函数（可能是 Array 或 Object）
  const target = Array.isArray(source) ? [] : {};

  // 存入 hash 表，标记为已拷贝（必须在递归前，解决循环引用）
  hash.set(source, target);

  // 递归拷贝所有属性（包括 Symbol 属性）
  const keys = [...Object.keys(source), ...Object.getOwnPropertySymbols(source)];
  for (const key of keys) {
    // 确保是自身的属性，不是原型链上的
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      target[key] = deepClone(source[key], hash);
    }
  }

  return target;
}
```

### 完整版（支持更多边界情况）

```javascript
/**
 * 完整版深拷贝
 * 支持所有内置类型和边界情况
 */
function deepCloneComplete(source, hash = new WeakMap()) {
  // 基本类型直接返回
  if (source === null || typeof source !== 'object') {
    return source;
  }

  // 处理函数（通常函数不需要深拷贝，直接返回引用）
  if (typeof source === 'function') {
    return source;
  }

  // 循环引用检查
  if (hash.has(source)) {
    return hash.get(source);
  }

  // 处理特殊对象
  if (source instanceof Date) {
    return new Date(source.getTime());
  }

  if (source instanceof RegExp) {
    const clone = new RegExp(source.source, source.flags);
    clone.lastIndex = source.lastIndex;
    return clone;
  }

  if (source instanceof Error) {
    const clone = new source.constructor(source.message);
    clone.stack = source.stack;
    return clone;
  }

  if (source instanceof Map) {
    const clone = new Map();
    hash.set(source, clone);
    source.forEach((value, key) => {
      clone.set(deepCloneComplete(key, hash), deepCloneComplete(value, hash));
    });
    return clone;
  }

  if (source instanceof Set) {
    const clone = new Set();
    hash.set(source, clone);
    source.forEach((value) => {
      clone.add(deepCloneComplete(value, hash));
    });
    return clone;
  }

  if (source instanceof ArrayBuffer) {
    return source.slice(0);
  }

  if (source instanceof DataView) {
    return new DataView(source.buffer.slice(0), source.byteOffset, source.byteLength);
  }

  // TypedArray（如 Uint8Array, Float32Array 等）
  if (ArrayBuffer.isView(source)) {
    return new source.constructor(source);
  }

  // 5. 处理普通对象和数组
  // 获取原型，保持原型链
  const prototype = Object.getPrototypeOf(source);
  const target = Object.create(prototype);

  // 存入 hash 表
  hash.set(source, target);

  // 拷贝属性
  const keys = [
    ...Object.keys(source),
    ...Object.getOwnPropertySymbols(source),
  ];

  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      target[key] = deepCloneComplete(source[key], hash);
    }
  }

  return target;
}
```

## 使用示例

```javascript
// 基本对象
const obj1 = { a: 1, b: { c: 2 } };
const clone1 = deepClone(obj1);
clone1.b.c = 99;
console.log(obj1.b.c); // 2（原对象不受影响）

// 包含数组
const obj2 = { arr: [1, [2, 3], { a: 4 }] };
const clone2 = deepClone(obj2);
clone2.arr[1][0] = 99;
console.log(obj2.arr[1][0]); // 2

// 循环引用
const obj3 = {};
obj3.self = obj3; // 自引用
const clone3 = deepClone(obj3);
console.log(clone3.self === clone3); // true（循环引用保持）
console.log(clone3.self !== obj3); // true（不是原对象）

// 特殊类型
const obj4 = {
  date: new Date(),
  regex: /hello/gi,
  map: new Map([['key', 'value']]),
  set: new Set([1, 2, 3]),
};
const clone4 = deepClone(obj4);
console.log(clone4.date instanceof Date); // true
console.log(clone4.date !== obj4.date); // true
console.log(clone4.regex.flags); // "gi"

// Symbol 属性
const sym = Symbol('test');
const obj5 = { [sym]: 'symbol value', normal: 'normal' };
const clone5 = deepClone(obj5);
console.log(clone5[sym]); // "symbol value"
```

## 边界情况

- **循环引用**：使用 `WeakMap` 存储已拷贝对象，避免无限递归
- **特殊对象类型**：Date、RegExp、Map、Set 需要特殊处理
- **Symbol 属性**：`Object.keys()` 不包含 Symbol，需使用 `Object.getOwnPropertySymbols()`
- **函数**：通常函数不需要深拷贝，返回引用即可
- **原型链**：使用 `Object.getPrototypeOf` 和 `Object.create` 保持原型关系
- **TypedArray**：如 `Uint8Array`、`Float32Array` 等需要特殊处理
- **不可枚举属性**：通常深拷贝只拷贝可枚举属性
- **getter/setter**：深拷贝通常会触发 getter 并拷贝结果值

## 复杂度分析

- **时间复杂度**：O(n) —— n 为对象中所有属性的数量
- **空间复杂度**：O(n) —— 需要存储 n 个对象的映射关系

## 面试追问

1. **`JSON.parse(JSON.stringify())` 有什么局限性？**
   - 不能处理 `undefined`、`Function`、`Symbol`
   - 不能处理循环引用（会报错）
   - 不能处理 `Date`（变成字符串）、`RegExp`（变成空对象）
   - 不能处理 `Map`、`Set`
   - 会忽略 `undefined` 的键值对

2. **为什么用 `WeakMap` 而不是 `Map`？**
   - `WeakMap` 的键是弱引用，不会阻止垃圾回收
   - 如果原对象被销毁，`WeakMap` 中的引用也会被自动清理
   - 避免内存泄漏

3. **如何处理不可枚举属性？**
   ```javascript
   // 使用 Object.getOwnPropertyDescriptors 获取所有属性描述符
   const descriptors = Object.getOwnPropertyDescriptors(source);
   Object.defineProperties(target, descriptors);
   ```

4. **如何拷贝一个对象的 getter/setter？**
   - 使用 `Object.getOwnPropertyDescriptor` 获取属性描述符
   - 使用 `Object.defineProperty` 定义到新对象上
   - 注意：深拷贝 getter 时，可能会改变 this 指向

5. **有没有更简单的深拷贝方案？**
   ```javascript
   // structuredClone（浏览器原生支持）
   const clone = structuredClone(obj);
   // 优点：原生支持，性能好
   // 缺点：不能拷贝函数、DOM 节点等
   ```

6. **如何优化深拷贝的性能？**
   - 使用迭代代替递归（避免栈溢出）
   - 对于只包含基本类型的对象，可以使用 `JSON.parse(JSON.stringify())`
   - 使用 Worker 处理大对象的深拷贝
