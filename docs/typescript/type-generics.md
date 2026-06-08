---
sidebar_position: 1
title: "泛型"
difficulty: "medium"
tags: ["typescript", "generics"]
---

# 泛型

## 什么是泛型？

泛型（Generics）允许你创建可复用的组件，这些组件可以支持多种类型而非单一类型。

```typescript
// 泛型函数
function identity<T>(arg: T): T {
  return arg;
}

identity<string>('hello'); // 显式指定
identity(42);              // 类型推断

// 泛型接口
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// 泛型类
class Stack<T> {
  private items: T[] = [];
  push(item: T) { this.items.push(item); }
  pop(): T | undefined { return this.items.pop(); }
}
```

## 泛型约束

```typescript
// 使用 extends 约束泛型
interface HasLength {
  length: number;
}

function logLength<T extends HasLength>(arg: T): T {
  console.log(arg.length);
  return arg;
}

logLength('hello');     // OK
logLength([1, 2, 3]);   // OK
// logLength(123);      // Error: number 没有 length 属性

// keyof 约束
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { name: 'Tom', age: 18 };
getProperty(user, 'name'); // OK
// getProperty(user, 'xxx'); // Error
```

## 条件类型

```typescript
// 基础条件类型
type IsString<T> = T extends string ? 'yes' : 'no';

type A = IsString<string>;  // 'yes'
type B = IsString<number>;  // 'no'

// infer 关键字
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

type Fn = () => string;
type Result = ReturnType<Fn>; // string

// 提取 Promise 的类型
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
type C = UnwrapPromise<Promise<string>>; // string
```

## 常见泛型工具类型

```typescript
// Partial - 所有属性变为可选
type Partial<T> = { [P in keyof T]?: T[P] };

// Required - 所有属性变为必选
type Required<T> = { [P in keyof T]-?: T[P] };

// Pick - 选取部分属性
type Pick<T, K extends keyof T> = { [P in K]: T[P] };

// Omit - 排除部分属性
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
```

## 关键点

- 泛型是类型系统的"参数"，让函数/类型更灵活
- `extends` 用于约束泛型的范围
- `infer` 在条件类型中提取类型
- 泛型不会增加运行时开销（编译后被擦除）
