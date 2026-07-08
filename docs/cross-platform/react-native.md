---
sidebar_position: 1
title: "React Native"
difficulty: "medium"
tags: ["cross-platform", "react-native", "bridge", "fabric"]
---

# React Native 原理与实践

## 核心架构

React Native（RN）让前端工程师使用 React 语法开发原生移动应用。其核心思想是：**JS 线程负责逻辑与布局计算，原生线程负责 UI 渲染**。

```
React Native 架构总览（旧架构）
═══════════════════════════════════════════════════════

  JS Thread                    Native Thread (Main/UI)
  ┌──────────────┐             ┌──────────────────┐
  │ React 代码    │             │ UIKit / Android   │
  │ 业务逻辑      │   Bridge    │ View              │
  │ Yoga 布局计算  │ ─────────→ │ 原生组件渲染       │
  │              │  (JSON 序列化)│                  │
  └──────────────┘             └──────────────────┘
        │                            │
        │   Shadow Thread            │
        │   ┌──────────────┐         │
        │   │ Yoga 引擎     │         │
        │   │ 布局计算       │         │
        │   └──────────────┘         │
        └────────────────────────────┘

问题：Bridge 是异步的、JSON 序列化的，存在性能瓶颈
```

## 旧架构的三大痛点

```
旧架构核心问题
═══════════════════════════════════════════════════════

1. Bridge 通信开销
   JS ──JSON.stringify──→ Bridge ──JSON.parse──→ Native
   每次通信都需要序列化/反序列化，高频操作（如动画）会卡顿

2. 三线程模型的延迟
   JS Thread → Shadow Thread → Main Thread
   布局计算和 UI 渲染分布在不同线程，通信链路长

3. JS 引擎启动慢
   首次启动需要加载 JSBundle、初始化 JS 引擎（JavaScriptCore）
   冷启动时间较长
```

## 新架构（2022+）

```
React Native 新架构
═══════════════════════════════════════════════════════

  ┌──────────────────────────────────────────────────┐
  │                   JS Runtime                      │
  │  ┌──────────┐  ┌───────────┐  ┌──────────────┐  │
  │  │  React    │  │  Hermes   │  │  JSI          │  │
  │  │  代码     │  │  引擎     │  │ (JS Interface) │  │
  │  └──────────┘  └───────────┘  └──────┬─────────┘  │
  └──────────────────────────────────────┼────────────┘
                                         │ 同步调用（C++ 绑定）
  ┌──────────────────────────────────────┼────────────┐
  │                   C++ Core                        │
  │  ┌───────────────┐  ┌──────────────────────────┐  │
  │  │  Fabric       │  │  TurboModules             │  │
  │  │  (新渲染器)    │  │  (新原生模块系统)          │  │
  │  └───────┬───────┘  └──────────────────────────┘  │
  └──────────┼────────────────────────────────────────┘
             │
  ┌──────────┼────────────────────────────────────────┐
  │          ▼          Native Layer                   │
  │  ┌──────────────┐  ┌──────────────────────────┐   │
  │  │  原生组件     │  │  原生模块                  │   │
  │  │  (Fabric 渲染)│  │  (TurboModules)           │   │
  │  └──────────────┘  └──────────────────────────┘   │
  └───────────────────────────────────────────────────┘

三大改进：
  1. JSI（JS Interface）：C++ 直接绑定，取代 JSON Bridge
  2. Fabric：新渲染器，支持同步渲染、并发特性
  3. TurboModules：按需加载原生模块，替代旧的 NativeModules
```

### JSI 详解

```
JSI 工作原理
═══════════════════════════════════════════════════════

旧方案（Bridge）：
  JS → JSON.stringify() → Bridge Queue → JSON.parse() → Native
  ❌ 异步、序列化开销大、无法共享内存

新方案（JSI）：
  JS → C++ HostObject → Native
  ✅ 同步调用、零序列化、可共享内存

JSI 的核心概念：
  - HostObject：C++ 对象暴露给 JS 直接访问
  - HostFunction：C++ 函数暴露给 JS 直接调用
  - Runtime：抽象了 JS 引擎（Hermes / JSC / V8）

// JS 侧可以直接调用 C++ 对象的方法，无需序列化
const result = global.nativeModule.compute(value);
```

### Fabric 渲染器

```
Fabric 渲染流程
═══════════════════════════════════════════════════════

1. JS 侧：React 构建 Element Tree
2. C++ 侧：Shadow Tree 计算布局（Yoga）
3. C++ 侧：生成差异（diff）→ Mutation 指令
4. Native 侧：执行 DOM 操作更新 UI

Fabric 的关键改进：
  ✅ 支持 React 18 的并发特性（Suspense、Transitions）
  ✅ 渲染优先级可调度
  ✅ 支持同步渲染路径（减少一帧延迟）
  ✅ 简化的线程模型（不再需要独立的 Shadow Thread）
```

## Hermes 引擎

```
Hermes vs JavaScriptCore
═══════════════════════════════════════════════════════

                Hermes              JavaScriptCore
                ──────              ──────────────
  启动速度       ★★★★★ (预编译)      ★★★ (解释执行)
  内存占用       ★★★★★              ★★★
  包体积         较小                较大
  调试体验       Chrome DevTools     Safari Inspector
  字节码         预编译 AOT          运行时 JIT

Hermes 的核心优化：
  - AOT 编译：JS → 字节码（编译时完成，减少运行时开销）
  - 预解析：启动时直接加载字节码，跳过解析阶段
  - 优化的 GC：分代式垃圾回收，减少卡顿
```

## 常用组件与原生映射

```
RN 组件 → 原生组件映射
═══════════════════════════════════════════════════════

  RN 组件             iOS                  Android
  ─────────          ─────                ────────
  <View>             UIView               android.view.View
  <Text>             UILabel              android.widget.TextView
  <Image>            UIImageView          android.widget.ImageView
  <ScrollView>       UIScrollView         android.widget.ScrollView
  <TextInput>        UITextField          android.widget.EditText
  <FlatList>         UITableView          RecyclerView
  <TouchableOpacity> UIControl            android.view.View + Ripple
```

## 性能优化要点

```
React Native 性能优化清单
═══════════════════════════════════════════════════════

1. JS 线程优化
   ├── 避免在 JS 线程做重计算（使用 InteractionManager）
   ├── 减少 Bridge/JSI 通信频率（批量操作）
   ├── 使用 React.memo 减少不必要的重渲染
   └── 长列表使用 FlatList（虚拟化）替代 map

2. 渲染优化
   ├── 减少组件嵌套层级
   ├── 使用 shouldComponentUpdate / React.memo
   ├── 图片使用 resizeMode 避免重新布局
   └── 动画使用原生驱动（useNativeDriver: true）

3. 内存优化
   ├── 及时清理定时器和事件监听
   ├── 大图片使用 resizeMode="contain" 而非固定尺寸
   ├── 避免在 render 中创建新对象/函数
   └── 使用 Hermes 引擎（更优的内存管理）

4. 启动优化
   ├── 使用 Hermes 预编译字节码
   ├── 按需加载 TurboModules
   ├── 拆分 JSBundle（基础包 + 业务包）
   └── 预加载常用页面
```

## 面试要点

**必知概念：**
- 旧架构三线程模型（JS / Shadow / Main）及其通信方式
- 新架构三大改进（JSI / Fabric / TurboModules）解决了什么问题
- Hermes 引擎的 AOT 编译优势
- Bridge 为什么是性能瓶颈（JSON 序列化、异步）

**高频问题：**
- RN 的 JS 线程和 Native 线程是如何通信的？
- 为什么 RN 的动画容易卡顿？如何优化？
- Fabric 渲染器相比旧渲染器有什么改进？
- JSI 和 Bridge 的本质区别是什么？

**进阶问题：**
- 如何实现 RN 的热更新？CodePush 的原理是什么？
- RN 的首屏加载优化有哪些手段？
- 如何在 RN 中实现复杂的交互动画？
