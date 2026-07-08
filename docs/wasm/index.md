---
sidebar_position: 0
title: WebAssembly
slug: /wasm
---

# 🚀 WebAssembly

> **"WebAssembly 让浏览器拥有了接近原生的性能"** —— WebAssembly (WASM) 是一种二进制指令格式，为 Web 平台带来了高性能计算能力，是前端工程师进阶的必修课。

## 为什么需要学习 WebAssembly？

```
JavaScript 的局限
    ↓
┌──────────────────────────────────────────────────────┐
│  解析 → 字节码 → JIT 编译 → 优化 → 去优化 → 重新优化  │
│  ↑                                                  │
│  性能瓶颈：解析开销、GC 停顿、类型推断不稳定           │
└──────────────────────────────────────────────────────┘
    ↓
WebAssembly 的解决方案
    ↓
┌──────────────────────────────────────────────────────┐
│  预编译二进制格式 → 线性内存 → 确定性执行性能           │
│  跳过解析和优化阶段 → 接近原生速度                     │
└──────────────────────────────────────────────────────┘
```

**WebAssembly 不是 JavaScript 的替代品，而是互补**：JS 负责 UI 交互和业务逻辑，WASM 负责计算密集型任务。

## 知识图谱

```
WebAssembly
├── 🧱 基础概念            ── 二进制格式、模块、内存模型、指令集
├── 🦀 Rust 编译到 WASM    ── wasm-pack、wasm-bindgen、工具链
├── 🔗 JS 互操作           ── 线性内存、共享 ArrayBuffer、宿主函数
├── 🎯 前端应用场景        ── 图片处理、音视频、游戏、加密计算
└── ⚡ 性能优化            ── SIMD、多线程、流式编译、体积优化
```

## 子主题导航

| 主题 | 难度 | 核心关键词 |
|------|------|-----------|
| [WebAssembly 基础概念](./wasm-basics.md) | 🟡 中等 | 二进制格式、模块、内存模型、指令集 |
| [Rust 编译到 WebAssembly](./wasm-rust.md) | 🟡 中等 | wasm-pack、wasm-bindgen、Cargo |
| [WebAssembly 与 JavaScript 交互](./wasm-js-interaction.md) | 🔴 困难 | 线性内存、共享数据、宿主绑定 |
| [WebAssembly 前端应用场景](./wasm-use-cases.md) | 🟡 中等 | 图片处理、音视频、游戏、加密 |

## WASM vs JS 性能对比概览

```
执行速度（计算密集型任务）
═══════════════════════════════════════════════════
  Native C++   │████████████████████████████████│ 1.0x
  WebAssembly  │██████████████████████████████  │ ~1.1-1.5x
  JS (V8 JIT)  │████████████████████            │ ~2-10x
  JS (解释执行) │████████████                    │ ~10-100x
═══════════════════════════════════════════════════
  越短 = 越快
```

## 学习建议

1. **基础概念** 是理解 WASM 的前提，建议首先学习二进制格式和内存模型
2. **Rust 编译** 是目前 WASM 生态最成熟的工具链，必须掌握
3. **JS 互操作** 是实际项目中最常遇到的问题，涉及数据传递和性能调优
4. **应用场景** 帮助理解什么场景该用 WASM、什么场景不该用
5. 学习过程中建议动手用 Rust 写一个简单的 WASM 模块并在浏览器中调用

## 面试要点速查

- **什么是 WebAssembly？** 一种低级的二进制指令格式，可在浏览器中以接近原生的速度运行
- **WASM 和 JS 的关系？** 互补而非替代，WASM 处理计算密集任务，JS 处理 UI 和业务逻辑
- **WASM 的优势？** 高性能、跨语言支持（Rust/C/C++/Go）、安全沙箱、体积小
- **WASM 的局限？** 不能直接操作 DOM、调试困难、需要与 JS 配合使用

## 推荐学习资源

- [WebAssembly 官方文档](https://webassembly.org/)
- [Rust and WebAssembly Book](https://rustwasm.github.io/docs/book/)
- [wasm-pack 官方文档](https://rustwasm.github.io/wasm-pack-book/)
- [MDN WebAssembly 文档](https://developer.mozilla.org/en-US/docs/WebAssembly)
