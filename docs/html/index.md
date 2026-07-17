---
sidebar_position: 1
title: 'HTML 概述与学习路线'
difficulty: 'easy'
tags: ['html', '基础', '学习路线']
---

# HTML 概述与学习路线

## HTML 是什么？

HTML（HyperText Markup Language）不仅仅是一堆标签的集合，它是**语义化的文档结构描述语言**。浏览器、搜索引擎、屏幕阅读器都依赖 HTML 来理解网页的内容和结构。

:::tip 核心认知
HTML 的本质是**结构化语义**，而非视觉呈现。一个没有任何 CSS 的 HTML 页面，如果结构写得好，依然是可读、可理解的。
:::

## HTML 的定位和重要性

| 维度     | HTML 的作用                    |
| -------- | ------------------------------ |
| 内容结构 | 定义文档的层级和语义关系       |
| SEO      | 搜索引擎通过标签理解内容重要性 |
| 可访问性 | 屏幕阅读器依赖语义标签导航页面 |
| 跨平台   | 所有浏览器、设备的通用基础     |
| 开发协作 | 语义化代码大幅降低维护成本     |

## 知识图谱

```
HTML 知识体系
├── 基础层
│   ├── 文档结构（DOCTYPE、html、head、body）
│   ├── 文本标签（h1-h6、p、span、strong、em）
│   ├── 链接与图片（a、img、picture、figure）
│   └── 列表与表格（ul/ol/li、table）
├── 语义层
│   ├── 结构语义（header、nav、main、footer）
│   ├── 内容语义（article、section、aside）
│   ├── 文本语义（time、mark、abbr、cite）
│   └── 交互语义（details、dialog、summary）
├── 表单层
│   ├── 输入控件（input 全类型、select、textarea）
│   ├── 表单验证（原生约束验证 API）
│   ├── FormData API
│   └── 自定义控件（ElementInternals）
├── 多媒体层
│   ├── 音视频（audio、video、track）
│   ├── 画布（canvas 2D/WebGL）
│   └── 嵌入内容（iframe、embed、object）
├── HTML5 API 层
│   ├── 拖拽（Drag and Drop）
│   ├── 地理位置（Geolocation）
│   ├── 历史管理（History API）
│   ├── Web Storage
│   └── 更多（Notification、Clipboard等）
└── 性能与 SEO 层
    ├── Meta 标签体系
    ├── 资源加载优化（preload/prefetch）
    ├── 脚本加载策略（defer/async）
    └── Open Graph 协议
```

## 学习路线

### 阶段一：入门（1-2周）

**目标**：掌握基本标签，能写出结构完整的静态页面。

- 理解 HTML 文档基本结构
- 掌握 20+ 常用标签
- 学会使用表格和列表
- 理解超链接和图片嵌入
- 能写出完整的表单页面

### 阶段二：进阶（2-4周）

**目标**：掌握语义化、表单高级用法、HTML5 API。

- 深入语义化标签体系
- 掌握表单验证和 FormData
- 了解 HTML5 新增 API
- 理解 Meta 标签和 SEO 优化
- 掌握资源加载性能优化

### 阶段三：精通（持续学习）

**目标**：无障碍开发、性能优化、底层原理。

- 深入 Web Accessibility（WCAG标准）
- 理解浏览器渲染与 HTML 解析过程
- 自定义元素和 Web Components
- Content Security Policy（CSP）
- 性能预算与关键渲染路径

## 面试考点导航表

| 文档           | 核心考点                             | 难度 | 高频指数 |
| -------------- | ------------------------------------ | ---- | -------- |
| 语义化标签     | HTML语义化的理解、article vs section | ⭐   | ★★★★★    |
| 表单与输入控件 | 表单验证机制、FormData用法           | ⭐⭐ | ★★★★     |
| HTML5 API      | History API原理、拖拽事件流          | ⭐⭐ | ★★★★     |
| Meta与性能标签 | defer/async区别、preload/prefetch    | ⭐⭐ | ★★★★★    |

:::info 面试建议
HTML 面试题通常穿插在"性能优化"和"浏览器原理"中考察，很少单独出现。但**语义化**和**资源加载策略**是必问考点。
:::

## 前端三件套的关系

```
┌─────────────────────────────────────────────┐
│                  浏览器                       │
├─────────────────────────────────────────────┤
│                                             │
│   HTML（结构）──→ DOM Tree                   │
│       ↕                    ↘                │
│   CSS（样式） ──→ CSSOM ──→ Render Tree     │
│       ↕                    ↗                │
│   JS（行为） ──→ 操作 DOM/CSSOM             │
│                                             │
└─────────────────────────────────────────────┘
```

| 技术       | 职责     | 类比     |
| ---------- | -------- | -------- |
| HTML       | 内容结构 | 房屋骨架 |
| CSS        | 视觉样式 | 装修设计 |
| JavaScript | 交互行为 | 电器设备 |

:::warning 常见误区
不要用 CSS/JS 来弥补 HTML 结构的缺陷。比如用 `div` + `click事件` 模拟按钮，不如直接用 `<button>`。正确的 HTML 结构是良好用户体验的基石。
:::

## 推荐学习资源

| 资源                                                              | 类型 | 适合阶段 | 说明                       |
| ----------------------------------------------------------------- | ---- | -------- | -------------------------- |
| [MDN Web Docs](https://developer.mozilla.org/zh-CN/docs/Web/HTML) | 文档 | 全阶段   | 最权威的 Web 技术参考      |
| [HTML Living Standard](https://html.spec.whatwg.org/)             | 规范 | 进阶     | WHATWG 维护的 HTML 标准    |
| [web.dev](https://web.dev/)                                       | 教程 | 进阶     | Google 的 Web 开发最佳实践 |
| [Can I Use](https://caniuse.com/)                                 | 工具 | 全阶段   | 浏览器兼容性查询           |
| [HTML5 Doctor](http://html5doctor.com/)                           | 博客 | 入门     | 语义化标签使用指南         |

## 本系列文档导读

1. **语义化标签完整指南** - 掌握正确的文档结构表达
2. **表单与输入控件深入** - 掌握复杂表单交互开发
3. **HTML5 新特性与 API** - 了解现代 Web 能力边界
4. **Meta 标签与性能标签** - 优化加载性能和 SEO

:::tip 学习建议
建议按顺序阅读，每篇文档都会在前一篇的基础上递进。阅读时配合 MDN 文档做实际编码练习，效果更佳。
:::
