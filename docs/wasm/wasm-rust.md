---
sidebar_position: 2
title: Rust 编译到 WebAssembly
difficulty: medium
tags:
  - wasm
  - rust
  - wasm-pack
  - wasm-bindgen
---

# 🦀 Rust 编译到 WebAssembly

> **"Rust + WASM 是目前 WebAssembly 生态中最成熟的工具链"** —— Rust 的零成本抽象和无 GC 特性使其成为编译到 WASM 的首选语言。

## 一、为什么选择 Rust？

```
各语言编译到 WASM 的对比
═══════════════════════════════════════════════════════════════
  语言       工具链          产物体积    生态成熟度   开发体验
  ──────────────────────────────────────────────────────────────
  Rust      wasm-pack       ★★★★★     ★★★★★      ★★★★★
  C/C++     Emscripten      ★★★★☆     ★★★★☆      ★★★☆☆
  Go        TinyGo          ★★★☆☆     ★★★☆☆      ★★★★☆
  AssemblyScript  asc       ★★★★☆     ★★★☆☆      ★★★★★
  Swift     SwiftWasm       ★★★☆☆     ★★☆☆☆      ★★★☆☆
═══════════════════════════════════════════════════════════════
```

Rust 的优势：
- **无 GC**：不需要将垃圾回收器编译进 WASM，产物体积小
- **零成本抽象**：高级语法不带来运行时开销
- **wasm-pack**：一键式构建工具，自动生成 JS 绑定
- **wasm-bindgen**：自动处理 Rust ↔ JS 类型转换

## 二、工具链概览

```
Rust WASM 工具链架构
═══════════════════════════════════════════════════
  ┌──────────────┐
  │  Rust 源码    │
  │  (.rs 文件)   │
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐     ┌─────────────────────────┐
  │  wasm-bindgen │────►│  JS 绑定代码自动生成      │
  │  (属性宏)     │     │  (类型转换、内存管理)      │
  └──────┬───────┘     └─────────────────────────┘
         │
         ▼
  ┌──────────────┐
  │  wasm-pack   │     一键构建、打包、发布
  │  (构建工具)   │
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │  .wasm 文件   │     编译产物
  │  + JS 绑定    │
  └──────────────┘
═══════════════════════════════════════════════════
```

### 2.1 安装工具链

```bash
# 1. 安装 Rust（如果没有）
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 2. 添加 WASM 编译目标
rustup target add wasm32-unknown-unknown

# 3. 安装 wasm-pack（Rust → WASM 构建工具）
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

# 4. 安装 cargo-generate（项目脚手架）
cargo install cargo-generate
```

## 三、创建第一个 Rust WASM 项目

### 3.1 项目初始化

```bash
# 使用模板创建项目
cargo generate --git https://github.com/rustwasm/wasm-pack-template
# 输入项目名称，例如：my-wasm-lib

cd my-wasm-lib
```

项目结构：

```
my-wasm-lib/
├── Cargo.toml          # Rust 项目配置
├── src/
│   └── lib.rs          # 源代码
├── tests/
│   └── web.rs          # 浏览器端测试
└── README.md
```

### 3.2 Cargo.toml 配置

```toml
[package]
name = "my-wasm-lib"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "rlib"]  # cdylib 用于生成 .wasm

[dependencies]
wasm-bindgen = "0.2"             # Rust ↔ JS 绑定
js-sys = "0.3"                   # JS 标准库绑定
web-sys = "0.3"                  # Web API 绑定（可选）

[dev-dependencies]
wasm-bindgen-test = "0.3"        # WASM 测试框架
```

### 3.3 编写 Rust 代码

```rust
// src/lib.rs
use wasm_bindgen::prelude::*;

// 导出函数到 JS
#[wasm_bindgen]
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

// 导出函数：计算斐波那契数列
#[wasm_bindgen]
pub fn fibonacci(n: u32) -> u64 {
    match n {
        0 => 0,
        1 => 1,
        _ => {
            let mut prev: u64 = 0;
            let mut curr: u64 = 1;
            for _ in 2..=n {
                let next = prev + curr;
                prev = curr;
                curr = next;
            }
            curr
        }
    }
}

// 导出结构体到 JS
#[wasm_bindgen]
pub struct ImageProcessor {
    width: u32,
    height: u32,
    data: Vec<u8>,
}

#[wasm_bindgen]
impl ImageProcessor {
    // JS 端调用：new ImageProcessor(width, height)
    #[wasm_bindgen(constructor)]
    pub fn new(width: u32, height: u32) -> ImageProcessor {
        ImageProcessor {
            width,
            height,
            data: vec![0; (width * height * 4) as usize],
        }
    }

    // 获取数据指针（用于 JS 直接写入内存）
    #[wasm_bindgen(js_name = dataPtr)]
    pub fn data_ptr(&self) -> *const u8 {
        self.data.as_ptr()
    }

    // 应用灰度滤镜
    #[wasm_bindgen(js_name = applyGrayscale)]
    pub fn apply_grayscale(&mut self) {
        for chunk in self.data.chunks_exact_mut(4) {
            let r = chunk[0] as f32;
            let g = chunk[1] as f32;
            let b = chunk[2] as f32;
            let gray = (0.299 * r + 0.587 * g + 0.114 * b) as u8;
            chunk[0] = gray;
            chunk[1] = gray;
            chunk[2] = gray;
            // chunk[3] 是 alpha，保持不变
        }
    }
}
```

## 四、构建与打包

### 4.1 使用 wasm-pack 构建

```bash
# 构建（默认 target 是 web）
wasm-pack build --target web

# 构建产物目录结构
pkg/
├── my_wasm_lib_bg.wasm        # WASM 二进制文件
├── my_wasm_lib.js             # JS 绑定（胶水代码）
├── my_wasm_lib.d.ts           # TypeScript 类型定义
├── my_wasm_lib_bg.wasm.d.ts   # WASM 类型定义
└── package.json               # npm 包配置
```

### 4.2 不同构建目标

```bash
# target web：用于原生 ES Module 环境
wasm-pack build --target web

# target bundler：用于 Webpack/Vite 等打包工具
wasm-pack build --target bundler

# target nodejs：用于 Node.js 环境
wasm-pack build --target nodejs

# target no-modules：兼容不支持 ES Module 的环境
wasm-pack build --target no-modules
```

```
构建目标对比
═══════════════════════════════════════════════════════
  目标          使用场景              导入方式
  ─────────────────────────────────────────────────────
  web          原生 HTML/JS          <script type="module">
  bundler      Webpack/Vite          import
  nodejs       Node.js               require / import
  no-modules   旧浏览器              全局变量
═══════════════════════════════════════════════════════
```

## 五、在前端项目中使用

### 5.1 原生 ES Module 方式

```html
<!DOCTYPE html>
<html>
<body>
  <script type="module">
    import init, { add, fibonacci, ImageProcessor } from './pkg/my_wasm_lib.js';

    async function main() {
      // 初始化 WASM 模块
      await init();

      // 调用导出函数
      console.log(add(1, 2));           // 3
      console.log(fibonacci(40));       // 102334155

      // 使用导出的类
      const processor = new ImageProcessor(100, 100);
      processor.applyGrayscale();
    }

    main();
  </script>
</body>
</html>
```

### 5.2 Vite + React 集成

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
  plugins: [wasm(), topLevelAwait()],
});
```

```tsx
// App.tsx
import { useEffect, useState } from 'react';
import init, { fibonacci } from '../pkg/my_wasm_lib';

function App() {
  const [result, setResult] = useState<number | null>(null);

  useEffect(() => {
    init().then(() => {
      const value = fibonacci(50);
      setResult(value);
    });
  }, []);

  return <div>Fibonacci(50) = {result}</div>;
}
```

## 六、wasm-bindgen 进阶

### 6.1 类型映射

```
Rust ↔ JavaScript 类型映射
═══════════════════════════════════════════════════════
  Rust 类型          JavaScript 类型
  ─────────────────────────────────────────────────────
  i32, u32          number
  f32, f64          number
  bool              boolean
  String            string
  &str              string（自动转换）
  Vec<u8>           Uint8Array
  Vec<i32>          Int32Array
  JsValue           any
  Result<T, JsValue>  抛出异常
  Option<T>         T | undefined
  Box<[f64]>        Float64Array
═══════════════════════════════════════════════════════
```

### 6.2 调用 JS 函数

```rust
use wasm_bindgen::prelude::*;

// 从 JS 导入函数
#[wasm_bindgen]
extern "C" {
    // 导入 JS 的 console.log
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);

    // 导入 JS 的 alert
    fn alert(s: &str);

    // 导入自定义 JS 函数
    #[wasm_bindgen(js_name = fetchData)]
    async fn fetch_data(url: &str) -> JsValue;
}

// 使用导入的函数
#[wasm_bindgen]
pub fn greet(name: &str) {
    log(&format!("Hello, {}!", name));
    alert(&format!("Welcome, {}!", name));
}
```

### 6.3 错误处理

```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn parse_number(s: &str) -> Result<f64, JsValue> {
    s.parse::<f64>().map_err(|e| {
        JsValue::from_str(&format!("解析失败: {}", e))
    })
}
```

```javascript
// JS 端会抛出异常
try {
  const result = parseNumber("abc");
} catch (e) {
  console.error(e); // "解析失败: invalid float literal"
}
```

## 七、性能优化技巧

### 7.1 优化编译体积

```toml
# Cargo.toml
[profile.release]
opt-level = "z"     # 优化体积（而非速度）
lto = true          # 链接时优化
strip = true        # 移除调试信息
codegen-units = 1   # 单编译单元，更好的优化
```

```bash
# 安装 wasm-opt 工具（Binaryen 提供）
wasm-opt -Oz -o optimized.wasm input.wasm

# 使用 twiggy 分析体积
cargo install twiggy
twiggy top my_wasm_lib_bg.wasm
```

### 7.2 减少 JS ↔ WASM 边界调用

```rust
// ❌ 差：每次调用都跨越边界
for i in 0..1000000 {
    js_callback(i);
}

// ✅ 好：批量处理后一次性返回
let results: Vec<i32> = (0..1000000).collect();
return results;
```

## 八、面试要点

### 8.1 常见面试问题

**Q1：为什么 Rust 是编译到 WASM 的首选语言？**

> Rust 没有 GC，不需要将垃圾回收器编译进 WASM（Go 编译到 WASM 时需要，导致体积大）。Rust 的所有权系统在编译期保证内存安全，运行时零开销。wasm-pack 和 wasm-bindgen 工具链成熟。

**Q2：wasm-bindgen 做了什么？**

> wasm-bindgen 自动生成 JS ↔ WASM 之间的胶水代码：类型转换（Rust String → JS string）、内存管理（JS 端持有 WASM 内存引用的防泄漏处理）、异步函数支持等。

**Q3：如何优化 WASM 产物体积？**

> Cargo.toml 中设置 `opt-level = "z"` + `lto = true` + `strip = true`；使用 wasm-opt 二次优化；分析依赖，避免引入不必要的 crate；使用 `wee_alloc` 替代默认分配器。

**Q4：web-sys 和 js-sys 有什么区别？**

> js-sys 提供 JavaScript 标准库的绑定（Array、Object、Promise 等）。web-sys 提供 Web API 的绑定（Document、Canvas、Fetch 等）。两者都是 wasm-bindgen 生态的一部分。
