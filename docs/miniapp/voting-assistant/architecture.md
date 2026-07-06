---
sidebar_position: 1
title: 项目架构与技术选型
difficulty: medium
tags:
  - miniapp
  - architecture
  - cloud-base
---

# 🏗️ 项目架构与技术选型

> **"好的架构是项目成功的基石"** —— 合理的架构设计能让项目更易维护、更易扩展。

## 一、整体架构

```
投票助手整体架构
═══════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────┐
│                    小程序前端                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │  页面层   │  │  组件层   │  │  工具层   │          │
│  │  Pages   │  │  Comps   │  │  Utils   │          │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘          │
│       └──────────────┴──────────────┘               │
│                      │                               │
│              ┌───────▼───────┐                       │
│              │   数据层 (API) │                       │
│              └───────┬───────┘                       │
└──────────────────────┼──────────────────────────────┘
                       │ wx.cloud.callFunction
┌──────────────────────┼──────────────────────────────┐
│                微信云开发                              │
│  ┌──────────┐  ┌─────▼─────┐  ┌──────────┐         │
│  │  云函数   │  │  云数据库  │  │  云存储   │         │
│  │ Functions │  │ Database  │  │ Storage  │         │
│  └──────────┘  └───────────┘  └──────────┘         │
└─────────────────────────────────────────────────────┘
```

## 二、云开发 vs 自建服务器

```
方案对比
═══════════════════════════════════════════════════════

微信云开发                    自建服务器
──────────────                ──────────────
✅ 零运维，免服务器            ✅ 完全自主可控
✅ 开箱即用的数据库/存储       ✅ 技术栈自由选择
✅ 微信登录无缝集成            ✅ 不受云开发限制
✅ 免费额度足够个人项目        ✅ 可扩展性更强
❌ 受微信平台限制              ❌ 需要运维成本
❌ 不适合复杂业务逻辑          ❌ 需要单独处理登录

本项目选择：微信云开发
原因：投票助手是中小型项目，云开发足够满足需求，且开发效率最高。
```

## 三、云开发环境搭建

### 3.1 开通云开发

```js
// app.js — 初始化云开发
App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      return;
    }

    wx.cloud.init({
      env: 'voting-assistant-xxx', // 云开发环境 ID
      traceUser: true,             // 是否记录用户访问
    });
  },

  globalData: {
    userInfo: null,
    openid: null,
  },
});
```

### 3.2 云数据库初始化

```js
// 数据库初始化脚本（在云函数中执行）
const db = wx.cloud.database();

// 创建集合并设置权限
// polls 集合 — 所有人可读，仅创建者可写
// vote_records 集合 — 仅创建者可读写
// users 集合 — 所有人可读，仅自己可写

// 插入测试数据
async function initTestData() {
  await db.collection('polls').add({
    data: {
      title: '你最喜欢哪个前端框架？',
      description: '选择你最常用的前端框架',
      type: 'single',
      options: [
        { id: '1', text: 'React', votes: 0 },
        { id: '2', text: 'Vue', votes: 0 },
        { id: '3', text: 'Angular', votes: 0 },
        { id: '4', text: 'Svelte', votes: 0 },
      ],
      settings: {
        anonymous: false,
        deadline: null,
        maxChoices: 1,
      },
      status: 'active',
      totalVotes: 0,
      createdAt: db.serverDate(),
      updatedAt: db.serverDate(),
    },
  });
}
```

## 四、项目配置

### 4.1 app.json 配置

```json
{
  "pages": [
    "pages/index/index",
    "pages/poll-create/index",
    "pages/poll-detail/index",
    "pages/poll-result/index",
    "pages/my-polls/index",
    "pages/profile/index"
  ],
  "window": {
    "navigationBarBackgroundColor": "#07c160",
    "navigationBarTitleText": "投票助手",
    "navigationBarTextStyle": "white",
    "backgroundColor": "#f5f5f5"
  },
  "tabBar": {
    "color": "#999",
    "selectedColor": "#07c160",
    "list": [
      {
        "pagePath": "pages/index/index",
        "text": "首页",
        "iconPath": "images/tab-home.png",
        "selectedIconPath": "images/tab-home-active.png"
      },
      {
        "pagePath": "pages/my-polls/index",
        "text": "我的",
        "iconPath": "images/tab-my.png",
        "selectedIconPath": "images/tab-my-active.png"
      }
    ]
  },
  "usingComponents": {
    "van-button": "@vant/weapp/button/index",
    "van-field": "@vant/weapp/field/index",
    "van-radio": "@vant/weapp/radio/index",
    "van-radio-group": "@vant/weapp/radio-group/index",
    "van-checkbox": "@vant/weapp/checkbox/index",
    "van-checkbox-group": "@vant/weapp/checkbox-group/index",
    "van-dialog": "@vant/weapp/dialog/index",
    "van-toast": "@vant/weapp/toast/index"
  },
  "sitemapLocation": "sitemap.json",
  "cloud": true
}
```

### 4.2 全局样式

```css
/* app.wxss — 全局样式 */
page {
  --color-primary: #07c160;
  --color-primary-light: #e8f8ee;
  --color-danger: #ee0a24;
  --color-text: #333333;
  --color-text-secondary: #666666;
  --color-text-placeholder: #999999;
  --color-bg: #f5f5f5;
  --color-bg-white: #ffffff;
  --radius-sm: 8rpx;
  --radius-md: 16rpx;
  --radius-lg: 24rpx;
  --spacing-xs: 8rpx;
  --spacing-sm: 16rpx;
  --spacing-md: 24rpx;
  --spacing-lg: 32rpx;
  --spacing-xl: 48rpx;

  font-size: 28rpx;
  color: var(--color-text);
  background-color: var(--color-bg);
}

.container {
  padding: var(--spacing-lg);
}

.card {
  background: var(--color-bg-white);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.btn-primary {
  background-color: var(--color-primary);
  color: #fff;
  border-radius: var(--radius-md);
  font-size: 32rpx;
  height: 88rpx;
  line-height: 88rpx;
}
```

## 五、工具函数封装

### 5.1 API 封装

```js
// utils/api.js — 云函数调用封装
class Api {
  // 调用云函数
  static async callFunction(name, data = {}) {
    try {
      const res = await wx.cloud.callFunction({
        name,
        data,
      });
      if (res.result.code === 0) {
        return res.result.data;
      }
      throw new Error(res.result.message || '请求失败');
    } catch (err) {
      console.error(`[API] ${name} error:`, err);
      wx.showToast({ title: err.message || '网络错误', icon: 'none' });
      throw err;
    }
  }

  // 创建投票
  static createPoll(data) {
    return this.callFunction('createPoll', data);
  }

  // 获取投票列表
  static getPollList(page = 1, pageSize = 10) {
    return this.callFunction('getPollList', { page, pageSize });
  }

  // 获取投票详情
  static getPollDetail(pollId) {
    return this.callFunction('getPollDetail', { pollId });
  }

  // 提交投票
  static submitVote(pollId, selectedOptions) {
    return this.callFunction('submitVote', { pollId, selectedOptions });
  }

  // 获取投票结果
  static getPollResult(pollId) {
    return this.callFunction('getPollResult', { pollId });
  }

  // 获取我的投票
  static getMyPolls(type = 'created') {
    return this.callFunction('getMyPolls', { type });
  }

  // 结束投票
  static endPoll(pollId) {
    return this.callFunction('endPoll', { pollId });
  }

  // 删除投票
  static deletePoll(pollId) {
    return this.callFunction('deletePoll', { pollId });
  }
}

module.exports = Api;
```

### 5.2 鉴权工具

```js
// utils/auth.js — 登录鉴权
class Auth {
  // 获取用户 openid
  static async getOpenid() {
    const app = getApp();
    if (app.globalData.openid) {
      return app.globalData.openid;
    }

    try {
      const res = await wx.cloud.callFunction({ name: 'login' });
      app.globalData.openid = res.result.openid;
      return res.result.openid;
    } catch (err) {
      console.error('[Auth] getOpenid error:', err);
      throw err;
    }
  }

  // 获取用户信息（需要用户授权）
  static async getUserProfile() {
    return new Promise((resolve, reject) => {
      wx.getUserProfile({
        desc: '用于展示用户信息',
        success: (res) => resolve(res.userInfo),
        fail: (err) => reject(err),
      });
    });
  }

  // 检查登录状态
  static async checkLogin() {
    try {
      await this.getOpenid();
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = Auth;
```

### 5.3 通用工具

```js
// utils/util.js — 通用工具函数
const util = {
  // 格式化时间
  formatTime(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const hour = d.getHours().toString().padStart(2, '0');
    const minute = d.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}`;
  },

  // 相对时间
  relativeTime(date) {
    const now = Date.now();
    const diff = now - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 30) return `${days}天前`;
    return util.formatTime(date);
  },

  // 生成唯一 ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  },

  // 防抖
  debounce(fn, delay = 300) {
    let timer = null;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  // 节流
  throttle(fn, delay = 300) {
    let lastTime = 0;
    return function (...args) {
      const now = Date.now();
      if (now - lastTime >= delay) {
        lastTime = now;
        fn.apply(this, args);
      }
    };
  },

  // 显示加载
  showLoading(title = '加载中...') {
    wx.showLoading({ title, mask: true });
  },

  // 隐藏加载
  hideLoading() {
    wx.hideLoading();
  },

  // 显示提示
  showToast(title, icon = 'none') {
    wx.showToast({ title, icon, duration: 2000 });
  },
};

module.exports = util;
```
