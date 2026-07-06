---
sidebar_position: 4
title: 部署与发布
difficulty: medium
tags:
  - miniapp
  - deploy
  - publish
  - performance
---

# 🚀 部署与发布

> **"开发完成只是开始，上线才是真正的考验"** —— 了解小程序的发布流程和优化技巧。

## 一、发布流程

```
小程序发布流程
═══════════════════════════════════════════════════════

1. 开发阶段
   ├── 本地开发 → 开发者工具预览
   ├── 真机调试 → 扫码预览
   └── 体验版测试 → 上传代码

2. 审核阶段
   ├── 提交审核 → 填写版本信息
   ├── 审核中   → 通常 1-7 天
   └── 审核通过 → 发布上线

3. 运维阶段
   ├── 版本管理 → 回滚、灰度发布
   ├── 数据监控 → 性能、错误、用户分析
   └── 持续迭代 → 功能更新、Bug 修复
```

### 1.1 上传代码

```bash
# 使用微信开发者工具上传
# 或使用 CLI 工具

# 安装 miniprogram-ci
npm install -g miniprogram-ci

# 上传代码
miniprogram-ci upload \
  --appid wx1234567890abcdef \
  --project-path ./miniprogram \
  --private-key-path ./private.key \
  --version 1.0.0 \
  --desc '首次发布'
```

### 1.2 审核注意事项

```
审核要点
═══════════════════════════════════════════════════════

✅ 通过审核的关键：
• 功能完整，无明显 Bug
• 页面加载正常，无白屏
• 用户隐私政策说明
• 不涉及违规内容
• 符合小程序类目要求

❌ 常见拒绝原因：
• 功能不完整或无法使用
• 页面加载超时或白屏
• 缺少隐私政策说明
• 涉及虚拟支付（iOS 限制）
• 诱导分享、强制关注
• 内容违规或侵权
```

## 二、性能优化

### 2.1 启动性能

```
启动性能优化
═══════════════════════════════════════════════════════

1. 代码包优化
   ├── 代码压缩（terser）
   ├── 图片压缩（tinypng）
   ├── 分包加载（subpackage）
   └── 按需引入组件

2. 首屏优化
   ├── 骨架屏（Skeleton）
   ├── 数据预拉取
   ├── 周期性更新
   └── 避免首页过重

3. 数据预拉取
```

```json
// app.json — 分包配置
{
  "pages": [
    "pages/index/index",
    "pages/profile/index"
  ],
  "subpackages": [
    {
      "root": "pages/poll",
      "pages": [
        "create/index",
        "detail/index",
        "result/index"
      ]
    },
    {
      "root": "pages/my",
      "pages": [
        "polls/index"
      ]
    }
  ],
  "preloadRule": {
    "pages/index/index": {
      "network": "all",
      "packages": ["pages/poll"]
    }
  }
}
```

### 2.2 渲染性能

```js
// 优化长列表渲染
Page({
  data: {
    pollList: [],
    // 使用虚拟列表
    startIndex: 0,
    endIndex: 20,
    itemHeight: 200,
  },

  // 使用 IntersectionObserver 实现懒加载
  onLoad() {
    this._observer = wx.createIntersectionObserver(this, {
      thresholds: [0],
    });

    this._observer
      .relativeTo('.scroll-container')
      .observe('.lazy-image', (res) => {
        if (res.intersectionRatio > 0) {
          // 图片进入可视区域，加载图片
          const { index } = res.dataset;
          this.loadImage(index);
        }
      });
  },

  onUnload() {
    if (this._observer) {
      this._observer.disconnect();
    }
  },

  // 避免频繁 setData
  // ❌ 错误：频繁小量更新
  badUpdate() {
    this.data.pollList.forEach((item, index) => {
      this.setData({ [`pollList[${index}].votes`]: item.votes + 1 });
    });
  },

  // ✅ 正确：批量更新
  goodUpdate() {
    const pollList = this.data.pollList.map(item => ({
      ...item,
      votes: item.votes + 1,
    }));
    this.setData({ pollList });
  },
});
```

### 2.3 网络优化

```js
// utils/api.js — 网络优化
class Api {
  // 请求缓存
  static _cache = new Map();

  // 带缓存的请求
  static async callWithCache(name, data, ttl = 60000) {
    const key = `${name}:${JSON.stringify(data)}`;
    const cached = this._cache.get(key);

    if (cached && Date.now() - cached.time < ttl) {
      return cached.data;
    }

    const result = await this.callFunction(name, data);
    this._cache.set(key, {
      data: result,
      time: Date.now(),
    });

    return result;
  }

  // 请求重试
  static async callWithRetry(name, data, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        return await this.callFunction(name, data);
      } catch (err) {
        if (i === retries - 1) throw err;
        await new Promise(resolve =>
          setTimeout(resolve, Math.pow(2, i) * 1000)
        );
      }
    }
  }

  // 请求队列（防止并发过多）
  static _queue = [];
  static _processing = false;

  static async callWithQueue(name, data) {
    return new Promise((resolve, reject) => {
      this._queue.push({ name, data, resolve, reject });
      this._processQueue();
    });
  }

  static async _processQueue() {
    if (this._processing || this._queue.length === 0) return;

    this._processing = true;
    const { name, data, resolve, reject } = this._queue.shift();

    try {
      const result = await this.callFunction(name, data);
      resolve(result);
    } catch (err) {
      reject(err);
    } finally {
      this._processing = false;
      this._processQueue();
    }
  }
}
```

## 三、错误监控

### 3.1 全局错误处理

```js
// app.js — 全局错误处理
App({
  onLaunch() {
    // 全局错误监听
    wx.onError((error) => {
      console.error('[Global Error]', error);
      this.reportError({
        type: 'js_error',
        message: error,
        stack: '',
      });
    });

    // 未处理的 Promise rejection
    wx.onUnhandledRejection((res) => {
      console.error('[Unhandled Rejection]', res.reason);
      this.reportError({
        type: 'promise_rejection',
        message: res.reason?.message || String(res.reason),
        stack: res.reason?.stack || '',
      });
    });

    // 页面不存在
    wx.onPageNotFound((res) => {
      console.error('[Page Not Found]', res.path);
      wx.redirectTo({ url: '/pages/index/index' });
    });
  },

  // 上报错误
  reportError(error) {
    // 可以上报到自己的服务器或使用微信的错误监控
    wx.cloud.callFunction({
      name: 'reportError',
      data: {
        ...error,
        page: getCurrentPages().pop()?.route || '',
        system: wx.getSystemInfoSync(),
        time: new Date().toISOString(),
      },
    }).catch(() => {});
  },
});
```

### 3.2 页面错误处理

```js
// 页面级别的错误处理
Page({
  async loadData() {
    try {
      util.showLoading();
      const data = await Api.getPollList();
      this.setData({ pollList: data.list });
    } catch (err) {
      // 区分错误类型
      if (err.message === '网络错误') {
        this.setData({ showError: true, errorMsg: '网络连接失败，请重试' });
      } else if (err.message === '登录过期') {
        // 重新登录
        await Auth.getOpenid();
        this.loadData();
      } else {
        util.showToast('加载失败，请重试');
      }
    } finally {
      util.hideLoading();
    }
  },
});
```

## 四、数据分析

```
关键指标监控
═══════════════════════════════════════════════════════

用户指标：
├── DAU / MAU — 日活 / 月活用户
├── 新增用户数
├── 用户留存率（次日、7日、30日）
└── 用户来源分析

功能指标：
├── 投票创建数
├── 投票参与率
├── 分享率
└── 平均投票时长

性能指标：
├── 启动耗时
├── 页面加载耗时
├── 接口响应时间
├── 错误率
└── Crash 率
```

## 五、版本管理

```
版本管理策略
═══════════════════════════════════════════════════════

语义化版本：主版本.次版本.修订号
├── 主版本 (Major) — 不兼容的 API 变更
├── 次版本 (Minor) — 向下兼容的功能新增
└── 修订号 (Patch) — 向下兼容的问题修正

灰度发布：
├── 阶段 1：内部测试（开发团队）
├── 阶段 2：小范围灰度（5% 用户）
├── 阶段 3：扩大灰度（20% 用户）
└── 阶段 4：全量发布（100% 用户）

紧急回滚：
• 发现严重 Bug 时立即回滚到上一版本
• 微信开发者工具 → 版本管理 → 回退版本
```

## 六、常见面试题

**Q1: 小程序的分包加载是什么？如何配置？**

A: 分包加载是将小程序代码分成多个包，按需下载。主包包含启动页面和公共代码，子包包含其他页面。配置 `subpackages` 字段，设置 `root` 和 `pages`。`preloadRule` 可以设置预加载规则。

**Q2: 小程序如何优化 setData 的性能？**

A: 1）减少 setData 频率，批量更新数据；2）只传递变化的字段，避免传整个对象；3）避免在滚动回调中频繁 setData；4）使用 `this.selectComponent` 直接操作组件；5）长列表使用虚拟列表。

**Q3: 云开发和自建服务器的优缺点？**

A: 云开发优点：零运维、开箱即用、免费额度、微信登录集成。缺点：受平台限制、不适合复杂业务。自建服务器优点：完全可控、技术栈自由、可扩展性强。缺点：需要运维、成本更高。
