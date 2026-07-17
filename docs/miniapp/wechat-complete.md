---
sidebar_position: 3
title: "微信小程序完整指南"
difficulty: "medium"
tags: ["小程序", "微信", "组件", "生命周期"]
---

# 微信小程序完整指南

## 项目结构详解

### 基础目录结构

```
├── app.js              # 小程序入口逻辑
├── app.json            # 全局配置
├── app.wxss            # 全局样式
├── project.config.json # 项目配置
├── sitemap.json        # 搜索收录配置
├── pages/
│   ├── index/
│   │   ├── index.js    # 页面逻辑
│   │   ├── index.json  # 页面配置
│   │   ├── index.wxml  # 页面结构
│   │   └── index.wxss  # 页面样式
│   └── logs/
├── components/         # 自定义组件
├── utils/              # 工具函数
└── miniprogram_npm/    # npm 构建产物
```

### 全局配置 vs 页面配置

| 配置项 | 全局(app.json) | 页面(page.json) | 说明 |
|--------|---------------|----------------|------|
| navigationBarTitleText | ✅ | ✅ | 页面级覆盖全局 |
| navigationBarBackgroundColor | ✅ | ✅ | 导航栏背景色 |
| enablePullDownRefresh | ✅ | ✅ | 下拉刷新 |
| usingComponents | ✅ | ✅ | 全局注册vs局部注册 |
| pages | ✅ | ❌ | 仅全局配置 |
| tabBar | ✅ | ❌ | 仅全局配置 |
| window | ✅ | ❌ | 页面直接写属性 |

```json
// app.json 核心配置
{
  "pages": ["pages/index/index", "pages/logs/logs"],
  "window": {
    "navigationBarTitleText": "我的应用",
    "navigationBarBackgroundColor": "#ffffff",
    "backgroundColor": "#eeeeee"
  },
  "tabBar": {
    "list": [
      { "pagePath": "pages/index/index", "text": "首页", "iconPath": "...", "selectedIconPath": "..." }
    ]
  },
  "permission": {
    "scope.userLocation": { "desc": "用于定位服务" }
  }
}
```

## 生命周期完整图谱

### App 级生命周期

```javascript
App({
  onLaunch(options) {
    // 小程序初始化（全局只触发一次）
    console.log('启动参数:', options.scene, options.query);
  },
  onShow(options) {
    // 从后台切换到前台
  },
  onHide() {
    // 从前台切换到后台
  },
  onError(msg) {
    // 全局错误捕获
    reportError(msg);
  },
  onUnhandledRejection({ reason, promise }) {
    // 未处理的 Promise reject
  }
});
```

### Page 级生命周期

```javascript
Page({
  onLoad(query) {     // 页面创建时（一次），接收路由参数
  },
  onShow() {          // 页面出现在前台时
  },
  onReady() {         // 页面首次渲染完成（一次）
  },
  onHide() {          // 页面隐藏（如 navigateTo 跳走）
  },
  onUnload() {        // 页面销毁（如 navigateBack）
  }
});
```

### Component 级生命周期

```javascript
Component({
  lifetimes: {
    created() {       // 组件实例创建，不能调用 setData
    },
    attached() {      // 组件进入页面节点树（最常用）
    },
    ready() {         // 组件渲染完成
    },
    detached() {      // 组件从页面节点树移除
    }
  },
  pageLifetimes: {
    show() {          // 所在页面展示
    },
    hide() {          // 所在页面隐藏
    },
    resize(size) {    // 所在页面尺寸变化
    }
  }
});
```

:::tip 执行顺序
App.onLaunch → App.onShow → Page.onLoad → Page.onShow → Component.created → Component.attached → Page.onReady → Component.ready
:::

## 组件通信方式对比

| 方式 | 方向 | 适用场景 | 性能 | 耦合度 |
|------|------|---------|------|--------|
| properties | 父→子 | 数据传递 | ⭐⭐⭐ | 低 |
| triggerEvent | 子→父 | 事件通知 | ⭐⭐⭐ | 低 |
| selectComponent | 父→子 | 调用子方法 | ⭐⭐ | 中 |
| 全局事件总线 | 任意 | 跨组件通信 | ⭐⭐ | 高 |
| 状态管理(mobx) | 任意 | 复杂状态共享 | ⭐⭐ | 中 |
| relations | 父↔子 | 组件关系声明 | ⭐⭐⭐ | 低 |

```javascript
// 子组件触发事件
this.triggerEvent('itemclick', { id: this.data.itemId }, { bubbles: true });

// 父组件获取子组件实例
const child = this.selectComponent('#my-component');
child.doSomething();
```

## WXS 脚本

### 什么是 WXS

WXS（WeiXin Script）是运行在视图层的脚本语言，能够在 WXML 中直接执行逻辑，避免数据传输开销。

### WXS vs JavaScript

| 对比项 | WXS | JavaScript |
|--------|-----|-----------|
| 运行环境 | 视图层（WebView） | 逻辑层（JSCore） |
| 能否调用 wx API | ❌ | ✅ |
| 性能（频繁交互） | 高（无通信开销） | 低（需跨线程） |
| ES6 支持 | ❌ 仅 ES5 | ✅ |
| 典型场景 | 数据格式化、动画响应 | 业务逻辑 |

```html
<!-- WXS 使用示例：价格格式化 -->
<wxs module="filters">
  var formatPrice = function(price) {
    return (price / 100).toFixed(2);
  }
  module.exports = { formatPrice: formatPrice };
</wxs>

<view>价格: ¥{{filters.formatPrice(item.price)}}</view>
```

:::info WXS 最佳使用场景
- 列表数据格式化（时间、价格、状态文本）
- 手势动画响应（拖拽、滑动）
- 复杂条件渲染逻辑
:::

## 自定义组件进阶

### Behaviors 混入

```javascript
// behaviors/pagination.js
module.exports = Behavior({
  data: { list: [], page: 1, hasMore: true },
  methods: {
    loadMore() {
      if (!this.data.hasMore) return;
      this.setData({ page: this.data.page + 1 });
      this.fetchData();
    }
  }
});

// 组件中使用
const pagination = require('../../behaviors/pagination');
Component({
  behaviors: [pagination],
  methods: {
    fetchData() { /* 具体请求逻辑 */ }
  }
});
```

### 抽象节点

```json
{
  "componentGenerics": {
    "selectable": { "default": "path/to/default" }
  }
}
```

```html
<!-- 使用时动态指定实现 -->
<generic-list generic:selectable="custom-checkbox" />
```

### 组件关系 (relations)

```javascript
// 父组件
Component({
  relations: {
    './tab-item': { type: 'child', linked(target) { this._updateTabs(); } }
  }
});
// 子组件
Component({
  relations: {
    './tabs': { type: 'parent' }
  }
});
```

## 分包加载

### 分包配置

```json
{
  "pages": ["pages/index/index"],
  "subpackages": [
    { "root": "packageA", "pages": ["pages/cat/cat"] },
    { "root": "packageB", "pages": ["pages/dog/dog"], "independent": true }
  ],
  "preloadRule": {
    "pages/index/index": {
      "network": "all",
      "packages": ["packageA"]
    }
  }
}
```

| 分包类型 | 特点 | 限制 |
|---------|------|------|
| 普通分包 | 依赖主包 | 不能使用主包外的资源 |
| 独立分包 | 可独立运行 | 不能依赖主包和其他包 |
| 分包预下载 | 进入某页面时预下载 | 同网络下预下载上限2MB |

:::warning 包体积限制
- 整个小程序所有分包大小不超过 **20MB**
- 单个分包/主包不超过 **2MB**
- 主包应只保留 tabBar 页面和公共资源
:::

### 分包异步化

```javascript
// 跨分包引用组件（异步）
{
  "usingComponents": {
    "list": "packageA/components/list/list"  
  },
  "componentPlaceholder": {
    "list": "view"  // 加载前的占位
  }
}
```

## 常见坑与解决方案

### setData 性能优化

```javascript
// ❌ 错误：频繁全量更新
this.setData({ list: this.data.list });

// ✅ 正确：路径更新
this.setData({ [`list[${index}].checked`]: true });

// ✅ 正确：合并更新
this.setData({
  'userInfo.name': 'Tom',
  'userInfo.age': 25,
  loading: false
});
```

### 页面栈限制

```javascript
// 页面栈最多10层，超出后 navigateTo 静默失败
// 解决方案：适时使用 redirectTo 或 reLaunch
const pages = getCurrentPages();
if (pages.length >= 9) {
  wx.redirectTo({ url: '/pages/detail/detail' });
} else {
  wx.navigateTo({ url: '/pages/detail/detail' });
}
```

### 样式隔离

```javascript
Component({
  options: {
    styleIsolation: 'isolated',        // 默认隔离
    // styleIsolation: 'apply-shared', // 接受外部样式
    // styleIsolation: 'shared',       // 双向共享（慎用）
  }
});
```

## 面试高频题

:::info 面试题1：小程序的双线程模型是什么？有什么优缺点？
**答**：小程序采用渲染线程（WebView）与逻辑线程（JSCore）分离的架构。优点：安全性高（逻辑层无法操作DOM）、渲染不阻塞逻辑。缺点：线程间通信有延迟，setData 是异步序列化传输，频繁通信会造成性能问题。
:::

:::info 面试题2：setData 的工作原理及性能优化手段？
**答**：setData 将数据从逻辑层序列化后通过 native bridge 传输到视图层，触发 diff 和渲染更新。优化手段：① 减少调用频率（合并更新）；② 减少数据量（路径更新）；③ 避免传输未使用的数据；④ 大列表使用虚拟列表。
:::

:::info 面试题3：小程序的登录流程是怎样的？
**答**：① wx.login() 获取临时 code → ② 发送 code 到开发者服务器 → ③ 服务器用 code + appid + secret 请求微信接口换取 session_key 和 openid → ④ 服务器生成自定义登录态返回前端 → ⑤ 前端存储登录态用于后续请求。
:::

:::info 面试题4：分包加载的原理和最佳实践？
**答**：分包原理是将小程序代码按功能模块拆分成多个包，启动时只下载主包，进入对应功能时按需下载分包。最佳实践：① 主包只放 tabBar 和公共依赖；② 合理配置预下载规则；③ 使用独立分包实现活动页等独立场景；④ 利用分包异步化减少包间依赖。
:::

:::info 面试题5：Component 和 Page 的区别与联系？
**答**：Page 本质是特殊的 Component。区别：Page 有路由参数(onLoad接收query)、页面生命周期(onShow/onHide)、页面事件(onPullDownRefresh)；Component 有 properties/methods/observers/relations。自基础库 2.9.2 起，可以用 Component 构造器构造页面。
:::

:::info 面试题6：如何实现小程序的状态管理？
**答**：方案有：① globalData（简单场景）；② 事件总线（轻量通信）；③ mobx-miniprogram（响应式状态管理）；④ 自实现 Store（基于 observers 或 watch）。推荐复杂应用使用 mobx-miniprogram-bindings，它提供 storeBindingsBehavior 实现组件级数据绑定。
:::
