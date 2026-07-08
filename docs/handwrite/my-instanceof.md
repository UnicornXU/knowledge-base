---
sidebar_position: 7
title: 手写 instanceof
---

# ✍️ 手写 instanceof

## 题目描述

实现一个 `myInstanceof` 函数，模拟 `instanceof` 操作符的行为。

**instanceof 的作用：**
检测构造函数的 `prototype` 是否出现在实例对象的原型链上。

## 核心思路

```
instance instanceof Constructor

沿原型链向上查找：
instance.__proto__ === Constructor.prototype ? true
instance.__proto__.__proto__ === Constructor.prototype ? true
...
直到找到 Object.prototype.__proto__ === null 为止
```

```
原型链示例：
const arr = [1, 2, 3];

arr.__proto__ === Array.prototype        // true
arr.__proto__.__proto__ === Object.prototype  // true
arr.__proto__.__proto__.__proto__ === null    // 原型链结束

所以：
arr instanceof Array   // true
arr instanceof Object  // true
arr instanceof Function // false
```

## 实现代码

### 基础版

```javascript
/**
 * 模拟 instanceof 操作符
 * @param {*} instance - 要检测的实例
 * @param {Function} Constructor - 构造函数
 * @returns {boolean} 是否是该构造函数的实例
 */
function myInstanceof(instance, Constructor) {
  // 基本类型直接返回 false
  if (instance === null || (typeof instance !== 'object' && typeof instance !== 'function')) {
    return false;
  }

  // 获取实例的原型
  let proto = Object.getPrototypeOf(instance);

  // 沿原型链向上查找
  while (proto !== null) {
    // 如果找到匹配的 prototype，返回 true
    if (proto === Constructor.prototype) {
      return true;
    }
    // 继续向上查找
    proto = Object.getPrototypeOf(proto);
  }

  // 遍历完原型链都没找到，返回 false
  return false;
}
```

### 完整版（更多边界处理）

```javascript
/**
 * 完整版 instanceof 实现
 * @param {*} instance - 要检测的实例
 * @param {Function} Constructor - 构造函数
 * @returns {boolean} 是否是该构造函数的实例
 */
function myInstanceofComplete(instance, Constructor) {
  // 处理 null 和 undefined
  if (instance == null) {
    return false;
  }

  // 处理基本类型（基本类型没有原型链）
  if (typeof instance !== 'object' && typeof instance !== 'function') {
    return false;
  }

  // Constructor 必须是函数或对象
  if (typeof Constructor !== 'function') {
    throw new TypeError('Right-hand side of instanceof is not callable');
  }

  // 处理 Symbol.hasInstance（ES6 可自定义 instanceof 行为）
  if (typeof Constructor[Symbol.hasInstance] === 'function') {
    return Constructor[Symbol.hasInstance](instance);
  }

  // 获取 Constructor.prototype
  const targetPrototype = Constructor.prototype;

  // 如果 Constructor.prototype 不是对象，抛出错误
  if (typeof targetPrototype !== 'object' && typeof targetPrototype !== 'function') {
    throw new TypeError('Function has non-object prototype in instanceof check');
  }

  // 沿原型链查找
  let proto = Object.getPrototypeOf(instance);

  while (proto !== null) {
    if (proto === targetPrototype) {
      return true;
    }
    proto = Object.getPrototypeOf(proto);
  }

  return false;
}
```

### 不使用 Object.getPrototypeOf 的版本

```javascript
/**
 * 不使用 Object.getPrototypeOf 的版本
 * 使用 __proto__ 属性（非标准但广泛支持）
 */
function myInstanceofLegacy(instance, Constructor) {
  if (instance === null || typeof instance !== 'object') {
    return false;
  }

  if (typeof Constructor !== 'function') {
    throw new TypeError('Right-hand side of instanceof is not callable');
  }

  let proto = instance.__proto__;

  while (proto !== null) {
    if (proto === Constructor.prototype) {
      return true;
    }
    proto = proto.__proto__;
  }

  return false;
}
```

## 使用示例

```javascript
// ===== 基本类型 =====
console.log(myInstanceof(123, Number));       // false（基本类型）
console.log(myInstanceof('abc', String));     // false（基本类型）
console.log(myInstanceof(true, Boolean));     // false（基本类型）
console.log(myInstanceof(null, Object));      // false（null）

// 注意：new Number(123) 创建的是对象
console.log(myInstanceof(new Number(123), Number)); // true

// ===== 对象类型 =====
console.log(myInstanceof({}, Object));              // true
console.log(myInstanceof([], Array));               // true
console.log(myInstanceof([], Object));              // true（Array 继承自 Object）
console.log(myInstanceof(/abc/, RegExp));           // true
console.log(myInstanceof(new Date(), Date));        // true
console.log(myInstanceof(new Map(), Map));          // true
console.log(myInstanceof(new Set(), Set));          // true

// ===== 函数 =====
console.log(myInstanceof(function(){}, Function));  // true
console.log(myInstanceof(function(){}, Object));    // true
console.log(myInstanceof(() => {}, Function));      // true

// ===== 自定义类 =====
class Animal {}
class Dog extends Animal {}

const dog = new Dog();
console.log(myInstanceof(dog, Dog));     // true
console.log(myInstanceof(dog, Animal));  // true
console.log(myInstanceof(dog, Object));  // true

// ===== 构造函数 =====
function Person(name) {
  this.name = name;
}

Person.prototype.sayHello = function () {
  return `Hello, ${this.name}`;
};

const person = new Person('Alice');
console.log(myInstanceof(person, Person)); // true
console.log(myInstanceof(person, Object)); // true

// ===== Symbol.hasInstance =====
class CustomCheck {
  static [Symbol.hasInstance](instance) {
    return typeof instance === 'number' && instance > 0;
  }
}

console.log(myInstanceofComplete(5, CustomCheck));   // true
console.log(myInstanceofComplete(-5, CustomCheck));  // false
```

## 边界情况

- **基本类型**：`instanceof` 对基本类型返回 `false`（即使 `Number.prototype` 存在）
- **null 和 undefined**：不是任何对象的实例
- **Constructor 必须是函数**：如果 Constructor 不是函数，抛出 TypeError
- **原型链循环**：正常情况下原型链不会有循环，但即使有也不会死循环（最终会到达 null）
- **Symbol.hasInstance**：ES6 允许自定义 instanceof 行为
- **跨 iframe 问题**：不同 iframe 的 Array 构造函数不同，`instanceof` 可能失败

## 复杂度分析

- **时间复杂度**：O(n) —— n 为原型链的深度
- **空间复杂度**：O(1) —— 只使用常量空间

## 面试追问

1. **`instanceof` 和 `typeof` 有什么区别？**
   | 特性 | typeof | instanceof |
   |------|--------|------------|
   | 检测基本类型 | 支持 | 不支持 |
   | 检测对象类型 | 只能检测 object | 可以区分具体类型 |
   | 检测 null | 返回 "object" | 返回 false |
   | 原理 | 检测类型标签 | 检测原型链 |

2. **`instanceof` 能检测基本类型吗？**
   ```javascript
   // 基本类型返回 false
   123 instanceof Number;        // false
   'abc' instanceof String;      // false

   // 包装对象返回 true
   new Number(123) instanceof Number;  // true
   new String('abc') instanceof String; // true
   ```

3. **如何优雅地检测数组？**
   ```javascript
   // 最推荐：使用 Array.isArray
   Array.isArray([]); // true

   // 其他方法
   [].constructor === Array; // true
   Object.prototype.toString.call([]) === '[object Array]'; // true
   [] instanceof Array; // true（但跨 iframe 有问题）
   ```

4. **什么是 Symbol.hasInstance？如何使用？**
   ```javascript
   class Even {
     static [Symbol.hasInstance](num) {
       return typeof num === 'number' && num % 2 === 0;
     }
   }

   2 instanceof Even; // true
   3 instanceof Even; // false
   ```

5. **为什么跨 iframe 的 Array 检测会失败？**
   ```javascript
   // 每个 iframe 有自己的 Array 构造函数
   const iframe = document.createElement('iframe');
   document.body.appendChild(iframe);
   const iframeArray = iframe.contentWindow.Array;

   const arr = new iframeArray(1, 2, 3);

   arr instanceof Array;          // false（主页面的 Array）
   arr instanceof iframeArray;    // true（iframe 的 Array）
   Array.isArray(arr);            // true（推荐方式）
   ```

6. **手写 instanceof 和原生 instanceof 有什么区别？**
   - 原生 instanceof 由引擎内部实现，性能更好
   - 手写版本需要遍历原型链，性能稍差
   - 原生 instanceof 处理了更多边界情况
   - 实际开发中应使用原生 instanceof
