---
sidebar_position: 0
title: 投票助手 - 项目概述
difficulty: medium
tags:
  - miniapp
  - weapp
  - project
  - voting
---

# 🗳️ 投票助手 — 项目概述

> **"投票助手是一个典型的小程序全栈项目"** —— 覆盖小程序开发的核心知识点，适合用来学习完整的小程序开发流程。

## 一、项目简介

```
投票助手 — 功能概览
═══════════════════════════════════════════════════════

用户端功能：
├── 🔐 微信登录（一键授权）
├── 📊 创建投票（单选/多选/图片投票）
├── 🗳️ 参与投票（防重复投票）
├── 📈 查看结果（实时统计、图表展示）
├── 🔗 分享投票（转发、海报生成）
└── 📋 我的投票（创建的 + 参与的）

管理端功能：
├── 🚫 投票管理（结束/删除投票）
├── 📊 数据导出（Excel 导出）
└── 🔔 消息通知（投票提醒）

技术亮点：
├── 微信登录 + Token 鉴权
├── 云数据库实时同步
├── 图片上传 + CDN 加速
├── 分享海报 Canvas 绘制
├── 防重复投票机制
└── 实时数据统计
```

## 二、需求分析

### 2.1 核心用户故事

```
用户故事（User Stories）
═══════════════════════════════════════════════════════

作为用户，我想要：
US1: 快速创建一个投票，设置标题、选项、截止时间
US2: 分享投票给朋友或群聊
US3: 参与他人创建的投票
US4: 查看投票的实时结果
US5: 防止同一用户重复投票
US6: 生成投票海报分享到朋友圈
US7: 管理我创建的投票

优先级排序：
P0（必须有）：US1, US2, US3, US4, US5
P1（应该有）：US6, US7
P2（可以有）：数据导出、消息通知
```

### 2.2 数据模型设计

```
数据模型
═══════════════════════════════════════════════════════

投票表 (polls)
├── _id              — 唯一标识
├── title            — 投票标题
├── description      — 投票描述
├── creator          — 创建者 ID
├── type             — 投票类型 (single/multiple/image)
├── options[]        — 选项数组
│   ├── id           — 选项 ID
│   ├── text         — 选项文本
│   ├── image        — 选项图片（可选）
│   └── votes        — 投票数
├── settings         — 投票设置
│   ├── anonymous    — 是否匿名
│   ├── deadline     — 截止时间
│   └── maxChoices   — 最大选择数（多选）
├── status           — 状态 (active/ended)
├── totalVotes       — 总投票数
├── createdAt        — 创建时间
└── updatedAt        — 更新时间

投票记录表 (vote_records)
├── _id              — 唯一标识
├── pollId           — 投票 ID
├── userId           — 用户 ID
├── selectedOptions  — 选择的选项 ID 数组
└── votedAt          — 投票时间

用户表 (users)
├── _id              — 唯一标识（微信 openid）
├── nickName         — 昵称
├── avatarUrl        — 头像
├── createdPolls[]   — 创建的投票 ID
└── createdAt        — 注册时间
```

## 三、页面结构

```
页面结构设计
═══════════════════════════════════════════════════════

pages/
├── index/              — 首页（投票列表）
│   └── index.wxml
│
├── poll-create/        — 创建投票
│   └── index.wxml
│
├── poll-detail/        — 投票详情
│   └── index.wxml
│
├── poll-result/        — 投票结果
│   └── index.wxml
│
├── my-polls/           — 我的投票
│   └── index.wxml
│
└── profile/            — 个人中心
    └── index.wxml

components/
├── poll-card/          — 投票卡片组件
├── option-item/        — 选项组件
├── result-chart/       — 结果图表组件
├── share-poster/       — 分享海报组件
└── loading/            — 加载组件
```

## 四、技术选型

| 层级 | 技术方案 | 说明 |
|------|----------|------|
| 前端框架 | 微信小程序原生 | 性能最好，无额外依赖 |
| UI 组件 | Vant Weapp | 丰富的小程序 UI 组件库 |
| 状态管理 | 全局 AppData + 事件总线 | 轻量方案，适合中小型项目 |
| 后端服务 | 微信云开发 | 免服务器，开箱即用 |
| 数据库 | 云数据库（MongoDB） | 文档型数据库，灵活 |
| 文件存储 | 云存储 | 图片上传、CDN 加速 |
| 图表 | wx-charts | 轻量级小程序图表库 |
| 海报生成 | Canvas API | 原生 Canvas 绘制海报 |

## 五、项目结构

```
voting-assistant/
├── cloudfunctions/          — 云函数
│   ├── login/               — 登录函数
│   ├── createPoll/          — 创建投票
│   ├── submitVote/          — 提交投票
│   └── getPollResult/       — 获取结果
│
├── miniprogram/             — 小程序前端
│   ├── pages/               — 页面
│   │   ├── index/
│   │   ├── poll-create/
│   │   ├── poll-detail/
│   │   ├── poll-result/
│   │   ├── my-polls/
│   │   └── profile/
│   │
│   ├── components/          — 自定义组件
│   │   ├── poll-card/
│   │   ├── option-item/
│   │   └── result-chart/
│   │
│   ├── utils/               — 工具函数
│   │   ├── api.js           — 接口封装
│   │   ├── auth.js          — 登录鉴权
│   │   └── util.js          — 通用工具
│   │
│   ├── app.js               — 应用入口
│   ├── app.json              — 应用配置
│   └── app.wxss              — 全局样式
│
├── project.config.json      — 项目配置
└── README.md
```

## 六、开发计划

```
开发计划（建议 2-3 周）
═══════════════════════════════════════════════════════

第 1 周：基础功能
├── Day 1-2: 项目初始化、云开发环境搭建
├── Day 3-4: 微信登录、用户模块
└── Day 5-7: 创建投票、投票详情页面

第 2 周：核心功能
├── Day 8-9:  投票提交、防重复投票
├── Day 10-11: 投票结果、图表展示
└── Day 12-14: 分享功能、海报生成

第 3 周：完善与上线
├── Day 15-16: 我的投票、投票管理
├── Day 17-18: 性能优化、异常处理
└── Day 19-21: 测试、修复、提交审核
```
