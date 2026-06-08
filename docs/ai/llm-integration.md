---
sidebar_position: 1
title: "前端集成 LLM"
difficulty: "medium"
tags: ["ai", "llm", "api"]
---

# 前端集成 LLM

## 如何在前端调用 LLM API？

### 方式一：直接调用 API（不推荐暴露 key）

```typescript
// ❌ 不安全：API Key 暴露在前端
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`, // 危险！
  },
  body: JSON.stringify({
    model: 'gpt-4',
    messages: [{ role: 'user', content: 'Hello' }],
  }),
});
```

### 方式二：通过后端代理（推荐）

```typescript
// ✅ 安全：前端请求自己的后端
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Hello',
    sessionId: 'user-123',
  }),
});
```

### 方式三：使用 Vercel AI SDK

```typescript
import { useChat } from 'ai/react';

function ChatComponent() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({ api: '/api/chat' });

  return (
    <div>
      {messages.map((m) => (
        <div key={m.id}>
          <strong>{m.role}:</strong> {m.content}
        </div>
      ))}
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} />
        <button type="submit" disabled={isLoading}>Send</button>
      </form>
    </div>
  );
}
```

## 安全注意事项

```typescript
// 后端代理示例（Next.js API Route）
// app/api/chat/route.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // 服务端环境变量
});

export async function POST(req: Request) {
  const { message } = await req.json();

  // 1. 验证用户身份
  // 2. 限流（Rate Limiting）
  // 3. 内容过滤

  const stream = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: message }],
    stream: true,
  });

  return new Response(stream.toReadableStream());
}
```

## 关键点

- **永远不要**在前端代码中暴露 API Key
- 使用后端代理转发请求，保护 API 密钥
- 实现用户认证、限流和内容过滤
- Vercel AI SDK 简化了前端 AI 集成
- 注意 Token 用量控制和成本管理
