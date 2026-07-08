---
sidebar_position: 1
title: Meta 标签与 Open Graph
---

# Meta 标签与 Open Graph

> **"Meta 标签是搜索引擎和社交平台理解页面内容的第一道门槛"** —— 缺失或错误的 Meta 标签直接影响点击率和社交分享效果。

## 为什么 Meta 标签重要？

```
Meta 标签的作用
═══════════════════════════════════════════════════════

搜索引擎结果页（SERP）展示的内容：
┌─────────────────────────────────────────────┐
│  ← title 标签的内容（蓝色链接）               │
│  ← description 的内容（灰色摘要）             │
│  ← URL                                       │
└─────────────────────────────────────────────┘

社交平台分享时展示的内容：
┌─────────────────────────────────────────────┐
│  ← og:image（封面图）                        │
│  ← og:title（标题）                          │
│  ← og:description（描述）                     │
└─────────────────────────────────────────────┘

Meta 标签直接影响：
  1. 搜索引擎的排名（间接因素）
  2. 搜索结果的点击率（CTR）
  3. 社交分享时的展示效果
  4. 爬虫对页面的理解
```

## 核心 Meta 标签详解

### 1. title 标签

```html
<!-- 基本格式：核心关键词 - 网站名称 -->
<title>React Hooks 完全指南 - 前端面试知识库</title>
```

**最佳实践：**
- 长度控制在 30-60 个字符（中文约 15-30 字）
- 每个页面的 title 必须唯一
- 核心关键词放在前面
- 用 `-` 或 `|` 分隔标题和品牌名

### 2. description 标签

```html
<meta
  name="description"
  content="深入讲解 React Hooks 的原理与使用技巧，包括 useState、useEffect、useCallback、useMemo 等核心 Hooks，附带面试真题与代码示例。"
/>
```

**最佳实践：**
- 长度控制在 120-160 个字符
- 包含页面核心关键词
- 写成有吸引力的文案，促使用户点击
- 每个页面的 description 必须唯一

### 3. keywords 标签（已过时）

```html
<!-- ⚠️ Google 已明确表示不使用 keywords 作为排名因素 -->
<meta name="keywords" content="React, Hooks, 前端面试" />
```

> **面试要点：** Google 在 2009 年已宣布不再使用 keywords meta 标签作为排名因素，因为滥用太严重。但百度等搜索引擎可能仍会参考。

### 4. viewport 标签（移动端 SEO 必备）

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

没有 viewport 标签的页面在移动端搜索结果中会被降权。

### 5. robots 标签

```html
<!-- 允许索引和跟踪链接（默认值） -->
<meta name="robots" content="index, follow" />

<!-- 禁止索引（页面不会出现在搜索结果中） -->
<meta name="robots" content="noindex" />

<!-- 禁止跟踪链接 -->
<meta name="robots" content="nofollow" />

<!-- 组合使用：不索引不跟踪 -->
<meta name="robots" content="noindex, nofollow" />
```

**常见场景：**
- 后台管理页面：`noindex, nofollow`
- 登录/注册页：`noindex`
- 搜索结果页：`noindex`（避免搜索引擎收录搜索结果）
- 临时活动页：`noindex`（活动结束后）

### 6. canonical URL

```html
<!-- 指定当前页面的权威 URL -->
<link rel="canonical" href="https://example.com/articles/react-hooks" />
```

**作用：** 当同一内容有多个 URL 时，告诉搜索引擎哪个是权威版本。

```
重复内容的常见场景：
═══════════════════════════════════════════════════════

同一个页面可能有多个 URL：
  https://example.com/article
  https://example.com/article/
  https://www.example.com/article
  https://example.com/article?utm_source=twitter
  https://example.com/article?ref=homepage

设置 canonical 后：
  <link rel="canonical" href="https://example.com/article" />
  → 搜索引擎将所有权重集中到权威 URL
```

## Open Graph 协议

Open Graph（OG）是 Facebook 提出的协议，用于控制网页在社交平台分享时的展示效果。微信、Telegram、Slack 等平台也支持。

```html
<!-- Open Graph 核心标签 -->
<meta property="og:type" content="article" />
<meta property="og:title" content="React Hooks 完全指南" />
<meta property="og:description" content="深入讲解 React Hooks 的原理与使用技巧" />
<meta property="og:image" content="https://example.com/images/og-react-hooks.png" />
<meta property="og:url" content="https://example.com/articles/react-hooks" />
<meta property="og:site_name" content="前端面试知识库" />
<meta property="og:locale" content="zh_CN" />
```

**og:type 常见值：**

| 类型 | 说明 | 适用场景 |
|------|------|----------|
| `website` | 网站 | 首页 |
| `article` | 文章 | 博客、新闻、教程 |
| `product` | 产品 | 电商商品页 |
| `profile` | 个人资料 | 用户主页 |

**og:image 最佳实践：**
- 推荐尺寸：1200 x 630 像素
- 最小尺寸：600 x 315 像素
- 文件大小 < 8MB
- 使用绝对 URL

## Twitter Card

```html
<!-- Twitter Card 标签 -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@your_twitter" />
<meta name="twitter:title" content="React Hooks 完全指南" />
<meta name="twitter:description" content="深入讲解 React Hooks 的原理与使用技巧" />
<meta name="twitter:image" content="https://example.com/images/twitter-react-hooks.png" />
```

**card 类型：**

| 类型 | 说明 | 展示效果 |
|------|------|----------|
| `summary` | 小图卡片 | 左侧小图 + 右侧标题和描述 |
| `summary_large_image` | 大图卡片 | 上方大图 + 下方标题和描述 |
| `app` | 应用卡片 | 展示应用信息 |
| `player` | 播放器卡片 | 嵌入视频/音频播放器 |

## React / Next.js 中的 Meta 标签实践

### 使用 React Helmet

```tsx
import { Helmet } from 'react-helmet-async';

function ArticlePage({ article }) {
  return (
    <>
      <Helmet>
        <title>{article.title} - 前端面试知识库</title>
        <meta name="description" content={article.summary} />
        <link rel="canonical" href={`https://example.com/articles/${article.slug}`} />

        {/* Open Graph */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.summary} />
        <meta property="og:image" content={article.coverImage} />
        <meta property="og:url" content={`https://example.com/articles/${article.slug}`} />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={article.title} />
        <meta name="twitter:description" content={article.summary} />
        <meta name="twitter:image" content={article.coverImage} />
      </Helmet>

      <article>
        <h1>{article.title}</h1>
        <p>{article.content}</p>
      </article>
    </>
  );
}
```

### 使用 Next.js Head

```tsx
// Next.js 13+ App Router
import { Metadata } from 'next';

export async function generateMetadata({ params }): Promise<Metadata> {
  const article = await getArticle(params.slug);

  return {
    title: `${article.title} - 前端面试知识库`,
    description: article.summary,
    openGraph: {
      type: 'article',
      title: article.title,
      description: article.summary,
      images: [{ url: article.coverImage, width: 1200, height: 630 }],
      url: `https://example.com/articles/${article.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.summary,
      images: [article.coverImage],
    },
    alternates: {
      canonical: `https://example.com/articles/${article.slug}`,
    },
  };
}

export default function ArticlePage({ params }) {
  // 页面组件
}
```

## 完整 Meta 标签模板

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <!-- 基础 Meta -->
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>页面标题 - 网站名称</title>
  <meta name="description" content="页面描述，120-160 字符" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="https://example.com/page" />

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="页面标题" />
  <meta property="og:description" content="页面描述" />
  <meta property="og:image" content="https://example.com/og-image.png" />
  <meta property="og:url" content="https://example.com/page" />
  <meta property="og:site_name" content="网站名称" />
  <meta property="og:locale" content="zh_CN" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="页面标题" />
  <meta name="twitter:description" content="页面描述" />
  <meta name="twitter:image" content="https://example.com/twitter-image.png" />

  <!-- Favicon -->
  <link rel="icon" href="/favicon.ico" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
</head>
<body>
  <!-- 页面内容 -->
</body>
</html>
```

## 面试要点总结

| 问题 | 关键答案 |
|------|----------|
| title 和 description 的最佳长度？ | title 30-60 字符，description 120-160 字符 |
| keywords 还有用吗？ | Google 已不使用，百度可能参考，优先级低 |
| canonical URL 解决什么问题？ | 多个 URL 指向同一内容时，集中权重到权威 URL |
| Open Graph 和 Twitter Card 的关系？ | OG 是通用协议，Twitter Card 是 Twitter 专用，两者互补 |
| SSR 和 CSR 的 Meta 标签区别？ | CSR 的 meta 在 JS 执行后才生效，爬虫可能看不到 |
