---
sidebar_position: 2
title: "流式响应处理"
difficulty: "medium"
tags: ["ai", "streaming", "sse"]
---

# 流式响应处理

## 为什么使用流式响应？

LLM 生成文本需要时间，流式响应让用户可以**逐步看到输出**，提升体验。

## Server-Sent Events (SSE)

```typescript
// 后端：使用 SSE 流式返回
// app/api/chat/route.ts (Next.js)
import OpenAI from 'openai';

const openai = new OpenAI();

export async function POST(req: Request) {
  const { message } = await req.json();

  const stream = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: message }],
    stream: true,
  });

  // 返回 ReadableStream
  return new Response(
    new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || '';
          if (text) {
            controller.enqueue(
              new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`)
            );
          }
        }
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
        controller.close();
      },
    }),
    {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    }
  );
}
```

## 前端消费流式响应

### 方式一：原生 Fetch + ReadableStream

```typescript
async function streamChat(message: string, onChunk: (text: string) => void) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (reader) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter((line) => line.startsWith('data: '));

    for (const line of lines) {
      const data = line.replace('data: ', '');
      if (data === '[DONE]') return;

      try {
        const { text } = JSON.parse(data);
        onChunk(text);
      } catch {}
    }
  }
}

// 使用
const [display, setDisplay] = useState('');

streamChat('你好', (text) => {
  setDisplay((prev) => prev + text);
});
```

### 方式二：Vercel AI SDK（推荐）

```typescript
import { useChat } from 'ai/react';

function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/chat',
  });

  return (
    <div>
      {messages.map((m) => (
        <p key={m.id}>{m.content}</p>
      ))}
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} />
      </form>
    </div>
  );
}
```

### 方式三：EventSource（SSE 客户端）

```typescript
function useSSE(url: string) {
  const [data, setData] = useState('');

  useEffect(() => {
    const source = new EventSource(url);

    source.onmessage = (event) => {
      if (event.data === '[DONE]') {
        source.close();
        return;
      }
      const { text } = JSON.parse(event.data);
      setData((prev) => prev + text);
    };

    source.onerror = () => source.close();
    return () => source.close();
  }, [url]);

  return data;
}
```

## SSE vs WebSocket 对比

| 特性 | SSE | WebSocket |
|------|-----|-----------|
| 方向 | 服务端 → 客户端（单向） | 双向 |
| 协议 | HTTP | 独立协议（ws://） |
| 自动重连 | 支持 | 需手动实现 |
| 数据格式 | 文本 | 文本/二进制 |
| 适用场景 | LLM 流式输出 | 聊天、实时协作 |

## 关键点

- LLM 场景推荐使用 SSE（单向流式输出足够）
- Vercel AI SDK 封装了流式响应的复杂逻辑
- 处理好中断（AbortController）和错误重试
- 流式输出时注意 Markdown 渲染的实时解析
