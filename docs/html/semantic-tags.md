---
sidebar_position: 2
title: '语义化标签完整指南'
difficulty: 'easy'
tags: ['html', '语义化', 'SEO', '可访问性']
---

# 语义化标签完整指南

## 什么是语义化？

HTML 语义化是指使用**具有明确含义的标签**来描述内容，让人和机器都能理解文档结构。

```html
<!-- ❌ 非语义化：一堆 div，谁也不知道这是什么 -->
<div class="header">
  <div class="nav">...</div>
</div>
<div class="content">
  <div class="article">...</div>
</div>

<!-- ✅ 语义化：标签本身就说明了内容的角色 -->
<header>
  <nav>...</nav>
</header>
<main>
  <article>...</article>
</main>
```

## 为什么语义化重要？

| 受益方     | 好处                                           |
| ---------- | ---------------------------------------------- |
| 搜索引擎   | 更好地理解页面结构，提升排名权重               |
| 屏幕阅读器 | 用户可以按区域跳转导航                         |
| 开发者     | 代码自文档化，降低维护成本                     |
| 浏览器     | 提供默认的可访问性行为（如 `<button>` 可聚焦） |
| 爬虫/AI    | 结构化数据提取更准确                           |

:::tip SEO 影响
Google 的 John Mueller 明确表示：语义化 HTML 帮助搜索引擎理解页面内容优先级。使用 `<h1>` 比用 `<div class="title">` 对 SEO 更友好。
:::

## 语义化标签完整分类

### 文档结构标签

| 标签        | 语义                     | 典型用途                  |
| ----------- | ------------------------ | ------------------------- |
| `<header>`  | 页面/区块的头部          | 网站顶栏、文章标题区      |
| `<nav>`     | 导航链接集合             | 主导航、面包屑、分页      |
| `<main>`    | 页面主体内容             | 每页仅一个，不含侧栏/页脚 |
| `<article>` | 独立完整的内容单元       | 博客文章、新闻、评论      |
| `<section>` | 主题性的内容分组         | 章节、功能模块区域        |
| `<aside>`   | 与主体内容间接相关的内容 | 侧边栏、广告、相关推荐    |
| `<footer>`  | 页面/区块的底部          | 版权信息、联系方式        |

### 文本内容标签

| 标签                        | 语义         | 示例场景           |
| --------------------------- | ------------ | ------------------ |
| `<h1>`-`<h6>`               | 标题层级     | 文档大纲结构       |
| `<p>`                       | 段落         | 正文内容           |
| `<blockquote>`              | 引用块       | 引用他人的话       |
| `<figure>` + `<figcaption>` | 图文组合     | 图片+描述文字      |
| `<ul>`/`<ol>`/`<dl>`        | 列表         | 无序/有序/定义列表 |
| `<pre>` + `<code>`          | 预格式化代码 | 代码展示           |

### 内联语义标签

| 标签       | 语义       | 对比                                 |
| ---------- | ---------- | ------------------------------------ |
| `<strong>` | 重要性强调 | 不是单纯加粗（用 CSS `font-weight`） |
| `<em>`     | 语气强调   | 不是单纯斜体                         |
| `<mark>`   | 高亮/标记  | 搜索结果高亮                         |
| `<time>`   | 时间/日期  | 机器可读的时间                       |
| `<abbr>`   | 缩写       | `<abbr title="HTML">HTML</abbr>`     |
| `<cite>`   | 引用来源   | 书名、文章标题                       |
| `<code>`   | 代码片段   | 行内代码                             |
| `<small>`  | 附属细则   | 版权声明、法律文本                   |

### 交互语义标签

| 标签                      | 语义     | 特点                           |
| ------------------------- | -------- | ------------------------------ |
| `<details>` + `<summary>` | 折叠面板 | 原生展开/收起，无需 JS         |
| `<dialog>`                | 对话框   | 原生模态框，支持 `showModal()` |
| `<menu>`                  | 命令菜单 | 上下文菜单（浏览器支持有限）   |

## 核心结构标签详解

### header

```html
<!-- 页面级 header -->
<header>
  <h1>网站名称</h1>
  <nav>...</nav>
</header>

<!-- 区块级 header（文章内部） -->
<article>
  <header>
    <h2>文章标题</h2>
    <time datetime="2024-01-15">2024年1月15日</time>
  </header>
  <p>文章内容...</p>
</article>
```

:::info 嵌套规则
`<header>` 不能嵌套 `<header>` 或 `<footer>`。可以出现多次（页面级 + 各区块内部）。
:::

### nav

```html
<!-- 主导航 -->
<nav aria-label="主导航">
  <ul>
    <li><a href="/">首页</a></li>
    <li><a href="/about">关于</a></li>
  </ul>
</nav>

<!-- 面包屑导航 -->
<nav aria-label="面包屑">
  <ol>
    <li><a href="/">首页</a></li>
    <li><a href="/docs">文档</a></li>
    <li aria-current="page">当前页</li>
  </ol>
</nav>
```

**使用原则**：只用于**主要导航链接集合**，页脚的次要链接不需要 `<nav>`。

### main

```html
<body>
  <header>...</header>
  <main>
    <!-- 页面的核心内容 -->
    <h1>页面标题</h1>
    <article>...</article>
  </main>
  <footer>...</footer>
</body>
```

:::warning 重要限制

- 每个页面**只能有一个** `<main>`
- `<main>` 不能是 `<article>`、`<aside>`、`<header>`、`<footer>`、`<nav>` 的后代
  :::

### article vs section

这是面试最高频的对比题：

| 特征     | `<article>`                | `<section>`              |
| -------- | -------------------------- | ------------------------ |
| 独立性   | 可独立分发、聚合           | 需要依附上下文           |
| 判断标准 | 拿出去放到别处还有意义吗？ | 需要一个标题来概括吗？   |
| 典型场景 | 博客文章、评论、产品卡片   | 章节、功能区块           |
| RSS      | 适合作为 RSS feed 条目     | 不适合独立输出           |
| 嵌套     | 可嵌套（如文章内嵌评论）   | 可嵌套（如章节内分小节） |

```html
<!-- article：独立完整的内容 -->
<article>
  <h2>如何学习前端</h2>
  <p>前端学习路线包括...</p>

  <!-- 嵌套的 article（评论也是独立内容） -->
  <article>
    <h3>用户A的评论</h3>
    <p>写得很好！</p>
  </article>
</article>

<!-- section：对内容进行主题分组 -->
<section>
  <h2>第一章：基础知识</h2>
  <section>
    <h3>1.1 变量声明</h3>
    <p>...</p>
  </section>
</section>
```

### aside

```html
<!-- 侧边栏 -->
<aside>
  <h3>相关文章</h3>
  <ul>
    <li><a href="#">CSS Grid 入门</a></li>
    <li><a href="#">Flexbox 完全指南</a></li>
  </ul>
</aside>

<!-- 文章内的补充说明 -->
<article>
  <p>JavaScript 是一门动态类型语言...</p>
  <aside>
    <p>💡 小知识：TypeScript 为 JS 添加了静态类型系统</p>
  </aside>
</article>
```

## 语义化 vs div 堆砌对比

### 代码对比

```html
<!-- ❌ div 堆砌 -->
<div class="page">
  <div class="top-bar">
    <div class="logo">My Site</div>
    <div class="menu">
      <div class="menu-item"><a href="/">Home</a></div>
    </div>
  </div>
  <div class="content">
    <div class="post">
      <div class="post-title">标题</div>
      <div class="post-body">内容</div>
    </div>
  </div>
  <div class="bottom">© 2024</div>
</div>

<!-- ✅ 语义化 -->
<header>
  <h1>My Site</h1>
  <nav>
    <a href="/">Home</a>
  </nav>
</header>
<main>
  <article>
    <h2>标题</h2>
    <p>内容</p>
  </article>
</main>
<footer>© 2024</footer>
```

### 屏幕阅读器体验差异

| 操作         | div 堆砌            | 语义化                    |
| ------------ | ------------------- | ------------------------- |
| 跳转到导航   | ❌ 无法识别         | ✅ 按 `nav` landmark 跳转 |
| 列出标题大纲 | ❌ 无大纲           | ✅ h1-h6 生成文档大纲     |
| 跳到主内容   | ❌ 只能逐行读       | ✅ 直接跳到 `main`        |
| 识别文章边界 | ❌ 不知道哪里是文章 | ✅ `article` 标记清晰     |

## 常见误用案例

:::warning 误用1：用 section 替代 div 做样式容器

```html
<!-- ❌ 错误：section 不是样式容器 -->
<section class="flex-container">
  <div>item 1</div>
</section>

<!-- ✅ 正确：纯样式容器用 div -->
<div class="flex-container">
  <div>item 1</div>
</div>
```

:::

:::warning 误用2：nav 包裹所有链接

```html
<!-- ❌ 错误：不是所有链接集合都需要 nav -->
<nav>
  <a href="/privacy">隐私政策</a>
  <a href="/terms">条款</a>
</nav>

<!-- ✅ 正确：页脚次要链接不需要 nav -->
<footer>
  <a href="/privacy">隐私政策</a>
  <a href="/terms">条款</a>
</footer>
```

:::

:::warning 误用3：article 内没有标题

```html
<!-- ❌ 每个 article 应该有标题（可访问性） -->
<article>
  <p>一些内容...</p>
</article>

<!-- ✅ 正确 -->
<article>
  <h2>文章标题</h2>
  <p>一些内容...</p>
</article>
```

:::

## 面试高频题

### 1. 如何理解 HTML 语义化？

**答**：语义化是指选用与内容含义匹配的标签来构建页面，而非只用 div/span。好处包括：①对搜索引擎友好（SEO）；②对辅助技术友好（可访问性）；③代码可读性和可维护性更强；④在无CSS场景下仍然可读。

### 2. section 和 article 有什么区别？

**答**：`article` 表示一个独立完整的内容单元（拿出来放到其他地方也能看懂），如博客文章、评论；`section` 表示文档中的一个主题分区，需要依赖上下文。简单判断：内容能否独立发布到 RSS？能就用 article。

### 3. 为什么不建议用 div 模拟按钮？

**答**：`<button>` 自带的能力：①可聚焦（Tab导航）；②键盘触发（Enter/Space）；③屏幕阅读器识别为按钮角色；④表单提交关联。用 div 需要手动实现所有这些，还容易遗漏。

### 4. 一个页面可以有多个 header 和 footer 吗？

**答**：可以。`<header>` 和 `<footer>` 可以作为页面级的头尾，也可以作为 `article`、`section` 等区块内部的头尾。但 `<main>` 只能有一个。

### 5. 什么时候用 div？

**答**：当没有任何语义标签合适时用 div。div 是**纯容器**，不传达任何语义。典型场景：纯粹为了CSS布局需要一个包裹层、JavaScript操作需要一个钩子元素。

### 6. h1 标签一个页面只能用一个吗？

**答**：HTML5 规范允许每个 sectioning content（article、section等）各有一个 h1，但从 SEO 和可访问性最佳实践来看，**建议每页只用一个 h1** 作为页面主标题，其余用 h2-h6 构建层级。

### 7. 如何判断一个元素应该用哪个语义标签？

**答**：按优先级依次判断：①是否有明确对应的标签（如导航→nav、时间→time）；②是否是独立内容（→article）；③是否是主题分组（→section）；④是否是辅助信息（→aside）；⑤都不是则用 div。
