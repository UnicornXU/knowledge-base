---
sidebar_position: 7
title: 性能优化面试题精选
tags:
  - 性能优化
  - 面试
---

# 🎯 性能优化面试题精选

> **"性能优化是前端面试的必考题——不是因为你背了多少方案，而是看你能不能系统地分析和解决问题"**

面试官问性能优化，不是想听你背八股文。他们想看到的是：**分析问题的思路 + 具体的优化手段 + 实际的优化效果**。

## 一、页面加载类

### Q1：如何优化首屏加载时间？

**分析思路：**

```
首屏加载 = 资源下载 + 解析执行 + 渲染绘制
    ↓
优化方向 = 减少资源 + 加快传输 + 推迟非关键
```

**完整回答：**

```javascript
// 1. 减少资源体积
// ├── 代码压缩（Terser、cssnano）
// ├── Gzip/Brotli 压缩（减少 60-80%）
// ├── Tree Shaking 移除死代码
// └── 图片压缩 + WebP/AVIF 格式

// 2. 减少请求次数
// ├── 代码合并（HTTP/1.1 场景）
// ├── 图标合并（Sprite / SVG Icon）
// └── 内联关键 CSS

// 3. 异步加载
// ├── JavaScript async/defer
// ├── 路由懒加载（React.lazy / defineAsyncComponent）
// ├── 图片懒加载（loading="lazy"）
// └── 第三方库按需导入

// 4. 利用缓存
// ├── 强缓存（带哈希的静态资源，max-age=1年）
// ├── 协商缓存（HTML 入口，no-cache）
// └── Service Worker 离线缓存

// 5. 预加载关键资源
// <link rel="preload" href="/fonts/inter.woff2" as="font" />
// <link rel="preload" href="/hero.webp" as="image" />
```

**实战案例：**

```
优化前：首屏 4.2 秒
├── JS: 1.8MB（未分割）
├── CSS: 200KB（未压缩）
├── 图片: 3.5MB（未优化）
└── 请求: 45 个

优化后：首屏 1.1 秒（⬇️ 74%）
├── JS: 450KB（代码分割 + Tree Shaking）
├── CSS: 50KB（压缩 + 关键 CSS 内联）
├── 图片: 800KB（WebP + 懒加载）
└── 请求: 15 个（合并 + 预加载）
```

---

### Q2：白屏问题如何排查和优化？

**排查思路：**

```
白屏排查流程
─────────────────────────────────────────────

1. 确认白屏范围
   ├── 完全白屏 → 可能是 JS 执行报错
   ├── 部分白屏 → 可能是资源加载失败
   └── 间歇白屏 → 可能是网络问题

2. 检查控制台
   ├── 有报错 → 修复 JS 错误
   ├── 有警告 → 检查资源加载
   └── 无输出 → 检查网络请求

3. 检查网络面板
   ├── 关键资源 404 → 检查路径配置
   ├── 资源加载超时 → 检查服务器/CDN
   └── 请求阻塞 → 检查资源加载顺序

4. 检查渲染
   ├── DOM 为空 → HTML 解析问题
   ├── DOM 有内容但看不见 → CSS 问题
   └── 有内容但闪烁 → 渲染时机问题
```

**常见原因和解决方案：**

```javascript
// 1. JS 执行报错导致白屏
// ❌ 错误代码阻塞了渲染
try {
  // 关键渲染代码
} catch (e) {
  // 降级处理，确保页面有内容
  document.getElementById('root').innerHTML = '<h1>页面加载失败，请刷新</h1>';
}

// 2. 资源加载顺序问题
// ❌ JS 阻塞了 HTML 解析
<script src="app.js"></script>

// ✅ 使用 defer
<script defer src="app.js"></script>

// 3. 关键 CSS 未内联
// ❌ 外部 CSS 阻塞渲染
<link rel="stylesheet" href="styles.css" />

// ✅ 内联关键 CSS
<style>
  /* 首屏关键样式 */
  .header { ... }
  .hero { ... }
</style>
<link rel="preload" href="styles.css" as="style" onload="this.rel='stylesheet'" />

// 4. SPA 首屏无内容
// ❌ 根节点为空，等待 JS 加载
<div id="root"></div>

// ✅ SSR 或预渲染
<div id="root">
  <!-- 服务端渲染的内容 -->
  <div class="app">
    <header>...</header>
    <main>...</main>
  </div>
</div>
```

---

### Q3：如何优化大型第三方库的加载？

**常见问题：**

```
大型库的痛点
─────────────────────────────────────────────

lodash:     72KB (min) → 全量导入
moment:     170KB (min) → 包含所有语言包
antd:       1.2MB (min) → 全量引入
echarts:    800KB (min) → 全量引入

首屏加载这些库 → 3 秒白屏 😱
```

**解决方案：**

```javascript
// 方案 1：按需导入
// ❌ 全量导入
import _ from 'lodash';
import moment from 'moment';
import { Button } from 'antd';

// ✅ 按需导入
import debounce from 'lodash/debounce';
import dayjs from 'dayjs'; // 替代 moment，体积小 97%
import Button from 'antd/es/button';
import 'antd/es/button/style/css';

// 方案 2：使用更轻量的替代库
const alternatives = {
  'moment': 'dayjs',           // 170KB → 2KB
  'lodash': 'lodash-es',       // 支持 Tree Shaking
  'axios': 'ky',               // 更现代的 HTTP 客户端
  'jquery': 'vanilla-js',      // 原生 API
};

// 方案 3：动态导入
// 不是首屏需要的库，延后加载
const loadEcharts = async () => {
  const echarts = await import('echarts/core');
  const { BarChart, LineChart } = await import('echarts/charts');
  const { GridComponent, TooltipComponent } = await import('echarts/components');
  const { CanvasRenderer } = await import('echarts/renderers');

  echarts.use([BarChart, LineChart, GridComponent, TooltipComponent, CanvasRenderer]);
  return echarts;
};

// 方案 4：外部化（CDN）
// webpack.config.js
module.exports = {
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
    lodash: '_',
  },
};

// HTML 中通过 CDN 引入
// <script src="https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js"></script>
```

---

## 二、渲染性能类

### Q4：重排（Reflow）和重绘（Repaint）是什么？如何避免？

**完整回答：**

```
浏览器渲染流程
─────────────────────────────────────────────

HTML → DOM ──┐
             ├──→ Render Tree → Layout → Paint → Composite
CSS  → CSSOM ┘

重排（Reflow）：Layout 阶段重新计算
├── 触发：修改几何属性（width/height/margin/padding）
├── 触发：DOM 结构变化（添加/删除元素）
├── 触发：读取 offset/scroll/client 系列属性
└── 开销：大，需要重新计算整个渲染树

重绘（Repaint）：Paint 阶段重新绘制
├── 触发：修改视觉属性（color/background/visibility）
└── 开销：中，不需要重新计算布局

最佳：只触发 Composite
├── transform
├── opacity
└── filter
```

**避免重排的方法：**

```javascript
// 1. 批量读写分离
// ❌ 读写交替，触发强制同步布局
elements.forEach(el => {
  const width = el.offsetWidth;  // 读 → 触发重排
  el.style.width = width + 10;   // 写 → 触发重排
});

// ✅ 批量读取，批量写入
const widths = Array.from(elements).map(el => el.offsetWidth);
elements.forEach((el, i) => {
  el.style.width = widths[i] + 10;
});

// 2. 使用 transform 代替位置属性
// ❌ 触发 Layout
element.style.left = '100px';
element.style.top = '100px';

// ✅ 只触发 Composite
element.style.transform = 'translate(100px, 100px)';

// 3. 使用 CSS 类切换
// ❌ 多次修改样式
element.style.color = 'red';
element.style.background = 'blue';
element.style.padding = '10px';

// ✅ 一次切换类名
element.classList.add('active');

// 4. 脱离文档流批量操作
const fragment = document.createDocumentFragment();
items.forEach(item => {
  fragment.appendChild(createItem(item));
});
container.appendChild(fragment);

// 5. 使用 contain 隔离
.component {
  contain: layout style paint;  // 限制重排范围
}
```

---

### Q5：什么是长任务？如何处理？

**回答：**

```javascript
// 长任务：执行时间超过 50ms 的 JavaScript 任务
// 影响：阻塞主线程，导致页面卡顿，影响 FID/INP

// 检测长任务
const observer = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    console.warn(`长任务: ${entry.duration.toFixed(1)}ms`);
  });
});
observer.observe({ type: 'long-task', buffered: true });

// 解决方案 1：时间切片
function processInChunks(items, chunkSize = 100) {
  let index = 0;

  function processChunk() {
    const chunk = items.slice(index, index + chunkSize);
    chunk.forEach(item => doWork(item));
    index += chunkSize;

    if (index < items.length) {
      requestAnimationFrame(processChunk);
    }
  }

  processChunk();
}

// 解决方案 2：scheduler.yield()（新 API）
async function processWithYield(items) {
  for (const item of items) {
    doWork(item);
    await scheduler.yield(); // 让出主线程
  }
}

// 解决方案 3：Web Worker（计算密集型任务）
const worker = new Worker('processor.js');
worker.postMessage(largeDataset);
worker.onmessage = (e) => updateUI(e.data);

// 解决方案 4：requestIdleCallback（非关键任务）
requestIdleCallback((deadline) => {
  while (deadline.timeRemaining() > 0 && tasks.length > 0) {
    const task = tasks.shift();
    task();
  }
});
```

---

### Q6：如何优化大量 DOM 操作？

**回答：**

```javascript
// 1. 虚拟列表（只渲染可见区域）
import { FixedSizeList } from 'react-window';

function VirtualList({ items }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={50}
    >
      {({ index, style }) => (
        <div style={style}>{items[index].name}</div>
      )}
    </FixedSizeList>
  );
}

// 2. DocumentFragment 批量插入
const fragment = document.createDocumentFragment();
for (let i = 0; i < 1000; i++) {
  const li = document.createElement('li');
  li.textContent = `Item ${i}`;
  fragment.appendChild(li);
}
list.appendChild(fragment); // 只触发一次重排

// 3. 使用 innerHTML（大量静态内容）
container.innerHTML = items.map(item =>
  `<div class="item">${item.name}</div>`
).join('');

// 4. 克隆节点（比 createElement 快）
const template = document.querySelector('.template');
items.forEach(item => {
  const clone = template.cloneNode(true);
  clone.querySelector('.name').textContent = item.name;
  container.appendChild(clone);
});

// 5. CSS 类切换代替多次样式修改
// ❌
element.style.width = '100px';
element.style.height = '100px';
element.style.background = 'red';

// ✅
element.classList.add('box-red');

// 6. 使用 requestAnimationFrame
function animate() {
  // 批量更新 DOM
  requestAnimationFrame(() => {
    elements.forEach(el => {
      el.style.transform = `translateX(${position}px)`;
    });
  });
}
```

---

## 三、网络优化类

### Q7：强缓存和协商缓存的区别？

**回答：**

```
缓存策略对比
─────────────────────────────────────────────

强缓存（不问服务器）
├── 头部：Cache-Control / Expires
├── 状态码：200 (from cache) 或 200 (from memory cache)
├── 判断：Cache-Control.max-age > 当前时间
├── 特点：完全不发请求，最快
└── 适用：带哈希的静态资源

协商缓存（问问服务器）
├── 头部：ETag / If-None-Match 或 Last-Modified / If-Modified-Since
├── 状态码：304 Not Modified
├── 判断：服务器验证资源是否变化
├── 特点：发请求但不传内容
└── 适用：HTML、API 数据

优先级：Cache-Control > Expires > ETag > Last-Modified
```

**最佳实践：**

```javascript
// 按资源类型选择缓存策略

// 1. HTML 入口文件
Cache-Control: no-cache
// 每次都协商，但可以利用 304 省带宽

// 2. 带哈希的 JS/CSS
Cache-Control: public, max-age=31536000, immutable
// 内容变了哈希就变，可以永久缓存

// 3. 图片/字体
Cache-Control: public, max-age=86400
// 或者带哈希则长期缓存

// 4. API 数据
Cache-Control: no-store
// 或者 short max-age + stale-while-revalidate
Cache-Control: public, max-age=60, stale-while-revalidate=3600
```

---

### Q8：HTTP/2 相比 HTTP/1.1 有什么优势？

**回答：**

```
HTTP/1.1 的问题
─────────────────────────────────────────────

1. 队头阻塞
   请求 1: [=======]
   请求 2:     [等待][=======]
   请求 3:              [等待][=======]

2. 连接数限制
   浏览器限制 6 个 TCP 连接
   每个连接内还是串行

3. 头部冗余
   每个请求都携带完整的 Cookie 和 User-Agent

HTTP/2 的改进
─────────────────────────────────────────────

1. 多路复用
   一个 TCP 连接，并行传输多个请求
   请求 1: [==][  ][==][  ]
   请求 2: [  ][==][  ][==]
   请求 3: [==][==][==][  ]

2. 头部压缩
   HPACK 算法压缩请求头
   减少 30-50% 的头部大小

3. 服务端推送
   服务器主动推送资源
   减少往返次数

4. 二进制分帧
   数据以帧传输，解析更高效
   支持流优先级
```

---

## 四、框架优化类

### Q9：React 中如何避免不必要的渲染？

**回答：**

```
React 渲染机制
─────────────────────────────────────────────

State 变化 → 当前组件 + 所有子组件 Re-render
            ↓
       Virtual DOM Diff
            ↓
       更新变化的 DOM

问题：即使子组件的 props 没变，也会渲染
```

**优化方法：**

```javascript
// 1. React.memo
const Child = React.memo(function Child({ data }) {
  return <div>{data.name}</div>;
});

// 2. useMemo 缓存计算结果
const Parent = () => {
  const [count, setCount] = useState(0);

  // 只在 count 变化时重新计算
  const expensiveResult = useMemo(() => {
    return heavyComputation(count);
  }, [count]);

  return <Child data={expensiveResult} />;
};

// 3. useCallback 稳定函数引用
const Parent = () => {
  const [count, setCount] = useState(0);

  // 函数引用稳定，配合 React.memo 使用
  const handleClick = useCallback(() => {
    setCount(c => c + 1);
  }, []);

  return <Button onClick={handleClick} />;
};

// 4. 状态下沉
// ❌ 状态在顶层，整个应用重渲染
function App() {
  const [value, setValue] = useState('');
  return (
    <div>
      <Header />  {/* 无关组件也重渲染 */}
      <Input value={value} onChange={setValue} />
      <Footer />
    </div>
  );
}

// ✅ 状态下沉到最小范围
function App() {
  return (
    <div>
      <Header />
      <InputSection />
      <Footer />
    </div>
  );
}

function InputSection() {
  const [value, setValue] = useState('');
  return <Input value={value} onChange={setValue} />;
}

// 5. 拆分 Context
// ❌ 一个大 Context
const AppContext = createContext({ user, theme, locale });

// ✅ 多个小 Context
const UserContext = createContext(null);
const ThemeContext = createContext(null);
const LocaleContext = createContext(null);
```

---

### Q10：Vue 的 computed 和 watch 有什么区别？

**回答：**

| 特性 | computed | watch |
|------|----------|-------|
| **用途** | 派生状态 | 副作用 |
| **返回值** | 有 | 无 |
| **缓存** | 自动缓存 | 不缓存 |
| **触发** | 依赖变化自动更新 | 手动指定监听源 |
| **适用场景** | 模板中使用的计算值 | 异步请求、埋点、DOM 操作 |

```vue
<script setup>
// computed：派生状态
const fullName = computed(() => `${firstName.value} ${lastName.value}`);
// 自动缓存，firstName/lastName 不变就不重新计算

// watch：副作用
watch(firstName, async (newVal) => {
  await fetchUserData(newVal); // 异步操作
  sendAnalytics('name-changed'); // 埋点
});

// watchEffect：自动收集依赖
watchEffect(async () => {
  const data = await fetchUser(userId.value); // 自动监听 userId
  userData.value = data;
});
</script>
```

---

## 五、综合场景类

### Q11：如何做性能优化的落地？

**回答框架：**

```
性能优化落地四步法
─────────────────────────────────────────────

1. 度量（Measure）
   ├── 建立性能指标体系
   ├── 集成 Lighthouse CI
   ├── 搭建性能监控平台
   └── 设定性能预算

2. 分析（Analyze）
   ├── Chrome DevTools Performance 面板
   ├── 火焰图找瓶颈
   ├── 网络面板找慢请求
   └── Lighthouse 报告找问题

3. 优化（Optimize）
   ├── 加载优化（代码分割、懒加载、缓存）
   ├── 渲染优化（减少重排重绘、虚拟列表）
   ├── 网络优化（CDN、HTTP/2、压缩）
   └── 框架优化（memo、computed、状态下沉）

4. 监控（Monitor）
   ├── 性能回归告警
   ├── 版本对比分析
   ├── 用户真实数据采集
   └── 持续迭代优化
```

**实际案例：**

```
某电商项目性能优化
─────────────────────────────────────────────

问题：
├── 首屏加载：4.5 秒
├── Lighthouse 评分：45 分
└── 用户跳出率：60%

优化措施：
├── 代码分割（路由级 + 组件级）
├── 图片优化（WebP + 懒加载 + CDN）
├── 缓存策略（静态资源强缓存 + 内容哈希）
├── 关键 CSS 内联
├── 第三方库按需加载
├── 虚拟列表优化商品列表
└── SSR 提升首屏速度

结果：
├── 首屏加载：1.2 秒（⬇️ 73%）
├── Lighthouse 评分：92 分（⬆️ 104%）
└── 用户跳出率：35%（⬇️ 42%）
```

---

### Q12：性能优化有哪些常见的误区？

**回答：**

```
性能优化常见误区
─────────────────────────────────────────────

❌ 误区 1：过早优化
   "先把功能做完，再优化"
   → 应该：在架构设计时就考虑性能

❌ 误区 2：只看加载速度
   "首屏 1 秒，体验很好"
   → 应该：还要关注交互响应、视觉稳定性

❌ 误区 3：只在开发环境测试
   "我这里很快啊"
   → 应该：在真实设备、真实网络下测试

❌ 误区 4：盲目使用缓存
   "缓存越多越好"
   → 应该：根据资源更新频率选择缓存策略

❌ 误区 5：过度优化
   "为了 1ms 的提升重写整个代码"
   → 应该：优化 ROI（投入产出比）最高的部分

❌ 误区 6：忽略第三方脚本
   "我们代码写得很好"
   → 应该：监控和限制第三方脚本的影响

❌ 误区 7：只优化首次加载
   "首屏很快就行了"
   → 应该：关注后续交互的流畅度
```

---

## 📚 面试准备建议

```
性能优化面试准备清单
─────────────────────────────────────────────

✅ 基础知识
├── 浏览器渲染流程
├── 关键渲染路径
├── 重排重绘原理
└── Web Vitals 指标

✅ 优化手段
├── 加载优化（代码分割、懒加载、压缩）
├── 渲染优化（transform、虚拟列表）
├── 网络优化（缓存、CDN、HTTP/2）
└── 框架优化（React.memo、computed）

✅ 工具使用
├── Chrome DevTools
├── Lighthouse
├── Performance API
└── web-vitals 库

✅ 实战经验
├── 优化前后的数据对比
├── 遇到的坑和解决方案
└── 性能监控体系搭建

✅ 沟通能力
├── 分析问题的思路
├── 优化方案的选择依据
└── 优化效果的量化表达
```
