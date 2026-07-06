---
sidebar_position: 3
title: 后端接口与数据管理
difficulty: hard
tags:
  - miniapp
  - cloud-function
  - database
  - api
---

# ⚙️ 后端接口与数据管理

> **"云函数是小程序的后端"** —— 微信云开发让前端工程师也能轻松搞定后端逻辑。

## 一、云函数架构

```
云函数设计
═══════════════════════════════════════════════════════

cloudfunctions/
├── login/                  — 用户登录
│   ├── index.js
│   └── package.json
│
├── createPoll/             — 创建投票
│   ├── index.js
│   └── package.json
│
├── getPollList/            — 获取投票列表
│   ├── index.js
│   └── package.json
│
├── getPollDetail/          — 获取投票详情
│   ├── index.js
│   └── package.json
│
├── submitVote/             — 提交投票
│   ├── index.js
│   └── package.json
│
├── getPollResult/          — 获取投票结果
│   ├── index.js
│   └── package.json
│
├── getMyPolls/             — 获取我的投票
│   ├── index.js
│   └── package.json
│
└── endPoll/                — 结束投票
    ├── index.js
    └── package.json
```

## 二、登录云函数

```js
// cloudfunctions/login/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  try {
    // 检查用户是否已注册
    const userRes = await db.collection('users').where({ _id: openid }).get();

    if (userRes.data.length === 0) {
      // 新用户，创建记录
      await db.collection('users').add({
        data: {
          _id: openid,
          nickName: '',
          avatarUrl: '',
          createdPolls: [],
          createdAt: db.serverDate(),
        },
      });
    }

    return {
      code: 0,
      data: {
        openid,
        isNewUser: userRes.data.length === 0,
      },
    };
  } catch (err) {
    return {
      code: -1,
      message: err.message,
    };
  }
};
```

## 三、创建投票云函数

```js
// cloudfunctions/createPoll/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  const { title, description, type, options, settings } = event;

  // 参数验证
  if (!title || !title.trim()) {
    return { code: -1, message: '投票标题不能为空' };
  }

  if (!options || options.length < 2) {
    return { code: -1, message: '至少需要2个选项' };
  }

  if (options.length > 10) {
    return { code: -1, message: '最多10个选项' };
  }

  // 构建选项数据
  const pollOptions = options.map((opt, index) => ({
    id: String(index + 1),
    text: opt.text.trim(),
    image: opt.image || '',
    votes: 0,
  }));

  try {
    // 创建投票
    const pollRes = await db.collection('polls').add({
      data: {
        title: title.trim(),
        description: (description || '').trim(),
        creator: openid,
        type: type || 'single',
        options: pollOptions,
        settings: {
          anonymous: settings?.anonymous || false,
          deadline: settings?.deadline || null,
          maxChoices: settings?.maxChoices || 1,
        },
        status: 'active',
        totalVotes: 0,
        createdAt: db.serverDate(),
        updatedAt: db.serverDate(),
      },
    });

    // 更新用户的创建列表
    await db.collection('users').doc(openid).update({
      data: {
        createdPolls: _.push(pollRes._id),
      },
    });

    return {
      code: 0,
      data: { pollId: pollRes._id },
    };
  } catch (err) {
    return {
      code: -1,
      message: err.message,
    };
  }
};
```

## 四、提交投票云函数

```js
// cloudfunctions/submitVote/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  const { pollId, selectedOptions } = event;

  // 参数验证
  if (!pollId || !selectedOptions || selectedOptions.length === 0) {
    return { code: -1, message: '参数错误' };
  }

  try {
    // 1. 检查投票是否存在且有效
    const pollRes = await db.collection('polls').doc(pollId).get();
    const poll = pollRes.data;

    if (!poll) {
      return { code: -1, message: '投票不存在' };
    }

    if (poll.status !== 'active') {
      return { code: -1, message: '投票已结束' };
    }

    // 检查截止时间
    if (poll.settings.deadline && new Date(poll.settings.deadline) < new Date()) {
      // 自动结束投票
      await db.collection('polls').doc(pollId).update({
        data: { status: 'ended' },
      });
      return { code: -1, message: '投票已过期' };
    }

    // 2. 检查是否已投票
    const voteRecordRes = await db.collection('vote_records')
      .where({
        pollId,
        userId: openid,
      })
      .get();

    if (voteRecordRes.data.length > 0) {
      return { code: -1, message: '您已经投过票了' };
    }

    // 3. 验证选择是否合法
    if (poll.type === 'single' && selectedOptions.length !== 1) {
      return { code: -1, message: '单选只能选择一个选项' };
    }

    if (poll.type === 'multiple') {
      const maxChoices = poll.settings.maxChoices || poll.options.length;
      if (selectedOptions.length > maxChoices) {
        return { code: -1, message: `最多选择${maxChoices}个选项` };
      }
    }

    // 验证选项 ID 是否有效
    const validOptionIds = poll.options.map(opt => opt.id);
    const invalidOptions = selectedOptions.filter(id => !validOptionIds.includes(id));
    if (invalidOptions.length > 0) {
      return { code: -1, message: '无效的选项' };
    }

    // 4. 提交投票（使用事务保证数据一致性）
    const transaction = await db.startTransaction();

    try {
      // 更新投票记录
      await transaction.collection('vote_records').add({
        data: {
          pollId,
          userId: openid,
          selectedOptions,
          votedAt: db.serverDate(),
        },
      });

      // 更新各选项的投票数
      for (const optionId of selectedOptions) {
        await transaction.collection('polls').doc(pollId).update({
          data: {
            'options': _.elemMatch(_.eq({ id: optionId }).inc({ votes: 1 })),
            'totalVotes': _.inc(1),
            'updatedAt': db.serverDate(),
          },
        });
      }

      await transaction.commit();

      return { code: 0, data: { success: true } };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    return { code: -1, message: err.message };
  }
};
```

## 五、获取投票结果

```js
// cloudfunctions/getPollResult/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  const { pollId } = event;

  try {
    // 获取投票信息
    const pollRes = await db.collection('polls').doc(pollId).get();
    const poll = pollRes.data;

    if (!poll) {
      return { code: -1, message: '投票不存在' };
    }

    // 计算百分比
    const options = poll.options.map(opt => ({
      ...opt,
      percent: poll.totalVotes > 0
        ? Math.round((opt.votes / poll.totalVotes) * 100)
        : 0,
    }));

    // 检查当前用户是否已投票
    const voteRecordRes = await db.collection('vote_records')
      .where({
        pollId,
        userId: openid,
      })
      .get();

    const hasVoted = voteRecordRes.data.length > 0;
    const myVote = hasVoted ? voteRecordRes.data[0].selectedOptions : [];

    // 是否是创建者
    const isCreator = poll.creator === openid;

    return {
      code: 0,
      data: {
        poll: {
          ...poll,
          options,
        },
        hasVoted,
        myVote,
        isCreator,
      },
    };
  } catch (err) {
    return { code: -1, message: err.message };
  }
};
```

## 六、数据库索引优化

```
数据库索引设计
═══════════════════════════════════════════════════════

polls 集合索引：
├── { status: 1, createdAt: -1 }     — 按状态和时间排序
├── { creator: 1, createdAt: -1 }    — 按创建者查询
└── { _id: 1 }                       — 主键索引（自动）

vote_records 集合索引：
├── { pollId: 1, userId: 1 }         — 唯一索引，防止重复投票
└── { userId: 1, votedAt: -1 }       — 按用户查询投票记录

users 集合索引：
└── { _id: 1 }                       — 主键索引（openid）
```

## 七、安全规则

```
数据库安全规则
═══════════════════════════════════════════════════════

polls 集合：
{
  "read": true,                      // 所有人可读
  "write": "auth.openid == doc.creator"  // 仅创建者可写
}

vote_records 集合：
{
  "read": "auth.openid == doc.userId",   // 仅自己可读
  "write": "auth.openid == doc.userId"   // 仅自己可写
}

users 集合：
{
  "read": true,                      // 所有人可读
  "write": "auth.openid == doc._id"      // 仅自己可写
}
```
