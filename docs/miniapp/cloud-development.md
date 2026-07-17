---
sidebar_position: 6
title: '小程序云开发实战'
difficulty: 'medium'
tags: ['小程序', '云开发', 'Serverless', '云函数']
---

# 小程序云开发实战

## 云开发概述

### 云开发 vs 传统后端开发

| 对比维度   | 云开发                 | 传统后端                |
| ---------- | ---------------------- | ----------------------- |
| 服务器管理 | 无需管理               | 需购买/运维             |
| 数据库     | 文档型（NoSQL）        | 自选（MySQL/MongoDB等） |
| 部署方式   | 自动部署               | 手动或CI/CD             |
| 扩缩容     | 自动弹性               | 手动配置                |
| 域名/备案  | 无需                   | 必须                    |
| 鉴权       | 内置用户身份           | 自建鉴权体系            |
| 成本       | 按量付费（有免费额度） | 固定+按量               |
| 适合团队   | 前端团队/小团队        | 全栈团队                |
| 局限性     | 平台绑定、定制性有限   | 高度灵活                |

### 适用场景

- 快速原型验证 / MVP 产品
- 前端工程师独立开发
- 中小型应用（日活10万以下）
- 内容型应用（博客、社区、小工具）

:::warning 不适合场景

- 高并发实时系统（游戏、直播）
- 需要复杂关系型查询的业务
- 已有成熟后端架构的项目
- 对数据隐私要求极高的金融系统
  :::

## 云函数

### 创建与部署

```javascript
// cloudfunctions/getUser/index.js
const cloud = require('wx-server-sdk');
cloud.init({env: cloud.DYNAMIC_CURRENT_ENV});

exports.main = async (event, context) => {
  const {OPENID, APPID} = cloud.getWXContext();

  const db = cloud.database();
  const user = await db.collection('users').where({openid: OPENID}).get();

  return {
    code: 0,
    data: user.data[0] || null,
    openid: OPENID,
  };
};
```

### 前端调用

```javascript
// 初始化云开发
wx.cloud.init({env: 'my-env-id', traceUser: true});

// 调用云函数
async function getUser() {
  try {
    const res = await wx.cloud.callFunction({name: 'getUser'});
    console.log('用户数据:', res.result.data);
    return res.result;
  } catch (err) {
    console.error('云函数调用失败:', err);
    throw err;
  }
}
```

### 定时触发器

```json
// cloudfunctions/dailyTask/config.json
{
  "triggers": [
    {
      "name": "dailyCleanup",
      "type": "timer",
      "config": "0 0 2 * * * *"
    }
  ]
}
```

```javascript
// cloudfunctions/dailyTask/index.js
exports.main = async (event, context) => {
  const db = cloud.database();
  const _ = db.command;

  // 清理30天前的临时数据
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const result = await db
    .collection('temp_data')
    .where({createdAt: _.lt(thirtyDaysAgo)})
    .remove();

  return {removed: result.stats.removed};
};
```

### 错误处理最佳实践

```javascript
exports.main = async (event, context) => {
  try {
    // 参数校验
    const {orderId, amount} = event;
    if (!orderId || !amount) {
      return {code: 400, message: '参数缺失'};
    }

    // 业务逻辑
    const result = await processOrder(orderId, amount);
    return {code: 0, data: result};
  } catch (err) {
    console.error('云函数异常:', err);

    // 区分错误类型
    if (err.errCode === -502001) {
      return {code: 500, message: '数据库操作失败'};
    }
    return {code: 500, message: '服务器内部错误'};
  }
};
```

## 云数据库

### 数据类型

| 类型     | 说明     | 示例                  |
| -------- | -------- | --------------------- |
| String   | 字符串   | "hello"               |
| Number   | 数字     | 42, 3.14              |
| Boolean  | 布尔值   | true                  |
| Object   | 对象     | { name: "Tom" }       |
| Array    | 数组     | [1, 2, 3]             |
| Date     | 日期     | new Date()            |
| GeoPoint | 地理位置 | db.Geo.Point(113, 23) |
| Null     | 空值     | null                  |

### CRUD 操作

```javascript
const db = cloud.database();
const todos = db.collection('todos');

// Create - 新增
const addResult = await todos.add({
  data: {
    title: '学习云开发',
    done: false,
    tags: ['学习', '技术'],
    createdAt: db.serverDate(),
    _openid: OPENID, // 自动鉴权
  },
});

// Read - 查询
const queryResult = await todos
  .where({done: false})
  .orderBy('createdAt', 'desc')
  .skip(0)
  .limit(20)
  .field({title: true, done: true, createdAt: true})
  .get();

// Update - 更新
await todos.doc('doc-id').update({
  data: {done: true, updatedAt: db.serverDate()},
});

// Delete - 删除
await todos.doc('doc-id').remove();
```

### Where 条件查询

```javascript
const _ = db.command;

// 比较操作
const result = await db
  .collection('products')
  .where({
    price: _.gt(100).and(_.lt(500)), // 100 < price < 500
    category: _.in(['电子', '图书']),
    stock: _.neq(0),
    tags: _.all(['热销', '新品']), // 数组同时包含
  })
  .get();

// 正则匹配
const searchResult = await db
  .collection('articles')
  .where({
    title: db.RegExp({regexp: keyword, options: 'i'}),
  })
  .get();
```

### 聚合查询 Pipeline

```javascript
const $ = db.command.aggregate;

const result = await db
  .collection('orders')
  .aggregate()
  .match({status: 'paid'})
  .group({
    _id: '$category',
    totalAmount: $.sum('$amount'),
    count: $.sum(1),
    avgAmount: $.avg('$amount'),
  })
  .sort({totalAmount: -1})
  .limit(10)
  .end();

// 结果：[{ _id: '电子产品', totalAmount: 50000, count: 120, avgAmount: 416.7 }, ...]
```

### 权限规则

| 权限                     | 说明     | 适用场景  |
| ------------------------ | -------- | --------- |
| 仅创建者可写，所有人可读 | 默认规则 | 公开内容  |
| 仅创建者可读写           | 私密数据 | 用户日记  |
| 仅管理端可写，所有人可读 | 系统配置 | 公告/配置 |
| 仅管理端可读写           | 敏感数据 | 管理后台  |

```json
// 自定义安全规则（database/collection.rule）
{
  "read": "auth.openid == doc._openid || doc.isPublic == true",
  "write": "auth.openid == doc._openid"
}
```

## 云存储

### 文件操作

```javascript
// 上传文件
async function uploadImage(filePath) {
  const cloudPath = `images/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

  const res = await wx.cloud.uploadFile({
    cloudPath,
    filePath,
  });
  return res.fileID; // cloud://env-id.xxxx/images/xxx.jpg
}

// 获取临时链接（有效期2小时）
const {fileList} = await wx.cloud.getTempFileURL({
  fileList: ['cloud://env-id.xxxx/images/1.jpg'],
});
const tempUrl = fileList[0].tempFileURL;

// 删除文件
await wx.cloud.deleteFile({
  fileList: ['cloud://env-id.xxxx/images/old.jpg'],
});
```

### 实际使用示例

```javascript
// 头像上传完整流程
Page({
  async chooseAndUpload() {
    const {tempFilePaths} = await wx.chooseImage({count: 1, sizeType: ['compressed']});

    wx.showLoading({title: '上传中...'});
    try {
      const fileID = await uploadImage(tempFilePaths[0]);

      // 更新用户头像记录
      await wx.cloud.callFunction({
        name: 'updateUser',
        data: {avatar: fileID},
      });

      this.setData({avatar: fileID});
      wx.showToast({title: '上传成功'});
    } catch (err) {
      wx.showToast({title: '上传失败', icon: 'error'});
    } finally {
      wx.hideLoading();
    }
  },
});
```

## 云调用（直接调用微信开放接口）

### 订阅消息

```javascript
// cloudfunctions/sendMessage/index.js
const cloud = require('wx-server-sdk');
cloud.init();

exports.main = async (event) => {
  const {toUser, templateId, data, page} = event;

  const result = await cloud.openapi.subscribeMessage.send({
    touser: toUser,
    templateId,
    page,
    data: {
      thing1: {value: data.title},
      time2: {value: data.time},
      thing3: {value: data.remark},
    },
  });

  return result;
};
```

### 生成小程序码

```javascript
// cloudfunctions/genQRCode/index.js
exports.main = async (event) => {
  const result = await cloud.openapi.wxacode.getUnlimited({
    scene: event.scene, // 最多32字符
    page: event.page,
    width: 280,
    autoColor: false,
    lineColor: {r: 0, g: 0, b: 0},
  });

  // 将 buffer 上传到云存储
  const upload = await cloud.uploadFile({
    cloudPath: `qrcode/${event.scene}.png`,
    fileContent: result.buffer,
  });

  return {fileID: upload.fileID};
};
```

## 实战案例：云开发用户系统

```javascript
// cloudfunctions/userService/index.js
const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();
const users = db.collection('users');

exports.main = async (event) => {
  const {action, data} = event;
  const {OPENID} = cloud.getWXContext();

  switch (action) {
    case 'register':
      return register(OPENID, data);
    case 'login':
      return login(OPENID);
    case 'update':
      return updateProfile(OPENID, data);
    default:
      return {code: 400, message: '未知操作'};
  }
};

async function register(openid, data) {
  const existing = await users.where({openid}).count();
  if (existing.total > 0) return {code: 409, message: '用户已存在'};

  await users.add({
    data: {
      openid,
      nickName: data.nickName,
      avatar: data.avatar,
      role: 'user',
      createdAt: db.serverDate(),
      lastLoginAt: db.serverDate(),
    },
  });
  return {code: 0, message: '注册成功'};
}

async function login(openid) {
  const user = await users.where({openid}).get();
  if (user.data.length === 0) return {code: 404, message: '用户不存在'};

  // 更新登录时间
  await users.where({openid}).update({
    data: {lastLoginAt: db.serverDate(), loginCount: db.command.inc(1)},
  });
  return {code: 0, data: user.data[0]};
}

async function updateProfile(openid, data) {
  // 白名单过滤可修改字段
  const allowed = ['nickName', 'avatar', 'bio', 'gender'];
  const updateData = {};
  for (const key of allowed) {
    if (data[key] !== undefined) updateData[key] = data[key];
  }
  updateData.updatedAt = db.serverDate();

  await users.where({openid}).update({data: updateData});
  return {code: 0, message: '更新成功'};
}
```

## 性能优化

### 云函数冷启动优化

| 优化方式       | 效果           | 说明                     |
| -------------- | -------------- | ------------------------ |
| 减少依赖包     | 降低初始化时间 | 只安装必要的 npm 包      |
| 使用预置并发   | 消除冷启动     | 付费特性，保持实例活跃   |
| 代码精简       | 减少注入时间   | 避免在全局作用域做重计算 |
| 复用数据库连接 | 减少握手       | 在函数外部初始化 db      |

```javascript
// ✅ 全局初始化（复用连接）
const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database(); // 放在 handler 外部

exports.main = async (event) => {
  // 直接使用 db，复用连接
  return await db.collection('data').get();
};
```

### 数据库索引

```javascript
// 为高频查询字段创建索引（在云开发控制台操作）
// 推荐索引：
// users: openid（唯一）, createdAt
// orders: userId + status（组合）, createdAt
// articles: category + publishedAt（组合）

// 查询时利用索引
const result = await db
  .collection('orders')
  .where({userId: openid, status: 'pending'}) // 命中组合索引
  .orderBy('createdAt', 'desc')
  .limit(20)
  .get();
```

### 批量操作

```javascript
// ❌ 循环单条操作（N次网络请求）
for (const item of items) {
  await db.collection('data').add({data: item});
}

// ✅ 批量写入（1次请求，限制20条/次）
const batch = items.map((item) => ({data: item}));
// 云函数中可批量操作
const MAX_BATCH = 20;
for (let i = 0; i < batch.length; i += MAX_BATCH) {
  const chunk = batch.slice(i, i + MAX_BATCH);
  await Promise.all(chunk.map((item) => db.collection('data').add(item)));
}
```

## 面试高频题

:::info 面试题1：云开发的优缺点？适合什么项目？
**答**：优点：① 无需运维服务器；② 内置鉴权（直接获取openid）；③ 快速上线；④ 弹性伸缩按量付费。缺点：① 平台绑定，不易迁移；② 数据库仅 NoSQL，复杂查询受限；③ 云函数有执行时间限制（60s）；④ 不适合高并发低延迟场景。适合：中小型应用、工具类小程序、内容展示类、快速验证 MVP。
:::

:::info 面试题2：云函数的冷启动问题及解决方案？
**答**：冷启动是指云函数实例首次创建或长时间未调用后重新初始化的过程，通常增加 500ms-2s 延迟。解决方案：① 减小代码包体积和依赖数量；② 将初始化逻辑放在 handler 外部（复用实例时跳过）；③ 使用预置并发（付费保持热实例）；④ 定时触发器定期"预热"；⑤ 将多个小函数合并为路由式大函数减少冷启动概率。
:::

:::info 面试题3：云数据库的权限规则如何设计？
**答**：四种预设规则 + 自定义安全规则。设计原则：① 最小权限原则，按需开放；② 用户私有数据设"仅创建者读写"；③ 公共只读数据设"管理端写、用户读"；④ 自定义规则可基于 `auth.openid`、`doc` 字段、`now` 时间做精细控制；⑤ 敏感操作通过云函数执行（跳过前端权限限制）。
:::

:::info 面试题4：云开发如何处理并发和数据一致性？
**答**：① 使用事务 `db.runTransaction()` 保证原子性；② 利用 `db.command.inc()` 做原子自增避免竞态；③ 乐观锁模式——更新时 where 条件加版本号；④ 云函数设置单实例单并发避免共享状态冲突；⑤ 对账系统兜底——定时任务核对关键数据一致性。
:::
