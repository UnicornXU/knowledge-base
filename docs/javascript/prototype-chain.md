---
sidebar_position: 4
title: "原型链与继承"
difficulty: "medium"
tags: ["javascript", "prototype", "inheritance"]
---

# 原型链与继承

## 原型三角关系

```
constructor ←─── prototype
    │                │
    │                │
    └── instance ────┘
         __proto__
```

```javascript
function Person(name) {
  this.name = name;
}

Person.prototype.sayHello = function () {
  return `Hello, I'm ${this.name}`;
};

const p = new Person('Tom');

p.__proto__ === Person.prototype;           // true
Person.prototype.constructor === Person;    // true
p.constructor === Person;                   // true（沿原型链查找）
```

## new 操作符的实现

```javascript
function myNew(Constructor, ...args) {
  // 1. 创建一个空对象，原型指向构造函数的 prototype
  const obj = Object.create(Constructor.prototype);
  // 2. 执行构造函数，this 指向新对象
  const result = Constructor.apply(obj, args);
  // 3. 如果构造函数返回了对象，则返回该对象；否则返回新对象
  return result instanceof Object ? result : obj;
}
```

## 继承的几种方式

### ES6 Class 继承（推荐）

```javascript
class Animal {
  constructor(name) {
    this.name = name;
  }
  speak() {
    return `${this.name} makes a sound`;
  }
}

class Dog extends Animal {
  speak() {
    return `${this.name} barks`;
  }
}
```

### 寄生组合继承

```javascript
function Parent(name) {
  this.name = name;
}
Parent.prototype.sayName = function () {
  return this.name;
};

function Child(name, age) {
  Parent.call(this, name);
  this.age = age;
}

Child.prototype = Object.create(Parent.prototype);
Child.prototype.constructor = Child;
```

## instanceof 原理

```javascript
function myInstanceof(obj, Constructor) {
  let proto = Object.getPrototypeOf(obj);
  while (proto !== null) {
    if (proto === Constructor.prototype) return true;
    proto = Object.getPrototypeOf(proto);
  }
  return false;
}
```

## 关键点

- 每个对象都有 `__proto__` 指向其构造函数的 `prototype`
- 原型链的终点是 `null`（`Object.prototype.__proto__ === null`）
- `hasOwnProperty` 检查自身属性，`in` 操作符会检查原型链
- ES6 `class` 本质是寄生组合继承的语法糖
