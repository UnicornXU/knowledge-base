---
sidebar_position: 3
title: "类型体操"
difficulty: "hard"
tags: ["typescript", "type-challenges"]
---

# 类型体操

## 实现 Trim

```typescript
type Whitespace = ' ' | '\n' | '\t';

type TrimLeft<S extends string> = S extends `${Whitespace}${infer Rest}`
  ? TrimLeft<Rest>
  : S;

type TrimRight<S extends string> = S extends `${infer Rest}${Whitespace}`
  ? TrimRight<Rest>
  : S;

type Trim<S extends string> = TrimRight<TrimLeft<S>>;

type T1 = Trim<'  hello  '>; // 'hello'
```

## 实现 DeepReadonly

```typescript
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object
    ? T[K] extends Function
      ? T[K]
      : DeepReadonly<T[K]>
    : T[K];
};

interface Config {
  api: {
    url: string;
    timeout: number;
  };
  theme: {
    color: string;
  };
}

type ReadonlyConfig = DeepReadonly<Config>;
// {
//   readonly api: { readonly url: string; readonly timeout: number; };
//   readonly theme: { readonly color: string; };
// }
```

## 实现 Promise.all 的类型

```typescript
declare function PromiseAll<T extends any[]>(
  values: readonly [...T]
): Promise<{
  [K in keyof T]: T[K] extends Promise<infer R> ? R : T[K];
}>;

// 测试
const p1 = Promise.resolve(1);
const p2 = Promise.resolve('hello');
const p3 = 42;

const result = PromiseAll([p1, p2, p3]);
// Promise<[number, string, number]>
```

## 实现 Fibonacci

```typescript
type Fibonacci<
  N extends number,
  Prev extends any[] = [],
  Curr extends any[] = [any],
  Index extends any[] = [any]
> = Index['length'] extends N
  ? Curr['length']
  : Fibonacci<N, Curr, [...Prev, ...Curr], [...Index, any]>;

type F1 = Fibonacci<1>;  // 1
type F2 = Fibonacci<2>;  // 1
type F3 = Fibonacci<3>;  // 2
type F4 = Fibonacci<8>;  // 21
```

## 关键点

- 类型体操的核心工具：`extends`、`infer`、模板字符串类型、递归
- 数组的 `['length']` 属性可用于类型级别的数值计算
- 模板字符串类型可以做字符串的解析和构造
- 实际项目中不需要过于复杂的类型体操，保持可读性优先
