---
sidebar_position: 2
title: "CRDT 算法与实践"
difficulty: "hard"
tags: ["CRDT", "Yjs", "Automerge", "分布式"]
---

# CRDT 算法与实践

## 什么是 CRDT

CRDT（Conflict-free Replicated Data Type，无冲突复制数据类型）是一类特殊的数据结构，它允许多个副本独立、并发地更新，无需协调（如锁或共识协议），并且能够自动合并所有更新，数学上保证最终一致性。

:::info 一句话理解 CRDT
"让数据结构本身解决冲突，而不是靠外部协调机制。"
:::

### CRDT 的核心价值

```
传统方案：                    CRDT方案：
Client A ──→ Lock ──→ 修改    Client A ──→ 直接修改本地副本
Client B ──→ 等待...          Client B ──→ 直接修改本地副本
                                        ↓
                              合并时自动解决冲突（数学保证）
```

---

## 数学基础（通俗版）

:::tip 不需要深入数学，理解直觉即可
CRDT 的正确性建立在抽象代数之上，但工程应用只需理解三个直觉：
:::

### 半格（Semilattice）

半格是一种数学结构，定义了元素之间的 **合并操作**（join/merge），满足：

| 性质 | 含义 | 通俗理解 |
|------|------|----------|
| **交换律** | merge(A, B) = merge(B, A) | 合并顺序不影响结果 |
| **结合律** | merge(A, merge(B, C)) = merge(merge(A, B), C) | 分批合并结果相同 |
| **幂等性** | merge(A, A) = A | 重复合并不会出错 |

### 偏序关系

CRDT 中的状态存在"新旧"关系：

```
状态演进：S1 → S2 → S3（S3 比 S1 "新"）

并发状态：S2a 和 S2b 无法比较谁"新"
         → 需要 merge 操作合并为 S3
```

### 单调性

CRDT 的状态只能"向前"演进，不能回退。这保证了：
- 信息不会丢失
- 合并操作总能产生"更新"的状态

---

## 两种 CRDT 类型

### 状态基 CvRDT vs 操作基 CmRDT

```
CvRDT（State-based）：              CmRDT（Operation-based）：
┌──────────┐  发送完整状态  ┌──────────┐    ┌──────────┐  发送操作  ┌──────────┐
│ Replica A│ ────────────→ │ Replica B│    │ Replica A│ ─────────→│ Replica B│
│ state={} │ ←──────────── │ state={} │    │ ops=[...]│           │ ops=[...]│
└──────────┘  merge状态    └──────────┘    └──────────┘           └──────────┘
```

| 对比维度 | CvRDT（状态基） | CmRDT（操作基） |
|----------|-----------------|-----------------|
| 传输内容 | 完整状态 | 操作（增量） |
| 网络开销 | 大（状态可能很大） | 小（仅传操作） |
| 网络要求 | 可丢包、可乱序 | 需要可靠有序传输（或幂等操作） |
| 合并方式 | merge 函数合并两个状态 | apply 函数应用操作 |
| 实现复杂度 | 较低 | 较高 |
| 代表实现 | Riak, Redis CRDT | Yjs, Automerge |

---

## 常见 CRDT 类型

### G-Counter（只增计数器）

```typescript
// 每个节点维护自己的计数，总数 = 所有节点之和
class GCounter {
  private counts: Map<string, number> = new Map();

  constructor(private nodeId: string) {
    this.counts.set(nodeId, 0);
  }

  increment() {
    const current = this.counts.get(this.nodeId) || 0;
    this.counts.set(this.nodeId, current + 1);
  }

  value(): number {
    let sum = 0;
    for (const count of this.counts.values()) {
      sum += count;
    }
    return sum;
  }

  merge(other: GCounter) {
    for (const [nodeId, count] of other.counts) {
      const myCount = this.counts.get(nodeId) || 0;
      this.counts.set(nodeId, Math.max(myCount, count));
    }
  }
}
```

### PN-Counter（可增可减计数器）

```typescript
// 用两个 G-Counter 实现：P 记录增加，N 记录减少
class PNCounter {
  private P: GCounter; // 增加计数
  private N: GCounter; // 减少计数

  value(): number {
    return this.P.value() - this.N.value();
  }

  increment() { this.P.increment(); }
  decrement() { this.N.increment(); }
}
```

### OR-Set（观察-删除集合）

OR-Set 解决了集合中"添加和删除同一元素"的冲突：

```typescript
// OR-Set: 每次添加生成唯一标签，删除时只删除已"观察到"的标签
class ORSet<T> {
  // element → Set<unique-tag>
  private elements: Map<T, Set<string>> = new Map();

  add(element: T) {
    const tag = generateUniqueId(); // 如 UUID
    if (!this.elements.has(element)) {
      this.elements.set(element, new Set());
    }
    this.elements.get(element)!.add(tag);
  }

  remove(element: T) {
    // 删除当前观察到的所有标签
    this.elements.delete(element);
  }

  has(element: T): boolean {
    const tags = this.elements.get(element);
    return tags !== undefined && tags.size > 0;
  }

  merge(other: ORSet<T>) {
    // 合并：取标签的并集
    for (const [element, tags] of other.elements) {
      if (!this.elements.has(element)) {
        this.elements.set(element, new Set());
      }
      for (const tag of tags) {
        this.elements.get(element)!.add(tag);
      }
    }
  }
}
```

### 序列 CRDT — 文本协作的核心

:::warning 文本协作是 CRDT 最复杂的应用场景
序列 CRDT 需要解决：在分布式环境中对有序元素（字符）的插入和删除保持一致。
:::

常见序列 CRDT 算法：

| 算法 | 原理 | 优点 | 缺点 |
|------|------|------|------|
| **RGA** | 链表 + 时间戳排序 | 性能好、实现较直观 | 墓碑(tombstone)内存开销 |
| **LSEQ** | 指数树分配位置标识 | 标识符紧凑 | 可能不均匀分布 |
| **Logoot** | 密集标识符空间 | 标识符独立生成 | 交错问题 |
| **Yjs YATA** | 链表 + 左右邻居标识 | 工业验证、高性能 | 实现复杂 |

---

## Yjs 库详解

[Yjs](https://github.com/yjs/yjs) 是目前最流行的 CRDT 协作库，被 Notion、Jupyter、BlockSuite 等产品使用。

### 核心概念

```typescript
import * as Y from 'yjs';

// Y.Doc — 协作文档的根容器
const doc = new Y.Doc();

// Y.Text — 协作富文本
const yText = doc.getText('editor');
yText.insert(0, 'Hello');
yText.insert(5, ' World');

// Y.Array — 协作数组
const yArray = doc.getArray('list');
yArray.push(['item1', 'item2']);

// Y.Map — 协作映射
const yMap = doc.getMap('config');
yMap.set('theme', 'dark');

// 监听变更
yText.observe(event => {
  console.log('Text changed:', event.changes);
});
```

### Provider 架构

Yjs 的 Provider 负责文档的网络同步和持久化：

```
┌────────────────────────────────────────────────┐
│                   Y.Doc                        │
├────────────────────────────────────────────────┤
│  Y.Text  │  Y.Array  │  Y.Map  │  Y.XmlFragment│
└─────┬─────────┬──────────┬──────────┬──────────┘
      │         │          │          │
      ▼         ▼          ▼          ▼
┌──────────┐┌──────────┐┌──────────┐┌──────────┐
│WebSocket ││ WebRTC   ││IndexedDB ││  Custom  │
│ Provider ││ Provider ││ Provider ││ Provider │
└──────────┘└──────────┘└──────────┘└──────────┘
   网络同步     P2P同步    本地持久化   自定义逻辑
```

### 与编辑器集成

```typescript
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { yCollab } from 'y-codemirror.next';
import { EditorView, basicSetup } from 'codemirror';

// 创建 Yjs 文档和 Provider
const ydoc = new Y.Doc();
const provider = new WebsocketProvider(
  'wss://your-server.com',
  'room-name',
  ydoc
);
const yText = ydoc.getText('codemirror');

// Awareness — 共享光标位置和用户信息
const awareness = provider.awareness;
awareness.setLocalStateField('user', {
  name: '张三',
  color: '#ff6600',
  cursor: null
});

// 创建 CodeMirror 编辑器
const view = new EditorView({
  extensions: [
    basicSetup,
    yCollab(yText, awareness)
  ],
  parent: document.getElementById('editor')!
});
```

### Awareness 协议

Awareness 用于共享非持久化状态（光标位置、用户在线状态等）：

```typescript
// 设置本地状态
awareness.setLocalStateField('cursor', { 
  anchor: 10, 
  head: 15 
});

// 监听其他用户状态变化
awareness.on('change', ({ added, updated, removed }) => {
  const states = awareness.getStates();
  states.forEach((state, clientId) => {
    if (clientId !== doc.clientID) {
      renderRemoteCursor(state.user, state.cursor);
    }
  });
});
```

:::tip 完整协作编辑器搭建步骤
1. 安装：`npm install yjs y-websocket y-prosemirror`
2. 启动 WebSocket 服务器：`npx y-websocket`
3. 创建 Y.Doc + Provider
4. 绑定到编辑器（ProseMirror/Tiptap/CodeMirror）
5. 配置 Awareness 实现光标共享
:::

---

## Automerge 对比

### 设计理念差异

| 维度 | Yjs | Automerge |
|------|-----|-----------|
| **设计目标** | 高性能网络协作 | 本地优先(local-first)应用 |
| **数据模型** | 显式类型(Y.Text/Y.Array) | JSON-like 自动检测 |
| **网络假设** | 需要 Provider 集成 | 网络无关、纯数据结构 |
| **持久化** | Provider 负责 | 内建二进制格式 |

### API 风格对比

```typescript
// Yjs — 显式操作
const doc = new Y.Doc();
const text = doc.getText('content');
text.insert(0, 'Hello');
text.delete(0, 2);

// Automerge — 函数式变更
import * as Automerge from '@automerge/automerge';
let doc = Automerge.init();
doc = Automerge.change(doc, d => {
  d.text = new Automerge.Text();
  d.text.insertAt(0, 'H', 'e', 'l', 'l', 'o');
});
```

### 性能对比

| 场景 | Yjs | Automerge |
|------|-----|-----------|
| 初始化大文档(100K ops) | ~50ms | ~200ms |
| 单次编辑操作 | <1ms | ~2ms |
| 内存占用(10K字符文档) | ~100KB | ~500KB |
| 二进制编码大小 | 较小 | 较大 |

:::warning 选型建议
- **选 Yjs**：需要与现有编辑器（ProseMirror/CodeMirror/Monaco）集成、追求极致性能、有明确的网络架构
- **选 Automerge**：构建本地优先应用、需要 Git-like 版本管理、JSON 数据结构为主
:::

---

## 面试题

### Q1: 解释 CRDT 如何保证最终一致性？

**参考答案：**

CRDT 通过数学性质保证最终一致性：
1. **交换律**：操作合并不依赖顺序 — merge(A,B) = merge(B,A)
2. **结合律**：分批合并结果相同
3. **幂等性**：重复合并不改变结果

这意味着无论操作以什么顺序到达、是否重复到达，所有副本只要收到相同的操作集，最终状态必然一致。不需要中心服务器协调排序。

### Q2: G-Counter 为什么能解决分布式计数问题？

**参考答案：**

G-Counter 让每个节点只增加自己的分量，合并时取每个节点分量的最大值（max）。因为：
- 每个节点只写自己的分量（无冲突）
- max 操作满足交换律、结合律、幂等性
- 总计数 = 所有分量之和
- 即使消息重复或乱序，max 保证正确性

### Q3: 序列 CRDT 中的"墓碑"问题是什么？如何优化？

**参考答案：**

墓碑（Tombstone）问题：删除元素时不能真正移除，需要保留标记以防其他副本的并发插入引用已删除位置。

导致问题：长期编辑的文档中，墓碑越来越多，内存和性能持续恶化。

优化方案：
1. **垃圾回收（GC）**：当确认所有副本都已看到删除操作后，可以清除墓碑
2. **快照压缩**：定期生成不含墓碑的快照，新加入的客户端从快照开始
3. **Yjs 的优化**：使用结构共享 + 增量编码，将墓碑开销降到最低

### Q4: Yjs 的 Provider 架构有什么优势？

**参考答案：**

Provider 架构将"数据结构"和"网络传输"解耦：
1. **可插拔**：同一个 Y.Doc 可以同时连接多个 Provider（WebSocket同步 + IndexedDB持久化）
2. **渐进增强**：先用 IndexedDB 实现离线，后加 WebSocket 实现在线同步
3. **自定义**：可以写自定义 Provider 接入任何后端（Firebase、Supabase等）
4. **测试友好**：不依赖网络即可测试 CRDT 逻辑

### Q5: 在一个 10 人协作的文档中，CRDT 的性能瓶颈在哪里？如何优化？

**参考答案：**

瓶颈：
1. **元数据膨胀**：每个字符携带唯一标识和因果信息
2. **合并计算**：并发操作多时合并开销增大
3. **Awareness 广播**：光标位置等临时状态的广播频率

优化：
1. **批量操作**：将连续字符输入合并为一次操作
2. **增量同步**：只传输 diff，不传完整状态
3. **Awareness 节流**：光标更新做防抖（如 50ms 间隔）
4. **文档分片**：大文档拆分为独立协作的子文档
5. **懒加载**：只加载当前视口范围的 CRDT 数据
