---
sidebar_position: 2
title: "工具类型"
difficulty: "medium"
tags: ["typescript", "utility-types"]
---

# 工具类型

## 内置工具类型速查

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
}

// Partial<T> - 所有属性可选
type PartialUser = Partial<User>;
// { id?: number; name?: string; email?: string; age?: number }

// Required<T> - 所有属性必选
type RequiredUser = Required<PartialUser>;

// Readonly<T> - 所有属性只读
type ReadonlyUser = Readonly<User>;

// Pick<T, K> - 选取属性
type UserBasic = Pick<User, 'id' | 'name'>;
// { id: number; name: string }

// Omit<T, K> - 排除属性
type UserWithoutEmail = Omit<User, 'email'>;
// { id: number; name: string; age: number }

// Record<K, V> - 构造键值对类型
type UserMap = Record<string, User>;

// Exclude<T, U> - 从联合类型中排除
type Status = 'active' | 'inactive' | 'deleted';
type ActiveStatus = Exclude<Status, 'deleted'>;
// 'active' | 'inactive'

// Extract<T, U> - 从联合类型中提取
type CommonStatus = Extract<Status, 'active' | 'deleted'>;
// 'active' | 'deleted'

// NonNullable<T> - 排除 null 和 undefined
type NullableString = string | null | undefined;
type SafeString = NonNullable<NullableString>; // string

// ReturnType<T> - 获取函数返回类型
type Fn = () => Promise<User>;
type Result = ReturnType<Fn>; // Promise<User>

// Parameters<T> - 获取函数参数类型
type Fn2 = (name: string, age: number) => void;
type Params = Parameters<Fn2>; // [string, number]
```

## 实战：表单类型

```typescript
// 通用表单状态类型
type FormState<T> = {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
};

// 使用
interface LoginForm {
  username: string;
  password: string;
}

const state: FormState<LoginForm> = {
  values: { username: '', password: '' },
  errors: {},
  touched: {},
  isSubmitting: false,
};
```

## 关键点

- `Partial` 适合更新操作（只传需要修改的字段）
- `Pick`/`Omit` 适合从已有类型派生子类型
- `Record` 适合构造映射类型
- 可以组合使用：`Partial<Pick<User, 'name' | 'age'>>`
