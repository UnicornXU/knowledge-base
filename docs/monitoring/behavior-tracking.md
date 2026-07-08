---
sidebar_position: 3
title: 用户行为追踪
slug: /monitoring/behavior-tracking
---

# 👤 用户行为追踪

> **"数据驱动决策"** —— 用户行为追踪是产品优化、增长分析、用户画像的数据基础。

## 行为追踪的核心场景

```
用户行为追踪全景图
═══════════════════════════════════════════════════════

👤 用户行为
├── 页面访问（PV / UV）
│   ├── 页面浏览量
│   ├── 独立访客数
│   └── 访问来源
│
├── 点击行为
│   ├── 按钮点击
│   ├── 链接点击
│   ├── 商品点击
│   └── 广告曝光/点击
│
├── 内容交互
│   ├── 滚动深度
│   ├── 停留时长
│   ├── 视频播放
│   └── 图片浏览
│
├── 转化行为
│   ├── 注册
│   ├── 下单
│   ├── 支付
│   └── 分享
│
└── 异常行为
    ├── 快速跳出
    ├── 反复操作
    └── 页面报错后离开
```

## 一、埋点方案分类

```
三种主流埋点方案
═══════════════════════════════════════════════════════

方案        原理                     优点               缺点
────────────────────────────────────────────────────
代码埋点    手动在代码中调用上报 API   精准、灵活          开发量大、易遗漏
可视化埋点  通过可视化工具圈选元素    无需发版、运营友好    不够灵活、需要工具
无痕埋点    SDK 自动采集所有事件      全量覆盖、无需开发    数据量大、需要清洗
────────────────────────────────────────────────────
```

## 二、手动埋点实现

### 2.1 基础埋点 SDK

```typescript
/**
 * 埋点 SDK 核心类
 */
interface TrackEvent {
  event: string;       // 事件名称
  category: string;    // 事件分类
  label?: string;      // 事件标签
  value?: number;      // 事件值
  page?: string;       // 页面路径
  timestamp?: number;  // 时间戳
  extra?: Record<string, unknown>; // 扩展字段
}

class Tracker {
  private queue: TrackEvent[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly batchSize = 10;
  private readonly flushInterval = 5000; // 5 秒

  constructor(private endpoint: string) {
    // 页面关闭前批量上报
    window.addEventListener('beforeunload', () => this.flush());
    // 页面隐藏时上报
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.flush();
    });
  }

  /**
   * 追踪事件
   */
  track(event: string, data: Partial<TrackEvent> = {}) {
    const trackEvent: TrackEvent = {
      event,
      timestamp: Date.now(),
      page: location.pathname,
      ...data,
    };

    this.queue.push(trackEvent);

    // 满足批量大小立即上报
    if (this.queue.length >= this.batchSize) {
      this.flush();
    } else if (!this.timer) {
      // 设置定时上报
      this.timer = setTimeout(() => this.flush(), this.flushInterval);
    }
  }

  /**
   * 批量上报
   */
  flush() {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    // 使用 sendBeacon 保证页面关闭时也能发送
    const blob = new Blob(
      [JSON.stringify({ events })],
      { type: 'application/json' }
    );
    navigator.sendBeacon(this.endpoint, blob);
  }
}

// 全局实例
const tracker = new Tracker('/api/track');

// 使用
tracker.track('button_click', {
  category: 'home',
  label: 'signup-btn',
  extra: { userId: '123' },
});
```

### 2.2 PV / UV 追踪

```typescript
/**
 * 页面访问追踪
 */
function trackPageView() {
  const pvData = {
    event: 'page_view',
    page: location.pathname + location.search,
    referrer: document.referrer,
    title: document.title,
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    userAgent: navigator.userAgent,
    timestamp: Date.now(),
  };

  tracker.track('page_view', pvData);
}

// SPA 路由变化时追踪
// React Router 示例
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function usePageViewTracking() {
  const location = useLocation();

  useEffect(() => {
    trackPageView();
  }, [location.pathname, location.search]);
}

// Vue Router 示例
router.afterEach((to) => {
  tracker.track('page_view', {
    page: to.fullPath,
    title: to.meta.title,
  });
});

// 首次进入页面
trackPageView();
```

### 2.3 点击事件追踪

```typescript
/**
 * 方式一：声明式埋点（组件内手动调用）
 */
function handleClick() {
  tracker.track('button_click', {
    category: 'product',
    label: 'add-to-cart',
    extra: { productId: '456', price: 99 },
  });

  // 业务逻辑...
}

/**
 * 方式二：装饰器 / HOC 自动埋点
 */
function withTracking(WrappedComponent, eventName) {
  return function TrackedComponent(props) {
    const handleClick = (...args) => {
      tracker.track(eventName, {
        category: 'interaction',
        label: props['data-track-label'],
      });
      props.onClick?.(...args);
    };

    return <WrappedComponent {...props} onClick={handleClick} />;
  };
}

/**
 * 方式三：全局代理（无侵入）
 * 通过 data-track-* 属性标记需要埋点的元素
 */
document.addEventListener('click', (e) => {
  const target = e.target.closest('[data-track-event]');
  if (!target) return;

  tracker.track(target.dataset.trackEvent, {
    category: target.dataset.trackCategory || 'click',
    label: target.dataset.trackLabel || target.textContent?.trim(),
    extra: {
      elementId: target.id,
      className: target.className,
      page: location.pathname,
    },
  });
});

// HTML 使用
// <button data-track-event="button_click" data-track-category="checkout" data-track-label="submit-order">
//   提交订单
// </button>
```

## 三、无痕埋点（全量采集）

```typescript
/**
 * 无痕埋点：自动采集所有用户交互
 * 原理：监听 DOM 事件，记录用户操作序列
 */
class AutoTracker {
  private events: Array<{
    type: string;
    target: string;
    timestamp: number;
    position?: { x: number; y: number };
    value?: string;
  }> = [];

  constructor() {
    this.initClickTracking();
    this.initInputTracking();
    this.initScrollTracking();
    this.initNavigationTracking();
  }

  /**
   * 自动追踪点击事件
   */
  private initClickTracking() {
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      this.events.push({
        type: 'click',
        target: this.getElementSelector(target),
        timestamp: Date.now(),
        position: { x: e.clientX, y: e.clientY },
      });
    });
  }

  /**
   * 自动追踪输入事件（脱敏处理）
   */
  private initInputTracking() {
    document.addEventListener(
      'change',
      (e) => {
        const target = e.target as HTMLInputElement;
        // 敏感字段脱敏
        const sensitiveFields = ['password', 'creditCard', 'ssn'];
        const isSensitive = sensitiveFields.some((f) =>
          target.name?.toLowerCase().includes(f)
        );

        this.events.push({
          type: 'input',
          target: this.getElementSelector(target),
          timestamp: Date.now(),
          value: isSensitive ? '***' : target.value?.substring(0, 50),
        });
      },
      true
    );
  }

  /**
   * 自动追踪滚动深度
   */
  private initScrollTracking() {
    let maxScrollDepth = 0;

    const trackScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      );
      if (scrollPercent > maxScrollDepth) {
        maxScrollDepth = scrollPercent;
      }
    };

    // 节流
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          trackScroll();
          ticking = false;
        });
        ticking = true;
      }
    });

    // 页面离开时上报最大滚动深度
    window.addEventListener('beforeunload', () => {
      tracker.track('scroll_depth', {
        value: maxScrollDepth,
      });
    });
  }

  /**
   * 自动追踪路由变化
   */
  private initNavigationTracking() {
    // 拦截 pushState
    const originalPushState = history.pushState;
    history.pushState = function (...args) {
      originalPushState.apply(this, args);
      tracker.track('navigation', { page: location.pathname });
    };

    // 拦截 replaceState
    const originalReplaceState = history.replaceState;
    history.replaceState = function (...args) {
      originalReplaceState.apply(this, args);
      tracker.track('navigation', { page: location.pathname });
    };

    // 监听 popstate
    window.addEventListener('popstate', () => {
      tracker.track('navigation', { page: location.pathname });
    });
  }

  /**
   * 生成元素选择器（用于定位元素）
   */
  private getElementSelector(element: HTMLElement): string {
    if (element.id) return `#${element.id}`;
    if (element.dataset.trackId) return `[data-track-id="${element.dataset.trackId}"]`;

    const path: string[] = [];
    let current: HTMLElement | null = element;
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      if (current.className) {
        selector += `.${current.className.split(' ').join('.')}`;
      }
      path.unshift(selector);
      current = current.parentElement;
    }
    return path.join(' > ');
  }
}
```

## 四、停留时长追踪

```typescript
/**
 * 页面停留时长追踪
 */
class DurationTracker {
  private startTime: number;
  private accumulatedTime = 0;
  private isActive = true;

  constructor(private pageName: string) {
    this.startTime = Date.now();
    this.initVisibilityTracking();
    this.initBeforeUnload();
  }

  private initVisibilityTracking() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        // 页面隐藏，暂停计时
        this.accumulatedTime += Date.now() - this.startTime;
        this.isActive = false;
      } else {
        // 页面可见，恢复计时
        this.startTime = Date.now();
        this.isActive = true;
      }
    });
  }

  private initBeforeUnload() {
    window.addEventListener('beforeunload', () => {
      const duration = this.isActive
        ? this.accumulatedTime + (Date.now() - this.startTime)
        : this.accumulatedTime;

      tracker.track('page_duration', {
        page: this.pageName,
        value: Math.round(duration / 1000), // 秒
      });
    });
  }
}

// 使用
const durationTracker = new DurationTracker('home');
```

## 五、用户路径分析

```typescript
/**
 * 用户访问路径追踪
 * 记录用户在页面间的完整流转路径
 */
class PathTracker {
  private path: Array<{
    page: string;
    enterTime: number;
    leaveTime?: number;
    source?: string;
  }> = [];

  constructor() {
    this.recordEnter();
    this.initNavigationListener();
  }

  private recordEnter() {
    this.path.push({
      page: location.pathname,
      enterTime: Date.now(),
      source: document.referrer,
    });
  }

  private initNavigationListener() {
    // 监听路由变化
    const handleNavigation = () => {
      // 记录离开时间
      const current = this.path[this.path.length - 1];
      if (current) {
        current.leaveTime = Date.now();
      }

      // 记录进入新页面
      this.recordEnter();

      // 上报路径（每 5 个节点上报一次）
      if (this.path.length % 5 === 0) {
        this.report();
      }
    };

    window.addEventListener('popstate', handleNavigation);
    // 拦截 pushState / replaceState（同上）
  }

  private report() {
    tracker.track('user_path', {
      extra: {
        path: this.path.slice(-10), // 最近 10 个节点
      },
    });
  }
}
```

## 面试要点总结

### 高频面试题

| 问题 | 关键答案 |
|------|---------|
| 三种埋点方案的区别？ | 代码埋点精准但开发量大、可视化埋点无需发版但不灵活、无痕埋点全量覆盖但数据量大 |
| 怎么实现批量上报？ | 队列 + 定时器 + 满批量触发 + sendBeacon 兜底 |
| 页面关闭时数据丢失怎么办？ | sendBeacon API，页面 visibilitychange 时提前 flush |
| 怎么追踪 SPA 路由变化？ | 拦截 pushState / replaceState + 监听 popstate |
| 停留时长怎么计算？ | 进入时间戳 - 离开时间戳，排除页面隐藏时间 |
| 如何进行数据脱敏？ | 敏感字段（密码、信用卡）替换为 `***` |

### 加分项

1. 能设计一个完整的埋点 SDK 架构（队列、批量、重试）
2. 知道 `sendBeacon` 和 `Image` 打点的区别
3. 理解无痕埋点的元素选择器生成算法
4. 能说出滚动深度的节流优化方案
5. 了解数据上报后的清洗和分析流程
