---
sidebar_position: 3
title: "RAG 前端实现"
difficulty: "hard"
tags: ["ai", "rag", "vector"]
---

# RAG 前端实现

## 什么是 RAG？

RAG（Retrieval-Augmented Generation）= 检索增强生成

```
用户问题 → 检索相关文档 → 将文档 + 问题一起发给 LLM → 生成答案
```

## RAG 架构

```
┌─────────────────────────────────────────────┐
│                   前端界面                    │
│  ┌─────────┐  ┌──────────┐  ┌────────────┐ │
│  │ 用户输入 │  │ 文档上传  │  │  答案展示   │ │
│  └────┬────┘  └────┬─────┘  └─────┬──────┘ │
│       │            │               │        │
└───────┼────────────┼───────────────┼────────┘
        │            │               │
        ▼            ▼               ▼
┌─────────────────────────────────────────────┐
│                  后端服务                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ 向量检索  │  │ 文档处理  │  │ LLM 调用 │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│       │                             │       │
│       ▼                             ▼       │
│  ┌──────────┐                ┌──────────┐  │
│  │ 向量数据库│                │  LLM API │  │
│  └──────────┘                └──────────┘  │
└─────────────────────────────────────────────┘
```

## 前端文档上传组件

```typescript
import { useState } from 'react';

function DocumentUpload({ onUpload }: { onUpload: (doc: Document) => void }) {
  const [uploading, setUploading] = useState(false);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const document = await response.json();
      onUpload(document);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <input
        type="file"
        accept=".pdf,.txt,.md,.docx"
        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
        disabled={uploading}
      />
      {uploading && <span>上传并处理中...</span>}
    </div>
  );
}
```

## RAG 问答界面

```typescript
import { useChat } from 'ai/react';

function RAGChat({ documentId }: { documentId: string }) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: '/api/rag/chat',
      body: { documentId },
    });

  return (
    <div className="rag-chat">
      <div className="messages">
        {messages.map((m) => (
          <div key={m.id} className={`message ${m.role}`}>
            <div className="content">{m.content}</div>
            {/* 显示引用来源 */}
            {m.annotations?.sources && (
              <div className="sources">
                <span>来源：</span>
                {m.annotations.sources.map((s, i) => (
                  <span key={i} className="source-chip">{s.title}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="基于文档内容提问..."
          disabled={isLoading}
        />
      </form>
    </div>
  );
}
```

## 向量数据库选择

| 数据库 | 特点 | 适用场景 |
|--------|------|---------|
| Pinecone | 全托管、易用 | 快速上线 |
| Milvus | 开源、高性能 | 大规模数据 |
| Chroma | 轻量、嵌入式 | 原型开发 |
| pgvector | PostgreSQL 扩展 | 已有 PG 的项目 |
| Qdrant | Rust 实现、高性能 | 生产环境 |

## 关键点

- RAG 的核心流程：检索 → 增强 → 生成
- 前端需要处理文档上传、问答交互、来源引用展示
- 向量数据库存储文档的 Embedding 向量
- 分块（Chunking）策略影响检索质量
- 需要处理好加载状态和错误处理
