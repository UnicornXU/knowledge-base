---
sidebar_position: 0
title: 国际化（i18n）概述
description: 前端国际化核心概念、知识体系与面试要点总览
keywords: [i18n, internationalization, 国际化, 国际化方案, react-intl, vue-i18next]
---

# 国际化（i18n）概述

国际化（Internationalization，缩写为 **i18n**，取首尾字母 i 和 n 之间有 18 个字母）是让应用能够以最小的工程代价适配不同语言、地区和文化的技术体系。

与之相关的概念还包括：

- **L10n（Localization，本地化）**：在国际化框架之上，针对特定地区做翻译、格式适配等具体工作。
- **Locale（区域设置）**：一个语言 + 地区的组合标识，如 `zh-CN`、`en-US`、`ja-JP`。

---

## 为什么需要国际化

| 场景 | 说明 |
|------|------|
| 产品出海 | 面向全球用户，需支持多语言界面 |
| 合规要求 | 欧盟 GDPR、阿拉伯地区 RTL 等法规和技术要求 |
| 用户体验 | 日期、货币、数字格式需符合用户所在地区的阅读习惯 |
| 运营效率 | 同一代码库支持多语言，减少维护成本 |

---

## 知识图谱

```text
                        ┌─────────────────────────┐
                        │    国际化（i18n）概述     │
                        └────────┬────────────────┘
              ┌──────────────┬───┴────────┬──────────────┐
              ▼              ▼            ▼              ▼
     ┌────────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
     │ 方案选型与对比  │ │ RTL 布局 │ │ 时区处理  │ │ 本地化格式   │
     └───┬────────────┘ └────┬─────┘ └────┬─────┘ └──────┬───────┘
         │                   │            │              │
    ┌────┴────┐         ┌───┴───┐   ┌────┴────┐    ┌────┴────┐
    │react-intl│        │逻辑属性│   │Intl API │    │货币格式 │
    │vue-i18n  │        │dir属性 │   │dayjs    │    │日期格式 │
    │FormatJS  │        │镜像图标│   │UTC策略  │    │数字格式 │
    └─────────┘        └───────┘   └─────────┘    └─────────┘
```

---

## 子主题导航

| 序号 | 文档 | 核心内容 | 关键词 |
|:----:|------|----------|--------|
| 1 | [国际化方案对比](./i18n-solutions.md) | react-intl / vue-i18next / FormatJS 原理对比、语言包动态加载、复数/性别/日期/货币处理 | react-intl, vue-i18next, FormatJS, ICU MessageFormat |
| 2 | [RTL 布局适配](./rtl-layout.md) | CSS 逻辑属性、dir 属性、镜像图标、RTL 测试策略 | RTL, CSS Logical Properties, dir, mirror |
| 3 | [时区与本地化处理](./timezone-locale.md) | Intl API、dayjs / luxon、UTC 存储策略、夏令时处理 | timezone, Intl, dayjs, luxon, DST |

---

## 国际化核心维度

### 1. 文本翻译

最基础的国际化需求。将 UI 中的硬编码字符串提取为翻译键值对，由翻译团队或工具提供各语言版本。

```js
// 硬编码（不可维护）
<button>提交</button>

// 国际化（推荐）
<button>{t('common.submit')}</button>
```

### 2. 格式化

不同地区对日期、数字、货币的展示格式差异巨大：

| 地区 | 日期 | 数字 | 货币 |
|------|------|------|------|
| 中国（zh-CN） | 2025年1月15日 | 1,234.56 | ¥1,234.56 |
| 美国（en-US） | January 15, 2025 | 1,234.56 | $1,234.56 |
| 德国（de-DE） | 15. Januar 2025 | 1.234,56 | 1.234,56 € |

### 3. 布局方向

阿拉伯语、希伯来语等语言的阅读方向是从右到左（RTL），需要布局镜像适配。

### 4. 时区处理

全球用户分布在不同时区，服务端存储、客户端展示、夏令时处理都需要统一策略。

### 5. 复数与性别

不同语言的复数规则差异极大。例如英语有 singular / plural 两种形式，而阿拉伯语有 6 种复数形式。

```icu
// ICU MessageFormat 复数示例
{count, plural,
  =0 {没有消息}
  one {你有 # 条消息}
  other {你有 # 条消息}
}
```

---

## 面试高频问题

1. **前端国际化的核心挑战有哪些？** — 文本翻译、格式化、布局方向、时区、复数规则。
2. **react-intl 和 i18next 的核心区别是什么？** — ICU MessageFormat vs 自定义格式、依赖关系、生态差异。
3. **如何实现语言包的动态加载？** — 按需 import、代码分割、缓存策略。
4. **RTL 布局适配的关键技术点？** — CSS 逻辑属性、dir 属性、图标镜像。
5. **时区处理的最佳实践？** — 服务端 UTC 存储、客户端本地展示、避免手动计算。

---

## 参考资源

- [ICU MessageFormat 规范](https://unicode.org/reports/tr35/)
- [MDN - Internationalization API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)
- [W3C - Structural markup and right-to-left text in HTML](https://www.w3.org/International/questions/qa-html-dir)
