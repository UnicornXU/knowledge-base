---
sidebar_position: 4
title: 数据表示
difficulty: medium
tags:
  - computer-basics
  - binary
  - floating-point
  - encoding
  - bitwise
---

# 🔢 数据表示

> **"计算机只认识 0 和 1"** —— 理解数据在计算机中的表示方式，是理解很多前端"怪异"行为的钥匙。

## 一、进制转换

### 1.1 常见进制

```
常见进制
═══════════════════════════════════════════════════════

二进制（Binary）    基数 2    0-1        0b1010 = 10
八进制（Octal）     基数 8    0-7        0o12 = 10
十进制（Decimal）   基数 10   0-9        10
十六进制（Hex）     基数 16   0-9, A-F   0xA = 10

转换方法：
十进制 → 二进制：除 2 取余，逆序排列
  10 ÷ 2 = 5 ... 0
   5 ÷ 2 = 2 ... 1
   2 ÷ 2 = 1 ... 0
   1 ÷ 2 = 0 ... 1
  结果：1010

二进制 → 十进制：按权展开
  1010 = 1×2³ + 0×2² + 1×2¹ + 0×2⁰ = 8 + 0 + 2 + 0 = 10
```

### 1.2 JavaScript 进制操作

```js
// 进制转换
(10).toString(2)      // "1010"  十进制 → 二进制
(10).toString(8)      // "12"    十进制 → 八进制
(10).toString(16)     // "a"     十进制 → 十六进制
parseInt('1010', 2)   // 10      二进制 → 十进制
parseInt('12', 8)     // 10      八进制 → 十进制
parseInt('a', 16)     // 10      十六进制 → 十进制

// 位运算直接操作二进制
0b1010 & 0b1100       // 0b1000 = 8  （按位与）
0b1010 | 0b1100       // 0b1110 = 14 （按位或）
0b1010 ^ 0b1100       // 0b0110 = 6  （按位异或）
~0b1010               // -11         （按位取反）
0b1010 << 2           // 0b101000 = 40 （左移）
0b1010 >> 1           // 0b101 = 5   （右移）
```

## 二、位运算

### 2.1 常见位运算技巧

```js
// 1. 判断奇偶
function isOdd(n) {
  return (n & 1) === 1;
}

// 2. 交换两个数（不用临时变量）
function swap(a, b) {
  a ^= b;
  b ^= a;
  a ^= b;
  return [a, b];
}

// 3. 取整（比 Math.floor 快）
function toInt(n) {
  return n | 0;
}
// 或
function toInt2(n) {
  return ~~n;
}

// 4. 2 的幂判断
function isPowerOf2(n) {
  return n > 0 && (n & (n - 1)) === 0;
}

// 5. 统计二进制中 1 的个数
function countBits(n) {
  let count = 0;
  while (n) {
    n &= (n - 1);  // 消除最低位的 1
    count++;
  }
  return count;
}

// 6. 找出唯一出现的数（其他都出现两次）
function singleNumber(nums) {
  return nums.reduce((a, b) => a ^ b, 0);
}
```

### 2.2 位运算在前端中的应用

```js
// 1. 权限系统
const READ = 0b001;    // 1
const WRITE = 0b010;   // 2
const EXECUTE = 0b100; // 4

let permission = READ | WRITE;  // 授予读写权限
permission |= EXECUTE;           // 添加执行权限
permission &= ~WRITE;            // 移除写权限
console.log(permission & READ);  // 检查是否有读权限

// 2. 位图（Bitmap）—— 快速判断
class BitMap {
  constructor(size) {
    this.bits = new Uint8Array(Math.ceil(size / 8));
  }

  set(index) {
    const byteIndex = Math.floor(index / 8);
    const bitIndex = index % 8;
    this.bits[byteIndex] |= (1 << bitIndex);
  }

  has(index) {
    const byteIndex = Math.floor(index / 8);
    const bitIndex = index % 8;
    return (this.bits[byteIndex] & (1 << bitIndex)) !== 0;
  }
}

// 3. 颜色操作（RGBA）
function rgba(r, g, b, a) {
  return ((r << 24) | (g << 16) | (b << 8) | a) >>> 0;
}

function getColorComponents(color) {
  return {
    r: (color >>> 24) & 0xff,
    g: (color >>> 16) & 0xff,
    b: (color >>> 8) & 0xff,
    a: color & 0xff,
  };
}
```

## 三、浮点数表示

### 3.1 IEEE 754 标准

```
IEEE 754 双精度浮点数（64位）
═══════════════════════════════════════════════════════

┌──────┬────────────┬────────────────────────────────────┐
│ 符号 │   指数      │             尾数                    │
│ 1位  │  11位      │             52位                    │
└──────┴────────────┴────────────────────────────────────┘

符号位（Sign）：0 = 正数，1 = 负数
指数位（Exponent）：偏移量 1023
尾数位（Mantissa）：隐含前导 1

公式：(-1)^S × 1.M × 2^(E-1023)

示例：0.1 的表示
  0.1 转二进制：0.0001100110011...（无限循环）
  IEEE 754：近似表示（精度丢失！）
  这就是 0.1 + 0.2 !== 0.3 的原因
```

### 3.2 浮点数精度问题

```js
// 经典问题
0.1 + 0.2 === 0.3  // false！

// 为什么？
// 0.1 → 0.00011001100110011001100110011001100110011001100110011010...
// 0.2 → 0.00110011001100110011001100110011001100110011001100110100...
// 两者都是无限循环小数，存储时有精度丢失

0.1 + 0.2  // 0.30000000000000004

// 解决方案
// 1. toFixed
(0.1 + 0.2).toFixed(10)  // "0.3000000000"
parseFloat((0.1 + 0.2).toFixed(10)) === 0.3  // true

// 2. 整数运算
(0.1 * 10 + 0.2 * 10) / 10 === 0.3  // true

// 3. Number.EPSILON
function equal(a, b) {
  return Math.abs(a - b) < Number.EPSILON;
}
equal(0.1 + 0.2, 0.3)  // true

// 4. BigInt（整数精度）
const a = 9007199254740993n;  // 超过 Number.MAX_SAFE_INTEGER
const b = 1n;
console.log(a + b);  // 9007199254740994n ✅
```

### 3.3 特殊数值

```js
// 特殊数值
Infinity           // 正无穷
-Infinity          // 负无穷
NaN                // Not a Number
-0                 // 负零（与 +0 不同）

// NaN 的特性
NaN === NaN        // false！
NaN !== NaN        // true！
typeof NaN         // 'number'
Number.isNaN(NaN)  // true（推荐）
isNaN('hello')     // true（会先类型转换，不推荐）

// 判断 NaN
function isNaNValue(x) {
  return x !== x;  // NaN 是唯一不等于自身的值
}

// 正零和负零
+0 === -0          // true
1 / +0             // Infinity
1 / -0             // -Infinity
Object.is(+0, -0)  // false

// 安全整数
Number.MAX_SAFE_INTEGER  // 9007199254740991 (2^53 - 1)
Number.MIN_SAFE_INTEGER  // -9007199254740991
Number.isSafeInteger(9007199254740992)  // false
```

## 四、字符编码

### 4.1 ASCII

```
ASCII 编码（7位，128个字符）
═══════════════════════════════════════════════════════

0-31    控制字符（不可打印）
32      空格
48-57   数字 0-9
65-90   大写字母 A-Z
97-122  小写字母 a-z

'A'.charCodeAt(0)  // 65
String.fromCharCode(65)  // 'A'
```

### 4.2 Unicode 与 UTF-8

```
Unicode 编码
═══════════════════════════════════════════════════════

Unicode 码点范围：
U+0000 - U+007F    ASCII（1字节）
U+0080 - U+07FF    拉丁、希腊等（2字节）
U+0800 - U+FFFF    中文、日文等（3字节）
U+10000 - U+10FFFF Emoji、罕见字（4字节）

UTF-8 编码规则：
0xxxxxxx                           1字节
110xxxxx 10xxxxxx                  2字节
1110xxxx 10xxxxxx 10xxxxxx         3字节
11110xxx 10xxxxxx 10xxxxxx 10xxxxxx 4字节

"中" 的 UTF-8 编码：
  Unicode: U+4E2D
  二进制: 0100 1110 0010 1101
  UTF-8:  11100100 10111000 10101101  (E4 B8 AD)
```

### 4.3 JavaScript 中的编码

```js
// JavaScript 使用 UTF-16 编码

// 基本多文种平面（BMP）：U+0000 - U+FFFF
'中'.length           // 1
'中'.charCodeAt(0)    // 20013 (0x4E2D)

// 补充平面（Emoji 等）：U+10000+
'😀'.length           // 2（代理对，占两个 UTF-16 单元）
'😀'.codePointAt(0)   // 128512 (0x1F600)

// 正确处理 Unicode
[...'😀🎉'].length    // 2（用展开运算符）
Array.from('😀🎉').length  // 2

// 编码转换
function encodeToUTF8(str) {
  return new TextEncoder().encode(str);
  // Uint8Array [228, 184, 173] (中 → E4 B8 AD)
}

function decodeFromUTF8(bytes) {
  return new TextDecoder().decode(bytes);
}

// Base64 编码
btoa('Hello')           // "SGVsbG8="
atob('SGVsbG8=')        // "Hello"
btoa('中')              // ❌ 报错（非 ASCII）
btoa(unescape(encodeURIComponent('中')))  // "5Lit"
```

## 五、二进制数据处理

### 5.1 ArrayBuffer 和 TypedArray

```js
// ArrayBuffer —— 原始二进制数据缓冲区
const buffer = new ArrayBuffer(16);  // 16 字节

// TypedArray —— 类型化数组视图
const int32View = new Int32Array(buffer);  // 4 个 32 位整数
const float64View = new Float64Array(buffer);  // 2 个 64 位浮点数
const uint8View = new Uint8Array(buffer);  // 16 个 8 位无符号整数

// DataView —— 灵活的二进制数据读写
const view = new DataView(buffer);
view.setInt32(0, 42);        // 在偏移 0 处写入 Int32
view.getFloat64(4, 3.14);    // 在偏移 4 处写入 Float64
view.getInt32(0);             // 读取 Int32 → 42

// 前端中的二进制处理：
// 1. File API / Blob
// 2. WebSocket 二进制传输
// 3. Canvas ImageData
// 4. WebAssembly
// 5. 加密算法
```

### 5.2 Blob 和 File

```js
// Blob —— 不可变的二进制数据块
const blob = new Blob(['Hello, World!'], { type: 'text/plain' });
console.log(blob.size);   // 13
console.log(blob.type);   // "text/plain"

// Blob 转 URL（可用于下载或显示图片）
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'hello.txt';
a.click();
URL.revokeObjectURL(url);  // 释放内存

// File —— 继承 Blob，增加了文件名和修改时间
const file = new File(['content'], 'example.txt', {
  type: 'text/plain',
  lastModified: Date.now(),
});

// 读取文件
const reader = new FileReader();
reader.onload = (e) => {
  console.log(e.target.result);
};
reader.readAsText(file);
reader.readAsArrayBuffer(file);  // 读取为二进制
reader.readAsDataURL(file);      // 读取为 Base64
```

## 六、常见面试题

**Q1: 为什么 0.1 + 0.2 !== 0.3？**

A: JavaScript 使用 IEEE 754 双精度浮点数，0.1 和 0.2 的二进制表示都是无限循环小数，存储时有精度丢失。解决方法：`Math.abs(0.1 + 0.2 - 0.3) < Number.EPSILON`。

**Q2: JavaScript 中有哪些数据类型？它们在内存中如何存储？**

A: 基本类型（number, string, boolean, null, undefined, symbol, bigint）存储在栈中；引用类型（object, array, function）存储在堆中，栈中只存引用地址。

**Q3: 什么是 Unicode？UTF-8 和 UTF-16 的区别？**

A: Unicode 是字符集，为每个字符分配唯一码点。UTF-8 是变长编码（1-4字节），兼容 ASCII，适合网络传输；UTF-16 也是变长编码（2或4字节），JavaScript 内部使用 UTF-16。
