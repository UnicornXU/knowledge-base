---
sidebar_position: 2
title: 结构化数据与 Schema.org
---

# 结构化数据与 Schema.org

> **"结构化数据是给搜索引擎的'说明书'，告诉它你的内容是什么类型、包含哪些字段"** —— 正确使用结构化数据可以让你的搜索结果展示为富摘要（Rich Snippet），显著提升点击率。

## 什么是结构化数据？

```
普通搜索结果 vs 富摘要搜索结果
═══════════════════════════════════════════════════════

普通结果：
┌─────────────────────────────────────────────┐
│  React Hooks 完全指南                        │
│  深入讲解 React Hooks 的原理与使用技巧...      │
│  https://example.com/articles/react-hooks   │
└─────────────────────────────────────────────┘

富摘要（添加了结构化数据）：
┌─────────────────────────────────────────────┐
│  React Hooks 完全指南                        │
│  ⭐⭐⭐⭐⭐ 4.9 分 (128 条评价)                │
│  深入讲解 React Hooks 的原理与使用技巧...      │
│  📅 2024-01-15  👤 作者名  ⏱ 15 分钟阅读     │
│  https://example.com/articles/react-hooks   │
└─────────────────────────────────────────────┘

  ↑ 评分、评价数、日期、作者、阅读时间
    都是通过结构化数据实现的
```

## Schema.org 是什么？

Schema.org 是 Google、Bing、Yahoo、Yandex 联合创建的结构化数据词汇表，定义了统一的类型和属性。

```
Schema.org 类型层次（常用）
═══════════════════════════════════════════════════════

Thing（万物）
├── Article（文章）
│   ├── NewsArticle（新闻）
│   ├── TechArticle（技术文章）
│   └── BlogArticle（博客文章）
├── Product（产品）
├── Organization（组织）
├── Person（人物）
├── Event（事件）
├── Recipe（食谱）
├── FAQPage（常见问题页）
├── HowTo（教程步骤）
├── Review（评价）
└── BreadcrumbList（面包屑导航）
```

## 三种结构化数据格式

### 1. JSON-LD（Google 推荐）

JSON-LD 是独立的 `<script>` 标签，不修改 HTML 结构，是 Google 推荐的格式。

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "React Hooks 完全指南",
  "description": "深入讲解 React Hooks 的原理与使用技巧",
  "image": "https://example.com/images/react-hooks.png",
  "author": {
    "@type": "Person",
    "name": "张三",
    "url": "https://example.com/authors/zhangsan"
  },
  "publisher": {
    "@type": "Organization",
    "name": "前端面试知识库",
    "logo": {
      "@type": "ImageObject",
      "url": "https://example.com/logo.png"
    }
  },
  "datePublished": "2024-01-15T08:00:00+08:00",
  "dateModified": "2024-06-20T10:30:00+08:00",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://example.com/articles/react-hooks"
  }
}
</script>
```

**优点：**
- 与 HTML 解耦，便于维护
- Google 优先解析的格式
- 不影响页面渲染

### 2. Microdata

Microdata 嵌入在 HTML 标签的属性中，直接标注内容。

```html
<article itemscope itemtype="https://schema.org/Article">
  <h1 itemprop="headline">React Hooks 完全指南</h1>
  <p itemprop="description">深入讲解 React Hooks 的原理与使用技巧</p>

  <img itemprop="image" src="/images/react-hooks.png" alt="React Hooks" />

  <div itemprop="author" itemscope itemtype="https://schema.org/Person">
    <span itemprop="name">张三</span>
  </div>

  <div itemprop="publisher" itemscope itemtype="https://schema.org/Organization">
    <span itemprop="name">前端面试知识库</span>
    <img itemprop="logo" src="/logo.png" alt="Logo" />
  </div>

  <time itemprop="datePublished" datetime="2024-01-15T08:00:00+08:00">
    2024 年 1 月 15 日
  </time>
  <time itemprop="dateModified" datetime="2024-06-20T10:30:00+08:00">
    2024 年 6 月 20 日
  </time>
</article>
```

**优点：**
- 标记与内容直接关联
- 不需要额外的 script 标签

**缺点：**
- 侵入 HTML 结构
- 维护成本高

### 3. RDFa（较少使用）

RDFa 是另一种嵌入式格式，语法更复杂，在前端中很少使用。

### 格式对比

| 特性 | JSON-LD | Microdata | RDFa |
|------|---------|-----------|------|
| Google 推荐 | 是 | 支持 | 支持 |
| 与 HTML 解耦 | 是 | 否 | 否 |
| 易于维护 | 高 | 中 | 低 |
| 动态生成 | 方便 | 困难 | 困难 |
| 浏览器兼容 | 全部 | 全部 | 全部 |

## 常见 Schema 类型详解

### Article（文章）

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "文章标题",
  "author": { "@type": "Person", "name": "作者" },
  "datePublished": "2024-01-15",
  "dateModified": "2024-06-20",
  "image": "https://example.com/image.jpg",
  "publisher": {
    "@type": "Organization",
    "name": "网站名称",
    "logo": { "@type": "ImageObject", "url": "https://example.com/logo.png" }
  },
  "description": "文章摘要"
}
```

### FAQPage（常见问题）

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "什么是 React Hooks？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "React Hooks 是 React 16.8 引入的新特性，允许在函数组件中使用 state 和其他 React 特性。"
      }
    },
    {
      "@type": "Question",
      "name": "useEffect 和 useLayoutEffect 的区别？",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "useEffect 在浏览器完成布局和绘制后异步执行，useLayoutEffect 在 DOM 变更后同步执行。"
      }
    }
  ]
}
```

> **效果：** FAQ 结构化数据可以让搜索结果直接展示问答折叠列表，占据更多搜索结果空间。

### BreadcrumbList（面包屑）

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "首页",
      "item": "https://example.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "React",
      "item": "https://example.com/react"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "React Hooks 完全指南"
    }
  ]
}
```

### Product（产品）

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "iPhone 15 Pro",
  "image": "https://example.com/iphone15.jpg",
  "description": "Apple iPhone 15 Pro 256GB",
  "brand": { "@type": "Brand", "name": "Apple" },
  "offers": {
    "@type": "Offer",
    "price": "7999",
    "priceCurrency": "CNY",
    "availability": "https://schema.org/InStock"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "1024"
  }
}
```

## React 中动态生成 JSON-LD

```tsx
interface JsonLdProps {
  data: Record<string, unknown>;
}

function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// 使用示例
function ArticlePage({ article }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.summary,
    image: article.coverImage,
    author: {
      '@type': 'Person',
      name: article.author.name,
    },
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <article>
        <h1>{article.title}</h1>
        <p>{article.content}</p>
      </article>
    </>
  );
}
```

## 测试与验证工具

| 工具 | 用途 | 地址 |
|------|------|------|
| Google Rich Results Test | 测试结构化数据是否能生成富摘要 | search.google.com/test/rich-results |
| Schema Markup Validator | 验证 Schema.org 标记语法 | validator.schema.org |
| Google Search Console | 监控已索引页面的结构化数据错误 | search.google.com/search-console |

**测试流程：**
1. 在页面中添加 JSON-LD 代码
2. 使用 Rich Results Test 输入 URL
3. 检查是否有错误或警告
4. 修复问题后部署
5. 在 Search Console 中监控索引状态

## 面试要点总结

| 问题 | 关键答案 |
|------|----------|
| 三种结构化数据格式的区别？ | JSON-LD 独立于 HTML（推荐），Microdata/RDFa 嵌入 HTML 标签 |
| 为什么 Google 推荐 JSON-LD？ | 与 HTML 解耦、易于维护和动态生成、不影响页面渲染 |
| 结构化数据能提升排名吗？ | 不直接影响排名，但富摘要提升 CTR，间接影响排名 |
| 哪些页面类型适合添加结构化数据？ | 文章、产品、FAQ、食谱、活动、面包屑、评价 |
| 如何验证结构化数据是否正确？ | Google Rich Results Test + Schema Markup Validator |
