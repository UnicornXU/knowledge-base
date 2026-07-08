---
sidebar_position: 2
title: 性能监控
slug: /monitoring/performance-monitoring
---

# ⚡ 性能监控（Web Vitals 采集）

> **"如果你不能度量它，你就无法改进它"** —— 性能监控是性能优化的前置条件，没有数据支撑的优化都是盲目的。

## Web Vitals 核心指标

```
Google Web Vitals 五大核心指标
═══════════════════════════════════════════════════════

指标          衡量什么              目标值      采集 API
─────────────────────────────────────────────────────
LCP           最大内容绘制时间       < 2.5s     PerformanceObserver
FID           首次输入延迟           < 100ms    PerformanceObserver
CLS           累计布局偏移           < 0.1      PerformanceObserver
INP           交互响应时间           < 200ms    PerformanceObserver
TTFB          首字节时间             < 800ms    Navigation Timing
─────────────────────────────────────────────────────
FCP           首次内容绘制           < 1.8s     PerformanceObserver
TBT           总阻塞时间             < 200ms    Long Task API
TTI           可交互时间             < 3.8s     计算得出
```

## 一、使用 web-vitals 库采集

```bash
npm install web-vitals
```

```typescript
import { onLCP, onFID, onCLS, onINP, onTTFB, onFCP } from 'web-vitals';

/**
 * 上报函数
 */
function sendToAnalytics(metric: {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  id: string;
  navigationType: string;
}) {
  // 使用 sendBeacon 确保页面关闭时也能发送
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    id: metric.id,
    page: location.pathname,
    connection: (navigator as any).connection?.effectiveType,
  });

  navigator.sendBeacon('/api/vitals', new Blob([body], { type: 'application/json' }));
}

// 采集所有核心指标
onLCP(sendToAnalytics);   // Largest Contentful Paint
onFID(sendToAnalytics);   // First Input Delay
onCLS(sendToAnalytics);   // Cumulative Layout Shift
onINP(sendToAnalytics);   // Interaction to Next Paint
onTTFB(sendToAnalytics);  // Time to First Byte
onFCP(sendToAnalytics);   // First Contentful Paint
```

## 二、PerformanceObserver 手动采集

### 2.1 LCP（Largest Contentful Paint）

```javascript
/**
 * LCP：最大内容绘制时间
 * 衡量页面主要内容的加载速度
 * 触发元素：img / video / background-image / 文本块
 */
const lcpObserver = new PerformanceObserver((entryList) => {
  const entries = entryList.getEntries();
  // LCP 是最后一个 entry（持续更新直到页面稳定）
  const lcpEntry = entries[entries.length - 1];

  console.log('LCP:', lcpEntry.startTime);
  console.log('LCP 元素:', lcpEntry.element);
  console.log('LCP URL:', lcpEntry.url); // 图片资源 URL

  reportMetric({
    name: 'LCP',
    value: lcpEntry.startTime,
    element: lcpEntry.element?.tagName,
    url: lcpEntry.url,
  });
});

lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
// buffered: true 表示获取观察前已存在的条目
```

### 2.2 CLS（Cumulative Layout Shift）

```javascript
/**
 * CLS：累计布局偏移
 * 衡量页面视觉稳定性
 * 不期望的布局移动 = 影响分数 × 距离分数
 *
 * 注意：用户交互后 500ms 内的布局偏移不计入 CLS
 */
let clsValue = 0;
let sessionValue = 0;
let sessionEntries = [];

const clsObserver = new PerformanceObserver((entryList) => {
  for (const entry of entryList.getEntries()) {
    // 忽略用户交互后 500ms 内的偏移
    if (!entry.hadRecentInput) {
      const firstSessionEntry = sessionEntries[0];
      const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

      // 如果当前条目与上一个条目间隔小于 1 秒
      // 且与第一个条目间隔小于 5 秒，则累加
      if (
        sessionValue &&
        entry.startTime - lastSessionEntry.startTime < 1000 &&
        entry.startTime - firstSessionEntry.startTime < 5000
      ) {
        sessionValue += entry.value;
        sessionEntries.push(entry);
      } else {
        sessionValue = entry.value;
        sessionEntries = [entry];
      }

      // 更新最大 CLS
      if (sessionValue > clsValue) {
        clsValue = sessionValue;
        reportMetric({ name: 'CLS', value: clsValue });
      }
    }
  }
});

clsObserver.observe({ type: 'layout-shift', buffered: true });
```

### 2.3 FID / INP

```javascript
/**
 * FID：首次输入延迟
 * 衡量用户首次交互的响应速度
 * FID = 事件处理开始时间 - 事件触发时间
 */
const fidObserver = new PerformanceObserver((entryList) => {
  for (const entry of entryList.getEntries()) {
    const fid = entry.processingStart - entry.startTime;
    console.log('FID:', fid);
    console.log('事件类型:', entry.name); // click / keydown 等

    reportMetric({
      name: 'FID',
      value: fid,
      eventType: entry.name,
    });
  }
});

fidObserver.observe({ type: 'first-input', buffered: true });

/**
 * INP：交互响应时间（替代 FID 的新指标）
 * 衡量所有交互中最慢的那次响应
 * INP = 从用户交互到下一帧渲染的完整延迟
 *
 * 注意：web-vitals 库内部使用了更复杂的算法
 * 这里是简化版原理展示
 */
const inpObserver = new PerformanceObserver((entryList) => {
  for (const entry of entryList.getEntries()) {
    // duration 包含 inputDelay + processingTime + presentationDelay
    console.log('交互耗时:', entry.duration);
    console.log('交互类型:', entry.name);

    reportMetric({
      name: 'INP_candidate',
      value: entry.duration,
      eventType: entry.name,
    });
  }
});

inpObserver.observe({ type: 'event', buffered: true, durationThreshold: 40 });
```

### 2.4 Navigation Timing（加载耗时）

```javascript
/**
 * Navigation Timing API 2
 * 获取完整的页面加载时间线
 */
function getNavigationTiming() {
  const navigation = performance.getEntriesByType('navigation')[0];
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
    // DOMContentLoaded
    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.startTime,
    // 页面完全加载
    load: navigation.loadEventEnd - navigation.startTime,

    // 资源类型
    type: navigation.type, // navigate / reload / back_forward / prerender
    // 协议
    protocol: navigation.nextHopProtocol,
  };
}

// 页面加载完成后获取
window.addEventListener('load', () => {
  // 延迟获取，确保 loadEventEnd 已赋值
  setTimeout(() => {
    const timing = getNavigationTiming();
    reportMetric({ name: 'navigation-timing', ...timing });
  }, 0);
});
```

### 2.5 Long Task（长任务检测）

```javascript
/**
 * Long Task API
 * 检测超过 50ms 的长任务（主线程阻塞）
 * 长任务会导致输入延迟、动画卡顿
 */
const longTaskObserver = new PerformanceObserver((entryList) => {
  for (const entry of entryList.getEntries()) {
    console.warn('长任务:', {
      duration: entry.duration,
      startTime: entry.startTime,
      attribution: entry.attribution, // 任务来源
    });

    reportMetric({
      name: 'long-task',
      duration: entry.duration,
      startTime: entry.startTime,
    });
  }
});

longTaskObserver.observe({ type: 'longtask', buffered: true });
```

## 三、资源加载监控

```javascript
/**
 * 监控资源加载性能
 */
function observeResources() {
  const observer = new PerformanceObserver((entryList) => {
    for (const entry of entryList.getEntries()) {
      const resource = {
        name: entry.name,
        type: entry.initiatorType, // script / link / img / fetch / xmlhttprequest
        duration: entry.duration,
        size: entry.transferSize,
        // DNS + TCP + TLS + TTFB
        serverTiming: entry.responseStart - entry.requestStart,
      };

      // 超过 3 秒的资源告警
      if (entry.duration > 3000) {
        console.warn('慢资源:', resource);
      }

      // 资源加载失败（size 为 0 且 duration 为 0）
      if (entry.transferSize === 0 && entry.duration === 0) {
        console.error('资源加载失败:', entry.name);
      }

      reportMetric({ name: 'resource', ...resource });
    }
  });

  observer.observe({ type: 'resource', buffered: true });
}
```

## 四、自定义性能打点

```javascript
/**
 * 手动性能打点（用于业务指标）
 */
class PerfTracker {
  marks = new Map();

  // 标记时间点
  mark(name) {
    this.marks.set(name, performance.now());
    performance.mark(name);
  }

  // 计算两个标记之间的时间差
  measure(name, startMark, endMark) {
    const start = this.marks.get(startMark);
    const end = this.marks.get(endMark);

    if (start === undefined || end === undefined) {
      console.warn(`Mark not found: ${startMark} or ${endMark}`);
      return;
    }

    const duration = end - start;
    performance.measure(name, startMark, endMark);

    reportMetric({ name, value: duration });
    return duration;
  }

  // 常用业务指标
  trackPageLoad(pageName) {
    this.mark(`${pageName}-start`);
  }

  trackPageReady(pageName) {
    this.mark(`${pageName}-ready`);
    return this.measure(
      `${pageName}-load-time`,
      `${pageName}-start`,
      `${pageName}-ready`
    );
  }
}

// 使用示例
const perf = new PerfTracker();

// 页面开始加载
perf.trackPageLoad('home');

// 数据请求完成后
fetchData().then(() => {
  perf.mark('home-data-ready');
});

// 首屏渲染完成后
onFirstScreenRendered(() => {
  const dataTime = perf.measure('home-data-cost', 'home-start', 'home-data-ready');
  const totalTime = perf.trackPageReady('home');
  console.log(`首屏数据耗时: ${dataTime}ms, 总耗时: ${totalTime}ms`);
});
```

## 五、性能评分与分级

```javascript
/**
 * Web Vitals 评分标准
 */
const VITALS_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },   // ms
  FID: { good: 100, poor: 300 },     // ms
  CLS: { good: 0.1, poor: 0.25 },   // 无单位
  INP: { good: 200, poor: 500 },     // ms
  TTFB: { good: 800, poor: 1800 },   // ms
  FCP: { good: 1800, poor: 3000 },   // ms
};

function getRating(name, value) {
  const threshold = VITALS_THRESHOLDS[name];
  if (!threshold) return 'unknown';
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

// 使用示例
const lcp = 1200;
console.log(getRating('LCP', lcp)); // 'good'
```

## 面试要点总结

### 高频面试题

| 问题 | 关键答案 |
|------|---------|
| LCP 怎么采集？ | `PerformanceObserver` + `type: 'largest-contentful-paint'` |
| CLS 怎么计算？ | 影响分数 x 距离分数，忽略用户交互后 500ms 的偏移 |
| FID 和 INP 的区别？ | FID 只测首次交互延迟，INP 测所有交互中最慢的 |
| TTFB 怎么获取？ | Navigation Timing API 的 `responseStart - requestStart` |
| 怎么检测长任务？ | Long Task API，阈值 50ms |
| 为什么用 sendBeacon？ | 页面关闭时也能发送数据，比 XHR 可靠 |

### 加分项

1. 知道 `buffered: true` 的作用（获取历史条目）
2. 理解 CLS 的会话窗口机制（5 秒窗口、1 秒间隔）
3. 能区分 TBT、TTI、FID 之间的关系
4. 知道 web-vitals 库的内部实现原理
5. 能设计自定义业务性能打点方案
