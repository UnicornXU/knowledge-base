---
sidebar_position: 3
title: V8 引擎与垃圾回收
difficulty: hard
tags:
  - browser
  - v8
  - garbage-collection
---

# 🧠 V8 引擎与垃圾回收

> **"理解 V8 的编译管线和垃圾回收机制，才能写出真正高性能的 JavaScript"**

V8 是 Chrome 和 Node.js 使用的 JavaScript 引擎。它的编译优化和内存管理策略直接影响着代码的执行效率。

## 一、V8 引擎架构

### 1.1 编译管线全景

```
V8 编译管线：
═══════════════════════════════════════════════════════

  JavaScript 源码
       │
       ▼
  ┌─────────┐
  │  Parser  │  → 词法分析 + 语法分析
  └────┬────┘  → 生成 AST（抽象语法树）
       │
       ▼
  ┌───────────────┐
  │   Ignition     │  → 字节码解释器
  │  (解释执行)    │  → 快速启动，低内存占用
  └──────┬────────┘  → 收集类型反馈信息
         │
         │  热点函数（执行次数超过阈值）
         ▼
  ┌───────────────┐
  │    Maglev      │  → 中间层优化编译器（V114+）
  │ (中等优化)     │  → 基于类型反馈进行投机优化
  └──────┬────────┘  → 编译速度和优化质量的平衡
         │
         │  极热代码路径
         ▼
  ┌───────────────┐
  │   TurboFan     │  → 最高优化级别编译器
  │ (最高优化)     │  → 激进的内联、逃逸分析
  └───────────────┘  → 生成高效机器码
```

### 1.2 JIT（Just-In-Time）编译

```
JIT 编译 vs AOT（Ahead-Of-Time）：
═══════════════════════════════════════

  AOT（如 C/C++）：
  源码 → 编译 → 机器码 → 执行
  优点：执行速度快
  缺点：编译时间长，无法利用运行时信息

  JIT（JavaScript）：
  源码 → 解释执行 → 收集运行时信息 → 热点代码编译为机器码 → 执行
  优点：快速启动 + 热点优化
  缺点：需要额外的分析和编译开销
```

### 1.3 隐藏类（Hidden Classes）与内联缓存

```js
// V8 使用隐藏类来加速属性访问
// 相同结构的对象共享同一个隐藏类

// ✅ 推荐：使用固定的属性顺序创建对象
function Point(x, y) {
  this.x = x;  // HiddenClass HC0 → HC1
  this.y = y;  // HiddenClass HC1 → HC2
}

const p1 = new Point(1, 2);  // 创建 HC0 → HC1 → HC2 链
const p2 = new Point(3, 4);  // 复用 HC2，相同隐藏类

// ❌ 避免：动态添加/删除属性
const obj = {};
obj.a = 1;    // 创建新的隐藏类
obj.b = 2;    // 创建新的隐藏类
delete obj.a; // 隐藏类回退，破坏优化

// ❌ 避免：属性初始化顺序不一致
const obj1 = {}; obj1.x = 1; obj1.y = 2;  // 隐藏类 A
const obj2 = {}; obj2.y = 2; obj2.x = 1;  // 隐藏类 B（不同！）
```

```
内联缓存（Inline Caching）：
═══════════════════════════════════════

  function getX(obj) {
    return obj.x;  // 内联缓存记住 obj 的隐藏类和 x 的偏移量
  }

  第一次调用：getX(p1)
    → 搜索属性位置（慢路径）
    → 缓存：HC2，偏移量 = 0

  后续调用：getX(p2)
    → 检查隐藏类是否为 HC2
    → 是 → 直接读取偏移量 0（快路径）
    → 否 → 去优化，重新搜索
```

## 二、垃圾回收策略

### 2.1 内存分代

```
V8 堆内存结构：
═══════════════════════════════════════════════════════

  ┌────────────────────────────────────────────────┐
  │                    V8 堆                        │
  │                                                │
  │  ┌──────────────────┐  ┌──────────────────┐   │
  │  │   新生代          │  │   老生代          │   │
  │  │   (Young Gen)    │  │   (Old Gen)      │   │
  │  │   1-8 MB         │  │   700MB-1.5GB    │   │
  │  │                  │  │                  │   │
  │  │  ┌─────┬──────┐ │  │                  │   │
  │  │  │ From│  To  │ │  │  长期存活的对象    │   │
  │  │  │ Semi│Semi  │ │  │                  │   │
  │  │  │Space│Space │ │  │                  │   │
  │  │  └─────┴──────┘ │  │                  │   │
  │  └──────────────────┘  └──────────────────┘   │
  │                                                │
  │  ┌──────────────────────────────────────────┐  │
  │  │              大对象空间                    │  │
  │  │              (Large Object Space)         │  │
  │  └──────────────────────────────────────────┘  │
  │                                                │
  │  ┌──────────────────────────────────────────┐  │
  │  │              代码空间                      │  │
  │  │              (Code Space)                 │  │
  │  └──────────────────────────────────────────┘  │
  └────────────────────────────────────────────────┘
```

### 2.2 新生代 GC：Scavenge 算法

```
Scavenge 算法（新生代）：
═══════════════════════════════════════════════════════

  From Space（使用中）         To Space（空闲）
  ┌──────────────────┐       ┌──────────────────┐
  │ A    B    C    D │       │                  │
  │ ↓         ↓     │       │                  │
  │ 存活    存活     │  →→→  │  C'   D'         │
  │      存活        │  复制  │                  │
  └──────────────────┘       └──────────────────┘
  A,B 被回收  C,D 存活         From 和 To 互换

  特点：
  • 只处理存活对象（通常很少）
  • 空间换时间：需要 2 倍空间
  • 速度快：适合新生代小空间
  • 存活对象经历两次 Scavenge → 晋升到老生代
```

### 2.3 老生代 GC：Mark-Sweep 与 Mark-Compact

```
Mark-Sweep（标记-清除）：
═══════════════════════════════════════════════════════

  标记阶段：从根对象出发，标记所有可达对象
  
  根对象（Roots）
  ├── 全局对象
  ├── 调用栈中的变量
  └── 闭包引用
      │
      ▼ 深度优先遍历标记
      
  ┌───┬───┬───┬───┬───┬───┬───┬───┐
  │ A │ B │ C │ D │ E │ F │ G │ H │
  │ ✓ │ ✓ │   │ ✓ │   │ ✓ │   │ ✓ │  ← 标记结果
  └───┴───┴───┴───┴───┴───┴───┴───┘

  清除阶段：回收未标记的对象
  
  ┌───┬───┬───┬───┬───┬───┬───┬───┐
  │ A │ B │   │ D │   │ F │   │ H │  ← C,E,G 被回收
  └───┴───┴───┴───┴───┴───┴───┴───┘
  
  问题：产生内存碎片

Mark-Compact（标记-整理）：
═══════════════════════════════════════════════════════

  在 Mark-Sweep 的基础上，将存活对象向一端移动
  
  ┌───┬───┬───┬───┬───────────────┐
  │ A │ B │ D │ F │ H │    空     │  ← 无碎片
  └───┴───┴───┴───┴───┴───────────┘
  
  优点：消除碎片
  缺点：需要移动对象，开销更大
```

### 2.4 并发与增量 GC

```
GC 优化策略演进：
═══════════════════════════════════════════════════════

1. 全停顿（Stop-The-World）
   GC 期间暂停所有 JS 执行
   |--- 执行 ---|-- GC --|--- 执行 ---|

2. 增量标记（Incremental Marking）
   将标记工作分成小块，穿插在 JS 执行中
   |执行|--标记--|执行|--标记--|执行|--标记--|sweep|

3. 并发标记（Concurrent Marking）
   GC 标记在后台线程并发执行
   |------- 执行 -------|
       |--- 后台 GC ---|

4. 并发清除（Concurrent Sweeping）
   清除工作也在后台线程执行
   |------- 执行 -------|
       |--- 后台 GC+清除 ---|

当前 V8 使用：并发标记 + 并发清除 + 增量标记（备用）
```

## 三、WeakRef 与 FinalizationRegistry

```js
// WeakRef：弱引用，不阻止垃圾回收
let obj = { data: 'important' };
const weakRef = new WeakRef(obj);

// 获取引用的对象（可能已被回收）
console.log(weakRef.deref()); // { data: 'important' }

obj = null; // 原对象失去强引用

// 下一次 GC 后：
console.log(weakRef.deref()); // undefined（已被回收）

// FinalizationRegistry：对象被回收后的清理回调
const registry = new FinalizationRegistry((heldValue) => {
  console.log(`对象 ${heldValue} 已被回收`);
  // 清理关联资源，如关闭连接、释放内存等
});

let cache = { data: 'cached' };
registry.register(cache, 'cache-key');

cache = null; // 对象在下次 GC 时会触发回调

// ⚠️ 注意：
// 1. 回调执行时机不确定（可能永远不会执行）
// 2. 不要在回调中执行关键业务逻辑
// 3. 主要用于清理外部资源（WebSocket、WebGL 纹理等）
```

## 四、常见内存泄漏模式

### 4.1 闭包导致的内存泄漏

```js
// ❌ 闭包持有对大对象的引用
function createHeavyClosure() {
  const largeData = new Array(1000000).fill('*');

  return function inner() {
    // 即使不用 largeData，它仍被闭包持有
    // V8 的优化可能帮助，但不能完全依赖
    return 'hello';
  };
}

// ✅ 使用完后手动解除引用
function createOptimizedClosure() {
  let largeData = new Array(1000000).fill('*');

  // 处理完后释放
  process(largeData);
  largeData = null; // 允许 GC 回收

  return function inner() {
    return 'hello';
  };
}
```

### 4.2 分离的 DOM 节点

```js
// ❌ DOM 节点被 JS 引用但已从 DOM 树移除
function createDetachedNode() {
  const div = document.createElement('div');
  document.body.appendChild(div);
  document.body.removeChild(div); // 从 DOM 树移除

  // div 仍在内存中！变量引用它
  return div; // 返回被分离的节点
}

// ✅ 正确清理
function cleanup() {
  const div = document.getElementById('temp');
  div.parentNode.removeChild(div);
  // 确保没有其他变量引用 div
}
```

### 4.3 定时器未清理

```js
// ❌ 忘记清理定时器
function startPolling() {
  setInterval(() => {
    // 这个定时器永远运行，回调中引用的数据永远不会被回收
    fetchData();
  }, 1000);
}

// ✅ 保存引用并清理
class Poller {
  constructor() {
    this.timerId = null;
  }

  start() {
    this.timerId = setInterval(() => this.fetchData(), 1000);
  }

  stop() {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}
```

### 4.4 事件监听器未移除

```js
// ❌ 全局事件监听器未清理
function setupComponent() {
  const handler = () => console.log('resize');
  window.addEventListener('resize', handler);
  // 组件销毁时 handler 仍在内存中
}

// ✅ 组件销毁时移除
class Component {
  constructor() {
    this.handleResize = () => console.log('resize');
    window.addEventListener('resize', this.handleResize);
  }

  destroy() {
    window.removeEventListener('resize', this.handleResize);
  }
}
```

### 4.5 Map / Set 持有引用

```js
// ❌ 全局 Map 不断增长
const cache = new Map();

function cacheResult(key, value) {
  cache.set(key, value); // 永远不会被回收
}

// ✅ 使用 WeakMap（键为对象时）
const weakCache = new WeakMap();

function cacheWithWeakRef(key, value) {
  weakCache.set(key, value); // key 被回收时自动清理
}
```

## 五、如何检测内存泄漏

### 5.1 Chrome DevTools 内存面板

```
检测步骤：
═══════════════════════════════════════

1. 打开 DevTools → Memory 面板
2. 选择 "Heap snapshot"（堆快照）
3. 执行操作前拍一次快照
4. 执行可能导致泄漏的操作
5. 拍第二次快照
6. 选择 "Comparison" 视图
7. 按 "Size Delta" 排序
8. 查找持续增长的对象
```

### 5.2 Performance Monitor

```js
// 使用 Performance API 手动监控
const observer = new PerformanceObserver((list) => {
  const entries = list.getEntriesByType('measure');
  entries.forEach(entry => {
    console.log(`${entry.name}: ${entry.duration}ms`);
  });
});
observer.observe({ entryTypes: ['measure'] });

// 检查 JS 堆大小
if (performance.memory) {
  console.log('已用堆大小:', performance.memory.usedJSHeapSize);
  console.log('堆大小限制:', performance.memory.jsHeapSizeLimit);
}
```

## 六、面试要点

- V8 的**四级编译管线**：Parser → Ignition → Maglev → TurboFan
- **隐藏类**和**内联缓存**是 V8 优化属性访问的核心机制
- 新生代使用 **Scavenge**（复制算法），老生代使用 **Mark-Sweep / Mark-Compact**
- GC 停顿优化：**增量标记** + **并发标记/清除**
- 五种常见内存泄漏：**闭包**、**分离 DOM**、**未清理定时器**、**事件监听器**、**Map/Set**
- `WeakRef` 和 `FinalizationRegistry` 的使用场景和注意事项

## 七、常见面试题

**Q1: V8 引擎如何执行 JavaScript 代码？**

A: 首先通过 Parser 将源码解析为 AST；然后 Ignition 解释器将 AST 编译为字节码并执行，同时收集类型反馈；热点函数经过 Maglev（中等优化）最终由 TurboFan 编译为高效的机器码。

**Q2: 什么是隐藏类？它如何优化代码？**

A: V8 为每个 JS 对象创建隐藏类来描述对象的形状（属性和顺序）。相同形状的对象共享隐藏类，属性访问时通过内联缓存记住偏移量，从而避免每次访问都做哈希查找。应保持对象结构一致来利用此优化。

**Q3: 新生代和老生代的 GC 策略有什么区别？**

A: 新生代空间小（1-8MB），使用 Scavenge 算法（将存活对象从 From 空间复制到 To 空间），速度快。老生代空间大，使用 Mark-Sweep 或 Mark-Compact，通过并发标记和增量标记减少停顿。新生代对象存活两次 Scavenge 后晋升到老生代。

**Q4: 如何检测和排查内存泄漏？**

A: 使用 Chrome DevTools Memory 面板的堆快照对比功能，对比操作前后的内存差异；使用 Performance 面板观察 JS 堆大小趋势；使用 Performance Monitor 实时查看 DOM 节点数、JS 堆大小等指标。

**Q5: WeakMap 和 WeakSet 有什么用？**

A: 它们只接受对象作为键，且不会阻止键对象被垃圾回收。适合用于存储对象的附加数据（如 DOM 元素的元数据）、实现缓存（键被回收后自动清理）、以及私有数据存储。
