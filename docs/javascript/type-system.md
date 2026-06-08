---
sidebar_position: 2
title: "类型系统与类型判断"
difficulty: "easy"
tags: ["javascript", "type"]
---

# 类型系统与类型判断

## JavaScript 有哪些数据类型？

**原始类型（Primitive）**：`string`、`number`、`bigint`、`boolean`、`undefined`、`symbol`、`null`

**引用类型（Reference）**：`Object`（包括 `Array`、`Function`、`Date`、`RegExp` 等）

## typeof vs instanceof

```javascript
typeof null          // "object"（历史遗留 bug）
typeof []            // "object"
typeof function(){}  // "function"

[] instanceof Array  // true
null instanceof Object // false
```

## 手写类型判断函数

```javascript
function getType(value) {
  return Object.prototype.toString.call(value).slice(8, -1).toLowerCase();
}

getType(null);       // "null"
getType([]);         // "array"
getType({});         // "object"
getType(new Date()); // "date"
getType(/abc/);      // "regexp"
```

## == 和 === 的区别

```javascript
// == 会进行类型转换
0 == ''        // true
0 == '0'       // true
false == '0'   // true
null == undefined // true

// === 严格相等，不做类型转换
0 === ''       // false
null === undefined // false
```

## Object.is() 与 === 的区别

```javascript
Object.is(+0, -0);    // false（=== 为 true）
Object.is(NaN, NaN);  // true（=== 为 false）
```

## 关键点

- `typeof null` 返回 `"object"` 是 JS 的历史 bug
- 判断数组推荐用 `Array.isArray()`
- 判断精确类型用 `Object.prototype.toString.call()`
- `==` 的隐式转换规则复杂，推荐始终使用 `===`
