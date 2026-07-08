---
sidebar_position: 1
title: WebAssembly 基础概念
difficulty: medium
tags:
  - wasm
  - binary-format
  - memory-model
---

# 🧱 WebAssembly 基础概念

> **"WASM 是一种面向栈的虚拟机的二进制指令格式"** —— 理解其底层结构是掌握 WebAssembly 的第一步。

## 一、什么是 WebAssembly？

WebAssembly（简称 WASM）是一种低级的、平台无关的字节码格式。它被设计为 Web 平台的编译目标，可以在浏览器中以接近原生的速度执行。

### 1.1 核心特性

```
WebAssembly 核心特性
═══════════════════════════════════════════════════════
  📦 二进制格式      → 体积小、解析快（比 JS 快 10-20x）
  🔒 安全沙箱        → 内存隔离、无直接系统访问
  🌐 平台无关        → 一次编译，到处运行
  🚀 接近原生性能     → 预编译、无 JIT 去优化
  🔗 与 JS 互操作     → 可调用 JS 函数，JS 可调用 WASM 导出
═══════════════════════════════════════════════════════
```

### 1.2 与 JavaScript 的关系

```
┌─────────────────────────────────────────────────────┐
│                    浏览器环境                         │
│  ┌───────────────┐        ┌───────────────┐         │
│  │  JavaScript   │◄──────►│  WebAssembly  │         │
│  │               │  互操作  │               │         │
│  │  • DOM 操作    │        │  • 计算密集    │         │
│  │  • 事件处理    │        │  • 图像处理    │         │
│  │  • 业务逻辑    │        │  • 编解码      │         │
│  │  • UI 交互    │        │  • 加密算法    │         │
│  └───────────────┘        └───────────────┘         │
│         │                        │                   │
│         ▼                        ▼                   │
│  ┌─────────────────────────────────────────────┐    │
│  │              共享线性内存 (SharedMemory)      │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

## 二、WASM 二进制格式

### 2.1 模块结构

WASM 模块由多个**段（Section）**组成，每个段存储不同类型的元数据：

```
WASM 模块二进制结构
═══════════════════════════════════════════════════
  Magic Number (4 bytes)   → 0x00 0x61 0x73 0x6D  ("\0asm")
  Version    (4 bytes)     → 0x01 0x00 0x00 0x00  (版本 1)
───────────────────────────────────────────────────
  Type Section             → 函数签名定义
  Import Section           → 从宿主环境导入的函数/内存/表
  Function Section         → 函数类型索引
  Table Section            → 间接调用表（用于函数指针）
  Memory Section           → 线性内存定义
  Global Section           → 全局变量
  Export Section           → 导出给宿主环境的接口
  Start Section            → 模块实例化时自动调用的函数
  Code Section             → 函数体（实际字节码指令）
  Data Section             → 内存初始数据
  Custom Section           → 调试信息、名称映射等
═══════════════════════════════════════════════════
```

### 2.2 文本格式（WAT）

WASM 有对应的文本表示格式 WAT（WebAssembly Text Format），便于人类阅读和调试：

```wasm
;; WAT 示例：一个简单的加法函数
(module
  ;; 定义函数类型
  (type $add_type (func (param i32 i32) (result i32)))

  ;; 导出 add 函数
  (func $add (type $add_type) (param $a i32) (param $b i32) (result i32)
    ;; 将参数压栈
    local.get $a
    local.get $b
    ;; 执行加法
    i32.add
  )

  ;; 导出函数名为 "add"
  (export "add" (func $add))
)
```

### 2.3 栈式虚拟机

WASM 采用**基于栈的执行模型**，而非基于寄存器：

```
执行 i32.add 的栈变化
═══════════════════════════════════════
  指令                栈状态
  ────────────────────────────────────
  i32.const 10      │ 10 │
  i32.const 20      │ 10 │ 20 │
  i32.add           │ 30 │
═══════════════════════════════════════
```

## 三、内存模型

### 3.1 线性内存

WASM 使用**线性内存（Linear Memory）**—— 一块连续的、可增长的字节数组：

```
线性内存布局
═══════════════════════════════════════════════════
  低地址                                              高地址
  ┌────────┬────────────────┬───────────────────┐
  │ 数据段  │     堆 (Heap)   │    栈 (Stack)      │
  │ (静态)  │   (动态分配)    │   (函数调用帧)     │
  └────────┴────────────────┴───────────────────┘
  0                                                    n
═══════════════════════════════════════════════════
  • 每个 WASM 模块实例拥有独立的线性内存
  • 默认页大小为 64KB
  • 可以动态增长（grow），但不能缩小
  • JS 和 WASM 共享同一块内存（通过 ArrayBuffer）
```

### 3.2 内存操作示例

```wasm
;; 线性内存操作示例
(module
  ;; 定义 1 页（64KB）内存，最大可增长到 10 页
  (memory (export "memory") 1 10)

  ;; 存储和读取数据
  (func $store_value (param $addr i32) (param $value i32)
    local.get $addr
    local.get $value
    i32.store ;; 将 value 存储到 addr 地址
  )

  (func $load_value (param $addr i32) (result i32)
    local.get $addr
    i32.load ;; 从 addr 地址读取 i32 值
  )

  ;; 导出函数
  (export "storeValue" (func $store_value))
  (export "loadValue" (func $load_value))
)
```

### 3.3 JS 端访问线性内存

```javascript
// JS 与 WASM 共享内存
const memory = wasmInstance.exports.memory;

// 创建 ArrayBuffer 视图来读写 WASM 内存
const uint8View = new Uint8Array(memory.buffer);
const int32View = new Int32Array(memory.buffer);
const float64View = new Float64Array(memory.buffer);

// 写入数据
int32View[0] = 42; // 在地址 0 写入 i32 值 42

// WASM 端读取
const result = wasmInstance.exports.loadValue(0); // 返回 42
```

## 四、类型系统

WASM 支持的基本类型：

```
WASM 基本类型
═══════════════════════════════════════════════════
  类型        说明              位数
  ────────────────────────────────────────────────
  i32        32 位整数          32
  i64        64 位整数          64
  f32        32 位浮点数        32
  f64        64 位浮点数        64
  v128       128 位 SIMD 向量   128  (SIMD 扩展)
  funcref    函数引用           -    (引用类型)
  externref  外部引用           -    (引用类型)
═══════════════════════════════════════════════════
```

## 五、WASM 实例化流程

```
WASM 加载和实例化过程
═══════════════════════════════════════════════════

  .wasm 文件（二进制）
       │
       ▼
  ┌──────────────────┐
  │  fetch / 下载     │
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │  编译 (compile)   │  WebAssembly.compile()
  │  验证字节码       │  → 返回 Module
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │  实例化           │  WebAssembly.instantiate()
  │  (instantiate)   │  → 注入导入对象
  │  分配内存         │  → 返回 Instance
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │  调用导出函数     │  instance.exports.add(1, 2)
  └──────────────────┘
═══════════════════════════════════════════════════
```

```javascript
// 完整的 WASM 加载和实例化示例
async function loadWasm() {
  // 方式一：两步法
  const response = await fetch('module.wasm');
  const bytes = await response.arrayBuffer();
  const module = await WebAssembly.compile(bytes);
  const instance = await WebAssembly.instantiate(module, {
    // 导入对象（宿主环境提供给 WASM 的函数）
    env: {
      log: (value) => console.log('WASM says:', value),
      memory: new WebAssembly.Memory({ initial: 1, maximum: 10 })
    }
  });

  // 方式二：一步法（更常用）
  const { instance: inst2 } = await WebAssembly.instantiateStreaming(
    fetch('module.wasm'),
    importObject
  );

  return instance;
}
```

## 六、面试要点

### 6.1 常见面试问题

**Q1：WASM 的二进制格式有什么优势？**

> 二进制格式体积比等效 JS 代码小 10-20 倍，解析速度也快 10-20 倍。JS 需要经过解析 → AST → 字节码 → JIT 优化的完整流程，而 WASM 只需解码即可执行。

**Q2：WASM 的线性内存和 JS 的堆内存有什么区别？**

> WASM 线性内存是一块连续的字节数组，没有垃圾回收，需要手动管理（类似 C 的 malloc/free）。JS 堆内存由 GC 自动管理，但有停顿。线性内存的优势是确定性和无 GC 开销。

**Q3：WASM 支持哪些语言作为编译目标？**

> Rust、C、C++（通过 Emscripten）、Go（TinyGo）、AssemblyScript（TypeScript 语法）、Swift 等。其中 Rust 的 wasm-pack 生态最成熟。

**Q4：WASM 能直接操作 DOM 吗？**

> 不能。WASM 没有内置的 DOM API，必须通过 JS 互操作来操作 DOM。这既是限制也是安全设计——防止恶意代码直接操作页面。

**Q5：WASM 的安全模型是什么？**

> WASM 运行在沙箱环境中：内存隔离（每个实例独立的线性内存）、无直接系统调用、无直接 DOM 访问。所有外部能力必须通过显式导入获得。

### 6.2 关键知识点速记

```
WASM 基础概念速记
═══════════════════════════════════════════════════
  ✅ 二进制指令格式，不是编程语言
  ✅ 基于栈的虚拟机
  ✅ 线性内存 = 连续字节数组，64KB 页大小
  ✅ 与 JS 互操作：导入/导出函数、共享内存
  ✅ 不能直接操作 DOM，需要 JS 桥接
  ✅ 支持 i32/i64/f32/f64 四种基本类型
  ✅ 流式编译（streaming compilation）提升加载速度
═══════════════════════════════════════════════════
```
