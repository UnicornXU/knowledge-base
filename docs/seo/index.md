---
sidebar_position: 0
title: 前端 SEO
slug: /seo
---

# 🔍 前端 SEO

> **"内容再好，搜索引擎找不到等于零"** —— SEO 是前端工程师必须掌握的核心技能之一，直接影响产品的自然流量和商业价值。

## 什么是 SEO？

```
SEO（Search Engine Optimization）= 搜索引擎优化
═══════════════════════════════════════════════════════

目标：让你的网页在搜索引擎（Google / Bing / 百度）中排名更高

前端 SEO 的核心职责：
• 让爬虫能正确抓取和理解页面内容
• 提供结构化的元数据（Meta Tags、Open Graph、Schema.org）
• 确保 SPA 应用对搜索引擎友好（SSR / SSG / 预渲染）
• 优化页面性能（Core Web Vitals）间接提升排名
```

## 为什么前端需要关注 SEO？

```
前端与 SEO 的关系
═══════════════════════════════════════════════════════

后端负责：
  └── 数据、API、服务器配置

前端负责：
  ├── HTML 结构是否语义化
  ├── Meta 标签是否完整
  ├── 结构化数据是否正确
  ├── SPA 是否对爬虫友好
  ├── 页面加载速度（Core Web Vitals）
  ├── 移动端适配
  └── canonical URL、robots 指令

前端做不好 SEO → 搜索引擎看不懂你的页面 → 排名靠后 → 没有自然流量
```

## 前端 SEO 知识图谱

```
前端 SEO 技术体系
═══════════════════════════════════════════════════════

🔍 前端 SEO
├── 📄 Meta 标签与 Open Graph
│   ├── title / description / keywords
│   ├── Open Graph 协议（Facebook / 微信 / Telegram）
│   ├── Twitter Card
│   ├── canonical URL（避免重复内容）
│   └── robots meta（noindex / nofollow）
│
├── 📊 结构化数据与 Schema.org
│   ├── JSON-LD（Google 推荐）
│   ├── Microdata
│   ├── Rich Snippets（富摘要）
│   ├── Google Rich Results Test
│   └── 常见 Schema 类型（Article / Product / FAQ）
│
├── ⚡ SSR/SSG 对 SEO 的影响
│   ├── 爬虫渲染机制（Googlebot 两波索引）
│   ├── CSR vs SSR vs SSG 的 SEO 差异
│   ├── 预渲染（Prerender.io / react-snap）
│   ├── 动态渲染（Rendertron / Puppeteer）
│   └── Next.js / Nuxt.js 的 SEO 方案
│
└── 🛠 其他 SEO 技术
    ├── 语义化 HTML（header / nav / main / article）
    ├── Sitemap（sitemap.xml）
    ├── Robots.txt
    ├── 图片优化（alt / lazy loading / WebP）
    ├── URL 设计（语义化 / 无 hash / 面包屑）
    └── Core Web Vitals（LCP / CLS / INP）
```

## 子主题导航

| 主题 | 说明 | 核心内容 |
|------|------|----------|
| [Meta 标签与 Open Graph](./meta-tags.md) | 页面元数据控制 | title / description / keywords、Open Graph、Twitter Card、canonical URL |
| [结构化数据与 Schema.org](./structured-data.md) | 让搜索引擎理解内容 | JSON-LD、Microdata、Rich Snippets、测试工具 |
| [SSR/SSG 对 SEO 的影响](./seo-frameworks.md) | SPA 的 SEO 解决方案 | Googlebot 两波索引、预渲染、动态渲染、Next.js / Nuxt.js |

## 前端 SEO 核心原则

```
SEO 优化的优先级
═══════════════════════════════════════════════════════

第一优先级（必须做）：
  ✅ 每个页面有唯一的 title 和 description
  ✅ 使用语义化 HTML 标签
  ✅ SPA 使用 SSR 或预渲染
  ✅ 设置 canonical URL

第二优先级（应该做）：
  ✅ 添加 Open Graph / Twitter Card
  ✅ 添加 JSON-LD 结构化数据
  ✅ 生成 sitemap.xml
  ✅ 优化 Core Web Vitals

第三优先级（锦上添花）：
  ✅ BreadcrumbList 结构化数据
  ✅ hreflang 多语言标记
  ✅ AMP 页面（已逐步弃用）
```

## 面试高频问题

| 问题 | 关键点 |
|------|--------|
| SPA 为什么对 SEO 不友好？ | 爬虫初始 HTML 为空，需要执行 JS 才能渲染 |
| Googlebot 如何处理 JS？ | 两波索引：第一波抓 HTML，第二波执行 JS |
| SSR 和 SSG 的区别？ | SSR 每次请求渲染，SSG 构建时渲染为静态 HTML |
| canonical URL 的作用？ | 避免重复内容，指定权威版本 |
| JSON-LD 和 Microdata 的区别？ | JSON-LD 独立于 HTML，Microdata 嵌入 HTML 标签 |
