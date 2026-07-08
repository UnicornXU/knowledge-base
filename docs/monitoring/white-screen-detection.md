---
sidebar_position: 4
title: 白屏检测方案
slug: /monitoring/white-screen-detection
---

# 🖥️ 白屏检测方案

> **"白屏是前端最严重的线上事故"** —— 用户看到白屏 = 功能完全不可用，必须秒级发现、分钟级修复。

## 什么是白屏？

```
白屏的典型场景
═══════════════════════════════════════════════════════

用户打开页面...
  ↓
屏幕一片空白，什么都没有
  ↓
可能是以下原因：
├── JS 语法错误导致渲染中断
├── 接口请求失败，数据为空
├── 资源加载失败（CSS / JS 404）
├── 兼容性问题（API 不支持）
├── 内存溢出导致崩溃
├── 路由配置错误
└── 服务端返回空页面
```

## 白屏检测方案总览

```
白屏检测方案对比
═══════════════════════════════════════════════════════

方案              原理                    准确度   性能消耗   实现难度
──────────────────────────────────────────────────────
采样点检测        在固定坐标取样像素        中       低        ⭐
DOM 节点检测      检查根节点是否有子元素    中       低        ⭐⭐
Canvas 截图对比   截图后分析像素数据        高       中        ⭐⭐⭐
MutationObserver  监听 DOM 变化            高       低        ⭐⭐
关键元素检测      检查特定元素是否存在      高       低        ⭐⭐
──────────────────────────────────────────────────────
```

## 一、采样点检测法

```typescript
/**
 * 采样点检测法
 * 在页面的多个关键位置取样，判断是否都是白色/透明像素
 *
 * 原理：如果页面正常渲染，采样点应该有不同的颜色值
 * 如果所有采样点都是白色或透明，则判定为白屏
 */
function detectWhiteScreen(): boolean {
  const samplePoints = [
    // 关键采样点位置（相对视口）
    { x: window.innerWidth * 0.25, y: window.innerHeight * 0.25 },
    { x: window.innerWidth * 0.75, y: window.innerHeight * 0.25 },
    { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5 },
    { x: window.innerWidth * 0.25, y: window.innerHeight * 0.75 },
    { x: window.innerWidth * 0.75, y: window.innerHeight * 0.75 },
  ];

  let whiteCount = 0;

  for (const point of samplePoints) {
    const element = document.elementFromPoint(point.x, point.y);

    if (!element || element === document.documentElement || element === document.body) {
      // 采样点在 body 或 html 上（没有实际内容覆盖）
      whiteCount++;
    } else {
      // 检查元素的背景色
      const style = window.getComputedStyle(element);
      const bgColor = style.backgroundColor;

      // 判断是否为白色或透明背景
      if (isWhiteOrTransparent(bgColor)) {
        whiteCount++;
      }
    }
  }

  // 超过 80% 的采样点为白色，判定为白屏
  return whiteCount / samplePoints.length >= 0.8;
}

/**
 * 判断颜色是否为白色或透明
 */
function isWhiteOrTransparent(color: string): boolean {
  // 透明
  if (color === 'transparent' || color === 'rgba(0, 0, 0, 0)') {
    return true;
  }

  // 白色或接近白色
  const whiteColors = [
    'rgb(255, 255, 255)',
    'rgba(255, 255, 255, 1)',
    '#ffffff',
    '#fff',
    'white',
  ];

  return whiteColors.includes(color.toLowerCase().trim());
}

// 延迟检测（等待页面渲染完成）
setTimeout(() => {
  if (detectWhiteScreen()) {
    reportError({
      type: 'white-screen',
      method: 'sample-point',
      url: location.href,
      timestamp: Date.now(),
    });
  }
}, 3000); // 页面加载 3 秒后检测
```

## 二、DOM 节点检测法

```typescript
/**
 * DOM 节点检测法
 * 检查 body 的子元素数量和内容
 *
 * 原理：正常页面的 body 下会有多个有意义的子节点
 * 白屏时 body 通常为空或只有极少的空节点
 */
function detectWhiteScreenByDOM(): boolean {
  const body = document.body;
  if (!body) return true;

  const children = body.childNodes;

  // 过滤掉空文本节点和注释节点
  const meaningfulNodes = Array.from(children).filter((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent?.trim().length > 0;
    }
    if (node.nodeType === Node.COMMENT_NODE) {
      return false;
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      // 过滤掉 script、style、link 等非可视元素
      const invisibleTags = ['SCRIPT', 'STYLE', 'LINK', 'META', 'NOSCRIPT'];
      return !invisibleTags.includes(el.tagName);
    }
    return false;
  });

  // 如果有意义的节点少于 2 个，可能是白屏
  if (meaningfulNodes.length < 2) {
    // 进一步检查：第一个节点是否有实际内容
    const firstEl = meaningfulNodes[0] as HTMLElement;
    if (firstEl) {
      const rect = firstEl.getBoundingClientRect();
      // 元素尺寸过小也视为白屏
      if (rect.width < 10 || rect.height < 10) {
        return true;
      }
    }
    return true;
  }

  return false;
}

// 使用
setTimeout(() => {
  if (detectWhiteScreenByDOM()) {
    reportError({
      type: 'white-screen',
      method: 'dom-check',
      bodyChildCount: document.body.childNodes.length,
      url: location.href,
    });
  }
}, 3000);
```

## 三、Canvas 截图对比法

```typescript
/**
 * Canvas 截图对比法
 * 将页面绘制到 Canvas，分析像素数据
 *
 * 原理：使用 html2canvas 将页面转为图片
 * 然后检查图片中是否有非白色像素
 * 优点：最准确，能检测到视觉层面的白屏
 * 缺点：性能消耗较大，需要引入额外库
 */
import html2canvas from 'html2canvas';

async function detectWhiteScreenByCanvas(): Promise<boolean> {
  try {
    const canvas = await html2canvas(document.body, {
      // 只取视口内的内容
      width: window.innerWidth,
      height: window.innerHeight,
      // 不加载跨域图片
      useCORS: false,
      // 缩小尺寸以提升性能
      scale: 0.1,
    });

    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    let nonWhiteCount = 0;
    const totalPixels = canvas.width * canvas.height;

    // 采样检查（每 10 个像素检查一次，提升性能）
    for (let i = 0; i < pixels.length; i += 40) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];

      // 判断是否为非白色像素
      const isWhite = r > 250 && g > 250 && b > 250 && a > 250;
      if (!isWhite) {
        nonWhiteCount++;
      }
    }

    // 非白色像素占比低于 5%，判定为白屏
    const nonWhiteRatio = nonWhiteCount / (totalPixels / 10);
    return nonWhiteRatio < 0.05;
  } catch (error) {
    // 截图失败不判定为白屏（可能是跨域问题）
    console.error('Canvas 截图失败:', error);
    return false;
  }
}
```

## 四、MutationObserver 监听法

```typescript
/**
 * MutationObserver 监听法
 * 监听 DOM 变化，如果页面加载后长时间没有有意义的 DOM 变更
 * 则判定为白屏
 *
 * 优点：性能消耗极低，实时性强
 * 缺点：需要合理的超时判断
 */
function detectWhiteScreenByMutation(): void {
  let hasMeaningfulContent = false;
  let mutationCount = 0;

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      // 检查新增节点
      for (const node of Array.from(mutation.addedNodes)) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          const invisibleTags = ['SCRIPT', 'STYLE', 'LINK', 'META', 'NOSCRIPT'];

          if (!invisibleTags.includes(el.tagName)) {
            mutationCount++;

            // 检查是否有实际内容
            if (el.textContent?.trim() || el.children.length > 0) {
              hasMeaningfulContent = true;
              observer.disconnect(); // 停止监听
              return;
            }
          }
        }
      }
    }
  });

  // 开始监听
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  // 超时检测：3 秒后检查
  setTimeout(() => {
    if (!hasMeaningfulContent) {
      observer.disconnect();

      reportError({
        type: 'white-screen',
        method: 'mutation-observer',
        mutationCount,
        url: location.href,
        html: document.documentElement.innerHTML.substring(0, 1000),
      });
    }
  }, 3000);
}
```

## 五、关键元素检测法

```typescript
/**
 * 关键元素检测法
 * 检查页面中关键的 DOM 元素是否存在且可见
 *
 * 最实用的方案：结合业务场景，检查关键渲染元素
 * 比通用方案更精准
 */
function detectWhiteScreenByKeyElements(): boolean {
  // 定义关键元素选择器（根据业务配置）
  const keyElementSelectors = [
    '#app',           // Vue 根节点
    '#root',          // React 根节点
    '.main-content',  // 主内容区
    'header',         // 页头
    'main',           // 主体
  ];

  let foundKeyElement = false;

  for (const selector of keyElementSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      // 检查元素是否有实际内容
      const rect = element.getBoundingClientRect();
      const hasSize = rect.width > 0 && rect.height > 0;
      const hasContent = element.textContent?.trim().length > 0 ||
        element.children.length > 0;

      if (hasSize && hasContent) {
        foundKeyElement = true;
        break;
      }
    }
  }

  return !foundKeyElement;
}

// 组合检测：关键元素 + 采样点
function detectWhiteScreenCombined(): boolean {
  const isWhiteByKeyElements = detectWhiteScreenByKeyElements();

  if (isWhiteByKeyElements) {
    // 关键元素不存在，再用采样点确认
    return detectWhiteScreen();
  }

  return false;
}
```

## 六、完整白屏监控方案

```typescript
/**
 * 白屏监控 SDK（综合方案）
 */
class WhiteScreenDetector {
  private config = {
    checkDelay: 3000,          // 检测延迟（ms）
    sampleThreshold: 0.8,      // 采样点白屏比例阈值
    retryTimes: 3,             // 重试次数
    retryInterval: 2000,       // 重试间隔
    keyElements: ['#app', '#root', 'main', '.main-content'],
  };

  constructor(private onError: (data: object) => void) {
    this.startDetection();
  }

  private async startDetection() {
    // 等待页面基本加载
    await this.waitForLoad();

    // 首次检测
    const isWhite = await this.detect();
    if (isWhite) {
      // 重试确认（避免误报）
      let retryCount = 0;
      let confirmed = true;

      while (retryCount < this.config.retryTimes) {
        await this.delay(this.config.retryInterval);
        const stillWhite = await this.detect();
        if (!stillWhite) {
          confirmed = false;
          break;
        }
        retryCount++;
      }

      if (confirmed) {
        this.report();
      }
    }
  }

  private async detect(): Promise<boolean> {
    // 组合多种检测方式
    const results = await Promise.all([
      this.checkKeyElements(),
      this.checkSamplePoints(),
    ]);

    // 任意一种方式检测到白屏即判定
    return results.some((r) => r);
  }

  private checkKeyElements(): boolean {
    for (const selector of this.config.keyElements) {
      const el = document.querySelector(selector);
      if (el && el.textContent?.trim()) {
        return false; // 找到有内容的关键元素，不是白屏
      }
    }
    return true;
  }

  private checkSamplePoints(): boolean {
    const points = [
      { x: window.innerWidth * 0.25, y: window.innerHeight * 0.25 },
      { x: window.innerWidth * 0.75, y: window.innerHeight * 0.25 },
      { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5 },
      { x: window.innerWidth * 0.25, y: window.innerHeight * 0.75 },
      { x: window.innerWidth * 0.75, y: window.innerHeight * 0.75 },
    ];

    let whiteCount = 0;
    for (const point of points) {
      const el = document.elementFromPoint(point.x, point.y);
      if (!el || el === document.documentElement || el === document.body) {
        whiteCount++;
      }
    }

    return whiteCount / points.length >= this.config.sampleThreshold;
  }

  private report() {
    this.onError({
      type: 'white-screen',
      url: location.href,
      userAgent: navigator.userAgent,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      html: document.documentElement.innerHTML.substring(0, 2000),
      timestamp: Date.now(),
    });
  }

  private waitForLoad(): Promise<void> {
    return new Promise((resolve) => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', () => resolve());
      }
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// 使用
new WhiteScreenDetector((data) => {
  // 上报白屏错误
  reportError(data);
});
```

## 面试要点总结

### 高频面试题

| 问题 | 关键答案 |
|------|---------|
| 白屏检测有哪些方案？ | 采样点、DOM 节点、Canvas 截图、MutationObserver、关键元素 |
| 采样点法怎么实现？ | `elementFromPoint` 取样 + 判断背景色 |
| 怎么避免白屏误报？ | 多次重试确认、延迟检测、组合多种方案 |
| MutationObserver 怎么用于白屏检测？ | 监听 DOM 变化，超时无有意义内容即判定白屏 |
| 白屏时需要上报什么信息？ | URL、UA、屏幕尺寸、HTML 片段、时间戳 |

### 加分项

1. 能说出每种方案的优缺点和适用场景
2. 知道如何配置关键元素选择器（业务相关）
3. 理解重试机制避免误报的重要性
4. 能设计组合检测方案提升准确率
5. 知道白屏上报后如何结合 Source Map 和错误日志定位根因
