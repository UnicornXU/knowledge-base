---
sidebar_position: 5
title: "记忆系统设计"
difficulty: "medium"
tags: ["agent", "memory", "RAG", "向量数据库"]
---

# 记忆系统设计

## Agent 为什么需要记忆

没有记忆的 Agent 就像一个"金鱼脑"助手——每次对话都从头开始，你昨天告诉它的事今天就忘了。想象一下这样的体验：

```
你：我叫小明
Agent：好的小明！
你：我叫什么？
Agent：抱歉，我不知道你叫什么。   ← 没有记忆，尴尬
```

记忆让 Agent 能够：

- **保持对话连贯**：记住刚才聊了什么
- **积累用户偏好**：记住你喜欢简洁回答、你是前端工程师
- **跨会话复用知识**：上周查过的资料不用重新查
- **处理长任务**：记住中间步骤的结果

> 比喻：没有记忆的 Agent 是"一次性纸杯"，用完即弃；有记忆的 Agent 是"笔记本"，越用越懂你。

## 记忆的三种类型

借鉴认知科学，Agent 的记忆通常分为三种：

| 类型 | 类比 | 存什么 | 生命周期 | 实现方式 |
|------|------|--------|---------|---------|
| **短期记忆** | 便签纸 | 当前对话的历史消息 | 单次会话 | 对话上下文数组 |
| **长期记忆** | 笔记本 | 用户偏好、历史事实 | 跨会话持久 | 向量数据库 |
| **工作记忆** | 草稿纸 | 任务执行的中间状态 | 单次任务 | 临时变量/状态 |

```
┌─────────────────────────────────────────────┐
│                  Agent 大脑                   │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ 短期记忆  │  │ 工作记忆  │  │ 长期记忆  │  │
│  │ (对话历史) │  │ (中间结果) │  │ (向量库)   │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│       ↑             ↑              ↑↓        │
│    当前会话       任务执行中      检索/写入    │
└─────────────────────────────────────────────┘
```

## 短期记忆实现

短期记忆最简单——就是把对话历史作为 messages 数组传给模型。但问题来了：**对话越来越长，Token 越来越多，费用越来越高，还会超出上下文窗口**。

### 方案一：滑动窗口

只保留最近 N 轮对话，老的直接丢弃：

```typescript
class SlidingWindowMemory {
  private messages: Array<{ role: string; content: string }> = [];
  private maxSize: number; // 保留的最大消息数

  constructor(maxSize = 20) {
    this.maxSize = maxSize;
  }

  add(message: { role: string; content: string }) {
    this.messages.push(message);
    // 超出窗口大小，从前面丢弃旧消息
    if (this.messages.length > this.maxSize) {
      this.messages = this.messages.slice(-this.maxSize);
    }
  }

  getMessages() {
    return [...this.messages];
  }

  clear() {
    this.messages = [];
  }
}

// 使用
const memory = new SlidingWindowMemory(10);
memory.add({ role: 'user', content: '你好' });
memory.add({ role: 'assistant', content: '你好！有什么可以帮你的？' });
```

**优点**：简单、Token 消耗可控
**缺点**：丢弃的信息就彻底丢了，可能丢失关键上下文

:::warning 保留 System Prompt
滑动窗口丢弃旧消息时，**不要丢弃 System Prompt**（第一条系统消息）。它定义了 Agent 的人设和行为规则，丢了就"人设崩塌"了。
:::

### 方案二：摘要压缩

当对话超过一定长度时，让模型把旧对话**总结成一段摘要**，用摘要替代原始消息：

```typescript
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

class SummaryMemory {
  private systemPrompt: string;
  private summary: string = '';
  private recentMessages: Array<{ role: string; content: string }> = [];
  private threshold: number; // 超过几条就触发摘要

  constructor(systemPrompt: string, threshold = 6) {
    this.systemPrompt = systemPrompt;
    this.threshold = threshold;
  }

  async add(message: { role: string; content: string }) {
    this.recentMessages.push(message);

    // 超过阈值，把旧消息压缩成摘要
    if (this.recentMessages.length > this.threshold) {
      await this.compress();
    }
  }

  private async compress() {
    // 取出要压缩的消息（保留最近 2 条不压缩）
    const toCompress = this.recentMessages.slice(0, -2);
    const keepRecent = this.recentMessages.slice(-2);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '请将以下对话总结为简洁的摘要，保留关键信息、用户偏好和重要事实。',
        },
        {
          role: 'user',
          content: `已有摘要：${this.summary}\n\n新对话：${JSON.stringify(toCompress)}`,
        },
      ],
    });

    this.summary = response.choices[0].message.content!;
    this.recentMessages = keepRecent;
    console.log('📝 已压缩对话为摘要');
  }

  getMessages() {
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: this.systemPrompt },
    ];
    // 如果有摘要，作为系统消息注入
    if (this.summary) {
      messages.push({ role: 'system', content: `之前的对话摘要：${this.summary}` });
    }
    messages.push(...this.recentMessages);
    return messages;
  }
}
```

**优点**：信息不丢失（被压缩了），Token 大幅减少
**缺点**：压缩有信息损失，多一次模型调用

## 长期记忆实现：向量数据库

短期记忆只在当前会话有效。要让 Agent **跨会话记住**用户信息，需要长期记忆——通常用**向量数据库**实现。

### 原理

> 比喻：长期记忆就像一个"智能笔记本"。你把每条信息变成一串数字（向量），存进去。下次要找相关信息时，也把问题变成数字，然后找"数字最接近"的那几条。这就是**语义搜索**——不是靠关键词匹配，而是靠"意思相近"。

流程：
1. **写入**：把文本通过 Embedding 模型转成向量 → 存入向量数据库
2. **检索**：把查询转成向量 → 在数据库里找最相似的 K 条 → 作为上下文喂给模型

### 完整代码示例

下面用 LangChain.js 的 `MemoryVectorStore`（纯内存，无需外部数据库）演示长期记忆：

```typescript
import OpenAI from 'openai';
import { OpenAIEmbeddings } from '@langchain/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { Document } from '@langchain/core/documents';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ============ 长期记忆管理器 ============
class LongTermMemory {
  private store: MemoryVectorStore;
  private embeddings: OpenAIEmbeddings;

  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      model: 'text-embedding-3-small',
    });
    this.store = new MemoryVectorStore(this.embeddings);
  }

  // 写入：把一段记忆存起来
  async remember(text: string, metadata?: Record<string, string>) {
    await this.store.addDocuments([
      new Document({ pageContent: text, metadata: metadata ?? {} }),
    ]);
    console.log(`💾 已记住: ${text.slice(0, 30)}...`);
  }

  // 检索：根据查询找相关记忆
  async recall(query: string, k = 3): Promise<string[]> {
    const results = await this.store.similaritySearch(query, k);
    return results.map((doc) => doc.pageContent);
  }
}

// ============ 带长期记忆的 Agent ============
class AgentWithMemory {
  private memory: LongTermMemory;
  private conversation: Array<{ role: string; content: string }>;

  constructor(systemPrompt: string) {
    this.memory = new LongTermMemory();
    this.conversation = [{ role: 'system', content: systemPrompt }];
  }

  async chat(userInput: string): Promise<string> {
    // 1. 先从长期记忆中检索相关信息
    const relevantMemories = await this.memory.recall(userInput);
    const memoryContext =
      relevantMemories.length > 0
        ? `\n\n[长期记忆参考]\n${relevantMemories.join('\n')}`
        : '';

    // 2. 把记忆作为上下文注入
    this.conversation.push({
      role: 'user',
      content: userInput + memoryContext,
    });

    // 3. 调用模型
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: this.conversation as any,
    });

    const reply = response.choices[0].message.content!;
    this.conversation.push({ role: 'assistant', content: reply });

    // 4. 把重要信息存入长期记忆（这里简化：存用户说的关键事实）
    if (this.looksLikeFact(userInput)) {
      await this.memory.remember(userInput);
    }

    return reply;
  }

  // 简单判断：是否像"值得记住的事实"（如"我叫XX"、"我喜欢XX"）
  private looksLikeFact(text: string): boolean {
    return /我叫|我喜欢|我是|我的|住在|工作是/.test(text);
  }
}

// ============ 使用 ============
async function demo() {
  const agent = new AgentWithMemory('你是一个友好的助手，会记住用户信息。');

  // 第一天对话
  console.log(await agent.chat('我叫小明，我是前端工程师，我喜欢用 React'));
  // → "你好小明！记住你是前端工程师..."

  // 假设新会话（conversation 清空，但长期记忆还在）
  // 第二天
  console.log(await agent.chat('你还记得我是谁吗？'));
  // → 会从长期记忆检索到"我叫小明..."，回答"你是小明，前端工程师"
}

demo();
```

:::note 生产环境用什么向量数据库
- **本地开发/小项目**：`MemoryVectorStore`（内存）、`Chroma`（本地）
- **生产环境**：Pinecone、Weaviate、Qdrant、Milvus、PostgreSQL + pgvector
- 前端知识库项目可参考本站的 [向量数据库前端实现](../ai/vector-db-frontend.md)
:::

## 记忆管理策略：何时存、何时取、何时忘

记忆不是越多越好。记太多会噪音大、检索慢、费用高。好的记忆系统要懂得"遗忘"。

### 何时存（写入策略）

| 信号 | 示例 | 策略 |
|------|------|------|
| 用户陈述事实 | "我叫小明" | 立即存 |
| 用户表达偏好 | "我喜欢简洁回答" | 立即存 |
| 任务关键结果 | 查到的航班信息 | 存（带时间戳） |
| 闲聊/寒暄 | "今天天气不错" | 不存 |

可以用一个"判断器"来决定要不要存：

```typescript
async function shouldRemember(text: string): Promise<boolean> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: '判断这句话是否包含值得长期记住的信息（如用户姓名、偏好、重要事实）。只回答 true 或 false。',
      },
      { role: 'user', content: text },
    ],
  });
  return response.choices[0].message.content!.trim() === 'true';
}
```

### 何时取（检索策略）

不是每句话都需要检索长期记忆。简单判断：

```typescript
async function needsRecall(userInput: string): Promise<boolean> {
  // 简单规则：提到"记得"、"上次"、"我的"等词时检索
  if (/记得|上次|我的|之前|我说过/.test(userInput)) return true;
  // 复杂判断可以交给一个小模型
  return false;
}
```

### 何时忘（遗忘策略）

```typescript
// 带过期时间的记忆
interface MemoryItem {
  text: string;
  timestamp: number;
  importance: 'high' | 'medium' | 'low';
}

function shouldForget(item: MemoryItem, now: number): boolean {
  const ageDays = (now - item.timestamp) / (1000 * 60 * 60 * 24);
  // 低重要性 + 超过 7 天 → 遗忘
  if (item.importance === 'low' && ageDays > 7) return true;
  // 中重要性 + 超过 30 天 → 遗忘
  if (item.importance === 'medium' && ageDays > 30) return true;
  return false;
}
```

## 上下文窗口管理技巧

即使有记忆系统，传给模型的上下文也不能无限长。管理技巧：

| 技巧 | 说明 |
|------|------|
| **Token 计数** | 调用前估算 Token 数，超限就裁剪 |
| **分层保留** | System Prompt 永留 → 最近 N 轮全留 → 更早的压缩成摘要 |
| **相关检索优先** | 长期记忆只取 Top-K 最相关的，不要全塞 |
| **工具结果精简** | 工具返回的大段数据先提取要点再存入上下文 |

```typescript
// 简单的 Token 估算（中文约 1 字 = 1.5 token，英文约 4 字符 = 1 token）
function estimateTokens(text: string): number {
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) ?? []).length;
  const otherChars = text.length - chineseChars;
  return Math.ceil(chineseChars * 1.5 + otherChars / 4);
}

// 确保上下文不超过限制
function trimToTokenLimit(
  messages: Array<{ role: string; content: string }>,
  limit: number
) {
  let total = 0;
  const result: typeof messages = [];
  // 从后往前保留（最新的最重要）
  for (let i = messages.length - 1; i >= 0; i--) {
    const tokens = estimateTokens(messages[i].content);
    if (total + tokens > limit) break;
    result.unshift(messages[i]);
    total += tokens;
  }
  // 确保保留 system prompt（第一条）
  if (result[0]?.role !== 'system' && messages[0]?.role === 'system') {
    result.unshift(messages[0]);
  }
  return result;
}
```

## 小结

- Agent 记忆分三种：**短期**（对话历史）、**长期**（向量数据库）、**工作**（任务中间态）
- **短期记忆**用滑动窗口或摘要压缩管理 Token
- **长期记忆**用向量数据库实现语义检索：写入时 Embedding 存储，查询时相似度搜索
- 记忆管理核心三问：**何时存**（只存有价值的）、**何时取**（需要时才检索）、**何时忘**（过期/低重要性丢弃）
- 上下文管理：Token 计数 + 分层保留 + 相关检索优先

## 下一步

有了工具和记忆，Agent 还需要"会思考"。下一章 [规划与推理能力](./agent-planning.md) 教你实现思维链、任务分解和自我反思。
