---
sidebar_position: 5
title: 手写 call/apply/bind
---

# ✍️ 手写 call/apply/bind

## 题目描述

手动实现 `Function.prototype.call`、`Function.prototype.apply` 和 `Function.prototype.bind` 方法。

**核心考察点：**
- `this` 绑定机制
- 函数上下文切换
- 原型链理解

## 核心思路

```
call/apply 核心：
1. 将函数设置为对象的临时方法
2. 调用该方法（此时 this 指向对象）
3. 删除临时方法
4. 返回结果

bind 核心：
1. 返回一个新函数
2. 新函数执行时调用原函数，并绑定指定的 this
3. 支持柯里化（预设参数）
```

## 实现代码

### 实现 call

```javascript
/**
 * 实现 Function.prototype.call
 * @param {*} context - this 上下文
 * @param {...*} args - 参数列表
 * @returns {*} 函数执行结果
 */
Function.prototype.myCall = function (context, ...args) {
  // 如果 context 是 null 或 undefined，指向全局对象
  // 如果是基本类型值，会自动装箱（如 1 → Number(1)）
  context = context == null ? globalThis : Object(context);

  // 生成唯一的 key，避免属性冲突
  const fnKey = Symbol();

  // 将当前函数（this）设置为 context 的临时方法
  context[fnKey] = this;

  // 调用该方法，此时 this 指向 context
  const result = context[fnKey](...args);

  // 删除临时方法
  delete context[fnKey];

  // 返回结果
  return result;
};
```

### 实现 apply

```javascript
/**
 * 实现 Function.prototype.apply
 * 与 call 类似，但参数以数组形式传入
 * @param {*} context - this 上下文
 * @param {Array} args - 参数数组
 * @returns {*} 函数执行结果
 */
Function.prototype.myApply = function (context, args = []) {
  // 验证参数
  if (!Array.isArray(args)) {
    throw new TypeError('CreateListFromArrayLike called on non-object');
  }

  context = context == null ? globalThis : Object(context);

  const fnKey = Symbol();
  context[fnKey] = this;

  // 使用展开运算符将数组展开为参数列表
  const result = context[fnKey](...args);

  delete context[fnKey];

  return result;
};
```

### 实现 bind

```javascript
/**
 * 实现 Function.prototype.bind
 * 返回一个新函数，绑定指定的 this 和预设参数
 * @param {*} context - this 上下文
 * @param {...*} presetArgs - 预设参数
 * @returns {Function} 绑定后的新函数
 */
Function.prototype.myBind = function (context, ...presetArgs) {
  // 保存原函数的引用
  const originalFn = this;

  // 验证 this 必须是函数
  if (typeof originalFn !== 'function') {
    throw new TypeError('myBind must be called on a function');
  }

  // 返回绑定函数
  const boundFn = function (...args) {
    // 判断是否通过 new 调用（bind 返回的函数被 new 调用时，this 指向新实例）
    // 如果 this 是 boundFn 的实例，说明是 new 调用
    if (this instanceof boundFn) {
      // 使用原函数构造新实例，合并参数
      return new originalFn(...presetArgs, ...args);
    }

    // 普通调用，绑定 context
    return originalFn.apply(context, [...presetArgs, ...args]);
  };

  // 维护原型链（如果原函数有 prototype）
  if (originalFn.prototype) {
    boundFn.prototype = Object.create(originalFn.prototype);
  }

  return boundFn;
};
```

### 完整版 bind（处理 new 调用细节）

```javascript
/**
 * 完整版 bind 实现
 * 正确处理 new 调用时的 this 指向
 */
Function.prototype.myBindComplete = function (context, ...presetArgs) {
  const originalFn = this;

  if (typeof originalFn !== 'function') {
    throw new TypeError('myBindComplete must be called on a function');
  }

  // 中间空函数，用于继承原型（避免修改 boundFn.prototype 影响原函数）
  const Empty = function () {};

  const boundFn = function (...args) {
    // 判断是否通过 new 调用
    // 如果 this instanceof Empty，说明是 new boundFn()
    // 此时 this 应该指向新实例，而不是 context
    const isNewCall = this instanceof Empty;

    return originalFn.apply(
      isNewCall ? this : context,
      [...presetArgs, ...args]
    );
  };

  // 如果原函数有 prototype，建立原型链
  if (originalFn.prototype) {
    Empty.prototype = originalFn.prototype;
    boundFn.prototype = new Empty();
  }

  return boundFn;
};
```

## 使用示例

```javascript
// ===== call 示例 =====
const person1 = { name: 'Alice' };
const person2 = { name: 'Bob' };

function greet(greeting, punctuation) {
  return `${greeting}, ${this.name}${punctuation}`;
}

console.log(greet.myCall(person1, 'Hello', '!')); // "Hello, Alice!"
console.log(greet.myCall(person2, 'Hi', '?'));    // "Hi, Bob?"

// call 实现继承
function Parent(name) {
  this.name = name;
}

function Child(name, age) {
  Parent.myCall(this, name);
  this.age = age;
}

const child = new Child('Tom', 18);
console.log(child); // { name: 'Tom', age: 18 }

// ===== apply 示例 =====
// apply 适合参数是数组的场景
const numbers = [5, 6, 2, 3, 7];
const max = Math.max.myApply(null, numbers);
console.log(max); // 7

// 等价于
// Math.max.apply(null, [5, 6, 2, 3, 7])

// ===== bind 示例 =====
const module = {
  x: 42,
  getX: function () {
    return this.x;
  },
};

const unboundGetX = module.getX;
console.log(unboundGetX()); // undefined（this 指向全局）

const boundGetX = unboundGetX.myBind(module);
console.log(boundGetX()); // 42

// 预设参数（柯里化）
function multiply(a, b) {
  return a * b;
}

const double = multiply.myBind(null, 2);
console.log(double(5)); // 10
console.log(double(10)); // 20

// bind 返回的函数被 new 调用
function Person(name, age) {
  this.name = name;
  this.age = age;
}

const BoundPerson = Person.myBind(null, 'Alice');
const p = new BoundPerson(25);
console.log(p); // Person { name: 'Alice', age: 25 }
console.log(p instanceof Person); // true
```

## 边界情况

- **context 为 null/undefined**：指向全局对象（严格模式下为 undefined）
- **context 为基本类型**：自动装箱（如 `1` 变成 `Number(1)`）
- **bind 返回的函数被 new 调用**：this 应指向新实例，而不是绑定的 context
- **原型链维护**：bind 返回的函数需要继承原函数的 prototype
- **Symbol 属性**：使用 `Symbol()` 作为临时属性 key，避免覆盖已有属性

## 复杂度分析

- **时间复杂度**：O(1) —— call/apply 只是函数调用，bind 只是创建新函数
- **空间复杂度**：O(1) —— 只存储少量临时变量

## 面试追问

1. **call、apply、bind 三者的区别？**
   | 方法 | 参数 | 返回值 | 是否立即执行 |
   |------|------|--------|-------------|
   | call | 逐个传参 | 函数结果 | 是 |
   | apply | 数组传参 | 函数结果 | 是 |
   | bind | 逐个传参（支持柯里化） | 新函数 | 否 |

2. **手写的 call 和原生 call 有什么区别？**
   - 原生 call 不会在 context 上添加临时属性（使用内部槽位）
   - 手写版本会临时添加属性（虽然用 Symbol 避免冲突，但仍有微小差异）
   - 原生 call 性能更好

3. **为什么 bind 返回的函数可以被 new 调用？**
   - ES5 规范规定 bind 返回的函数必须支持 new
   - new 调用时 this 指向新实例，而不是绑定的 context
   - 原型链也需要正确维护

4. **如何判断一个函数是否是通过 new 调用的？**
   ```javascript
   function Foo() {
     if (!(this instanceof Foo)) {
       // 不是 new 调用
     }
   }
   // 或者使用 new.target
   function Bar() {
     if (!new.target) {
       // 不是 new 调用
     }
   }
   ```

5. **箭头函数的 this 指向？能否用 call/apply/bind 改变？**
   - 箭头函数没有自己的 this，this 继承自外层作用域
   - call/apply/bind 无法改变箭头函数的 this 指向
   - 箭头函数也没有 prototype 属性，不能被 new

6. **实际开发中 bind 的常见场景？**
   - React 类组件中绑定事件处理函数
   - 回调函数中保持 this 指向
   - 函数柯里化
