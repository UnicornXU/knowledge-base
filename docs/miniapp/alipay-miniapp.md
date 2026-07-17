---
sidebar_position: 4
title: "支付宝小程序开发"
difficulty: "medium"
tags: ["小程序", "支付宝", "差异对比"]
---

# 支付宝小程序开发

## 微信 vs 支付宝小程序差异对比

### 文件结构差异

| 对比项 | 微信小程序 | 支付宝小程序 |
|--------|-----------|-------------|
| 模板文件 | .wxml | .axml |
| 样式文件 | .wxss | .acss |
| 脚本增强 | WXS (.wxs) | SJS (.sjs) |
| 配置文件 | app.json | app.json（字段不同） |
| 项目配置 | project.config.json | mini.project.json |

### API 差异对比

| 功能 | 微信 | 支付宝 | 说明 |
|------|------|--------|------|
| 网络请求 | wx.request | my.request | 参数基本一致 |
| 数据缓存 | wx.setStorageSync | my.setStorageSync | 同步API一致 |
| 路由跳转 | wx.navigateTo | my.navigateTo | 参数一致 |
| 支付 | wx.requestPayment | my.tradePay | 参数完全不同 |
| 用户信息 | wx.getUserProfile | my.getOpenUserInfo | 返回结构不同 |
| 扫码 | wx.scanCode | my.scan | 参数差异大 |
| 分享 | onShareAppMessage | onShareAppMessage | 参数略有不同 |
| 模板消息 | 订阅消息 | 模板消息/生活号 | 机制完全不同 |

### 组件差异

| 组件 | 微信 | 支付宝 | 差异点 |
|------|------|--------|--------|
| 滚动视图 | scroll-view | scroll-view | 支付宝多支持 scroll-animation-duration |
| 弹窗 | wx.showModal | my.confirm | API名称和参数不同 |
| 选择器 | picker | picker | mode 值写法不同 |
| 画布 | canvas 2d | canvas | 支付宝无 type="2d" |
| 地图 | map | map | 标记点属性命名不同 |

### 生态差异

| 维度 | 微信 | 支付宝 |
|------|------|--------|
| 用户量级 | 12亿+ | 9亿+ |
| 核心场景 | 社交、内容、电商 | 金融、生活服务、政务 |
| 流量入口 | 搜索、分享、公众号 | 搜索、生活号、支付成功页 |
| 开放能力 | 社交关系链 | 信用体系、金融能力 |
| 审核速度 | 1-3天 | 1-2天 |

## SJS 脚本

### SJS vs WXS 对比

| 特性 | WXS | SJS |
|------|-----|-----|
| 语法标准 | ES5 | ES5 + 部分ES6 |
| 导入方式 | `<wxs src="" module="">` | `<import-sjs name="" from="">` |
| 支持正则 | ✅ | ✅ |
| 支持 Date | ✅ | ✅ |
| 模块导出 | module.exports | export default |
| 事件响应 | WXS事件 | SJS事件响应 |

```html
<!-- SJS 示例：格式化手机号 -->
<import-sjs name="utils" from="./utils.sjs"/>
<view>{{utils.formatPhone(phone)}}</view>
```

```javascript
// utils.sjs
function formatPhone(phone) {
  if (!phone) return '';
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}
export default { formatPhone };
```

:::tip SJS 使用场景
- 视图层数据格式化（避免 setData 传输格式化后数据）
- 手势动画事件响应（touchmove 实时计算位移）
- 复杂 UI 状态逻辑计算
:::

## 支付宝特有能力

### 芝麻信用

```javascript
// 芝麻信用免押金
my.zmCreditBorrow({
  creditBorrowId: 'xxx',
  success(res) {
    console.log('免押结果:', res.resultStatus);
  }
});
```

### 花呗分期

```javascript
// 花呗分期支付
my.tradePay({
  tradeNO: orderInfo.tradeNo, // 服务端创建的交易号
  success(res) {
    if (res.resultCode === '9000') {
      console.log('支付成功');
    }
  }
});
// 服务端创建订单时指定分期参数
// extend_params: { hb_fq_num: '3', hb_fq_seller_percent: '0' }
```

### 小程序云 (云托管)

```javascript
// 支付宝云函数调用
my.serverless.function.invoke({
  name: 'getOrderList',
  data: { userId: 'xxx', page: 1 },
  success(res) {
    console.log(res.result);
  }
});
```

### 生活号集成

```javascript
// 关注生活号引导
my.openCardList({
  tradeNO: '',
});

// 消息推送能力（通过生活号模板消息）
// 服务端调用 alipay.open.public.message.single.send
```

## 支付集成完整流程

### 流程图

```
用户点击支付 → 前端请求服务端创建订单 → 服务端调用支付宝接口
     → 返回 tradeNo → 前端调用 my.tradePay → 支付宝收银台
     → 用户支付 → 异步通知服务端 → 服务端验签更新订单状态
```

### 前端代码

```javascript
Page({
  async handlePay() {
    // 1. 请求服务端创建订单
    const { tradeNo } = await my.request({
      url: 'https://api.example.com/order/create',
      method: 'POST',
      data: { goodsId: this.data.goodsId, amount: this.data.amount }
    });
    
    // 2. 调用支付
    my.tradePay({
      tradeNO: tradeNo,
      success(res) {
        switch(res.resultCode) {
          case '9000': my.navigateTo({ url: '/pages/pay-success/index' }); break;
          case '6001': my.showToast({ content: '用户取消支付' }); break;
          case '4000': my.showToast({ content: '支付失败' }); break;
        }
      }
    });
  }
});
```

:::warning 注意事项
- 支付结果以服务端异步通知为准，前端 resultCode 仅作 UI 展示
- tradeNO 参数名注意大小写（NO 大写）
- 沙箱环境需要使用沙箱版支付宝 App 测试
:::

### 服务端回调处理要点

```javascript
// Node.js 服务端异步通知验签
const alipaySdk = new AlipaySdk({ /* 配置 */ });

app.post('/notify/alipay', async (req, res) => {
  const verified = alipaySdk.checkNotifySign(req.body);
  if (!verified) return res.send('fail');
  
  const { trade_status, out_trade_no, trade_no } = req.body;
  if (trade_status === 'TRADE_SUCCESS') {
    await updateOrderStatus(out_trade_no, 'paid', trade_no);
  }
  res.send('success'); // 必须返回 success，否则会重复通知
});
```

## 开放能力

### 获取用户信息

```javascript
// 获取基础信息（需要用户授权按钮）
// axml
// <button open-type="getAuthorize" onGetAuthorize="onGetUser" scope="userInfo">授权</button>

Page({
  onGetUser() {
    my.getOpenUserInfo({
      success(res) {
        const userInfo = JSON.parse(res.response).response;
        console.log(userInfo.nickName, userInfo.avatar);
      }
    });
  }
});
```

### 获取手机号

```javascript
// <button open-type="getAuthorize" onGetAuthorize="onGetPhone" scope="phoneNumber">获取手机号</button>

Page({
  onGetPhone() {
    my.getPhoneNumber({
      success(res) {
        // res.response 是加密数据，需要服务端解密
        my.request({
          url: '/api/decrypt-phone',
          data: { encryptedData: res.response }
        });
      }
    });
  }
});
```

### 运动步数

```javascript
my.getRunData({
  countDate: '2024-01-15',
  success(res) {
    // res.response 为加密数据，服务端解密后获取步数
    console.log(res.response);
  }
});
```

## 从微信迁移到支付宝

### 迁移清单

| 步骤 | 操作 | 工具/方法 |
|------|------|----------|
| 1 | 文件后缀替换 | .wxml→.axml, .wxss→.acss |
| 2 | API 前缀替换 | wx.→my. |
| 3 | 模板语法调整 | wx:if→a:if, wx:for→a:for |
| 4 | 事件绑定改写 | bind:tap→onTap, catch:tap→catchTap |
| 5 | WXS 迁移为 SJS | 改写导入导出语法 |
| 6 | 支付/登录逻辑重写 | 对接支付宝接口 |
| 7 | 能力差异补充 | 分享、模板消息等 |

:::warning 迁移高频问题
- 事件对象结构不同：微信 `e.currentTarget.dataset`，支付宝 `e.target.dataset`
- 支付宝不支持 `<slot name="">` 需改用具名 slot 的特定写法
- 支付宝 `my.request` 不支持 `responseType: 'arraybuffer'` 在旧版本
- 样式 `page` 选择器在支付宝中换成 `page` 或使用 `:root`
:::

## 面试高频题

:::info 面试题1：微信小程序和支付宝小程序的核心架构差异？
**答**：两者都采用双线程架构（逻辑层+渲染层），但差异在于：① 支付宝使用 UC 内核的 WebView，微信在 Android 用 X5 内核；② 支付宝支持 SJS 事件响应（类似 WXS 事件），语法更接近现代 JS；③ 组件系统上支付宝的 ref 和 mixin 机制有差异；④ 支付宝有独有的多端同步渲染引擎。
:::

:::info 面试题2：如何设计一套代码同时适配微信和支付宝？
**答**：方案有：① 使用跨平台框架（Taro/uni-app）编译到多端；② 自建适配层抹平 API 差异，封装 `request`/`navigate` 等通用方法；③ 条件编译处理平台专属逻辑；④ 文件名约定（.wx.js / .ali.js）配合构建工具按平台打包。
:::

:::info 面试题3：支付宝小程序的支付流程与安全保障？
**答**：① 前端调用 `my.tradePay` 唤起收银台；② 订单必须由服务端创建（签名验证防篡改）；③ 支付结果以异步通知（notify_url）为准而非前端回调；④ 服务端需验证异步通知签名防止伪造；⑤ 使用 RSA2 签名算法保障数据完整性；⑥ 敏感接口使用应用私钥+支付宝公钥双向验证。
:::

:::info 面试题4：从微信迁移到支付宝最关键的注意事项？
**答**：① 事件系统差异最大——绑定语法、事件对象结构、冒泡机制都有区别；② 支付和登录需完全重写（接口协议不同）；③ 组件 API 差异（如 createSelectorQuery 的链式调用方式）；④ 支付宝不支持部分微信独有能力（如转发到朋友圈）；⑤ 建议通过适配层而非条件判断来处理差异。
:::
