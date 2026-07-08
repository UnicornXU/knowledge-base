---
sidebar_position: 3
title: 时区与本地化处理
description: Intl API、dayjs/luxon 使用、UTC 存储策略、夏令时处理全面解析
keywords: [timezone, Intl API, dayjs, luxon, UTC, 夏令时, DST, 时区处理]
---

# 时区与本地化处理

## 时区基础概念

### 时区标识

| 标识类型 | 示例 | 说明 |
|----------|------|------|
| UTC 偏移 | `+08:00`, `-05:00` | 与 UTC 的固定偏移量 |
| IANA 时区 | `Asia/Shanghai`, `America/New_York` | 地理区域标识，处理夏令时 |
| 缩写 | `CST`, `EST` | 易混淆（CST 可指多个时区） |

### 为什么推荐 IANA 时区

```text
// IANA 时区数据库
Asia/Shanghai      → UTC+8（无夏令时）
America/New_York   → UTC-5（冬季）/ UTC-4（夏令时）
Europe/London      → UTC+0（冬季）/ UTC+1（夏令时）
Australia/Sydney   → UTC+11（冬季）/ UTC+10（夏令时，南半球相反）
```

使用 IANA 时区而非固定偏移量，可以正确处理夏令时变化。

---

## Intl API

`Intl` 是 ECMAScript 内置的国际化 API，无需第三方库即可处理大部分格式化需求。

### Intl.DateTimeFormat

```js
// 基本用法
const formatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Shanghai',
});

formatter.format(new Date())
// → "2025年1月15日星期三 14:30"

// 指定时区
new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  dateStyle: 'full',
  timeStyle: 'long',
}).format(new Date())
// → "Wednesday, January 15, 2025 at 2:30:00 AM EST"
```

### Intl.NumberFormat

```js
// 数字格式化
new Intl.NumberFormat('de-DE').format(1234567.89)
// → "1.234.567,89"

// 货币格式化
new Intl.NumberFormat('ja-JP', {
  style: 'currency',
  currency: 'JPY',
}).format(1500)
// → "￥1,500"

// 百分比
new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 1,
}).format(0.856)
// → "85.6%"

// 单位
new Intl.NumberFormat('zh-CN', {
  style: 'unit',
  unit: 'kilometer-per-hour',
}).format(120)
// → "120千米/小时"
```

### Intl.RelativeTimeFormat

```js
// 相对时间
const rtf = new Intl.RelativeTimeFormat('zh-CN', { numeric: 'auto' });

rtf.format(-1, 'day')   // → "昨天"
rtf.format(-2, 'day')   // → "前天"
rtf.format(1, 'day')    // → "明天"
rtf.format(3, 'month')  // → "3个月后"
rtf.format(-1, 'year')  // → "去年"
```

### Intl.ListFormat

```js
// 列表格式化
const lf = new Intl.ListFormat('zh-CN', { style: 'long', type: 'conjunction' });

lf.format(['苹果', '香蕉', '橙子'])
// → "苹果、香蕉和橙子"

lf.format(['Apple', 'Banana'])
// → "Apple和Banana"
```

### Intl.Segmenter（分词）

```js
// 中文分词
const segmenter = new Intl.Segmenter('zh-CN', { granularity: 'word' });
const segments = segmenter.segment('国际化是前端的重要课题');

for (const { segment, isWordLike } of segments) {
  if (isWordLike) {
    console.log(segment); // "国际化", "是", "前端", "的", "重要", "课题"
  }
}
```

---

## dayjs

dayjs 是一个轻量级（2kB）的日期处理库，API 与 Moment.js 兼容。

### 基础用法

```js
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import 'dayjs/locale/zh-cn';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.locale('zh-cn');

// 创建时间
dayjs()                           // 当前时间
dayjs('2025-01-15')               // 解析字符串
dayjs(1705305600000)              // 解析时间戳

// 格式化
dayjs().format('YYYY年M月D日 dddd')
// → "2025年1月15日 星期三"

dayjs().format('LTS')             // 本地化时间格式
```

### 时区处理

```js
// 设置时区
dayjs.tz.setDefault('Asia/Shanghai');

// 创建指定时区的时间
const shanghaiTime = dayjs.tz('2025-01-15 14:30', 'Asia/Shanghai');
const newYorkTime = shanghaiTime.tz('America/New_York');

console.log(newYorkTime.format('YYYY-MM-DD HH:mm'))
// → "2025-01-15 01:30"（冬令时差13小时）

// 转换时区
dayjs().tz('Asia/Tokyo').format('HH:mm')  // 东京时间
dayjs().tz('Europe/London').format('HH:mm') // 伦敦时间
```

### 相对时间

```js
dayjs().fromNow()        // "几秒前"
dayjs().add(1, 'hour').fromNow()  // "1小时后"
dayjs().subtract(3, 'day').fromNow()  // "3天前"

dayjs('2025-01-01').from('2025-01-15')
// → "14天前"
```

---

## luxon

luxon 是 Moment.js 作者创建的现代日期库，原生支持时区和国际化。

### 基础用法

```js
import { DateTime } from 'luxon';

// 创建时间
DateTime.now()                         // 当前时间
DateTime.fromISO('2025-01-15T14:30:00')
DateTime.fromMillis(1705305600000)

// 指定时区
DateTime.now().setZone('Asia/Shanghai')

// 格式化
DateTime.now().setLocale('zh-CN').toLocaleString(DateTime.DATE_FULL)
// → "2025年1月15日"

DateTime.now().toFormat('yyyy年M月d日')
// → "2025年1月15日"
```

### 时区处理

```js
// 转换时区
const shanghai = DateTime.now().setZone('Asia/Shanghai');
const tokyo = shanghai.setZone('Asia/Tokyo');
const london = shanghai.setZone('Europe/London');

console.log(tokyo.toFormat('HH:mm'));   // 东京时间
console.log(london.toFormat('HH:mm'));  // 伦敦时间

// 检查是否为 DST（夏令时）
console.log(shanghai.isInDST);  // false（中国无夏令时）
console.log(london.isInDST);    // 取决于当前日期
```

### Duration（时间段）

```js
const duration = Duration.fromObject({
  hours: 2,
  minutes: 30,
  seconds: 45,
});

duration.toHuman()
// → "2小时30分钟45秒"

duration.shiftTo('minutes').toObject()
// → { minutes: 150, seconds: 45 }
```

---

## UTC 存储策略

### 核心原则

```text
┌─────────────────────────────────────────────────────┐
│  服务端存储：始终使用 UTC                              │
│  API 传输：始终使用 ISO 8601 格式（带时区标识）        │
│  客户端展示：转换为用户本地时区                         │
│  用户输入：记录用户的时区偏好                          │
└─────────────────────────────────────────────────────┘
```

### 存储格式

```js
// 服务端存储（PostgreSQL 示例）
// TIMESTAMPTZ 类型自动存储为 UTC
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  name TEXT,
  start_time TIMESTAMPTZ NOT NULL,  -- 存储 UTC
  end_time TIMESTAMPTZ NOT NULL
);

// 插入时自动转换
INSERT INTO events (name, start_time)
VALUES ('会议', '2025-01-15T14:30:00+08:00');
-- 实际存储: 2025-01-15T06:30:00Z
```

### API 传输

```js
// 服务端返回 ISO 8601 格式
{
  "createdAt": "2025-01-15T06:30:00Z",
  "eventTime": "2025-01-15T14:30:00+08:00"
}

// 客户端解析并显示
const eventTime = new Date("2025-01-15T06:30:00Z");
console.log(
  new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(eventTime)
);
// → "2025/1/15 14:30"
```

### 用户时区检测

```js
// 方案 1：使用 Intl API（推荐）
const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
// → "Asia/Shanghai"

// 方案 2：存储用户偏好
const userSettings = {
  timezone: 'Asia/Shanghai',
  locale: 'zh-CN',
  dateFormat: 'YYYY年M月D日',
  timeFormat: '24h',
};
```

### 跨时区会议调度

```js
// 用户在上海（+8），纽约（-5），伦敦（+0）
// 会议时间需要显示为各用户的本地时间
const meetingUTC = '2025-01-15T10:00:00Z';

const displayForUser = (utcTime, timezone) => {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: timezone,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(utcTime));
};

displayForUser(meetingUTC, 'Asia/Shanghai')   // → "2025/1/15 18:00"
displayForUser(meetingUTC, 'America/New_York') // → "2025/1/15 05:00"
displayForUser(meetingUTC, 'Europe/London')   // → "2025/1/15 10:00"
```

---

## 夏令时（DST）处理

### 什么是夏令时

夏令时（Daylight Saving Time）是部分国家在夏季将时钟拨快一小时的制度，以充分利用日光。

```text
美国东部时间（America/New_York）:
  冬令时（EST）: UTC-5（11月~3月）
  夏令时（EDT）: UTC-4（3月~11月）

切换时间:
  3月第二个周日 02:00 → 03:00（时钟拨快，跳过一小时）
  11月第一个周日 02:00 → 01:00（时钟拨回，重复一小时）
```

### DST 常见陷阱

#### 陷阱 1：时间不存在

```js
// 2025年美国东部，3月9日 02:00~03:00 不存在
const dt = DateTime.fromObject(
  { year: 2025, month: 3, day: 9, hour: 2, minute: 30 },
  { zone: 'America/New_York' }
);

console.log(dt.isValid);           // false
console.log(dt.invalidReason);     // "unit out of range: hour"
```

#### 陷阱 2：时间重复

```js
// 2025年美国东部，11月2日 01:00~02:00 出现两次
const dt1 = DateTime.fromObject(
  { year: 2025, month: 11, day: 2, hour: 1, minute: 30 },
  { zone: 'America/New_York' }
);

// 第一次出现是 EDT（UTC-4），第二次是 EST（UTC-5）
console.log(dt1.offset);  // -240（EDT，夏令时）
```

#### 陷阱 3：时间间隔计算

```js
// 夏令时切换日，24小时 ≠ 1天
const start = DateTime.fromISO('2025-03-08T14:00:00', {
  zone: 'America/New_York',
});
const end = start.plus({ days: 1 });

console.log(end.diff(start, 'hours').hours);
// → 23（因为跳过了1小时）

// 冬令时切换日
const start2 = DateTime.fromISO('2025-11-01T14:00:00', {
  zone: 'America/New_York',
});
const end2 = start2.plus({ days: 1 });

console.log(end2.diff(start2, 'hours').hours);
// → 25（因为重复了1小时）
```

### DST 安全实践

```js
// 1. 使用 duration 而非绝对时间差
const duration = end.diff(start);
console.log(duration.as('hours'));  // 可能不是整数

// 2. 计算日期差时使用日历天数
const dayDiff = end.diff(start, 'days').days;

// 3. 避免在 DST 切换时间附近做时间计算
// 将敏感操作安排在安全时间窗口

// 4. 使用 "保持挂钟时间" 策略
const meeting = DateTime.fromObject(
  { hour: 14, minute: 0 },
  { zone: 'America/New_York' }
);
// 每天 14:00 开会，夏令时切换时自动调整 UTC 时间
```

---

## 综合实战：日程应用

```js
import { DateTime } from 'luxon';

class Scheduler {
  constructor(userTimezone) {
    this.timezone = userTimezone;
  }

  // 创建日程（输入本地时间，存储为 UTC）
  createEvent(localTime, title) {
    const dt = DateTime.fromISO(localTime, {
      zone: this.timezone,
    });
    return {
      title,
      utcTime: dt.toUTC().toISO(),
      localTime: dt.toISO(),
      timezone: this.timezone,
    };
  }

  // 显示日程（UTC 转换为用户本地时间）
  displayEvent(event, targetTimezone) {
    const utc = DateTime.fromISO(event.utcTime, { zone: 'utc' });
    const local = utc.setZone(targetTimezone || this.timezone);

    return {
      ...event,
      displayDate: local.toLocaleString(DateTime.DATE_FULL),
      displayTime: local.toLocaleString(DateTime.TIME_SIMPLE),
      isDST: local.isInDST,
    };
  }

  // 跨时区日程查询
  findOverlapping(events, participantTimezones) {
    return events.map(event => {
      const utc = DateTime.fromISO(event.utcTime, { zone: 'utc' });
      const times = participantTimezones.map(tz => ({
        timezone: tz,
        localTime: utc.setZone(tz).toFormat('HH:mm'),
        isSleeping: this.isSleepingHours(utc.setZone(tz)),
      }));
      return { ...event, participantTimes: times };
    });
  }

  isSleepingHours(dt) {
    return dt.hour >= 23 || dt.hour < 7;
  }
}

// 使用
const scheduler = new Scheduler('Asia/Shanghai');
const event = scheduler.createEvent('2025-01-15T14:00', '团队会议');
const display = scheduler.displayEvent(event, 'America/New_York');
console.log(display);
// {
//   title: "团队会议",
//   displayDate: "January 15, 2025",
//   displayTime: "1:00 AM",
//   isDST: false
// }
```

---

## 面试高频问题

1. **为什么服务端要使用 UTC 存储时间？**
   - 避免时区歧义，统一时间基准
   - 方便时间计算和比较
   - 客户端负责转换为用户本地时区

2. **IANA 时区和 UTC 偏移量的区别？**
   - UTC 偏移量是固定值（如 +08:00）
   - IANA 时区包含夏令时规则（如 America/New_York）
   - 推荐使用 IANA 时区以正确处理 DST

3. **夏令时会导致哪些问题？**
   - 某些时间点不存在（时钟拨快时跳过一小时）
   - 某些时间点重复（时钟拨回时同一时间出现两次）
   - 24小时不等于1天（DST切换日）
   - 时间间隔计算需要特殊处理

4. **如何检测用户的时区？**
   - `Intl.DateTimeFormat().resolvedOptions().timeZone`
   - 用户手动设置偏好

5. **dayjs 和 luxon 的选择？**
   - dayjs：轻量（2kB），API 与 Moment.js 兼容
   - luxon：功能完整，原生支持时区，但体积更大
   - 推荐：轻量需求选 dayjs，复杂时区需求选 luxon
