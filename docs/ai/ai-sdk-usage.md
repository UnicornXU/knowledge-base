---
sidebar_position: 4
title: "AI SDK 使用"
difficulty: "medium"
tags: ["ai", "sdk", "vercel-ai", "langchain"]
---

# AI SDK 使用

## Vercel AI SDK

### 核心功能

```typescript
// 安装
// npm install ai @ai-sdk/openai

import { generateText, streamText, generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';

// 1. 生成文本
const { text } = await generateText({
  model: openai('gpt-4'),
  prompt: '解释什么是 RAG',
});

// 2. 流式生成
const stream = await streamText({
  model: openai('gpt-4'),
  messages: [{ role: 'user', content: '你好' }],
});

// 3. 结构化输出
import { z } from 'zod';

const { object } = await generateObject({
  model: openai('gpt-4'),
  schema: z.object({
    name: z.string(),
    age: z.number(),
    skills: z.array(z.string()),
  }),
  prompt: '生成一个虚构人物的信息',
});
```

### React Hook

```typescript
import { useChat, useCompletion } from 'ai/react';

// useChat：对话式
function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat();
  return (
    <form onSubmit={handleSubmit}>
      {messages.map((m) => <p key={m.id}>{m.content}</p>)}
      <input value={input} onChange={handleInputChange} />
    </form>
  );
}

// useCompletion：文本补全
function Completion() {
  const { completion, input, handleInputChange, handleSubmit } = useCompletion();
  return (
    <form onSubmit={handleSubmit}>
      <p>{completion}</p>
      <input value={input} onChange={handleInputChange} />
    </form>
  );
}
```

## LangChain.js

### 基础使用

```typescript
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

const model = new ChatOpenAI({ modelName: 'gpt-4' });

const response = await model.invoke([
  new SystemMessage('你是一个前端面试官'),
  new HumanMessage('请问我一个关于 React Hooks 的问题'),
]);
```

### RAG Chain

```typescript
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { RetrievalQAChain } from 'langchain/chains';

// 1. 文档分块
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});
const docs = await splitter.splitDocuments(documents);

// 2. 创建向量存储
const vectorStore = await MemoryVectorStore.fromDocuments(
  docs,
  new OpenAIEmbeddings()
);

// 3. 创建 RAG Chain
const model = new ChatOpenAI({ modelName: 'gpt-4' });
const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());

// 4. 提问
const response = await chain.invoke({
  query: '这个文档的主要内容是什么？',
});
```

## AI SDK 对比

| 特性 | Vercel AI SDK | LangChain.js |
|------|--------------|-------------|
| 定位 | 前端 AI 集成 | AI 应用框架 |
| 体积 | 小（~10KB） | 大（~100KB+） |
| 学习曲线 | 低 | 高 |
| RAG 支持 | 需手动实现 | 内置 |
| 流式支持 | 优秀 | 良好 |
| 适用场景 | 前端直接集成 | 复杂 AI Pipeline |

## 关键点

- Vercel AI SDK 适合前端快速集成 LLM
- LangChain.js 适合构建复杂的 AI 应用链
- `generateObject` 可以获取结构化 JSON 输出
- 选择 SDK 时考虑项目复杂度和包体积
