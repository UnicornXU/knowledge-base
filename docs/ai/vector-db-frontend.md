---
sidebar_position: 6
title: "向量数据库前端交互"
difficulty: "hard"
tags: ["ai", "vector-db", "embedding"]
---

# 向量数据库前端交互

## 什么是向量数据库？

向量数据库专门用于存储和检索高维向量（Embedding），是 AI 应用的核心基础设施。

```
文本 → Embedding 模型 → 向量 [0.12, -0.34, 0.56, ...] → 存储到向量数据库
```

## 前端上传文档到向量数据库

```typescript
// 文档处理流程
async function uploadToVectorDB(file: File) {
  // 1. 上传文件到后端
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/documents/process', {
    method: 'POST',
    body: formData,
  });

  const { documentId, chunks, status } = await response.json();

  // 2. 轮询处理状态
  return pollStatus(documentId);
}

async function pollStatus(documentId: string) {
  while (true) {
    const response = await fetch(`/api/documents/${documentId}/status`);
    const { status, progress } = await response.json();

    if (status === 'completed') return;
    if (status === 'failed') throw new Error('处理失败');

    // 更新进度
    updateProgress(progress);
    await new Promise((r) => setTimeout(r, 1000));
  }
}
```

## 语义搜索界面

```typescript
function SemanticSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    setLoading(true);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          topK: 5,
          threshold: 0.7,
        }),
      });

      const data = await response.json();
      setResults(data.results);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="search-bar">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="语义搜索..."
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? '搜索中...' : '搜索'}
        </button>
      </div>

      <div className="results">
        {results.map((result, i) => (
          <div key={i} className="result-card">
            <div className="score">
              相似度: {(result.score * 100).toFixed(1)}%
            </div>
            <div className="content">{result.content}</div>
            <div className="metadata">
              来源: {result.metadata.source}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Embedding 可视化

```typescript
import { Scatter } from 'react-chartjs-2';

function EmbeddingVisualizer({ embeddings }: { embeddings: Embedding[] }) {
  // 使用 t-SNE 或 PCA 降维到 2D
  const data = {
    datasets: [{
      data: embeddings.map((e) => ({
        x: e.vector[0], // 降维后的 x
        y: e.vector[1], // 降维后的 y
      })),
      backgroundColor: embeddings.map((e) =>
        e.category === 'A' ? '#ff6384' : '#36a2eb'
      ),
    }],
  };

  return <Scatter data={data} />;
}
```

## 向量数据库 API 封装

```typescript
class VectorDBClient {
  constructor(private baseUrl: string) {}

  // 插入向量
  async upsert(vectors: Vector[]) {
    return fetch(`${this.baseUrl}/vectors/upsert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vectors }),
    });
  }

  // 查询相似向量
  async query(vector: number[], topK = 5) {
    const response = await fetch(`${this.baseUrl}/vectors/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vector, topK }),
    });
    return response.json();
  }

  // 删除向量
  async delete(ids: string[]) {
    return fetch(`${this.baseUrl}/vectors/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
  }
}
```

## 关键点

- 向量数据库存储的是高维向量，不是原始文本
- Embedding 质量直接影响搜索效果
- 前端需要处理好文档处理的异步状态
- 语义搜索比关键词搜索更智能，但计算成本更高
- 可视化有助于理解向量空间的分布
