---
sidebar_position: 2
title: 加载性能优化
tags:
  - 性能优化
  - 加载
  - 打包
---

# 📦 加载性能优化

> **"用户不会等待，他们只会离开"**

加载性能是用户对网站的**第一印象**。让我们看看如何让用户更快看到内容。

## 一、资源压缩与合并

### 1.1 为什么压缩很重要？

想象一下你要搬家：

```
❌ 未压缩：
┌─────────────────────────────────────┐
│  一个箱子里只放了一件衣服            │
│  搬了 100 趟才搬完                   │
│  花费：5 小时 😫                    │
└─────────────────────────────────────┘

✅ 压缩后：
┌─────────────────────────────────────┐
│  真空压缩，一个箱子装 10 件衣服      │
│  只需 10 趟                         │
│  花费：30 分钟 🎉                   │
└─────────────────────────────────────┘
```

### 1.2 代码压缩

**JavaScript 压缩：**

```javascript
// 压缩前
function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price * items[i].quantity;
  }
  return total;
}

// 压缩后（Terser）
function calculateTotal(n){let t=0;for(let i=0;i<n.length;i++)t+=n[i].price*n[i].quantity;return t}
```

**CSS 压缩：**

```css
/* 压缩前 */
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  margin: 10px;
}

/* 压缩后（cssnano） */
.container{display:flex;justify-content:center;align-items:center;padding:20px;margin:10px}
```

### 1.3 Gzip / Brotli 压缩

```nginx
# Nginx 配置 Gzip
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1024;
gzip_comp_level 6;

# Brotli 压缩（更高效）
brotli on;
brotli_types text/plain text/css application/json application/javascript;
brotli_comp_level 6;
```

**压缩效果对比：**

| 压缩方式 | 压缩率 | 速度 | 浏览器支持 |
|----------|--------|------|------------|
| Gzip | 60-70% | 快 | 所有浏览器 |
| Brotli | 70-80% | 中等 | 现代浏览器 |

---

## 二、代码分割与懒加载

### 2.1 为什么要代码分割？

```
❌ 未分割：
┌─────────────────────────────────────┐
│  一个巨大的 JS 文件（2MB）           │
│  用户必须等待全部下载才能使用        │
│  首屏加载：8 秒 😱                  │
└─────────────────────────────────────┘

✅ 分割后：
┌─────────────────────────────────────┐
│  主包（200KB）+ 路由懒加载          │
│  首屏只需要主包                     │
│  首屏加载：1.5 秒 🚀                │
└─────────────────────────────────────┘
```

### 2.2 Webpack 代码分割

```javascript
// webpack.config.js
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // 第三方库单独打包
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
        },
        // 公共模块提取
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          priority: 5,
          reuseExistingChunk: true,
        },
      },
    },
  },
};
```

### 2.3 路由懒加载

**React：**

```javascript
import { lazy, Suspense } from 'react';

// 路由懒加载
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Suspense>
  );
}
```

**Vue：**

```javascript
// Vue Router 路由懒加载
const routes = [
  {
    path: '/',
    component: () => import('./views/Home.vue'),
  },
  {
    path: '/about',
    component: () => import('./views/About.vue'),
  },
  {
    path: '/dashboard',
    // 带注释的魔法注释，指定 chunk 名称
    component: () => import(/* webpackChunkName: "dashboard" */ './views/Dashboard.vue'),
  },
];
```

### 2.4 组件懒加载

```javascript
// React 组件懒加载
const HeavyChart = lazy(() => import('./HeavyChart'));

function Dashboard() {
  const [showChart, setShowChart] = useState(false);

  return (
    <div>
      <button onClick={() => setShowChart(true)}>
        显示图表
      </button>
      {showChart && (
        <Suspense fallback={<ChartSkeleton />}>
          <HeavyChart />
        </Suspense>
      )}
    </div>
  );
}
```

---

## 三、图片优化策略

### 3.1 图片格式选择

```
图片格式选择指南
├── 照片类（色彩丰富）
│   └── JPEG / WebP（有损压缩）
├── 图标/Logo（需要透明）
│   └── PNG / SVG / WebP
├── 简单动画
│   └── GIF / APNG / WebP
├── 复杂插画
│   └── SVG / WebP
└── 现代浏览器
    └── 优先使用 WebP / AVIF
```

**格式对比：**

| 格式 | 压缩率 | 透明 | 动画 | 适用场景 |
|------|--------|------|------|----------|
| JPEG | 高 | ❌ | ❌ | 照片 |
| PNG | 低 | ✅ | ❌ | 图标、Logo |
| GIF | 中 | ✅ | ✅ | 简单动画 |
| WebP | 很高 | ✅ | ✅ | 通用 |
| AVIF | 极高 | ✅ | ✅ | 现代浏览器 |
| SVG | - | ✅ | ✅ | 矢量图形 |

### 3.2 图片懒加载

**原生懒加载（推荐）：**

```html
<!-- loading="lazy" 原生支持 -->
<img src="image.jpg" loading="lazy" alt="懒加载图片" />

<!-- 配合 Intersection Observer -->
<img 
  data-src="image.jpg" 
  class="lazy"
  alt="懒加载图片"
/>
```

**JavaScript 实现：**

```javascript
// Intersection Observer 实现懒加载
function lazyLoadImages() {
  const images = document.querySelectorAll('img.lazy');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.remove('lazy');
        observer.unobserve(img);
      }
    });
  }, {
    rootMargin: '50px 0px', // 提前 50px 开始加载
  });

  images.forEach(img => observer.observe(img));
}
```

### 3.3 响应式图片

```html
<!-- srcset 适配不同屏幕 -->
<img 
  srcset="
    image-320w.jpg 320w,
    image-640w.jpg 640w,
    image-1280w.jpg 1280w
  "
  sizes="
    (max-width: 320px) 280px,
    (max-width: 640px) 580px,
    1200px
  "
  src="image-640w.jpg"
  alt="响应式图片"
/>

<!-- picture 元素（更灵活） -->
<picture>
  <source media="(min-width: 800px)" srcset="image-large.webp" type="image/webp" />
  <source media="(min-width: 400px)" srcset="image-medium.webp" type="image/webp" />
  <img src="image-small.jpg" alt="响应式图片" />
</picture>
```

### 3.4 图片 CDN 优化

```javascript
// 使用图片 CDN 的动态处理
function getImageUrl(url, options = {}) {
  const { width, height, quality = 80, format = 'auto' } = options;
  
  // 示例：阿里云 OSS 图片处理
  let processedUrl = url;
  
  if (width || height) {
    processedUrl += `?x-oss-process=image/resize`;
    if (width) processedUrl += `,w_${width}`;
    if (height) processedUrl += `,h_${height}`;
  }
  
  if (format === 'webp') {
    processedUrl += `/format,webp`;
  }
  
  processedUrl += `/quality,q_${quality}`;
  
  return processedUrl;
}

// 使用
const optimizedUrl = getImageUrl('https://cdn.example.com/photo.jpg', {
  width: 800,
  quality: 75,
  format: 'webp',
});
```

---

## 四、预加载与预获取

### 4.1 资源提示

```html
<head>
  <!-- DNS 预解析 -->
  <link rel="dns-prefetch" href="//cdn.example.com" />
  
  <!-- 预连接（DNS + TCP + TLS） -->
  <link rel="preconnect" href="https://api.example.com" />
  
  <!-- 预加载关键资源 -->
  <link rel="preload" href="/fonts/main.woff2" as="font" crossorigin />
  <link rel="preload" href="/css/critical.css" as="style" />
  <link rel="preload" href="/js/main.js" as="script" />
  
  <!-- 预获取下一页面资源 -->
  <link rel="prefetch" href="/about.js" />
  
  <!-- 预渲染下一页面 -->
  <link rel="prerender" href="/about" />
</head>
```

### 4.2 资源加载优先级

```
浏览器资源加载优先级
├── Highest（最高）
│   ├── 主文档 HTML
│   └── 关键 CSS（head 中）
├── High（高）
│   ├── 字体文件
│   └── 关键 JavaScript
├── Medium（中）
│   ├── 图片（视口内）
│   └── 异步脚本
├── Low（低）
│   ├── 预加载资源
│   └── 非关键 CSS
└── Lowest（最低）
    ├── 预获取资源
    └── 懒加载图片
```

### 4.3 Service Worker 缓存

```javascript
// service-worker.js
const CACHE_NAME = 'v1';
const ASSETS = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/scripts/app.js',
  '/images/logo.png',
];

// 安装时缓存资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// 拦截请求，优先使用缓存
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

---

## 五、字体优化

### 5.1 字体加载策略

```css
/* 字体加载优化 */
@font-face {
  font-family: 'MyFont';
  src: url('/fonts/myfont.woff2') format('woff2');
  font-display: swap; /* 关键：先显示备用字体 */
  font-weight: 400;
  font-style: normal;
}
```

**font-display 行为：**

| 值 | 行为 | 适用场景 |
|-----|------|----------|
| `auto` | 浏览器决定 | 默认 |
| `swap` | 先显示备用字体，字体加载后替换 | 大部分场景 |
| `fallback` | 短暂隐藏（100ms），然后备用字体 | 次要字体 |
| `optional` | 仅在快速加载时使用 | 非关键字体 |
| `block` | 短暂隐藏（3s），然后备用字体 | 关键字体 |

### 5.2 字体子集化

```javascript
// 使用 fonttools 提取子集
// pip install fonttools brotli

// 只包含常用中文字符
// pyftsubset font.woff2 --text-file=common-chars.txt --output-file=font-subset.woff2
```

---

## 六、实战案例

### 案例：电商首页优化

**优化前：**
- 首屏加载：4.2 秒
- JS 大小：1.8MB
- 图片大小：3.5MB

**优化措施：**

1. **代码分割**
```javascript
// 路由懒加载
const ProductList = lazy(() => import('./ProductList'));
const Cart = lazy(() => import('./Cart'));
```

2. **图片优化**
```html
<!-- WebP 格式 + 懒加载 -->
<img 
  srcset="product-400w.webp 400w, product-800w.webp 800w"
  loading="lazy"
  alt="商品图片"
/>
```

3. **关键 CSS 内联**
```html
<style>
  /* 首屏关键 CSS */
  .hero { ... }
  .nav { ... }
</style>
```

4. **预加载关键资源**
```html
<link rel="preload" href="/api/products" as="fetch" crossorigin />
```

**优化后：**
- 首屏加载：1.1 秒 ⬇️ 74%
- JS 大小：450KB ⬇️ 75%
- 图片大小：800KB ⬇️ 77%

---

## 🎯 高频面试题

### 1. 如何优化首屏加载时间？

**答：**

```
首屏加载优化策略
├── 减少资源大小
│   ├── 代码压缩（Terser、cssnano）
│   ├── Gzip/Brotli 压缩
│   ├── 图片压缩和格式优化
│   └── Tree Shaking 移除死代码
├── 减少请求次数
│   ├── 代码合并
│   ├── 图标合并（Sprite）
│   └── 内联关键 CSS
├── 异步加载
│   ├── JavaScript async/defer
│   ├── 路由懒加载
│   ├── 组件懒加载
│   └── 图片懒加载
└── 利用缓存
    ├── 强缓存（Cache-Control）
    ├── 协商缓存（ETag）
    └── Service Worker
```

### 2. 如何优化大型第三方库的加载？

**答：**

```javascript
// 1. 按需导入
import _ from 'lodash'; // ❌ 全部导入
import debounce from 'lodash/debounce'; // ✅ 按需导入

// 2. 动态导入
const moment = await import('moment');

// 3. 使用更轻量的替代库
// lodash → lodash-es（支持 Tree Shaking）
// moment → dayjs（体积小 97%）

// 4. 外部化（CDN）
// webpack.config.js
externals: {
  react: 'React',
  'react-dom': 'ReactDOM',
}
```

---

## 📚 推荐资源

- [Web.dev 性能优化指南](https://web.dev/performance/)
- [MDN 性能优化](https://developer.mozilla.org/zh-CN/docs/Web/Performance)
- [Google PageSpeed Insights](https://pagespeed.web.dev/)
- [Lighthouse 文档](https://developer.chrome.com/docs/lighthouse/)
