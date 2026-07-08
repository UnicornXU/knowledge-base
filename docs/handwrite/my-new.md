---
sidebar_position: 6
title: 手写 new 操作符
---

# ✍️ 手写 new 操作符

## 题目描述

实现一个 `myNew` 函数，模拟 `new` 操作符的行为。

**new 操作符的执行过程：**
1. 创建一个新的空对象
2. 将新对象的 `__proto__` 指向构造函数的 `prototype`
3. 将构造函数的 `this` 指向新对象并执行
4. 如果构造函数返回对象，则使用该对象；否则返回新对象

## 核心思路

```
new Constructor(arg1, arg2)

等价于：
1. let obj = {}                    // 创建空对象
2. obj.__proto__ = Constructor.prototype  // 连接原型链
3. let result = Constructor.apply(obj, [arg1, arg2])  // 执行构造函数
4. return typeof result === 'object' ? result : obj  // 处理返回值
```

```
原型链关系：
instance.__proto__ === Constructor.prototype
Constructor.prototype.constructor === Constructor
```

## 实现代码

### 基础版

```javascript
/**
 * 模拟 new 操作符
 * @param {Function} Constructor - 构造函数
 * @param {...*} args - 参数
 * @returns {Object} 新实例
 */
function myNew(Constructor, ...args) {
  // 1. 创建新对象，原型指向构造函数的 prototype
  const obj = Object.create(Constructor.prototype);

  // 2. 执行构造函数，将 this 指向新对象
  const result = Constructor.apply(obj, args);

  // 3. 如果构造函数返回了对象，则使用该对象；否则返回新对象
  return typeof result === 'object' && result !== null ? result : obj;
}
```

### 完整版（更多边界处理）

```javascript
/**
 * 完整版 new 操作符实现
 * @param {Function} Constructor - 构造函数
 * @param {...*} args - 参数
 * @returns {Object} 新实例
 */
function myNewComplete(Constructor, ...args) {
  // 验证 Constructor 必须是函数
  if (typeof Constructor !== 'function') {
    throw new TypeError(`${Constructor} is not a constructor`);
  }

  // 1. 创建新对象，连接原型链
  // Object.create 等价于：
  // const obj = {};
  // obj.__proto__ = Constructor.prototype;
  const obj = Object.create(Constructor.prototype);

  // 2. 执行构造函数，绑定 this 为新对象
  const result = Constructor.apply(obj, args);

  // 3. 判断返回值
  // 如果构造函数返回了对象或函数，则使用该返回值
  // 否则返回新创建的对象
  if (
    (typeof result === 'object' && result !== null) ||
    typeof result === 'function'
  ) {
    return result;
  }

  // 如果返回的是基本类型（或 undefined），则忽略，返回新对象
  return obj;
}
```

### 不使用 Object.create 的版本

```javascript
/**
 * 不使用 Object.create 的 new 实现
 * 手动设置 __proto__
 */
function myNewLegacy(Constructor, ...args) {
  // 1. 创建空对象
  const obj = {};

  // 2. 设置原型链
  // 注意：__proto__ 是非标准属性，但所有现代浏览器都支持
  // 标准方法是 Object.setPrototypeOf()
  Object.setPrototypeOf(obj, Constructor.prototype);

  // 3. 执行构造函数
  const result = Constructor.apply(obj, args);

  // 4. 处理返回值
  if (typeof result === 'object' && result !== null) {
    return result;
  }

  return obj;
}
```

## 使用示例

```javascript
// ===== 基本用法 =====
function Person(name, age) {
  this.name = name;
  this.age = age;
}

Person.prototype.sayHello = function () {
  return `Hello, I'm ${this.name}`;
};

const p1 = myNew(Person, 'Alice', 25);
console.log(p1); // Person { name: 'Alice', age: 25 }
console.log(p1.sayHello()); // "Hello, I'm Alice"
console.log(p1 instanceof Person); // true
console.log(p1.__proto__ === Person.prototype); // true

// ===== 构造函数返回对象 =====
function Special() {
  this.a = 1;
  // 返回一个对象，new 的结果将是这个对象
  return { b: 2 };
}

const s = myNew(Special);
console.log(s); // { b: 2 }（不是 Special 的实例）
console.log(s instanceof Special); // false

// ===== 构造函数返回基本类型 =====
function WithReturn() {
  this.a = 1;
  return 123; // 基本类型会被忽略
}

const w = myNew(WithReturn);
console.log(w); // { a: 1 }（返回值被忽略）
console.log(w instanceof WithReturn); // true

// ===== 空构造函数 =====
function Empty() {}

const e = myNew(Empty);
console.log(e); // {}（空对象）
console.log(e instanceof Empty); // true

// ===== 继承场景 =====
function Animal(name) {
  this.name = name;
}

Animal.prototype.speak = function () {
  return `${this.name} speaks`;
};

function Dog(name, breed) {
  Animal.call(this, name); // 调用父构造函数
  this.breed = breed;
}

// 设置原型链
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;

const dog = myNew(Dog, 'Rex', 'German Shepherd');
console.log(dog.speak()); // "Rex speaks"
console.log(dog instanceof Dog); // true
console.log(dog instanceof Animal); // true
```

## 边界情况

- **构造函数返回对象**：如果构造函数显式返回一个对象，new 表达式的结果是该对象，而不是新创建的实例
- **构造函数返回基本类型**：返回基本类型（包括 null 和 undefined）会被忽略，仍然返回新创建的实例
- **this 上下文**：构造函数中的 this 必须指向新创建的对象
- **原型链**：新对象的 `__proto__` 必须正确指向构造函数的 prototype
- **非函数调用**：如果 Constructor 不是函数，应抛出 TypeError

## 复杂度分析

- **时间复杂度**：O(1) —— 创建对象和设置原型是常数操作
- **空间复杂度**：O(1) —— 只创建一个新对象

## 面试追问

1. **`new` 操作符具体做了哪几件事？**
   - 创建一个新的空对象 `{}`
   - 将新对象的 `__proto__` 指向构造函数的 `prototype`
   - 将构造函数的 `this` 指向新对象并执行构造函数
   - 如果构造函数返回对象，则返回该对象；否则返回新创建的对象

2. **`Object.create(null)` 和 `{}` 有什么区别？**
   ```javascript
   const obj1 = {};
   const obj2 = Object.create(null);

   console.log(obj1.__proto__); // Object.prototype
   console.log(obj2.__proto__); // undefined

   // obj2 没有继承任何属性和方法
   console.log(obj2.toString); // undefined
   ```

3. **`new.target` 是什么？有什么用途？**
   ```javascript
   function Foo() {
     console.log(new.target);
   }

   Foo();           // undefined（不是 new 调用）
   new Foo();       // [Function: Foo]（new 调用）

   // 用途：强制只能通过 new 调用
   function Bar() {
     if (!new.target) {
       throw new Error('必须使用 new 调用');
     }
   }
   ```

4. **ES6 的 class 和 function 构造函数有什么区别？**
   - class 必须通过 new 调用，普通函数不需要
   - class 不存在变量提升（TDZ）
   - class 中的所有方法都是不可枚举的
   - class 内部默认使用严格模式

5. **如何实现一个只能被 new 调用的函数（不能直接调用）？**
   ```javascript
   function OnlyNew() {
     if (!new.target) {
       throw new TypeError('Cannot call a class as a function');
     }
   }

   // 或者使用 class
   class OnlyNewClass {
     constructor() {
       // class 自动限制只能 new 调用
     }
   }
   ```

6. **手写 new 和原生 new 有什么性能差异？**
   - 原生 new 由引擎内部优化，性能更好
   - 手写版本涉及函数调用和属性查找，有额外开销
   - 实际开发中应使用原生 new，手写只是为了考察理解
