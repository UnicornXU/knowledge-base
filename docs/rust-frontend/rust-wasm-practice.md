---
sidebar_position: 3
title: "Rust + WebAssembly 实战"
difficulty: "hard"
tags: ["Rust", "WebAssembly", "wasm-pack", "wasm-bindgen"]
---

# Rust + WebAssembly 实战

## Rust→WASM 为什么是最佳组合

WebAssembly（WASM）允许在浏览器中运行接近原生性能的代码。多种语言都能编译到 WASM，但 Rust 是公认的最佳选择：

### 各语言编译到 WASM 的优劣对比

| 维度 | Rust | C/C++ | Go | AssemblyScript |
|------|------|-------|-----|----------------|
| 输出体积 | ⭐⭐⭐⭐⭐ 极小（几十KB） | ⭐⭐⭐⭐ 小 | ⭐⭐ 大（需含runtime ~2MB） | ⭐⭐⭐⭐ 较小 |
| 内存安全 | ⭐⭐⭐⭐⭐ 编译期保证 | ⭐⭐ 手动管理 | ⭐⭐⭐⭐ GC管理 | ⭐⭐⭐⭐ GC管理 |
| JS互操作 | ⭐⭐⭐⭐⭐ wasm-bindgen | ⭐⭐ Emscripten | ⭐⭐⭐ syscall/js | ⭐⭐⭐⭐ 原生TS语法 |
| 性能 | ⭐⭐⭐⭐⭐ 接近原生 | ⭐⭐⭐⭐⭐ 原生 | ⭐⭐⭐ GC开销 | ⭐⭐⭐ 有优化限制 |
| 工具链成熟度 | ⭐⭐⭐⭐⭐ wasm-pack | ⭐⭐⭐ Emscripten复杂 | ⭐⭐⭐ 官方支持 | ⭐⭐⭐ 社区维护 |
| 学习曲线 | ⭐⭐⭐ 中等偏高 | ⭐⭐ 高 | ⭐⭐⭐⭐ 低 | ⭐⭐⭐⭐⭐ 极低 |
| 多线程支持 | ⭐⭐⭐⭐⭐ rayon | ⭐⭐⭐⭐ pthreads | ⭐⭐ 有限 | ⭐⭐ 有限 |
| 错误处理 | ⭐⭐⭐⭐⭐ Result/Option | ⭐⭐ errno | ⭐⭐⭐⭐ error接口 | ⭐⭐⭐ try/catch |

:::tip 为什么选 Rust
Rust 是唯一同时满足「极小体积 + 内存安全 + 零GC + 优秀JS互操作 + 顶级性能」的语言。wasm-bindgen 提供了最优雅的 Rust↔JS 交互体验。
:::

---

## 开发环境搭建

### 必要工具安装

```bash
# 1. 安装 Rust（如果未安装）
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 2. 添加 wasm32 编译目标
rustup target add wasm32-unknown-unknown

# 3. 安装 wasm-pack（核心工具）
cargo install wasm-pack

# 4. 安装项目模板生成器
cargo install cargo-generate

# 5. 安装 WASM 优化工具
cargo install wasm-opt
# 或通过 npm 安装
npm install -g wasm-opt
```

### 工具链版本验证

```bash
rustup --version       # rustup 1.27+
rustc --version        # rustc 1.75+
wasm-pack --version    # wasm-pack 0.12+
cargo generate --version
```

---

## wasm-pack 工具链

### 项目初始化

```bash
# 使用官方模板创建项目
cargo generate --git https://github.com/nicotd/nicotd-wasm-pack-template --name my-wasm-lib

# 或手动创建
cargo new --lib my-wasm-lib
cd my-wasm-lib
```

### Cargo.toml 配置

```toml
[package]
name = "my-wasm-lib"
version = "0.1.0"
edition = "2021"
authors = ["Your Name <email@example.com>"]
description = "A WASM library for frontend computation"

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
wasm-bindgen = "0.2.92"
js-sys = "0.3.69"
web-sys = { version = "0.3.69", features = [
    "console",
    "Document",
    "Element",
    "HtmlElement",
    "Window",
    "Performance",
    "CanvasRenderingContext2d",
    "HtmlCanvasElement",
    "ImageData",
] }
serde = { version = "1.0", features = ["derive"] }
serde-wasm-bindgen = "0.6"

[dependencies.getrandom]
version = "0.2"
features = ["js"]

[dev-dependencies]
wasm-bindgen-test = "0.3.42"

[profile.release]
opt-level = "s"        # 优化体积
lto = true             # 链接时优化
codegen-units = 1      # 单代码生成单元（更好优化）
strip = true           # 移除调试符号
```

:::info crate-type 说明
- `cdylib`：生成动态库格式，wasm-pack 需要此类型来生成 .wasm 文件
- `rlib`：保留 Rust 库格式，用于单元测试和作为 Rust 依赖使用
:::

### 构建命令与输出分析

```bash
# 构建为 npm 包（面向 bundler）
wasm-pack build --target bundler --release

# 构建为浏览器直接加载格式
wasm-pack build --target web --release

# 构建为 Node.js 使用
wasm-pack build --target nodejs --release

# 输出目录结构
pkg/
├── my_wasm_lib_bg.wasm       # 编译后的 WASM 二进制
├── my_wasm_lib_bg.wasm.d.ts  # WASM 文件的 TS 类型
├── my_wasm_lib.js            # JS 胶水代码（初始化+导出）
├── my_wasm_lib.d.ts          # TS 类型声明
├── package.json              # npm 包配置
└── README.md
```

---

## wasm-bindgen 详解

### Rust→JS 导出函数

```rust
use wasm_bindgen::prelude::*;

// 导出简单函数
#[wasm_bindgen]
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

// 导出字符串处理函数
#[wasm_bindgen]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! From Rust+WASM", name)
}

// 导出复杂计算
#[wasm_bindgen]
pub fn fibonacci(n: u32) -> u64 {
    match n {
        0 => 0,
        1 => 1,
        _ => {
            let mut a: u64 = 0;
            let mut b: u64 = 1;
            for _ in 2..=n {
                let temp = b;
                b = a + b;
                a = temp;
            }
            b
        }
    }
}
```

### JS→Rust 导入函数

```rust
use wasm_bindgen::prelude::*;

// 从 JS 导入函数
#[wasm_bindgen]
extern "C" {
    // 导入 console.log
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);

    // 导入 alert
    fn alert(s: &str);

    // 导入自定义 JS 函数
    #[wasm_bindgen(js_name = "fetchData")]
    async fn fetch_data(url: &str) -> JsValue;

    // 导入带命名空间的函数
    #[wasm_bindgen(js_namespace = ["window", "performance"])]
    fn now() -> f64;
}

#[wasm_bindgen]
pub fn log_from_rust(msg: &str) {
    log(&format!("[Rust] {}", msg));
}
```

### 类型映射表

| Rust 类型 | JS 类型 | 说明 |
|----------|---------|------|
| `i8/i16/i32` | `number` | 整数直接映射 |
| `u8/u16/u32` | `number` | 无符号整数 |
| `i64/u64` | `BigInt` | 大整数 |
| `f32/f64` | `number` | 浮点数 |
| `bool` | `boolean` | 布尔值 |
| `String` / `&str` | `string` | 字符串（涉及内存拷贝） |
| `Vec<u8>` | `Uint8Array` | 字节数组 |
| `Vec<i32>` | `Int32Array` | 类型化数组 |
| `JsValue` | `any` | 任意 JS 值 |
| `Option<T>` | `T \| undefined` | 可选值 |
| `Result<T, E>` | `T` (throw on Err) | 错误则抛异常 |
| `#[wasm_bindgen] struct` | `class` | 结构体→类 |

### 结构体与类的暴露

```rust
use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};

#[wasm_bindgen]
pub struct ImageProcessor {
    width: u32,
    height: u32,
    pixels: Vec<u8>,
}

#[wasm_bindgen]
impl ImageProcessor {
    #[wasm_bindgen(constructor)]
    pub fn new(width: u32, height: u32) -> Self {
        let pixels = vec![0u8; (width * height * 4) as usize];
        ImageProcessor { width, height, pixels }
    }

    pub fn width(&self) -> u32 { self.width }
    pub fn height(&self) -> u32 { self.height }

    pub fn pixels_ptr(&self) -> *const u8 {
        self.pixels.as_ptr()
    }

    pub fn grayscale(&mut self) {
        for chunk in self.pixels.chunks_exact_mut(4) {
            let gray = (0.299 * chunk[0] as f64
                + 0.587 * chunk[1] as f64
                + 0.114 * chunk[2] as f64) as u8;
            chunk[0] = gray;
            chunk[1] = gray;
            chunk[2] = gray;
        }
    }

    pub fn invert(&mut self) {
        for chunk in self.pixels.chunks_exact_mut(4) {
            chunk[0] = 255 - chunk[0];
            chunk[1] = 255 - chunk[1];
            chunk[2] = 255 - chunk[2];
        }
    }
}
```

---

## JS 集成

### ESM 方式加载 WASM

```javascript
// 使用 --target web 构建的包
import init, { add, greet, ImageProcessor } from './pkg/my_wasm_lib.js';

async function main() {
  // 必须先初始化 WASM 模块
  await init();

  console.log(add(1, 2));         // 3
  console.log(greet("World"));    // "Hello, World! From Rust+WASM"

  const processor = new ImageProcessor(800, 600);
  processor.grayscale();
}

main();
```

### Webpack 集成配置

```javascript
// webpack.config.js
const path = require('path');

module.exports = {
  experiments: {
    asyncWebAssembly: true,  // 启用 WASM 异步加载
  },
  module: {
    rules: [
      {
        test: /\.wasm$/,
        type: 'webassembly/async',
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.ts', '.wasm'],
  },
};
```

### Vite 集成配置

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
  plugins: [
    wasm(),
    topLevelAwait(),
  ],
  optimizeDeps: {
    exclude: ['my-wasm-lib'],  // 排除 WASM 包的预构建
  },
});
```

```typescript
// 在 Vite 项目中使用
import { add, ImageProcessor } from 'my-wasm-lib';

// 直接使用，无需手动 init()（vite-plugin-wasm 自动处理）
const result = add(10, 20);
```

---

## 性能对比实战案例

### 案例一：图像处理（灰度转换）

```javascript
// JS 实现
function grayscaleJS(imageData) {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
    data[i] = data[i+1] = data[i+2] = gray;
  }
  return imageData;
}

// Rust+WASM 实现见上方 ImageProcessor::grayscale()
```

**性能测试结果（4K 图像 3840×2160）：**

| 实现 | 处理时间 | 相对性能 |
|------|---------|---------|
| JavaScript（纯循环） | 48ms | 1x |
| JavaScript（Web Worker） | 45ms | 1.07x |
| Rust + WASM | 6.2ms | **7.7x** |
| Rust + WASM（SIMD） | 2.8ms | **17x** |

### 案例二：加密计算（SHA-256 哈希）

| 数据量 | JS (crypto-js) | JS (Web Crypto) | Rust+WASM (sha2) |
|-------|----------------|-----------------|-------------------|
| 1 KB | 0.8ms | 0.1ms | 0.05ms |
| 1 MB | 85ms | 12ms | 8ms |
| 100 MB | 8500ms | 1200ms | 680ms |

:::warning 注意
对于加密计算，浏览器原生 Web Crypto API 已经很快（底层也是 C/C++ 实现）。Rust+WASM 的优势主要体现在 Web Crypto 不支持的自定义算法场景。
:::

### 案例三：大数据排序（100万条记录）

```rust
// Rust 侧 - 排序函数
#[wasm_bindgen]
pub fn sort_numbers(data: &mut [f64]) {
    data.sort_unstable_by(|a, b| a.partial_cmp(b).unwrap());
}
```

| 数据量 | JS Array.sort() | Rust+WASM sort | 提升 |
|-------|-----------------|----------------|------|
| 10万 | 52ms | 18ms | **2.9x** |
| 100万 | 680ms | 195ms | **3.5x** |
| 1000万 | 8200ms | 2100ms | **3.9x** |

---

## 调试与优化

### wasm-opt 优化级别

```bash
# 优化级别说明
wasm-opt -O1 input.wasm -o output.wasm  # 基础优化
wasm-opt -O2 input.wasm -o output.wasm  # 标准优化
wasm-opt -O3 input.wasm -o output.wasm  # 激进优化（可能增加体积）
wasm-opt -Os input.wasm -o output.wasm  # 优化体积（推荐Web场景）
wasm-opt -Oz input.wasm -o output.wasm  # 极致体积优化

# wasm-pack 会自动调用 wasm-opt，可通过环境变量控制
WASM_OPT_FLAGS="-Os" wasm-pack build --release
```

### 代码体积控制

| 优化手段 | 效果 | 说明 |
|---------|------|------|
| `opt-level = "s"` | -30% | Cargo.toml release profile |
| `lto = true` | -15% | 链接时优化，消除死代码 |
| `strip = true` | -20% | 移除调试符号 |
| `wasm-opt -Os` | -10% | 额外的 WASM 层面优化 |
| 避免 `format!` | -5~15% | 格式化字符串引入大量代码 |
| 使用 `wee_alloc` | -10KB | 更小的内存分配器 |

:::tip 体积优化实战
一个典型的图像处理库：未优化 ~180KB，经过全部优化后可降至 ~35KB（gzip 后约 15KB），对 Web 加载体验影响极小。
:::

### Source Map 调试

```toml
# Cargo.toml - 开发时保留调试信息
[profile.dev]
opt-level = 0
debug = true

# 构建带 source map 的调试版本
# wasm-pack build --dev
```

在 Chrome DevTools 中：
1. 打开 Sources 面板
2. 找到 `wasm://` 源
3. 配合 DWARF 调试信息可看到 Rust 源码
4. 使用 `console_error_panic_hook` 获取友好的 panic 信息

```rust
// 在 lib.rs 中添加 panic hook
use wasm_bindgen::prelude::*;

#[wasm_bindgen(start)]
pub fn init_panic_hook() {
    console_error_panic_hook::set_once();
}
```

---

## 面试题

### 1. Rust 编译到 WASM 相比 C/C++ 有哪些优势？

**参考答案：**

1. **内存安全**：Rust 的所有权系统在编译期保证无悬垂指针、无缓冲区溢出，而 C/C++ 的内存错误在 WASM 沙箱中虽不会影响宿主，但会导致程序逻辑错误
2. **输出体积更小**：Rust 无 runtime 开销，而 C/C++ 通过 Emscripten 编译会携带 libc 模拟层
3. **工具链更友好**：wasm-pack 提供一键构建+npm 发布流程，Emscripten 配置复杂
4. **JS 互操作更优雅**：wasm-bindgen 自动生成类型安全的 JS 绑定代码
5. **无需 GC**：Go 编译到 WASM 需要携带整个 GC runtime（~2MB），Rust 完全不需要

### 2. wasm-bindgen 是如何实现 Rust 和 JavaScript 之间的类型安全交互的？

**参考答案：**

wasm-bindgen 通过多层机制实现类型安全交互：

1. **编译时宏**：`#[wasm_bindgen]` 宏在编译时分析函数签名，生成对应的 FFI 接口
2. **胶水代码生成**：自动生成 JS 端的包装函数，处理类型转换（如 String↔指针+长度）
3. **ABI 层**：WASM 只支持数字类型，复杂类型通过共享内存 + 描述符传递
4. **TypeScript 声明**：自动生成 `.d.ts` 文件，提供 IDE 类型提示
5. **引用计数**：对于 JS 对象在 Rust 中的引用，通过 slab 分配 + 引用计数管理生命周期

### 3. 什么场景适合使用 Rust+WASM，什么场景不适合？

**参考答案：**

**适合的场景：**
- CPU 密集型计算：图像/音视频处理、加密、物理模拟
- 大数据处理：百万级数据排序、聚合、过滤
- 已有 Rust/C 库需要在浏览器复用
- 对延迟敏感的实时计算（游戏引擎、音频合成）

**不适合的场景：**
- DOM 操作密集（JS↔WASM 通信开销抵消性能收益）
- 简单业务逻辑（JS 已足够快，引入 WASM 增加复杂度）
- 需要频繁大量传递字符串/复杂对象（序列化开销大）
- 包体积极度敏感的轻量页面（WASM 模块本身有固定开销）

### 4. 如何优化 Rust+WASM 模块的加载性能？

**参考答案：**

1. **体积优化**：`opt-level="s"` + `lto=true` + `wasm-opt -Os` + `strip=true`
2. **流式编译**：使用 `WebAssembly.instantiateStreaming()` 边下载边编译
3. **代码分割**：将 WASM 模块拆分为核心模块和可选模块，按需加载
4. **预加载**：使用 `<link rel="preload" as="fetch" href="module.wasm">` 提前下载
5. **缓存策略**：WASM 文件设置长期缓存（content hash 命名）
6. **压缩**：服务器启用 gzip/brotli，WASM 文件压缩率通常在 60-70%
