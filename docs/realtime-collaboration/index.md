---
sidebar_position: 1
title: "实时协作技术概述"
difficulty: "medium"
tags: ["实时协作", "OT", "CRDT", "多人编辑"]
---

# 实时协作技术概述

## 什么是实时协作

实时协作（Real-time Collaboration）是指多个用户在同一时间对同一份数据进行编辑，并能即时看到彼此操作结果的技术。它是现代在线办公、远程协作的核心基础设施。

### 典型应用场景

| 场景 | 代表产品 | 协作粒度 | 技术难度 |
|------|----------|----------|----------|
| 文档协作 | Google Docs、腾讯文档、飞书文档 | 字符级 | ⭐⭐⭐⭐ |
| 白板协作 | Miro、Excalidraw、FigJam | 图形对象级 | ⭐⭐⭐ |
| 代码编辑 | VS Code Live Share、Replit | 字符级 | ⭐⭐⭐⭐⭐ |
| 设计工具 | Figma、Sketch(协作版) | 属性级 | ⭐⭐⭐⭐ |
| 表格协作 | Google Sheets、多维表格 | 单元格级 | ⭐⭐⭐ |

---

## 核心挑战

:::warning 实时协作的四大技术难题
1. **并发冲突** — 多人同时修改同一位置时如何合并？
2. **网络延迟** — 用户操作到其他人看到变化之间的时间差如何处理？
3. **一致性保证** — 所有客户端最终状态如何保持一致？
4. **离线支持** — 断网期间的修改如何在恢复后正确合并？
:::

### 并发冲突示例

```
时间线 →
用户A: "Hello"  →  在位置5插入 " World"  →  "Hello World"
用户B: "Hello"  →  在位置0插入 "Say "    →  "Say Hello"

如果简单合并，结果可能是：
- "Say Hello World" ✓（期望结果）
- "Say HelloWorld"  ✗（位置偏移错误）
- "SayHello World"  ✗（冲突未解决）
```

---

## 技术方案对比

### OT vs CRDT vs Last-Write-Wins

| 对比维度 | OT (Operational Transform) | CRDT (Conflict-free Replicated Data Type) | Last-Write-Wins |
|----------|---------------------------|-------------------------------------------|-----------------|
| **一致性保证** | 强一致（需中心服务器仲裁） | 最终一致（数学证明无冲突） | 弱一致（可能丢失数据） |
| **实现复杂度** | 极高（变换函数组合爆炸） | 高（数据结构设计复杂） | 低 |
| **性能开销** | 中等（服务端计算变换） | 较高（元数据膨胀） | 极低 |
| **离线支持** | 差（依赖服务器排序） | 优秀（天然支持） | 优秀 |
| **适用场景** | 文档编辑、代码协作 | 分布式系统、P2P协作 | 简单KV存储、配置同步 |

:::info OT 与 CRDT 的本质区别
- **OT**：先发送操作，再通过变换函数解决冲突（事后解决）
- **CRDT**：通过精心设计的数据结构，使冲突不可能发生（事前预防）
:::

---

## 典型产品技术分析

### Google Docs — OT 的工业级实践

```
架构简图：
Client A ──┐
            ├── WebSocket ──→ OT Server ──→ 持久化存储
Client B ──┘                    │
                                ↓
                          变换引擎(Transform Engine)
                          - 接收所有客户端操作
                          - 按到达顺序排列
                          - 对后到的操作做变换
                          - 广播变换后的操作
```

- 使用中心化 OT，服务端作为单一真相来源
- 操作粒度：字符级插入/删除
- 历史版本通过操作日志重建

### Figma — CRDT 变体

- 使用自研的 CRDT 变体用于设计元素的属性同步
- 对象级操作（移动、缩放、属性修改）而非字符级
- 混合架构：服务端负责持久化和权限，客户端直接合并

### Notion — 自研 Block 级方案

- 以 Block 为基本协作单位
- 使用类似 Last-Write-Wins + 操作队列的混合方案
- 非字符级实时协作，而是 Block 级锁定 + 合并

### VS Code Live Share — OT

- 基于 OT 实现字符级共同编辑
- 使用中心化架构（Host 作为服务端）
- 额外同步：终端、调试会话、服务器端口

---

## 协作架构模式

### 中心化 vs P2P vs 混合模式

```
中心化架构：              P2P架构：               混合模式：
┌─────────┐           ┌───────┐             ┌───────┐
│  Server │           │Client │             │Client │
└────┬────┘           └───┬───┘             └───┬───┘
     │                    │                     │
  ┌──┼──┐            ┌───┼───┐           ┌────┼────┐
  │  │  │            │   │   │           │    │    │
┌─┴┐┌┴─┐┌┴─┐     ┌──┴┐┌─┴─┐┌┴──┐    ┌──┴┐┌─┴─┐┌─┴──┐
│C1││C2││C3│     │C2 ││C3 ││C4 │    │C2 ││C3 ││Srv │
└──┘└──┘└──┘     └───┘└───┘└───┘    └───┘└───┘└────┘
```

| 模式 | 优点 | 缺点 | 代表产品 |
|------|------|------|----------|
| 中心化 | 实现简单、权限控制容易 | 单点故障、服务器压力大 | Google Docs |
| P2P | 无服务器依赖、低延迟 | NAT 穿透困难、一致性复杂 | Automerge |
| 混合 | 兼顾两者优点 | 架构复杂 | Figma |

---

## 通信方案选择

### WebSocket / WebRTC / SSE 在协作中的对比

| 方案 | 延迟 | 方向 | 适用场景 |
|------|------|------|----------|
| **WebSocket** | 低(~50ms) | 双向 | 文档协作、白板（主流选择） |
| **WebRTC DataChannel** | 极低(~10ms) | P2P双向 | 游戏同步、低延迟白板 |
| **SSE** | 中(~100ms) | 服务端→客户端 | 只读协作（评论通知等） |

:::tip 工程建议
- **大多数协作场景**选择 WebSocket — 可靠、易实现、穿透性好
- **对延迟极度敏感**的场景（如实时游戏）选择 WebRTC DataChannel
- **需要 fallback 方案**时，可以 WebSocket 为主 + HTTP 长轮询兜底
:::

### WebSocket 协作通信示例

```typescript
// 协作 WebSocket 客户端核心逻辑
class CollaborationClient {
  private ws: WebSocket;
  private pendingOps: Operation[] = [];
  private version: number = 0;

  connect(docId: string) {
    this.ws = new WebSocket(`wss://collab.example.com/doc/${docId}`);

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      switch (msg.type) {
        case 'remote-op':
          this.applyRemoteOperation(msg.operation);
          break;
        case 'ack':
          this.acknowledgePending(msg.version);
          break;
        case 'sync':
          this.fullSync(msg.document);
          break;
      }
    };
  }

  sendOperation(op: Operation) {
    this.pendingOps.push(op);
    this.ws.send(JSON.stringify({
      type: 'operation',
      operation: op,
      baseVersion: this.version
    }));
  }

  private applyRemoteOperation(op: Operation) {
    // 对 pending 操作做变换后应用
    const transformed = this.transformAgainstPending(op);
    this.applyToDocument(transformed);
    this.version++;
  }
}
```

---

## 学习路线建议

```
基础阶段                 进阶阶段                 实战阶段
────────────────────    ────────────────────    ────────────────────
1. WebSocket 通信       4. OT 算法原理          7. 基于 Yjs 搭建协作编辑器
2. 状态同步概念         5. CRDT 数据结构        8. WebRTC P2P 通信
3. 冲突检测基础         6. Yjs/Automerge 库     9. 生产级架构设计
```

:::info 推荐学习资源
- [Yjs 官方文档](https://docs.yjs.dev/)
- [Martin Kleppmann: CRDTs and the Quest for Distributed Consistency](https://www.youtube.com/watch?v=B5NULPSiOGw)
- [Google OT 论文: Jupiter Collaboration System](https://dl.acm.org/doi/10.1145/215585.215706)
:::

---

## 面试题

### Q1: OT 和 CRDT 的核心区别是什么？分别适合哪些场景？

**参考答案：**

OT（操作变换）通过变换函数将并发操作转换为兼容形式，依赖中心服务器确定操作顺序；CRDT（无冲突复制数据类型）通过数学性质保证并发操作自动合并无冲突。

- OT 适合中心化架构、需要精确控制的场景（Google Docs）
- CRDT 适合去中心化、需要离线支持的场景（本地优先应用）

### Q2: 如何保证所有客户端最终看到相同的文档状态？

**参考答案：**

通过满足 **收敛性（Convergence）** 条件：
1. **因果一致性**：操作按因果顺序执行
2. **最终一致性**：所有客户端收到相同操作集后状态一致
3. **意图保持**：操作的执行效果符合用户原始意图

具体实现：OT 依靠服务端全序排列 + 变换函数；CRDT 依靠交换律和幂等性的数学保证。

### Q3: 实时协作中如何处理离线编辑？

**参考答案：**

1. 本地操作立即应用并持久化（IndexedDB/本地存储）
2. 记录操作日志和本地版本号
3. 恢复连接后，将离线期间的操作发送到服务器
4. 服务器（OT方案）进行变换合并，或客户端（CRDT方案）自动合并
5. CRDT 天然支持离线，因为合并不依赖操作顺序

### Q4: 为什么 Figma 选择了 CRDT 而不是 OT？

**参考答案：**

Figma 的设计工具特性决定了选择：
1. 操作粒度是对象属性级（位置、颜色、大小），而非字符级，CRDT 实现较简单
2. 需要高性能的客户端渲染，CRDT 不需要等待服务器确认即可本地应用
3. P2P 优先的体验目标，减少服务器往返延迟
4. 离线编辑是重要需求，CRDT 天然支持
