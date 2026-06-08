---
sidebar_position: 6
title: 性能监控
tags:
  - 性能优化
  - 监控
  - 指标
  - Lighthouse
---

# 📊 性能监控

> **"你无法优化你无法测量的东西"** —— Peter Drucker

性能优化不是一锤子买卖。今天优化了，明天新加一个组件可能就回退了。建立完善的监控体系，才能让性能持续达标。

## 一、性能指标体系

### 1.1 核心 Web Vitals

```
Google 核心 Web Vitals（2024）
─────────────────────────────────────────────

┌─────────────────────────────────────────────────────────┐
│                    用户体验生命周期                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   加载        →     交互      →      视觉稳定            │
│   (LCP)            (INP)            (CLS)               │
│                                                         │
│   最大内容         交互到下一        累计布局              │
│   绘制时间         次绘制时间        偏移                  │
│                                                         │
│   < 2.5s          < 200ms         < 0.1                 │
│   ✅ Good         ✅ Good         ✅ Good                │
│   2.5-4s 需改进    200-500 需改进    0.1-0.25 需改进       │
│   > 4s 差          > 500 差        > 0.25 差             │
└─────────────────────────────────────────────────────────┘
```

### 1.2 各指标详解

| 指标 | 衡量什么 | 如何测量 | 优化方向 |
|------|----------|----------|----------|
| **LCP** | 最大内容元素的渲染时间 | `PerformanceObserver` | 优化图片加载、减少阻塞资源 |
| **INP** | 用户交互的响应延迟 | `PerformanceObserver` | 减少主线程阻塞、拆分长任务 |
| **CLS** | 页面布局的稳定性 | `PerformanceObserver` | 设置图片尺寸、避免动态注入内容 |
| **TTFB** | 服务器响应速度 | Navigation Timing | CDN、服务器优化、缓存 |
| **FCP** | 首次内容绘制 | `PerformanceObserver` | 减少关键资源、预加载 |
| **TTI** | 页面可交互时间 | Lighthouse | 减少 JS 执行时间 |

### 1.3 指标采集 API

```javascript
// 使用 web-vitals 库（推荐）
import { onLCP, onINP, onCLS, onTTFB, onFCP } from 'web-vitals';

function sendToAnalytics(metric) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating, // 'good' | 'needs-improvement' | 'poor'
    id: metric.id,
    delta: metric.delta,
    navigationType: metric.navigationType,
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: Date.now(),
  });

  // 使用 sendBeacon 确保页面关闭时也能发送
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/vitals', body);
  } else {
    fetch('/api/vitals', { body, method: 'POST', keepalive: true });
  }
}

// 注册所有核心指标
onLCP(sendToAnalytics);
onINP(sendToAnalytics);
onCLS(sendToAnalytics);
onTTFB(sendToAnalytics);
onFCP(sendToAnalytics);
```

---

## 二、Performance API 详解

### 2.1 Navigation Timing（导航计时）

```javascript
// 获取页面加载的详细时间数据
function getNavigationTiming() {
  const [navigation] = performance.getEntriesByType('navigation');

  if (!navigation) return null;

  return {
    // DNS 查询
    dns: navigation.domainLookupEnd - navigation.domainLookupStart,

    // TCP 连接
    tcp: navigation.connectEnd - navigation.connectStart,

    // TLS 握手
    tls: navigation.secureConnectionStart > 0
      ? navigation.connectEnd - navigation.secureConnectionStart
      : 0,

    // TTFB（首字节时间）
    ttfb: navigation.responseStart - navigation.requestStart,

    // 内容下载
    contentDownload: navigation.responseEnd - navigation.responseStart,

    // DOM 解析
    domParse: navigation.domInteractive - navigation.responseEnd,

    // 资源加载
    resourceLoad: navigation.domComplete - navigation.domContentLoadedEventStart,

    // 完全加载
    total: navigation.loadEventEnd - navigation.startTime,
  };
}

// 可视化加载时间线
function visualizeTiming() {
  const timing = getNavigationTiming();
  if (!timing) return;

  console.log(`
    加载时间线
    ───────────────────────────────────────
    DNS:          ${timing.dns}ms
    TCP:          ${timing.tcp}ms
    TLS:          ${timing.tls}ms
    TTFB:         ${timing.ttfb}ms
    内容下载:      ${timing.contentDownload}ms
    DOM 解析:     ${timing.domParse}ms
    资源加载:      ${timing.resourceLoad}ms
    ───────────────────────────────────────
    总计:         ${timing.total}ms
  `);
}
```

### 2.2 Resource Timing（资源计时）

```javascript
// 分析所有资源的加载情况
function analyzeResources() {
  const resources = performance.getEntriesByType('resource');

  const analysis = {
    total: resources.length,
    totalSize: 0,
    byType: {},
    slowest: [],
    largest: [],
  };

  resources.forEach(resource => {
    const type = getResourceType(resource.name);
    const duration = resource.responseEnd - resource.startTime;
    const size = resource.transferSize || 0;

    // 按类型统计
    if (!analysis.byType[type]) {
      analysis.byType[type] = { count: 0, totalDuration: 0, totalSize: 0 };
    }
    analysis.byType[type].count++;
    analysis.byType[type].totalDuration += duration;
    analysis.byType[type].totalSize += size;

    analysis.totalSize += size;

    // 收集最慢和最大的资源
    analysis.slowest.push({ name: resource.name, duration });
    analysis.largest.push({ name: resource.name, size });
  });

  // 排序取 Top 10
  analysis.slowest.sort((a, b) => b.duration - a.duration).slice(0, 10);
  analysis.largest.sort((a, b) => b.size - a.size).slice(0, 10);

  return analysis;
}

function getResourceType(url) {
  if (url.match(/\.js$/)) return 'JavaScript';
  if (url.match(/\.css$/)) return 'CSS';
  if (url.match(/\.(png|jpg|jpeg|gif|webp|svg)$/)) return 'Image';
  if (url.match(/\.(woff2?|ttf|eot)$/)) return 'Font';
  if (url.match(/\/api\//)) return 'API';
  return 'Other';
}
```

### 2.3 Long Tasks（长任务监控）

```javascript
// 监控超过 50ms 的长任务
function observeLongTasks() {
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      console.warn(`长任务检测：
        时长: ${entry.duration.toFixed(1)}ms
        开始: ${entry.startTime.toFixed(1)}ms
        容器: ${entry.attribution?.[0]?.containerName || 'unknown'}
      `);

      // 上报到监控平台
      sendToAnalytics({
        type: 'long-task',
        duration: entry.duration,
        startTime: entry.startTime,
        url: window.location.href,
      });
    });
  });

  observer.observe({ type: 'long-list', buffered: true });
}

// 使用 scheduler.yield() 拆分长任务
async function processWithYield(items) {
  for (const item of items) {
    processItem(item);

    // 每处理一项就让出主线程
    if ('scheduler' in window && 'yield' in scheduler) {
      await scheduler.yield();
    } else {
      // 降级方案
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
}
```

### 2.4 Layout Shift（布局偏移监控）

```javascript
// 监控布局偏移
function observeLayoutShifts() {
  let sessionValue = 0;
  let sessionEntries = [];

  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      // 忽略用户交互引起的偏移（500ms 内）
      if (!entry.hadRecentInput) {
        sessionValue += entry.value;
        sessionEntries.push(entry);

        // 单次偏移超过 0.1 就告警
        if (entry.value > 0.1) {
          console.warn(`布局偏移：
            偏移值: ${entry.value.toFixed(4)}
            影响区域: ${entry.sources?.map(s => s.node?.tagName).join(', ')}
          `);
        }
      }
    });
  });

  observer.observe({ type: 'layout-shift', buffered: true });

  // 定期上报 CLS
  setInterval(() => {
    if (sessionValue > 0) {
      sendToAnalytics({
        type: 'cls',
        value: sessionValue,
        entries: sessionEntries.length,
      });
    }
  }, 5000);
}
```

---

## 三、Lighthouse 深度使用

### 3.1 Lighthouse 评分体系

```
Lighthouse 评分维度
─────────────────────────────────────────────

┌─────────────────────────────────────────────────────────┐
│                                                         │
│   🚀 Performance（性能）                                │
│   ├── FCP  (15%)  首次内容绘制                          │
│   ├── SI   (15%)  速度指数                              │
│   ├── LCP  (25%)  最大内容绘制                          │
│   ├── TTI  (15%)  可交互时间                            │
│   ├── TBT  (30%)  总阻塞时间                            │
│   └── CLS  (0%)   累计布局偏移                          │
│                                                         │
│   ♿ Accessibility（可访问性）                           │
│   ├── 色彩对比度                                        │
│   ├── ARIA 标签                                         │
│   └── 键盘导航                                          │
│                                                         │
│   ✅ Best Practices（最佳实践）                          │
│   ├── HTTPS                                             │
│   ├── 控制台错误                                        │
│   └── 图片尺寸                                          │
│                                                         │
│   🔍 SEO（搜索引擎优化）                                 │
│   ├── meta 标签                                         │
│   ├── 结构化数据                                        │
│   └── 移动端适配                                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Lighthouse CI 集成

```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000/', 'http://localhost:3000/about'],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop', // 或 'mobile'
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

```json
// package.json
{
  "scripts": {
    "lhci": "lhci autorun",
    "lhci:collect": "lhci collect",
    "lhci:assert": "lhci assert"
  },
  "devDependencies": {
    "@lhci/cli": "^0.12.0"
  }
}
```

### 3.3 Lighthouse 报告解读

```
Lighthouse 报告关键指标
─────────────────────────────────────────────

FCP（首次内容绘制）
├── 测量：第一个文本/图片/SVG 出现的时间
├── 目标：< 1.8s
└── 优化：减少关键资源、内联关键 CSS

SI（速度指数）
├── 测量：页面内容可见区域的填充速度
├── 目标：< 3.4s
└── 优化：优先加载首屏内容

LCP（最大内容绘制）
├── 测量：最大元素（通常是图片/H1）完成渲染的时间
├── 目标：< 2.5s
└── 优化：预加载 LCP 图片、减少阻塞资源

TTI（可交互时间）
├── 测量：页面完全可交互的时间
├── 目标：< 3.8s
└── 优化：代码分割、减少主线程工作

TBT（总阻塞时间）
├── 测量：FCP 到 TTI 之间长任务的总时长
├── 目标：< 200ms
└── 优化：拆分长任务、减少第三方脚本

CLS（累计布局偏移）
├── 测量：页面生命周期中布局偏移的总和
├── 目标：< 0.1
└── 优化：设置图片尺寸、避免动态注入
```

---

## 四、性能监控平台搭建

### 4.1 采集 SDK

```javascript
// perf-sdk.js
class PerfMonitor {
  constructor(options) {
    this.endpoint = options.endpoint;
    this.appId = options.appId;
    this.sampleRate = options.sampleRate || 1;

    this.init();
  }

  init() {
    // 采样控制
    if (Math.random() > this.sampleRate) return;

    // 监控 Web Vitals
    this.observeWebVitals();

    // 监控资源加载
    this.observeResources();

    // 监控长任务
    this.observeLongTasks();

    // 监控错误
    this.observeErrors();

    // 页面卸载时批量上报
    this.setupBatchReport();
  }

  observeWebVitals() {
    import('web-vitals').then(({ onLCP, onINP, onCLS }) => {
      const report = (metric) => this.addMetric('web-vital', {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
      });

      onLCP(report);
      onINP(report);
      onCLS(report);
    });
  }

  observeResources() {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        // 只关注慢资源（> 1s）
        if (entry.duration > 1000) {
          this.addMetric('slow-resource', {
            name: entry.name,
            duration: entry.duration,
            size: entry.transferSize,
            type: entry.initiatorType,
          });
        }
      });
    });

    observer.observe({ type: 'resource', buffered: true });
  }

  observeLongTasks() {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        this.addMetric('long-task', {
          duration: entry.duration,
          startTime: entry.startTime,
        });
      });
    });

    observer.observe({ type: 'long-task', buffered: true });
  }

  observeErrors() {
    window.addEventListener('error', (event) => {
      this.addMetric('js-error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.addMetric('unhandled-rejection', {
        reason: String(event.reason),
      });
    });
  }

  addMetric(type, data) {
    if (!this.metrics) this.metrics = [];
    this.metrics.push({
      type,
      ...data,
      timestamp: Date.now(),
      url: window.location.href,
    });
  }

  setupBatchReport() {
    // 使用 sendBeacon 确保页面关闭时也能发送
    const report = () => {
      if (!this.metrics?.length) return;

      const body = JSON.stringify({
        appId: this.appId,
        metrics: this.metrics,
      });

      if (navigator.sendBeacon) {
        navigator.sendBeacon(this.endpoint, body);
      }

      this.metrics = [];
    };

    // 页面卸载时上报
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        report();
      }
    });

    // 定期上报（每 30 秒）
    setInterval(report, 30000);
  }
}

// 使用
const monitor = new PerfMonitor({
  endpoint: 'https://analytics.example.com/perf',
  appId: 'my-app',
  sampleRate: 0.1, // 10% 采样
});
```

### 4.2 数据分析与告警

```javascript
// 后端：数据分析服务
class PerfAnalytics {
  // 计算百分位数
  calculatePercentile(values, percentile) {
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  // 分析指标趋势
  analyzeTrend(metrics, timeWindow = '1h') {
    const grouped = this.groupByTimeWindow(metrics, timeWindow);

    return Object.entries(grouped).map(([time, values]) => ({
      time,
      p50: this.calculatePercentile(values, 50),
      p75: this.calculatePercentile(values, 75),
      p95: this.calculatePercentile(values, 95),
      p99: this.calculatePercentile(values, 99),
      count: values.length,
    }));
  }

  // 检测异常
  detectAnomalies(current, baseline, threshold = 2) {
    const anomalies = [];

    ['p50', 'p75', 'p95', 'p99'].forEach(percentile => {
      const ratio = current[percentile] / baseline[percentile];
      if (ratio > threshold) {
        anomalies.push({
          metric: percentile,
          current: current[percentile],
          baseline: baseline[percentile],
          ratio,
        });
      }
    });

    return anomalies;
  }

  // 生成告警
  checkAlerts(metrics) {
    const latest = this.analyzeTrend(metrics, '5m')[0];
    const baseline = this.analyzeTrend(metrics, '1d')[0];

    const anomalies = this.detectAnomalies(latest, baseline);

    if (anomalies.length > 0) {
      this.sendAlert({
        type: 'performance-regression',
        anomalies,
        time: latest.time,
      });
    }
  }
}
```

### 4.3 性能预算

```javascript
// 性能预算配置
const perfBudget = {
  // 资源大小预算
  resources: {
    script: { max: 200 * 1024 },      // JS: 200KB
    stylesheet: { max: 50 * 1024 },   // CSS: 50KB
    image: { max: 500 * 1024 },       // 图片总计: 500KB
    font: { max: 100 * 1024 },        // 字体: 100KB
    total: { max: 1500 * 1024 },      // 总计: 1.5MB
  },

  // 加载时间预算
  timing: {
    FCP: { max: 1800 },   // 1.8s
    LCP: { max: 2500 },   // 2.5s
    TTI: { max: 3800 },   // 3.8s
    TBT: { max: 200 },    // 200ms
    CLS: { max: 0.1 },    // 0.1
  },

  // 资源数量预算
  requests: {
    total: { max: 50 },
    script: { max: 10 },
    stylesheet: { max: 5 },
  },
};

// CI 中检查预算
function checkBudget(lighthouseReport) {
  const { categories, audits } = lighthouseReport;
  const violations = [];

  // 检查时间预算
  Object.entries(perfBudget.timing).forEach(([metric, budget]) => {
    const audit = audits[metric.toLowerCase().replace(/-/g, '-')];
    if (audit && audit.numericValue > budget.max) {
      violations.push({
        metric,
        actual: audit.numericValue,
        budget: budget.max,
        over: audit.numericValue - budget.max,
      });
    }
  });

  if (violations.length > 0) {
    console.error('性能预算超标！');
    violations.forEach(v => {
      console.error(`  ${v.metric}: ${v.actual}ms (预算: ${v.max}ms, 超出: ${v.over}ms)`);
    });
    process.exit(1);
  }
}
```

---

## 五、性能分析工具

### 5.1 Chrome DevTools 性能面板

```
Chrome DevTools Performance 面板使用指南
─────────────────────────────────────────────

1. 录制性能
   ├── 点击 Record 按钮
   ├── 执行用户操作
   └── 点击 Stop 完成录制

2. 分析火焰图
   ├── Main：主线程活动
   │   ├── 蓝色：HTML 解析
   │   ├── 黄色：JavaScript 执行
   │   └── 紫色：样式计算和布局
   ├── Network：网络请求
   └── Frames：帧率

3. 识别瓶颈
   ├── 长任务（> 50ms 的黄色块）
   ├── 强制同步布局（红色三角警告）
   ├── 大量重排（Layout 块）
   └── 长时间绘制（Paint 块）

4. 查看详情
   ├── 点击任务块查看调用栈
   ├── 点击 Summary 标签查看时间分布
   └── 使用 Bottom-Up/Call Tree 分析
```

### 5.2 React DevTools Profiler

```javascript
// 使用 React Profiler 组件
import { Profiler } from 'react';

function onRenderCallback(
  id,          // Profiler 树的标识
  phase,       // "mount" 或 "update"
  actualDuration,  // 本次更新耗时
  baseDuration,    // 不使用 memo 时的预估耗时
  startTime,
  commitTime
) {
  // 只报告超过 16ms 的渲染
  if (actualDuration > 16) {
    console.log(`组件 ${id} 渲染耗时: ${actualDuration.toFixed(1)}ms`);

    sendToAnalytics({
      type: 'react-render',
      componentId: id,
      phase,
      duration: actualDuration,
    });
  }
}

function App() {
  return (
    <Profiler id="App" onRender={onRenderCallback}>
      <Header />
      <Main />
      <Footer />
    </Profiler>
  );
}
```

### 5.3 自动化性能测试

```javascript
// Playwright 性能测试
const { test, expect } = require('@playwright/test');

test('页面加载性能', async ({ page }) => {
  // 开始追踪
  await page.tracing.start({ screenshots: true, snapshots: true });

  await page.goto('https://example.com');

  // 等待页面完全加载
  await page.waitForLoadState('networkidle');

  // 获取性能指标
  const metrics = await page.evaluate(() => {
    const [navigation] = performance.getEntriesByType('navigation');
    return {
      ttfb: navigation.responseStart - navigation.requestStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.startTime,
      load: navigation.loadEventEnd - navigation.startTime,
    };
  });

  // 断言性能指标
  expect(metrics.ttfb).toBeLessThan(800);
  expect(metrics.domContentLoaded).toBeLessThan(2000);
  expect(metrics.load).toBeLessThan(3000);

  // 停止追踪并保存
  await page.tracing.stop();
});
```

---

## 六、实战案例

### 案例：搭建完整的性能监控体系

```
监控体系架构
─────────────────────────────────────────────

┌─────────────────────────────────────────────────────────┐
│                    前端采集 SDK                          │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│   │ Web Vitals│  │ 资源加载  │  │ 长任务   │            │
│   └──────────┘  └──────────┘  └──────────┘            │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                    数据传输层                            │
│   sendBeacon → HTTP → 消息队列（Kafka）                 │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                    数据处理层                            │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│   │ 清洗聚合  │  │ 异常检测  │  │ 趋势分析  │            │
│   └──────────┘  └──────────┘  └──────────┘            │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                    数据存储                              │
│   时序数据库（InfluxDB） + Elasticsearch               │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                    展示与告警                            │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│   │ Grafana   │  │ 告警规则  │  │ 报表生成  │            │
│   └──────────┘  └──────────┘  └──────────┘            │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 高频面试题

### 1. 如何衡量前端性能？

**答：**

```
前端性能衡量维度
─────────────────────────────────────────────

1. 加载性能
   ├── TTFB：服务器响应速度
   ├── FCP：首次内容绘制
   ├── LCP：最大内容绘制
   └── 资源加载时间

2. 交互性能
   ├── FID：首次输入延迟
   ├── INP：交互到下次绘制
   ├── TTI：可交互时间
   └── TBT：总阻塞时间

3. 视觉稳定性
   └── CLS：累计布局偏移

4. 资源效率
   ├── 资源大小
   ├── 请求数量
   └── 缓存命中率
```

### 2. 如何搭建性能监控平台？

**答：**

```
监控平台核心模块
─────────────────────────────────────────────

1. 采集层
   ├── Web Vitals 库采集核心指标
   ├── Performance API 采集详细数据
   ├── 错误监控（error + unhandledrejection）
   └── 自定义埋点

2. 传输层
   ├── sendBeacon（页面卸载时）
   ├── 批量上报（减少请求次数）
   └── 采样控制（降低服务端压力）

3. 处理层
   ├── 数据清洗和聚合
   ├── 异常检测（同比/环比）
   └── P50/P75/P95/P99 计算

4. 展示层
   ├── 实时大盘
   ├── 趋势图表
   └── 告警通知
```

---

## 📚 推荐资源

- [Web Vitals 官方文档](https://web.dev/vitals/)
- [Lighthouse 文档](https://developer.chrome.com/docs/lighthouse/)
- [Performance API 参考](https://developer.mozilla.org/zh-CN/docs/Web/API/Performance)
- [Chrome DevTools 性能分析](https://developer.chrome.com/docs/devtools/performance/)
- [web-vitals 库](https://github.com/GoogleChrome/web-vitals)
