---
sidebar_position: 5
title: "Meta 标签与性能标签"
difficulty: "medium"
tags: ["html", "meta", "性能", "SEO", "预加载"]
---

# Meta 标签与性能标签

## Meta 标签完整分类

### 基础 Meta 标签

| Meta 标签 | 作用 | 示例 |
|-----------|------|------|
| `charset` | 字符编码 | `<meta charset="UTF-8">` |
| `viewport` | 视口配置 | 移动端适配必需 |
| `description` | 页面描述 | 搜索结果摘要 |
| `keywords` | 关键词 | SEO（权重已很低） |
| `author` | 作者 | `<meta name="author" content="张三">` |
| `robots` | 爬虫指令 | index/noindex、follow/nofollow |
| `theme-color` | 浏览器主题色 | 移动端地址栏颜色 |

### 完整 head 模板

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <!-- 字符编码（必须在前1024字节内） -->
  <meta charset="UTF-8">

  <!-- 视口配置 -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- SEO 基础 -->
  <title>页面标题 - 网站名</title>
  <meta name="description" content="页面描述，建议120-160字符">
  <meta name="keywords" content="关键词1,关键词2">

  <!-- 爬虫控制 -->
  <meta name="robots" content="index,follow">
  <link rel="canonical" href="https://example.com/page">

  <!-- Open Graph（社交分享） -->
  <meta property="og:title" content="分享标题">
  <meta property="og:description" content="分享描述">
  <meta property="og:image" content="https://example.com/image.jpg">
  <meta property="og:url" content="https://example.com/page">
  <meta property="og:type" content="article">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="分享标题">

  <!-- 移动端 -->
  <meta name="theme-color" content="#4CAF50">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <link rel="apple-touch-icon" href="/icon-180.png">

  <!-- 安全 -->
  <meta http-equiv="X-Content-Type-Options" content="nosniff">

  <!-- 资源预加载 -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preload" href="/fonts/main.woff2" as="font" crossorigin>
  <link rel="prefetch" href="/next-page.js">

  <!-- 样式 -->
  <link rel="stylesheet" href="/styles.css">
</head>
```

## viewport 深入

### 属性详解

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
```

| 属性 | 值 | 说明 |
|------|------|------|
| `width` | device-width / 数值 | 视口宽度 |
| `height` | device-height / 数值 | 视口高度（少用） |
| `initial-scale` | 0.1 - 10 | 初始缩放比例 |
| `minimum-scale` | 0.1 - 10 | 最小缩放比例 |
| `maximum-scale` | 0.1 - 10 | 最大缩放比例 |
| `user-scalable` | yes/no | 是否允许用户缩放 |
| `interactive-widget` | resizes-visual / resizes-content / overlays-content | 虚拟键盘行为 |

### 移动端适配原理

```
物理像素 (Physical Pixels)
    ↓ ÷ DPR (设备像素比)
CSS 像素 (CSS Pixels / 逻辑像素)
    ↓ × viewport scale
视觉视口 (Visual Viewport)
```

:::tip 为什么需要 viewport meta？
没有 viewport meta 时，移动浏览器会假设页面宽度为 980px，然后缩小显示。设置 `width=device-width` 告诉浏览器：视口宽度等于设备逻辑宽度，不要缩放。
:::

:::warning 可访问性提醒
不要设置 `user-scalable=no` 或 `maximum-scale=1.0`！这会阻止视力障碍用户放大页面。WCAG 2.1 明确要求允许至少 200% 的缩放。
:::

## Open Graph 协议

### 社交分享卡片配置

```html
<!-- 基础 OG 标签 -->
<meta property="og:title" content="文章标题">
<meta property="og:description" content="文章摘要（建议60-90字符）">
<meta property="og:image" content="https://example.com/share-image.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="https://example.com/article">
<meta property="og:type" content="article">
<meta property="og:site_name" content="我的网站">
<meta property="og:locale" content="zh_CN">

<!-- 文章类型扩展 -->
<meta property="article:published_time" content="2024-01-15T08:00:00Z">
<meta property="article:author" content="https://example.com/author">
<meta property="article:section" content="Technology">
<meta property="article:tag" content="前端">
```

### Twitter Card

```html
<!-- Summary Card（小图） -->
<meta name="twitter:card" content="summary">

<!-- Summary with Large Image（大图） -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@website">
<meta name="twitter:creator" content="@author">
<meta name="twitter:title" content="标题">
<meta name="twitter:description" content="描述">
<meta name="twitter:image" content="https://example.com/image.jpg">
```

:::info 分享图片最佳实践
- 尺寸：1200×630px（微信/Facebook/Twitter 通用）
- 格式：JPG 或 PNG
- 大小：<5MB
- 重要内容放在中心安全区域（部分平台会裁剪边缘）
:::

## 资源加载优化标签

### script defer vs async

```html
<!-- 正常加载：阻塞 HTML 解析 -->
<script src="app.js"></script>

<!-- defer：异步下载，HTML 解析完后按顺序执行 -->
<script src="app.js" defer></script>

<!-- async：异步下载，下载完立即执行（打断解析） -->
<script src="analytics.js" async></script>
```

**执行时机图：**

```
HTML 解析:  ████████████████████████████████████ DOMContentLoaded
                                                    ↑
正常 script: ████░░░░[下载]░░[执行]░░████████████████
                    ↑阻塞              ↑继续解析

defer:      ████████████████████████████░░[执行]░░ DOMContentLoaded
            ↑ 并行下载，不阻塞          ↑ 解析完毕后执行

async:      ████████░░[执行]░░████████████████████
            ↑ 并行下载  ↑ 下载完立刻执行（打断解析）
```

| 对比 | defer | async |
|------|-------|-------|
| 下载时机 | 并行下载，不阻塞 | 并行下载，不阻塞 |
| 执行时机 | DOM 解析完成后、DOMContentLoaded 前 | 下载完立即执行 |
| 执行顺序 | **保证顺序** | 不保证顺序 |
| 适用场景 | 依赖 DOM 的脚本、有依赖关系的脚本 | 独立脚本（统计、广告） |
| DOMContentLoaded | 会等 defer 脚本执行完 | 不等待 |

:::tip 使用建议
- 应用主脚本 → `defer`（需要顺序和 DOM）
- 第三方统计/广告 → `async`（独立无依赖）
- 内联脚本不支持 defer/async
- `type="module"` 默认行为类似 defer
:::

### link 资源提示标签

```html
<!-- preconnect：提前建立连接（DNS + TCP + TLS） -->
<link rel="preconnect" href="https://fonts.googleapis.com">

<!-- dns-prefetch：仅提前做 DNS 解析 -->
<link rel="dns-prefetch" href="https://cdn.example.com">

<!-- preload：高优先级预加载当前页面必需资源 -->
<link rel="preload" href="/fonts/main.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/hero.jpg" as="image">
<link rel="preload" href="/critical.css" as="style">

<!-- prefetch：低优先级预取未来可能用到的资源 -->
<link rel="prefetch" href="/next-page.js">
<link rel="prefetch" href="/next-page-data.json">

<!-- prerender：预渲染整个页面（浏览器支持有限） -->
<link rel="prerender" href="/likely-next-page">

<!-- modulepreload：预加载 ES Module -->
<link rel="modulepreload" href="/modules/app.js">
```

### 资源提示对比表

| 提示 | 作用 | 优先级 | 使用时机 |
|------|------|--------|---------|
| `dns-prefetch` | DNS 解析 | 最低 | 第三方域名 |
| `preconnect` | DNS + TCP + TLS | 低 | 即将请求的第三方域名 |
| `preload` | 下载资源到缓存 | 高 | 当前页面关键资源 |
| `prefetch` | 预取未来资源 | 最低 | 下一页可能用到的资源 |
| `prerender` | 预渲染整页 | 最低 | 用户极可能访问的下一页 |

:::warning preload 注意事项
- preload 的资源如果 3 秒内未被使用，Chrome 会在控制台警告
- 必须指定正确的 `as` 属性（font/style/script/image 等），否则优先级错误
- 字体 preload 必须加 `crossorigin`（即使同源）
:::

### fetchpriority 属性

```html
<!-- 提高 LCP 图片优先级 -->
<img src="hero.jpg" fetchpriority="high" alt="首屏大图">

<!-- 降低非关键图片优先级 -->
<img src="footer-logo.png" fetchpriority="low" alt="页脚logo">

<!-- 提高关键脚本优先级 -->
<script src="critical.js" fetchpriority="high"></script>

<!-- 配合 preload -->
<link rel="preload" href="/lcp-image.jpg" as="image" fetchpriority="high">
```

| 值 | 说明 | 适用场景 |
|------|------|---------|
| `high` | 高于默认优先级 | LCP 图片、关键 CSS/JS |
| `low` | 低于默认优先级 | 非首屏图片、非关键资源 |
| `auto` | 浏览器自行决定（默认） | 大多数情况 |

## 安全相关 Meta

```html
<!-- Content Security Policy（内容安全策略） -->
<meta http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self' https://cdn.example.com; style-src 'self' 'unsafe-inline'">

<!-- 禁止 MIME 类型嗅探 -->
<meta http-equiv="X-Content-Type-Options" content="nosniff">

<!-- 点击劫持防护（推荐用 CSP frame-ancestors 替代） -->
<meta http-equiv="X-Frame-Options" content="DENY">

<!-- 强制 HTTPS（推荐通过 HTTP 头设置） -->
<meta http-equiv="Strict-Transport-Security" content="max-age=31536000">

<!-- Referrer 策略 -->
<meta name="referrer" content="strict-origin-when-cross-origin">
```

:::info CSP 快速参考
| 指令 | 控制对象 | 示例 |
|------|---------|------|
| `default-src` | 默认策略 | `'self'` |
| `script-src` | JavaScript | `'self' 'nonce-abc123'` |
| `style-src` | CSS | `'self' 'unsafe-inline'` |
| `img-src` | 图片 | `'self' data: https:` |
| `connect-src` | XHR/Fetch | `'self' https://api.example.com` |
| `frame-ancestors` | 嵌入限制 | `'none'`（替代 X-Frame-Options） |
:::

## 面试高频题

### 1. defer 和 async 的区别？

**答**：两者都是异步下载不阻塞解析。区别：①执行时机：defer 在 DOM 解析完成后执行，async 在下载完立即执行（可能打断解析）；②执行顺序：defer 保证按文档顺序执行，async 不保证；③DOMContentLoaded：defer 脚本在 DCL 前执行完，async 不等待。

### 2. preload 和 prefetch 的区别？

**答**：①优先级不同：preload 是高优先级（当前页面必需），prefetch 是低优先级（未来页面可能需要）；②时机不同：preload 的资源当前页面就要用，prefetch 是为下一次导航准备；③缓存策略：preload 不用会报警告，prefetch 可能被浏览器忽略。

### 3. viewport 中 width=device-width 是什么意思？

**答**：将视口宽度设置为设备的逻辑像素宽度（CSS 像素宽度）。不设置时，移动浏览器默认视口宽度为 980px 然后缩小显示。设置后，页面宽度等于设备屏幕宽度，配合响应式设计实现正确的移动端显示。

### 4. 如何优化首屏加载性能（从 HTML 标签层面）？

**答**：①关键 CSS 用 preload 或内联；②JS 用 defer/async 避免阻塞；③LCP 图片加 `fetchpriority="high"` + preload；④第三方域名用 preconnect/dns-prefetch；⑤非首屏资源用 prefetch 预取或 `loading="lazy"` 懒加载。

### 5. Open Graph 协议是什么？有什么用？

**答**：Open Graph 是 Facebook 发起的协议，通过 `<meta property="og:xxx">` 标签定义页面在社交平台分享时的标题、描述、图片等展示信息。微信、Twitter、LinkedIn 等都支持。可以控制分享卡片的外观，提升点击率。

### 6. CSP（Content Security Policy）是什么？如何配置？

**答**：CSP 是一种安全策略，通过白名单机制限制页面能加载哪些资源，防止 XSS 攻击。可通过 HTTP 头 `Content-Security-Policy` 或 meta 标签设置。核心指令包括 `default-src`、`script-src`、`style-src` 等，值包括 `'self'`（同源）、`'none'`、具体域名等。
