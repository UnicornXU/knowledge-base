---
sidebar_position: 2
title: 页面与组件开发
difficulty: medium
tags:
  - miniapp
  - wxml
  - wxss
  - component
---

# 🎨 页面与组件开发

> **"组件化是小程序开发的核心思想"** —— 合理拆分组件能让代码更易维护、更易复用。

## 一、首页（投票列表）

### 1.1 页面结构

```xml
<!-- pages/index/index.wxml -->
<view class="page-index">
  <!-- 搜索栏 -->
  <view class="search-bar">
    <van-search
      value="{{keyword}}"
      placeholder="搜索投票"
      bind:change="onSearchChange"
      bind:search="onSearch"
    />
  </view>

  <!-- 投票列表（使用普通 view + 页面滚动） -->
  <view class="poll-list">
    <block wx:for="{{pollList}}" wx:key="_id">
      <poll-card
        poll="{{item}}"
        bind:tap="onPollTap"
        bind:share="onPollShare"
      />
    </block>

    <!-- 加载状态 -->
    <view class="loading-status" wx:if="{{pollList.length > 0}}">
      <van-loading wx:if="{{isLoading}}" size="24rpx">加载中...</van-loading>
      <text wx:elif="{{noMore}}">— 没有更多了 —</text>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" wx:if="{{!isLoading && pollList.length === 0}}">
      <image src="/images/empty.png" mode="aspectFit" />
      <text class="empty-title">暂无投票</text>
      <text class="empty-desc">快来创建第一个投票吧</text>
      <van-button type="primary" size="small" bind:tap="onCreateTap">
        创建投票
      </van-button>
    </view>
  </view>

  <!-- 创建按钮 -->
  <view class="fab-button" bind:tap="onCreateTap">
    <van-icon name="plus" size="24" color="#fff" />
  </view>
</view>
```

> **说明**：这里使用普通 `view` 而非 `scroll-view`，配合页面级别的 `onReachBottom` 和 `onPullDownRefresh` 实现滚动加载和下拉刷新，更符合小程序的开发习惯。

### 1.2 页面逻辑

```js
// pages/index/index.js
const Api = require('../../utils/api');
const util = require('../../utils/util');

Page({
  data: {
    pollList: [],
    keyword: '',
    page: 1,
    pageSize: 10,
    isLoading: false,
    noMore: false,
  },

  // 配置下拉刷新
  config: {
    enablePullDownRefresh: true,
  },

  onLoad() {
    this.loadPollList();
  },

  onShow() {
    // 从创建页返回时刷新
    if (this._needRefresh) {
      this._needRefresh = false;
      this.refreshList();
    }
  },

  // 页面下拉刷新（需要在 app.json 或页面 json 中开启 enablePullDownRefresh）
  onPullDownRefresh() {
    this.refreshList();
    wx.stopPullDownRefresh();
  },

  // 页面触底加载更多
  onReachBottom() {
    this.loadPollList();
  },

  // 加载投票列表
  async loadPollList() {
    if (this.data.isLoading || this.data.noMore) return;

    this.setData({ isLoading: true });

    try {
      const data = await Api.getPollList(this.data.page, this.data.pageSize);
      const newList = this.data.page === 1
        ? data.list
        : [...this.data.pollList, ...data.list];

      this.setData({
        pollList: newList,
        noMore: data.list.length < this.data.pageSize,
        page: this.data.page + 1,
      });
    } catch (err) {
      console.error('加载失败:', err);
    } finally {
      this.setData({ isLoading: false });
    }
  },

  // 刷新列表
  refreshList() {
    this.setData({ page: 1, noMore: false });
    this.loadPollList();
  },

  // 搜索
  onSearchChange(e) {
    this.setData({ keyword: e.detail });
  },

  onSearch() {
    this.refreshList();
  },

  // 点击投票卡片
  onPollTap(e) {
    const { id } = e.detail;
    wx.navigateTo({ url: `/pages/poll-detail/index?id=${id}` });
  },

  // 分享投票
  onPollShare(e) {
    const { poll } = e.detail;
    // 设置分享数据供 onShareAppMessage 使用
    this._sharePoll = poll;
  },

  // 创建投票
  onCreateTap() {
    wx.navigateTo({ url: '/pages/poll-create/index' });
  },

  // 分享配置
  onShareAppMessage() {
    if (this._sharePoll) {
      const poll = this._sharePoll;
      this._sharePoll = null;
      return {
        title: poll.title,
        path: `/pages/poll-detail/index?id=${poll._id}`,
      };
    }
    return {
      title: '投票助手 - 快速创建投票',
      path: '/pages/index/index',
    };
  },
});
```

### 1.3 页面配置

```json
// pages/index/index.json
{
  "navigationBarTitleText": "投票助手",
  "enablePullDownRefresh": true,
  "usingComponents": {
    "poll-card": "/components/poll-card/index",
    "van-search": "@vant/weapp/search/index",
    "van-button": "@vant/weapp/button/index",
    "van-icon": "@vant/weapp/icon/index",
    "van-loading": "@vant/weapp/loading/index"
  }
}
```

### 1.4 页面样式

```css
/* pages/index/index.wxss */
.page-index {
  min-height: 100vh;
  background: var(--color-bg);
  padding-bottom: 120rpx;
}

.search-bar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #fff;
  padding: 16rpx 24rpx;
}

.poll-list {
  padding: 24rpx;
}

.loading-status {
  text-align: center;
  padding: 32rpx;
  color: var(--color-text-placeholder);
  font-size: 24rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 200rpx;
}

.empty-state image {
  width: 300rpx;
  height: 300rpx;
  margin-bottom: 32rpx;
}

.empty-title {
  font-size: 32rpx;
  color: var(--color-text);
  margin-bottom: 16rpx;
}

.empty-desc {
  font-size: 26rpx;
  color: var(--color-text-placeholder);
  margin-bottom: 32rpx;
}

.fab-button {
  position: fixed;
  right: 40rpx;
  bottom: 120rpx;
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 16rpx rgba(7, 193, 96, 0.4);
}
```

## 二、创建投票页面

### 2.1 页面结构

```xml
<!-- pages/poll-create/index.wxml -->
<view class="page-create">
  <!-- 投票标题 -->
  <view class="form-section">
    <view class="section-title">投票标题</view>
    <van-field
      value="{{form.title}}"
      placeholder="请输入投票标题"
      maxlength="50"
      bind:input="onTitleInput"
      show-word-limit
    />
  </view>

  <!-- 投票描述 -->
  <view class="form-section">
    <view class="section-title">投票描述（可选）</view>
    <van-field
      value="{{form.description}}"
      placeholder="请输入投票描述"
      type="textarea"
      maxlength="200"
      bind:input="onDescInput"
      show-word-limit
    />
  </view>

  <!-- 投票类型 -->
  <view class="form-section">
    <view class="section-title">投票类型</view>
    <view class="type-selector">
      <view
        class="type-item {{form.type === 'single' ? 'active' : ''}}"
        bind:tap="onTypeChange"
        data-type="single"
      >
        <van-icon name="passed" />
        <text>单选投票</text>
      </view>
      <view
        class="type-item {{form.type === 'multiple' ? 'active' : ''}}"
        bind:tap="onTypeChange"
        data-type="multiple"
      >
        <van-icon name="records" />
        <text>多选投票</text>
      </view>
      <view
        class="type-item {{form.type === 'image' ? 'active' : ''}}"
        bind:tap="onTypeChange"
        data-type="image"
      >
        <van-icon name="photo" />
        <text>图片投票</text>
      </view>
    </view>
  </view>

  <!-- 选项列表 -->
  <view class="form-section">
    <view class="section-title">
      投票选项
      <text class="option-count">（{{form.options.length}}/10）</text>
    </view>

    <view class="option-list">
      <view
        class="option-item"
        wx:for="{{form.options}}"
        wx:key="id"
      >
        <view class="option-index">{{index + 1}}</view>

        <!-- 图片投票：上传图片 -->
        <block wx:if="{{form.type === 'image'}}">
          <view class="option-image" bind:tap="onUploadImage" data-index="{{index}}">
            <image wx:if="{{item.image}}" src="{{item.image}}" mode="aspectFill" />
            <van-icon wx:else name="photograph" size="40" color="#999" />
          </view>
        </block>

        <van-field
          value="{{item.text}}"
          placeholder="请输入选项"
          bind:input="onOptionInput"
          data-index="{{index}}"
        />

        <van-icon
          name="delete"
          color="#999"
          size="40rpx"
          bind:tap="onDeleteOption"
          data-index="{{index}}"
          wx:if="{{form.options.length > 2}}"
        />
      </view>
    </view>

    <view class="add-option" bind:tap="onAddOption" wx:if="{{form.options.length < 10}}">
      <van-icon name="plus" />
      <text>添加选项</text>
    </view>
  </view>

  <!-- 投票设置 -->
  <view class="form-section">
    <view class="section-title">投票设置</view>

    <!-- 多选最大选择数 -->
    <view class="setting-item" wx:if="{{form.type === 'multiple'}}">
      <text>最多选择</text>
      <van-stepper
        value="{{form.maxChoices}}"
        min="2"
        max="{{form.options.length}}"
        bind:change="onMaxChoicesChange"
      />
    </view>

    <!-- 截止时间 -->
    <view class="setting-item">
      <text>截止时间</text>
      <picker mode="multiSelector" bindchange="onDeadlineChange" value="{{deadlineValue}}" range="{{deadlineRange}}">
        <text class="deadline-text">
          {{form.deadline ? form.deadline : '不设置'}}
        </text>
      </picker>
    </view>

    <!-- 匿名投票 -->
    <view class="setting-item">
      <text>匿名投票</text>
      <van-switch
        checked="{{form.anonymous}}"
        bind:change="onAnonymousChange"
        size="44rpx"
      />
    </view>
  </view>

  <!-- 提交按钮 -->
  <view class="submit-area">
    <van-button type="primary" block round bind:tap="onSubmit" loading="{{isSubmitting}}">
      创建投票
    </van-button>
  </view>
</view>
```

### 2.2 页面逻辑

```js
// pages/poll-create/index.js
const Api = require('../../utils/api');
const util = require('../../utils/util');

Page({
  data: {
    form: {
      title: '',
      description: '',
      type: 'single',
      options: [
        { id: '1', text: '', image: '' },
        { id: '2', text: '', image: '' },
      ],
      maxChoices: 2,
      deadline: '',
      anonymous: false,
    },
    deadlineValue: [],
    deadlineRange: [],
    isSubmitting: false,
  },

  onLoad() {
    this.initDeadlinePicker();
  },

  // 初始化截止时间选择器
  initDeadlinePicker() {
    const now = new Date();
    const years = [now.getFullYear(), now.getFullYear() + 1];
    const months = Array.from({ length: 12 }, (_, i) => i + 1 + '月');
    const days = Array.from({ length: 31 }, (_, i) => i + 1 + '日');
    const hours = Array.from({ length: 24 }, (_, i) => i + '时');
    const minutes = ['00分', '30分'];

    this.setData({
      deadlineRange: [months, days, hours, minutes],
    });
  },

  // 标题输入
  onTitleInput(e) {
    this.setData({ 'form.title': e.detail });
  },

  // 描述输入
  onDescInput(e) {
    this.setData({ 'form.description': e.detail });
  },

  // 类型切换
  onTypeChange(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ 'form.type': type });
  },

  // 选项输入
  onOptionInput(e) {
    const { index } = e.currentTarget.dataset;
    this.setData({
      [`form.options[${index}].text`]: e.detail,
    });
  },

  // 上传图片
  async onUploadImage(e) {
    const { index } = e.currentTarget.dataset;
    try {
      const res = await wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sizeType: ['compressed'],
      });

      const filePath = res.tempFiles[0].tempFilePath;
      util.showLoading('上传中...');

      // 上传到云存储
      const cloudRes = await wx.cloud.uploadFile({
        cloudPath: `poll-images/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`,
        filePath,
      });

      this.setData({
        [`form.options[${index}].image`]: cloudRes.fileID,
      });
    } catch (err) {
      if (err.errMsg !== 'chooseMedia:fail cancel') {
        util.showToast('上传失败');
      }
    } finally {
      util.hideLoading();
    }
  },

  // 添加选项
  onAddOption() {
    const options = this.data.form.options;
    if (options.length >= 10) {
      util.showToast('最多10个选项');
      return;
    }
    options.push({
      id: util.generateId(),
      text: '',
      image: '',
    });
    this.setData({ 'form.options': options });
  },

  // 删除选项
  onDeleteOption(e) {
    const { index } = e.currentTarget.dataset;
    const options = this.data.form.options;
    if (options.length <= 2) {
      util.showToast('至少需要2个选项');
      return;
    }
    options.splice(index, 1);
    this.setData({ 'form.options': options });
  },

  // 截止时间变更
  onDeadlineChange(e) {
    const [monthIdx, dayIdx, hourIdx, minuteIdx] = e.detail.value;
    const now = new Date();
    const deadline = new Date(
      now.getFullYear(),
      monthIdx,
      dayIdx + 1,
      hourIdx,
      minuteIdx * 30
    );

    if (deadline <= now) {
      util.showToast('截止时间不能早于当前时间');
      return;
    }

    this.setData({
      'form.deadline': util.formatTime(deadline),
      deadlineValue: e.detail.value,
    });
  },

  // 匿名投票变更
  onAnonymousChange(e) {
    this.setData({ 'form.anonymous': e.detail });
  },

  // 提交表单
  async onSubmit() {
    const { form } = this.data;

    // 表单验证
    if (!form.title.trim()) {
      util.showToast('请输入投票标题');
      return;
    }

    const validOptions = form.options.filter(opt => opt.text.trim());
    if (validOptions.length < 2) {
      util.showToast('至少需要2个有效选项');
      return;
    }

    this.setData({ isSubmitting: true });

    try {
      await Api.createPoll({
        ...form,
        options: validOptions,
      });

      util.showToast('创建成功', 'success');

      // 标记需要刷新列表
      const pages = getCurrentPages();
      if (pages.length > 1) {
        pages[pages.length - 2]._needRefresh = true;
      }

      setTimeout(() => wx.navigateBack(), 1500);
    } catch (err) {
      util.showToast('创建失败');
    } finally {
      this.setData({ isSubmitting: false });
    }
  },
});
```

## 三、投票卡片组件

### 3.1 组件结构

```xml
<!-- components/poll-card/index.wxml -->
<view class="poll-card" bind:tap="onTap">
  <!-- 头部：标题 + 状态 -->
  <view class="card-header">
    <view class="card-title">{{poll.title}}</view>
    <view class="card-status {{poll.status}}">
      {{poll.status === 'active' ? '进行中' : '已结束'}}
    </view>
  </view>

  <!-- 描述 -->
  <view class="card-desc" wx:if="{{poll.description}}">
    {{poll.description}}
  </view>

  <!-- 选项预览 -->
  <view class="card-options">
    <view
      class="option-preview"
      wx:for="{{poll.options}}"
      wx:key="id"
      wx:if="{{index < 3}}"
    >
      <view class="option-text">{{item.text}}</view>
      <view class="option-bar">
        <view
          class="option-bar-fill"
          style="width: {{poll.totalVotes > 0 ? (item.votes / poll.totalVotes * 100) : 0}}%"
        />
      </view>
      <view class="option-percent">
        {{poll.totalVotes > 0 ? Math.round(item.votes / poll.totalVotes * 100) : 0}}%
      </view>
    </view>
    <view class="more-options" wx:if="{{poll.options.length > 3}}">
      还有 {{poll.options.length - 3}} 个选项...
    </view>
  </view>

  <!-- 底部信息 -->
  <view class="card-footer">
    <view class="footer-left">
      <text class="vote-count">{{poll.totalVotes}} 人参与</text>
      <text class="time">{{relativeTime}}</text>
    </view>
    <view class="footer-right" catch:tap="onShare">
      <van-icon name="share" size="36rpx" color="#999" />
    </view>
  </view>
</view>
```

### 3.2 组件逻辑

```js
// components/poll-card/index.js
const util = require('../../utils/util');

Component({
  properties: {
    poll: {
      type: Object,
      value: {},
    },
  },

  data: {
    relativeTime: '',
  },

  lifetimes: {
    attached() {
      this.updateRelativeTime();
    },
  },

  observers: {
    'poll.createdAt'(val) {
      if (val) this.updateRelativeTime();
    },
  },

  methods: {
    updateRelativeTime() {
      this.setData({
        relativeTime: util.relativeTime(this.data.poll.createdAt),
      });
    },

    onTap() {
      this.triggerEvent('tap', { id: this.data.poll._id });
    },

    onShare() {
      this.triggerEvent('share', { poll: this.data.poll });
    },
  },
});
```

### 3.3 组件样式

```css
/* components/poll-card/index.wxss */
.poll-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16rpx;
}

.card-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  flex: 1;
  margin-right: 16rpx;
}

.card-status {
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
  flex-shrink: 0;
}

.card-status.active {
  background: #e8f8ee;
  color: #07c160;
}

.card-status.ended {
  background: #f5f5f5;
  color: #999;
}

.card-desc {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 24rpx;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.card-options {
  margin-bottom: 24rpx;
}

.option-preview {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.option-text {
  width: 150rpx;
  font-size: 26rpx;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.option-bar {
  flex: 1;
  height: 24rpx;
  background: #f0f0f0;
  border-radius: 12rpx;
  margin: 0 16rpx;
  overflow: hidden;
}

.option-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #07c160, #10b981);
  border-radius: 12rpx;
  transition: width 0.3s ease;
}

.option-percent {
  width: 80rpx;
  text-align: right;
  font-size: 24rpx;
  color: #666;
}

.more-options {
  font-size: 24rpx;
  color: #999;
  text-align: center;
  padding: 8rpx 0;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16rpx;
  border-top: 1rpx solid #f0f0f0;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.vote-count {
  font-size: 24rpx;
  color: #07c160;
}

.time {
  font-size: 24rpx;
  color: #999;
}
```

## 四、结果图表组件

```xml
<!-- components/result-chart/index.wxml -->
<view class="result-chart">
  <canvas
    canvas-id="resultCanvas"
    id="resultCanvas"
    class="chart-canvas"
    style="width: {{canvasWidth}}px; height: {{canvasHeight}}px;"
  />

  <!-- 图例 -->
  <view class="chart-legend">
    <view
      class="legend-item"
      wx:for="{{options}}"
      wx:key="id"
    >
      <view class="legend-color" style="background: {{colors[index]}}" />
      <text class="legend-text">{{item.text}}</text>
      <text class="legend-value">{{item.votes}}票 ({{item.percent}}%)</text>
    </view>
  </view>
</view>
```

```js
// components/result-chart/index.js
Component({
  properties: {
    options: {
      type: Array,
      value: [],
    },
    totalVotes: {
      type: Number,
      value: 0,
    },
  },

  data: {
    colors: ['#07c160', '#1989fa', '#ff976a', '#ed4014', '#fadb14', '#722ed1'],
    canvasWidth: 300,
    canvasHeight: 300,
  },

  lifetimes: {
    ready() {
      this.drawChart();
    },
  },

  observers: {
    options() {
      this.drawChart();
    },
  },

  methods: {
    drawChart() {
      const { options, totalVotes, colors } = this.data;
      if (!options.length || totalVotes === 0) return;

      const ctx = wx.createCanvasContext('resultCanvas', this);
      const centerX = 150;
      const centerY = 150;
      const radius = 120;

      let startAngle = -Math.PI / 2; // 从顶部开始

      options.forEach((opt, index) => {
        const percent = opt.votes / totalVotes;
        const sweepAngle = percent * 2 * Math.PI;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + sweepAngle);
        ctx.setFillStyle(colors[index % colors.length]);
        ctx.fill();

        startAngle += sweepAngle;
      });

      // 中心白色圆（环形图效果）
      ctx.beginPath();
      ctx.arc(centerX, centerY, 60, 0, 2 * Math.PI);
      ctx.setFillStyle('#ffffff');
      ctx.fill();

      // 中心文字
      ctx.setFillStyle('#333');
      ctx.setFontSize(24);
      ctx.setTextAlign('center');
      ctx.fillText(totalVotes.toString(), centerX, centerY - 5);
      ctx.setFontSize(14);
      ctx.setFillStyle('#999');
      ctx.fillText('总票数', centerX, centerY + 18);

      ctx.draw();
    },
  },
});
```
