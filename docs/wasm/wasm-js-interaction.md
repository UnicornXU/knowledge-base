---
sidebar_position: 3
title: WebAssembly 与 JavaScript 交互
difficulty: hard
tags:
  - wasm
  - javascript
  - interop
  - memory
---

# 🔗 WebAssembly 与 JavaScript 交互

> **"理解 WASM 与 JS 的数据传递机制，是用好 WebAssembly 的关键"** —— 互操作的效率直接影响 WASM 的实际性能收益。

## 一、互操作架构总览

```
WASM 与 JS 互操作架构
═══════════════════════════════════════════════════════════════

  JavaScript 环境                          WASM 模块
  ┌───────────────────┐                   ┌───────────────────┐
  │                   │                   │                   │
  │  调用导出函数 ─────┼──────────────────►│  export 函数       │
  │                   │                   │                   │
  │  提供导入函数 ◄────┼───────────────────│  import 函数       │
  │                   │                   │                   │
  │  读写线性内存 ◄───►│   Shared Memory   │  读写线性内存      │
  │                   │                   │                   │
  │  传递引用类型 ─────┼───────────────────►│  externref 参数    │
  │                   │                   │                   │
  └───────────────────┘                   └───────────────────┘

  数据传递方式：
  1. 值传递：i32, f64 等基本类型直接传递（零开销）
  2. 内存传递：复杂数据通过共享线性内存传递（需要序列化）
  3. 引用传递：externref 直接传递 JS 对象引用（无需拷贝）
═══════════════════════════════════════════════════════════════
```

## 二、数据传递方式详解

### 2.1 值传递（直接参数传递）

基本类型（i32、f64 等）可以直接在 WASM 和 JS 之间传递，零额外开销：

```rust
// Rust 端
#[wasm_bindgen]
pub fn calculate_distance(x1: f64, y1: f64, x2: f64, y2: f64) -> f64 {
    ((x2 - x1).powi(2) + (y2 - y1).powi(2)).sqrt()
}
```

```javascript
// JS 端 —— 基本类型直接传递，无额外开销
const distance = calculate_distance(0, 0, 3, 4); // 5.0
```

### 2.2 字符串传递

字符串需要在 WASM 线性内存中分配和编码：

```
字符串传递过程
═══════════════════════════════════════════════════
  JS → WASM:
  1. JS 端将字符串编码为 UTF-8 字节
  2. 在 WASM 线性内存中分配空间
  3. 将字节写入分配的内存
  4. 将指针和长度传给 WASM 函数
  5. WASM 函数处理完毕后释放内存

  WASM → JS:
  1. WASM 函数返回指针和长度
  2. JS 端从线性内存读取 UTF-8 字节
  3. 解码为 JS 字符串
  4. 释放 WASM 端的内存
═══════════════════════════════════════════════════
```

```rust
// wasm-bindgen 自动处理字符串的编解码
#[wasm_bindgen]
pub fn to_uppercase(s: &str) -> String {
    s.to_uppercase()
}
```

### 2.3 二进制数据传递（ArrayBuffer / TypedArray）

处理大量数据时，使用 `Uint8Array` 等 TypedArray 最高效：

```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn process_image_data(data: &mut [u8], width: u32, height: u32) {
    // 直接操作传入的字节数组（零拷贝，直接修改 WASM 内存）
    for i in (0..data.len()).step_by(4) {
        let r = data[i] as f32;
        let g = data[i + 1] as f32;
        let b = data[i + 2] as f32;
        // 转为灰度
        let gray = (0.299 * r + 0.587 * g + 0.114 * b) as u8;
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
        // data[i+3] alpha 不变
    }
}
```

```javascript
// JS 端
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

// 直接传入 Uint8Array，WASM 直接修改底层内存
process_image_data(imageData.data, canvas.width, canvas.height);

// 写回 canvas
ctx.putImageData(imageData, 0, 0);
```

### 2.4 引用类型传递（externref）

`externref` 允许直接传递 JS 对象引用到 WASM，无需序列化：

```wasm
;; WAT 中使用 externref
(module
  (import "env" "handleObject" (func $handle (param externref)))

  (func $process (param $obj externref)
    local.get $obj
    call $handle  ;; 直接将 JS 对象传给导入函数
  )

  (export "process" (func $process))
)
```

## 三、内存共享与管理

### 3.1 线性内存的共享

```
JS 与 WASM 共享内存模型
═══════════════════════════════════════════════════════════════
  JS 视角                              WASM 视角
  ┌──────────────────┐                 ┌──────────────────┐
  │ ArrayBuffer      │                 │ 线性内存          │
  │ memory.buffer    │◄══ 同一块内存 ══►│ linear memory    │
  │                  │                 │                  │
  │ TypedArray 视图:  │                 │ 直接 load/store  │
  │ - Uint8Array     │                 │ 指令读写          │
  │ - Int32Array     │                 │                  │
  │ - Float64Array   │                 │                  │
  └──────────────────┘                 └──────────────────┘
═══════════════════════════════════════════════════════════════
```

```javascript
// 获取 WASM 内存的 ArrayBuffer
const memory = wasmInstance.exports.memory;

// 创建不同类型的视图
const bytes = new Uint8Array(memory.buffer);
const ints = new Int32Array(memory.buffer);
const floats = new Float64Array(memory.buffer);

// 写入数据
floats[0] = 3.14; // 在偏移 0 写入 f64

// WASM 端读取
const value = wasmInstance.exports.read_f64_at_zero(); // 3.14
```

### 3.2 手动内存管理

```rust
use wasm_bindgen::prelude::*;
use std::alloc::{alloc, dealloc, Layout};

#[wasm_bindgen]
pub struct Buffer {
    ptr: *mut u8,
    len: usize,
    layout: Layout,
}

#[wasm_bindgen]
impl Buffer {
    #[wasm_bindgen(constructor)]
    pub fn new(size: usize) -> Result<Buffer, JsValue> {
        let layout = Layout::from_size_align(size, 1)
            .map_err(|_| JsValue::from_str("Invalid layout"))?;
        let ptr = unsafe { alloc(layout) };
        if ptr.is_null() {
            return Err(JsValue::from_str("Allocation failed"));
        }
        Ok(Buffer { ptr, len: size, layout })
    }

    /// 返回数据指针，供 JS 端直接读写
    #[wasm_bindgen(js_name = ptr)]
    pub fn ptr(&self) -> *mut u8 {
        self.ptr
    }

    #[wasm_bindgen(getter)]
    pub fn length(&self) -> usize {
        self.len
    }

    /// 获取数据的切片视图
    pub fn as_slice(&self) -> &[u8] {
        unsafe { std::slice::from_raw_parts(self.ptr, self.len) }
    }
}

// 实现 Drop 自动释放内存
impl Drop for Buffer {
    fn drop(&mut self) {
        unsafe {
            dealloc(self.ptr, self.layout);
        }
    }
}
```

```javascript
// JS 端使用
const buffer = new Buffer(1024);
const ptr = buffer.ptr();

// 直接写入 WASM 内存
const view = new Uint8Array(wasmInstance.exports.memory.buffer, ptr, 1024);
view[0] = 0xFF;

// WASM 端可以读取
buffer.as_slice(); // [255, 0, 0, ...]
```

### 3.3 内存增长

```javascript
// WASM 内存增长时，ArrayBuffer 会 detached，需要重新获取视图
const memory = wasmInstance.exports.memory;

function getMemoryView() {
  // 每次访问都重新创建视图，因为 buffer 可能已更新
  return new Uint8Array(memory.buffer);
}

// 也可以监听 memory.grow 事件（非标准，需要手动检测）
let currentBuffer = memory.buffer;
function checkMemoryGrown() {
  if (memory.buffer !== currentBuffer) {
    currentBuffer = memory.buffer;
    // 重新创建所有 TypedArray 视图
  }
}
```

## 四、导入/导出机制

### 4.1 导出函数（WASM → JS）

```rust
#[wasm_bindgen]
pub fn compute(data: &[f64]) -> f64 {
    data.iter().sum::<f64>() / data.len() as f64
}
```

```javascript
// JS 调用 WASM 导出函数
const result = compute(new Float64Array([1.0, 2.0, 3.0, 4.0, 5.0]));
// result = 3.0
```

### 4.2 导入函数（JS → WASM）

```rust
use wasm_bindgen::prelude::*;

// 声明从 JS 导入的函数
#[wasm_bindgen]
extern "C" {
    fn console_log(s: &str);
    fn on_progress(percent: f32);
    fn fetch_from_network(url: &str) -> String;
}

#[wasm_bindgen]
pub fn process_with_callback(data: &[u8]) {
    console_log("开始处理...");
    on_progress(0.0);

    // 处理数据...

    on_progress(1.0);
    console_log("处理完成！");
}
```

```javascript
// 实例化时提供导入对象
const importObject = {
  env: {
    console_log: (s) => console.log(s),
    on_progress: (p) => updateProgressBar(p),
    fetch_from_network: (url) => fetch(url).then(r => r.text())
  }
};

const { instance } = await WebAssembly.instantiateStreaming(
  fetch('module.wasm'),
  importObject
);
```

### 4.3 宿主绑定（Host Bindings）

```
宿主绑定调用流程
═══════════════════════════════════════════════════════════════
  传统方式（胶水代码）:
  WASM → JS 函数调用 → 参数转换 → 宿主 API → 结果转换 → 返回 WASM
  每次调用都有跨越边界的开销

  宿主绑定（proposal）:
  WASM → 直接调用宿主 API（引擎内部处理类型转换）
  减少 JS 胶水代码，降低调用开销
═══════════════════════════════════════════════════════════════
```

## 五、异步操作

### 5.1 Rust async 与 JS Promise

```rust
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::JsFuture;
use web_sys::{Request, RequestInit, Response};

#[wasm_bindgen]
pub async fn fetch_json(url: &str) -> Result<JsValue, JsValue> {
    let mut opts = RequestInit::new();
    opts.method("GET");

    let request = Request::new_with_str_and_init(url, &opts)?;

    let window = web_sys::window().unwrap();
    let resp_value = JsFuture::from(window.fetch_with_request(&request)).await?;

    let resp: Response = resp_value.dyn_into()?;
    let json = JsFuture::from(resp.json()?).await?;

    Ok(json)
}
```

```javascript
// JS 端像使用普通 Promise 一样使用
const data = await fetch_json('https://api.example.com/data');
console.log(data);
```

### 5.2 SharedArrayBuffer + Worker 多线程

```javascript
// 主线程：创建共享内存
const memory = new WebAssembly.Memory({
  initial: 1,
  maximum: 10,
  shared: true  // 启用共享
});

// Worker 线程中使用相同的内存
const worker = new Worker('worker.js');
worker.postMessage({ memory });
```

```rust
// Rust 端使用原子操作
use std::sync::atomic::{AtomicI32, Ordering};

static COUNTER: AtomicI32 = AtomicI32::new(0);

#[wasm_bindgen]
pub fn increment() -> i32 {
    COUNTER.fetch_add(1, Ordering::SeqCst)
}
```

## 六、性能调优

### 6.1 减少边界调用

```
JS ↔ WASM 边界调用开销
═══════════════════════════════════════════════════════════════
  场景                    耗时（相对值）
  ─────────────────────────────────────────────────────
  纯 JS 函数调用           1x
  JS → WASM 函数调用       ~2-5x（有边界开销）
  批量数据传入 WASM        1x（内存共享，无额外拷贝）
  WASM 内部循环计算        1x（无边界开销）

  优化策略：
  ✅ 将循环移入 WASM（避免每次迭代跨越边界）
  ✅ 批量传入数据（一次传入，WASM 内部处理）
  ✅ 使用 SharedArrayBuffer（多线程共享数据）
  ❌ 在循环中频繁调用 JS 函数
═══════════════════════════════════════════════════════════════
```

### 6.2 数据序列化优化

```javascript
// ❌ 差：逐个字段传递
for (const item of items) {
  wasmInstance.exports.process(item.x, item.y, item.z, item.w);
}

// ✅ 好：批量传入数组
const buffer = new Float64Array(items.length * 4);
items.forEach((item, i) => {
  buffer[i * 4] = item.x;
  buffer[i * 4 + 1] = item.y;
  buffer[i * 4 + 2] = item.z;
  buffer[i * 4 + 3] = item.w;
});
wasmInstance.exports.process_batch(buffer, items.length);
```

## 七、面试要点

### 7.1 常见面试问题

**Q1：WASM 和 JS 之间传递数据有哪些方式？**

> 三种方式：(1) 值传递——基本类型（i32、f64）直接通过函数参数传递，零开销；(2) 内存传递——复杂数据（字符串、数组）通过共享线性内存传递，需要编解码；(3) 引用传递——externref 可直接传递 JS 对象引用，无需拷贝。

**Q2：为什么频繁的 JS ↔ WASM 调用会降低性能？**

> 每次跨边界调用都有固定的开销：保存/恢复调用栈、类型检查、参数转换。如果在循环中频繁调用，这些开销会累积。优化策略是将循环移入 WASM 端，减少跨边界调用次数。

**Q3：WASM 内存增长时会发生什么？**

> 当 WASM 调用 memory.grow 时，底层 ArrayBuffer 可能被重新分配（类似 realloc）。此时之前获取的 TypedArray 视图会 detached（失效）。需要重新获取 `memory.buffer` 并创建新的视图。

**Q4：如何在 WASM 中处理异步操作？**

> 使用 wasm-bindgen-futures 将 JS Promise 转换为 Rust Future。WASM 端可以 async/await 调用 JS 的异步 API（如 fetch）。WASM 模块本身是同步执行的，异步是通过与 JS 事件循环协作实现的。
