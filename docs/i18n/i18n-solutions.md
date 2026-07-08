---
sidebar_position: 1
title: 前端国际化方案对比
description: react-intl / vue-i18next / FormatJS 原理对比、动态加载语言包、复数性别日期货币处理
keywords: [react-intl, vue-i18next, FormatJS, ICU MessageFormat, 语言包动态加载, 国际化方案]
---

# 前端国际化方案对比

## 主流方案一览

| 方案 | 框架 | 核心原理 | 包大小（min+gz） | 备注 |
|------|------|----------|-----------------|------|
| **react-intl** | React | ICU MessageFormat + FormatJS | ~16kB | 最成熟的 React 方案 |
| **vue-i18n** | Vue | 自定义消息格式 + 插值语法 | ~12kB | Vue 官方推荐 |
| **i18next** | 框架无关 | 自定义格式 + ICU 插件 | ~15kB | 生态最大、框架无关 |
| **FormatJS** | 框架无关 | ICU MessageFormat 标准 | ~8kB | react-intl 底层库 |
| **Lingui** | React | ICU + Babel/Macro 编译时处理 | ~5kB | 编译时优化，包最小 |

---

## ICU MessageFormat 原理

ICU（International Components for Unicode）MessageFormat 是国际化消息格式的行业标准。

### 基本语法

```icu
// 简单替换
Hello, {name}!

// 复数
{count, plural,
  =0 {No items}
  one {# item}
  other {# items}
}

// 性别
{gender, select,
  male {He}
  female {She}
  other {They}
} sent a message.

// 嵌套
{gender, select,
  male {He has}
  female {She has}
  other {They have}
} {count, plural,
  =0 {no messages}
  one {# message}
  other {# messages}
}.
```

### 复数规则（CLDR）

不同语言的复数类别由 Unicode CLDR 定义：

| 语言 | 类别 | 规则 |
|------|------|------|
| 英语 | one, other | n=1 为 one，其余 other |
| 中文 | other | 只有 other |
| 阿拉伯语 | zero, one, two, few, many, other | 6 种类别 |
| 波兰语 | one, few, many, other | 4 种类别 |

```js
// 复数规则示例（阿拉伯语）
{
  "count": "{count, plural, =0 {لا رسائل} one {رسالة واحدة} two {رسالتان} few {# رسائل} many {# رسالة} other {# رسالة}}"
}
```

---

## react-intl 深入

### 核心原理

react-intl 基于 FormatJS，使用 ICU MessageFormat 解析消息模板：

```jsx
import { IntlProvider, FormattedMessage, FormattedNumber, FormattedDate } from 'react-intl';

const messages = {
  zh: {
    greeting: '你好，{name}！',
    itemCount: '{count, plural, =0 {没有商品} one {# 件商品} other {# 件商品}}',
  },
};

function App() {
  return (
    <IntlProvider locale="zh" messages={messages.zh}>
      <FormattedMessage id="greeting" values={{ name: '小明' }} />
      <FormattedMessage id="itemCount" values={{ count: 5 }} />
      <FormattedNumber value={1234.56} style="currency" currency="CNY" />
      <FormattedDate value={new Date()} year="numeric" month="long" day="numeric" />
    </IntlProvider>
  );
}
```

### 底层工作流程

```text
消息模板字符串 → ICU Parser → AST → 值注入 → 格式化输出
```

1. **解析阶段**：将 `{count, plural, one {# item} other {# items}}` 解析为 AST
2. **选择阶段**：根据 locale 的 CLDR 复数规则选择正确的分支
3. **格式化阶段**：用实际值替换占位符，应用数字/日期格式

### useIntl Hook

```jsx
import { useIntl } from 'react-intl';

function PriceDisplay({ amount, currency }) {
  const intl = useIntl();

  return (
    <span>
      {intl.formatNumber(amount, {
        style: 'currency',
        currency,
      })}
    </span>
  );
}
```

---

## vue-i18n 深入

### 核心原理

vue-i18n 使用自定义的消息插值语法，同时支持 ICU MessageFormat 插件：

```vue
<template>
  <div>
    <!-- 基本插值 -->
    <p>{{ $t('greeting', { name: '小明' }) }}</p>

    <!-- 复数 -->
    <p>{{ $tc('itemCount', count, { count }) }}</p>

    <!-- 格式化 -->
    <p>{{ $d(new Date(), 'long') }}</p>
    <p>{{ $n(1234.56, 'currency') }}</p>
  </div>
</template>

<script>
import { createI18n } from 'vue-i18n';

const i18n = createI18n({
  locale: 'zh-CN',
  messages: {
    'zh-CN': {
      greeting: '你好，{name}！',
      itemCount: '没有商品 | {count} 件商品',
    },
  },
  numberFormats: {
    'zh-CN': {
      currency: { style: 'currency', currency: 'CNY' },
    },
  },
  datetimeFormats: {
    'zh-CN': {
      long: { year: 'numeric', month: 'long', day: 'numeric' },
    },
  },
});
</script>
```

### Composition API 模式

```vue
<script setup>
import { useI18n } from 'vue-i18n';

const { t, n, d, locale } = useI18n();

const message = t('greeting', { name: '小明' });
const price = n(1234.56, 'currency');
const date = d(new Date(), 'long');
</script>
```

---

## 语言包动态加载

大型应用不可能将所有语言打包到主 bundle 中，需要按需加载。

### 方案一：动态 import（推荐）

```js
// i18n.ts
const locales = {
  'zh-CN': () => import('./locales/zh-CN.json'),
  'en-US': () => import('./locales/en-US.json'),
  'ja-JP': () => import('./locales/ja-JP.json'),
};

async function loadLocale(locale) {
  const mod = await locales[locale]();
  return mod.default;
}
```

### 方案二：语言包分割

将语言包按模块拆分，只加载当前页面所需的翻译：

```js
// 按功能模块拆分
const modules = {
  'zh-CN': {
    common: () => import('./locales/zh-CN/common.json'),
    dashboard: () => import('./locales/zh-CN/dashboard.json'),
    settings: () => import('./locales/zh-CN/settings.json'),
  },
};

async function loadModule(locale, moduleName) {
  const mod = await modules[locale][moduleName]();
  i18n.global.mergeLocaleMessage(locale, mod.default);
}
```

### 方案三：服务端下发

```js
// 从 CDN 或 API 获取语言包
async function fetchMessages(locale) {
  const cacheKey = `i18n_${locale}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) return JSON.parse(cached);

  const res = await fetch(`/api/i18n/${locale}`);
  const messages = await res.json();
  sessionStorage.setItem(cacheKey, JSON.stringify(messages));
  return messages;
}
```

### 缓存策略

| 策略 | 适用场景 | 实现方式 |
|------|----------|----------|
| sessionStorage | 会话内缓存 | 存储已加载的语言包 |
| localStorage | 持久缓存 | 带版本号，版本变更时清除 |
| Service Worker | 离线支持 | Cache API 缓存语言包请求 |
| HTTP 缓存 | CDN 分发 | Cache-Control 长缓存 + 版本化 URL |

---

## 日期格式化

### 使用 Intl.DateTimeFormat

```js
// 基本用法
new Intl.DateTimeFormat('zh-CN').format(new Date())
// → "2025/1/15"

// 详细选项
new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
  hour: '2-digit',
  minute: '2-digit',
  timeZoneName: 'short',
}).format(new Date())
// → "2025年1月15日星期三 14:30 CST"
```

### 使用 dayjs

```js
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

dayjs.locale('zh-cn');
dayjs().format('YYYY年M月D日 dddd')
// → "2025年1月15日 星期三"
```

---

## 货币格式化

```js
// 人民币
new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
}).format(1234.56)
// → "¥1,234.56"

// 美元
new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
}).format(1234.56)
// → "$1,234.56"

// 欧元（德语格式）
new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
}).format(1234.56)
// → "1.234,56 €"
```

---

## 复数与性别处理

### react-intl 中的复数

```jsx
<FormattedMessage
  id="cart.items"
  defaultMessage="{count, plural,
    =0 {Your cart is empty}
    one {You have # item in your cart}
    other {You have # items in your cart}
  }"
  values={{ count: items.length }}
/>
```

### vue-i18n 中的复数

```js
// 语言包
{
  cart: {
    items: '购物车为空 | 购物车中有 {count} 件商品'
  }
}

// 使用
$t('cart.items', count, { count })
```

### 复杂嵌套（性别 + 复数）

```icu
{gender, select,
  male {He has {count, plural,
    =0 {no items}
    one {# item}
    other {# items}
  }}
  female {She has {count, plural,
    =0 {no items}
    one {# item}
    other {# items}
  }}
  other {They have {count, plural,
    =0 {no items}
    one {# item}
    other {# items}
  }}
} in the cart.
```

---

## 最佳实践

### 1. 翻译键命名规范

```js
// 好：模块.功能.描述
{
  "user.profile.title": "个人资料",
  "user.profile.saveButton": "保存",
  "cart.checkout.totalPrice": "总价",
}

// 差：随意命名
{
  "title1": "个人资料",
  "btn": "保存",
  "price": "总价",
}
```

### 2. 避免拼接翻译

```jsx
// 错误：拼接翻译片段
<p>{t('user')} {t('created')} {t('account')}</p>

// 正确：使用完整句子
<p>{t('user.createdAccount', { name })}</p>
```

### 3. 提取硬编码字符串

```js
// 使用工具自动提取
// i18next-scanner / babel-plugin-react-intl / vue-i18n-extract
```

### 4. 翻译文件版本管理

```text
src/
├── locales/
│   ├── zh-CN/
│   │   ├── common.json      # 公共翻译
│   │   ├── auth.json        # 认证模块
│   │   └── dashboard.json   # 仪表盘模块
│   ├── en-US/
│   │   ├── common.json
│   │   ├── auth.json
│   │   └── dashboard.json
│   └── _meta.json           # 版本与元信息
```

---

## 面试高频问题

1. **react-intl 和 vue-i18n 的核心区别？**
   - react-intl 基于 ICU MessageFormat 标准，vue-i18n 使用自定义插值语法
   - react-intl 是 FormatJS 生态的一部分，vue-i18n 是 Vue 官方推荐

2. **ICU MessageFormat 的复数规则如何工作？**
   - 基于 CLDR 的语言类别（one, other 等）
   - 不同语言有不同的复数类别数量

3. **语言包动态加载的方案有哪些？**
   - 动态 import + 代码分割
   - 按模块拆分 + 增量加载
   - 服务端下发 + 缓存策略

4. **如何处理翻译中的 HTML 标签？**
   - react-intl: `<FormattedMessage values={{ link: <a href="/privacy">隐私政策</a> }} />`
   - vue-i18n: 使用组件插值或 `v-html`（注意 XSS）

5. **翻译缺失时如何兜底？**
   - 设置默认消息（defaultMessage）
   - 回退到默认语言（fallbackLocale）
   - 开发环境提示缺失翻译
