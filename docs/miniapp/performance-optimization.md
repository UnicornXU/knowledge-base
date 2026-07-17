---
sidebar_position: 5
title: '小程序性能优化'
difficulty: 'hard'
tags: ['小程序', '性能优化', '渲染', '启动']
---

# 小程序性能优化

## 性能指标体系

### 核心指标

| 指标       | 含义         | 小程序对应      | 优秀值      |
| ---------- | ------------ | --------------- | ----------- |
| FP         | 首次绘制     | 页面开始渲染    | < 1s        |
| FCP        | 首次内容绘制 | 首屏内容出现    | < 1.5s      |
| LCP        | 最大内容绘制 | 主要内容完成    | < 2.5s      |
| TTI        | 可交互时间   | 页面可操作      | < 3s        |
| 包下载时间 | —            | 代码包下载完成  | < 1s (WiFi) |
| 注入时间   | —            | JS 代码注入执行 | < 200ms     |

### 性能评分标准（微信开发者工具 Audits）

| 维度     | 权重 | 关键项                      |
| -------- | ---- | --------------------------- |
| 启动性能 | 40%  | 包体积、首屏请求数、骨架屏  |
| 运行性能 | 35%  | setData 频率/大小、内存占用 |
| 网络性能 | 25%  | 请求耗时、缓存命中率        |

:::tip 性能面板查看方法
开发者工具 → 调试器 → Performance/Audits 面板，或使用 `wx.getPerformance()` API 在代码中获取性能数据。
:::

## 启动优化

### 代码包体积控制

```javascript
// 1. 分析包体积（开发者工具 → 代码依赖分析）
// 主要优化手段：

// ① 移除无用代码和资源
// ② 图片上传 CDN，不放本地
// ③ 使用生产版本的第三方库
// ④ 开启代码压缩（项目配置 → 上传时压缩）
```

| 优化手段           | 预期收益     | 实施难度 |
| ------------------ | ------------ | -------- |
| 图片转 CDN         | 30-60% 减少  | ⭐       |
| 移除未使用代码     | 10-20%       | ⭐⭐     |
| 分包加载           | 主包减少50%+ | ⭐⭐     |
| 三方库精简         | 5-15%        | ⭐⭐⭐   |
| Tree-shaking (npm) | 5-10%        | ⭐⭐     |

### 分包策略

```json
{
  "subpackages": [
    {
      "root": "pages/shop",
      "pages": ["list/index", "detail/index", "cart/index"]
    },
    {
      "root": "pages/user",
      "pages": ["profile/index", "settings/index"],
      "independent": true
    }
  ],
  "preloadRule": {
    "pages/index/index": {
      "network": "wifi",
      "packages": ["pages/shop"]
    }
  }
}
```

### 异步数据预拉取

```json
// app.json 配置预拉取
{
  "preloadRule": {},
  "fetchDta": {
    "prefetch": [
      {
        "url": "https://api.example.com/home",
        "data": {"from": "prefetch"}
      }
    ]
  }
}
```

```javascript
// 页面中获取预拉取数据
Page({
  onLoad() {
    wx.getBackgroundFetchData({
      fetchType: 'pre',
      success(res) {
        const data = JSON.parse(res.fetchedData);
        this.setData({homeData: data});
      },
    });
  },
});
```

### 骨架屏

```javascript
// 开发者工具自动生成骨架屏
// 页面右键 → 生成骨架屏 → 自动生成 page.skeleton.wxml 和 page.skeleton.wxss

// 手动控制显示/隐藏
Page({
  data: {showSkeleton: true},
  onLoad() {
    this.loadData().then(() => {
      this.setData({showSkeleton: false});
    });
  },
});
```

## 渲染优化

### setData 最佳实践

:::warning setData 性能陷阱
每次 setData 调用都会触发：序列化 → 跨线程传输 → 反序列化 → diff → 渲染。数据量越大、频率越高，性能损耗越严重。
:::

```javascript
// ❌ 反模式1：频繁调用
onScroll(e) {
  this.setData({ scrollTop: e.detail.scrollTop }); // 每帧都调用
}

// ✅ 优化：节流
onScroll: throttle(function(e) {
  this.setData({ scrollTop: e.detail.scrollTop });
}, 50)

// ❌ 反模式2：大数据量
this.setData({ hugeList: entireList }); // 可能几百KB

// ✅ 优化：路径更新
this.setData({ [`list[${index}].status`]: 'done' });

// ❌ 反模式3：冗余数据
this.setData({
  rawData: apiResponse,  // 包含大量视图不需要的字段
  list: apiResponse.list
});

// ✅ 优化：只传视图需要的数据
this.setData({
  list: apiResponse.list.map(item => ({
    id: item.id, title: item.title, cover: item.cover
  }))
});
```

### 合并更新策略

```javascript
// ❌ 多次 setData
this.setData({loading: true});
this.setData({title: res.title});
this.setData({list: res.list});

// ✅ 单次合并
this.setData({
  loading: true,
  title: res.title,
  list: res.list,
});

// ✅ 使用 nextTick 收集同步更新
const updates = {};
updates.a = 1;
updates.b = 2;
updates.c = 3;
this.setData(updates);
```

### 虚拟列表（recycle-view）

```json
// 使用官方 recycle-view 组件
{
  "usingComponents": {
    "recycle-view": "miniprogram-recycle-view/recycle-view",
    "recycle-item": "miniprogram-recycle-view/recycle-item"
  }
}
```

```html
<recycle-view batch="{{batchSetRecycleData}}" id="recycleId">
  <recycle-item wx:for="{{recycleList}}" wx:key="id">
    <view class="item">{{item.title}}</view>
  </recycle-item>
</recycle-view>
```

```javascript
const createRecycleContext = require('miniprogram-recycle-view');

Page({
  onReady() {
    this.ctx = createRecycleContext({
      id: 'recycleId',
      dataKey: 'recycleList',
      page: this,
      itemSize: {width: 375, height: 80}, // rpx
    });
    this.ctx.append(longList); // 添加数据
  },
});
```

### 自定义组件优化

```javascript
Component({
  options: {
    pureDataPattern: /^_/, // 以_开头的字段为纯数据字段，不参与渲染
  },
  data: {
    _rawData: null, // 不会触发渲染更新
    displayData: [], // 参与渲染
  },
  observers: {
    // 用 observers 代替 properties 的 observer（已废弃）
    'propA, propB': function (a, b) {
      this.setData({computed: a + b});
    },
  },
});
```

## 网络优化

### 请求合并

```javascript
// ❌ 页面 onLoad 中并发多个独立请求
onLoad() {
  wx.request({ url: '/api/user' });
  wx.request({ url: '/api/config' });
  wx.request({ url: '/api/banner' });
  wx.request({ url: '/api/list' });
}

// ✅ 服务端提供聚合接口
onLoad() {
  wx.request({
    url: '/api/home/aggregate',
    success(res) {
      this.setData({
        user: res.data.user,
        config: res.data.config,
        banner: res.data.banner,
        list: res.data.list
      });
    }
  });
}
```

### 缓存策略

```javascript
const CacheManager = {
  get(key, maxAge = 5 * 60 * 1000) {
    const cached = wx.getStorageSync(key);
    if (!cached) return null;
    if (Date.now() - cached.timestamp > maxAge) {
      wx.removeStorageSync(key);
      return null;
    }
    return cached.data;
  },
  set(key, data) {
    wx.setStorageSync(key, {data, timestamp: Date.now()});
  },
};

// 使用：先读缓存再请求
async function fetchWithCache(url, cacheKey) {
  const cached = CacheManager.get(cacheKey);
  if (cached) return cached; // 缓存命中

  const res = await requestAsync(url);
  CacheManager.set(cacheKey, res.data);
  return res.data;
}
```

### 离线化方案

```javascript
// 利用后台数据预拉取 + 本地缓存实现弱网可用
App({
  onLaunch() {
    this.preloadCriticalData();
  },
  async preloadCriticalData() {
    const keys = ['home_data', 'user_info', 'config'];
    for (const key of keys) {
      try {
        const res = await requestAsync(`/api/${key}`);
        wx.setStorageSync(key, res.data);
      } catch (e) {
        console.log(`${key} 使用离线缓存`);
      }
    }
  },
});
```

## 内存管理

### 内存告警监听

```javascript
wx.onMemoryWarning((res) => {
  // level: 5(TRIM_MEMORY_RUNNING_MODERATE)
  //        10(TRIM_MEMORY_RUNNING_LOW)
  //        15(TRIM_MEMORY_RUNNING_CRITICAL)
  console.warn('内存告警级别:', res.level);

  // 清理策略
  this.clearImageCache();
  this.releaseUnusedData();
});
```

### 图片回收策略

```html
<!-- 使用 lazy-load 延迟加载 -->
<image lazy-load src="{{item.cover}}" mode="aspectFill" />

<!-- 结合 IntersectionObserver 回收不可见图片 -->
```

```javascript
Page({
  onReady() {
    this.observer = this.createIntersectionObserver({observeAll: true});
    this.observer.relativeToViewport({top: 500, bottom: 500}).observe('.list-item', (res) => {
      const index = res.dataset.index;
      if (res.intersectionRatio <= 0) {
        // 不可见，置空图片释放内存
        this.setData({[`list[${index}].showImg`]: false});
      } else {
        this.setData({[`list[${index}].showImg`]: true});
      }
    });
  },
});
```

### 页面栈优化

```javascript
// 监控页面栈深度
function checkPageStack() {
  const pages = getCurrentPages();
  if (pages.length > 7) {
    console.warn('页面栈过深，建议使用 redirectTo');
  }
  return pages.length;
}

// 适时清理页面栈
function smartNavigate(url) {
  const pages = getCurrentPages();
  if (pages.length >= 8) {
    wx.redirectTo({url}); // 替换当前页
  } else {
    wx.navigateTo({url}); // 保留当前页
  }
}
```

## 分包预下载策略

### 配置规则

```json
{
  "preloadRule": {
    "pages/index/index": {
      "network": "all",
      "packages": ["subpackageA"]
    },
    "pages/category/index": {
      "network": "wifi",
      "packages": ["subpackageB", "subpackageC"]
    }
  }
}
```

| 配置项   | 说明                   | 限制              |
| -------- | ---------------------- | ----------------- |
| network  | 触发网络条件(all/wifi) | —                 |
| packages | 预下载的包             | 同一网络下上限2MB |
| 触发时机 | 进入指定页面时         | 不保证下载完成    |

:::tip 预下载策略建议

- 首页预下载最常用的分包（如商品模块）
- 分类页预下载对应的详情分包
- 仅 WiFi 环境预下载非核心分包
- 结合用户行为数据动态配置
  :::

## 性能监控

### wx.getPerformance

```javascript
const performance = wx.getPerformance();
const observer = performance.createObserver((entryList) => {
  const entries = entryList.getEntries();
  entries.forEach((entry) => {
    console.log(`${entry.name}: ${entry.duration}ms`);
  });
});
observer.observe({entryTypes: ['render', 'script', 'navigation']});
```

### 自定义埋点

```javascript
class PerfMonitor {
  constructor() {
    this.marks = {};
  }

  mark(name) {
    this.marks[name] = Date.now();
  }

  measure(name, startMark, endMark) {
    const duration = this.marks[endMark] - this.marks[startMark];
    this.report({name, duration, page: getCurrentPageRoute()});
    return duration;
  }

  report(data) {
    wx.request({
      url: 'https://monitor.example.com/perf',
      method: 'POST',
      data: {...data, timestamp: Date.now(), device: wx.getSystemInfoSync()},
    });
  }
}

// 使用
const perf = new PerfMonitor();
perf.mark('pageLoad_start');
// ... 数据加载完成
perf.mark('pageLoad_end');
perf.measure('pageLoadTime', 'pageLoad_start', 'pageLoad_end');
```

## 面试高频题

:::info 面试题1：setData 的性能瓶颈在哪？如何优化？
**答**：瓶颈在于跨线程通信——数据从逻辑层序列化后通过 Native Bridge 传递到渲染层再反序列化。优化策略：① 减少调用频率（合并/节流）；② 减少数据量（路径更新、过滤无用字段）；③ 避免后台页面 setData（onHide时停止定时器）；④ 大列表使用虚拟列表组件。微信开发者工具的 Audits 面板可检测 setData 调用情况。
:::

:::info 面试题2：小程序的启动流程及各阶段优化？
**答**：启动流程：① 资源准备（代码包下载）→ ② 代码注入（执行App/Page/Component构造器）→ ③ 首屏渲染（初始 setData + WXML 编译）→ ④ 网络请求 → ⑤ 完全渲染。优化：阶段① 分包+预下载；阶段② 减少启动时同步代码、懒初始化；阶段③ 骨架屏+精简初始数据；阶段④ 预拉取+缓存优先；阶段⑤ 按需渲染+懒加载。
:::

:::info 面试题3：如何实现小程序长列表的性能优化？
**答**：① 虚拟列表（recycle-view）——只渲染可视区域内的节点；② IntersectionObserver 监听元素可见性，回收不可见元素的图片；③ 分页加载，每次只追加一页数据；④ 路径更新避免全量 setData；⑤ 纯数据字段存储原始数据不触发渲染；⑥ 使用 `wx:key` 提高 diff 效率。
:::

:::info 面试题4：小程序如何监控和分析性能数据？
**答**：① 使用 `wx.getPerformance()` 获取框架级性能数据（render/script/navigation）；② 自定义 Performance Mark/Measure 埋点关键路径；③ 利用 `wx.getRealtimeLogManager()` 实时日志上报；④ 接入微信的性能监控平台（we分析）；⑤ 自建监控系统采集 setData 耗时、接口响应时间、异常率等指标。
:::

:::info 面试题5：分包加载如何影响性能？如何制定分包策略？
**答**：分包将主包体积压缩到最小，减少首屏下载时间。策略制定：① 主包只保留 tabBar 页和公共基础库；② 按功能模块（电商/用户/营销）划分分包；③ 高频路径配置预下载；④ 独立分包用于活动页等场景（可独立启动，不依赖主包）；⑤ 分包异步化实现跨包组件按需加载。
:::

:::info 面试题6：如何解决小程序的内存问题？
**答**：① 监听 `wx.onMemoryWarning` 及时释放缓存；② 图片使用 lazy-load 和按需回收；③ 控制页面栈深度（超过阈值用 redirectTo）；④ 大数据处理完及时置 null；⑤ 避免在 data 中存放大量非渲染数据（使用纯数据字段或实例属性）；⑥ WXS 处理频繁交互减少逻辑层内存压力。
:::
