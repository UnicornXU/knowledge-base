---
sidebar_position: 3
title: ECharts 原理与定制开发
difficulty: hard
tags:
  - echarts
  - 图表
  - 可视化
  - 数据可视化
---

# 📊 ECharts 原理与定制开发

> **"ECharts 是国内使用最广泛的可视化库，理解其原理和定制能力是前端可视化的必备技能"**

ECharts（Enterprise Charts）是百度开源的 JavaScript 可视化库，底层基于 ZRender 渲染引擎，支持 Canvas 和 SVG 两种渲染方式。

## 一、ECharts 架构

### 1.1 整体架构

```
ECharts 架构全景
══════════════════════════════════════════════════

  ┌─────────────────────────────────────────────┐
  │                 ECharts 配置层               │
  │  option（用户配置）                           │
  ├─────────────────────────────────────────────┤
  │                 组件系统                      │
  │  ├── 坐标系（Cartesian、Polar、Geo）          │
  │  ├── 图表系列（Line、Bar、Scatter、Pie...）    │
  │  ├── 交互组件（Tooltip、Legend、DataZoom）    │
  │  └── 布局系统（Grid、Title、Toolbox）         │
  ├─────────────────────────────────────────────┤
  │                 ZRender 渲染引擎              │
  │  ├── 图形元素（Rect、Circle、Path...）        │
  │  ├── 事件系统                                │
  │  ├── 动画系统                                │
  │  └── 渲染后端（Canvas / SVG）                │
  ├─────────────────────────────────────────────┤
  │           Canvas API / SVG DOM               │
  └─────────────────────────────────────────────┘
```

### 1.2 初始化与渲染流程

```javascript
// 1. 初始化
const chart = echarts.init(dom, theme, {
  renderer: 'canvas',   // 或 'svg'
  width: 800,
  height: 600,
});

// 2. 设置配置项
chart.setOption({
  xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
  yAxis: { type: 'value' },
  series: [{
    type: 'bar',
    data: [120, 200, 150, 80, 70],
  }],
});

// 3. 渲染流程
// option → 数据处理 → 布局计算 → 图形生成 → Canvas/SVG 绘制
```

```
ECharts 渲染流程
────────────────────────────────────────

  setOption(option)
       ↓
  ┌──────────────┐
  │  Model 层     │  ← 解析配置，生成数据模型
  └──────┬───────┘
         ↓
  ┌──────────────┐
  │  View 层      │  ← 布局计算，生成图形元素
  └──────┬───────┘
         ↓
  ┌──────────────┐
  │  Render 层    │  ← ZRender 渲染到 Canvas/SVG
  └──────────────┘
```

---

## 二、核心配置体系

### 2.1 option 结构

```javascript
const option = {
  // 标题
  title: { text: '销售数据', left: 'center' },

  // 提示框
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
  },

  // 图例
  legend: { top: 30 },

  // 工具栏
  toolbox: {
    feature: {
      dataZoom: {},
      dataView: { readOnly: false },
      magicType: { type: ['line', 'bar'] },
      restore: {},
      saveAsImage: {},
    },
  },

  // 网格（控制图表区域）
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },

  // X 轴
  xAxis: {
    type: 'category',
    data: ['1月', '2月', '3月', '4月', '5月', '6月'],
    axisLabel: { rotate: 30 },
  },

  // Y 轴
  yAxis: {
    type: 'value',
    name: '销售额（万）',
    splitLine: { lineStyle: { type: 'dashed' } },
  },

  // 数据缩放
  dataZoom: [
    { type: 'inside', start: 0, end: 100 },
    { type: 'slider', start: 0, end: 100 },
  ],

  // 系列（核心）
  series: [
    {
      name: '线上',
      type: 'bar',
      data: [120, 200, 150, 80, 70, 110],
      itemStyle: { color: '#4F46E5' },
      markPoint: { data: [{ type: 'max', name: '最大值' }] },
      markLine: { data: [{ type: 'average', name: '平均值' }] },
    },
    {
      name: '线下',
      type: 'bar',
      data: [80, 130, 100, 60, 50, 90],
      itemStyle: { color: '#10B981' },
    },
  ],
};

chart.setOption(option);
```

### 2.2 常用图表类型

| 类型 | type 值 | 适用场景 |
|------|---------|---------|
| 折线图 | `line` | 趋势变化 |
| 柱状图 | `bar` | 数据对比 |
| 饼图 | `pie` | 占比分析 |
| 散点图 | `scatter` | 相关性分析 |
| 雷达图 | `radar` | 多维对比 |
| 地图 | `map` | 地理数据 |
| 树图 | `tree` | 层级结构 |
| 热力图 | `heatmap` | 密度分布 |
| K 线图 | `candlestick` | 股票行情 |
| 桑基图 | `sankey` | 流量转化 |

---

## 三、自定义系列（Custom Series）

### 3.1 custom 系列基础

当内置图表类型无法满足需求时，可以使用 `custom` 系列完全控制渲染逻辑。

```javascript
// 用 custom 系列绘制甘特图
const option = {
  xAxis: { type: 'value', min: 0, max: 100 },
  yAxis: {
    type: 'category',
    data: ['任务 A', '任务 B', '任务 C', '任务 D'],
  },
  series: [{
    type: 'custom',
    renderItem: function (params, api) {
      // 获取数据值
      const categoryIndex = api.value(0);
      const start = api.coord([api.value(1), categoryIndex]);
      const end = api.coord([api.value(2), categoryIndex]);
      const height = api.size([0, 1])[1] * 0.6;

      // 返回图形元素描述
      return {
        type: 'rect',
        shape: {
          x: start[0],
          y: start[1] - height / 2,
          width: end[0] - start[0],
          height: height,
        },
        style: {
          fill: api.visual('color'),
          opacity: 0.8,
        },
      };
    },
    encode: { x: [1, 2], y: 0 },
    data: [
      [0, 10, 30],  // 任务 A：10-30
      [1, 20, 50],  // 任务 B：20-50
      [2, 40, 70],  // 任务 C：40-70
      [3, 60, 90],  // 任务 D：60-90
    ],
  }],
};
```

### 3.2 renderItem 函数详解

```javascript
// renderItem 是 custom 系列的核心，负责将数据映射为图形
// 参数：
//   params - 包含 dataIndex、seriesIndex 等上下文信息
//   api    - 提供数据访问和坐标转换的工具方法

// api 常用方法：
// api.value(dim)          → 获取指定维度的数据值
// api.coord([x, y])       → 将数据坐标转换为像素坐标
// api.size([width, height])→ 将数据尺寸转换为像素尺寸
// api.style()             → 获取样式（自动映射 itemStyle）
// api.visual('color')     → 获取视觉映射的颜色

// 支持返回的图形元素类型：
// 'rect'     → 矩形
// 'circle'   → 圆形
// 'sector'   → 扇形（饼图）
// 'polygon'  → 多边形
// 'polyline' → 折线
// 'line'     → 直线
// 'bezierCurve' → 贝塞尔曲线
// 'arc'      → 弧线
// 'group'    → 分组（可以嵌套多个元素）
```

### 3.3 自定义水波图示例

```javascript
// 自定义水波图（球形进度）
function renderLiquid(params, api) {
  const centerX = api.coord([50, 50])[0];
  const centerY = api.coord([50, 50])[1];
  const radius = 80;
  const value = api.value(0);

  return {
    type: 'group',
    children: [
      // 背景圆
      {
        type: 'circle',
        shape: { cx: centerX, cy: centerY, r: radius },
        style: { fill: '#E5E7EB' },
      },
      // 水波（简化版）
      {
        type: 'sector',
        shape: {
          cx: centerX,
          cy: centerY,
          r: radius,
          startAngle: -Math.PI / 2,
          endAngle: -Math.PI / 2 + (value / 100) * Math.PI * 2,
        },
        style: { fill: '#4F46E5', opacity: 0.7 },
      },
      // 文字
      {
        type: 'text',
        style: {
          text: `${value}%`,
          x: centerX,
          y: centerY,
          textAlign: 'center',
          textVerticalAlign: 'middle',
          fontSize: 24,
          fontWeight: 'bold',
          fill: '#1F2937',
        },
      },
    ],
  };
}
```

---

## 四、性能优化

### 4.1 大数据量优化

```
ECharts 大数据量优化策略
══════════════════════════════════════════════════

  📌 数据层面
  ├── progressiveIncremental 渐进式渲染
  ├── dataZoom 数据缩放（只渲染可视区域）
  ├── 数据采样（sampling: 'lttb'）
  └── 数据降维（large: true）

  📌 渲染层面
  ├── 使用 Canvas 渲染器（大数据量优于 SVG）
  ├── 关闭不必要的动画（animation: false）
  ├── 关闭 tooltip 悬停检测（tooltip: { show: false }）
  └── 减少图层数量

  📌 交互层面
  ├── throttle 处理频繁事件
  ├── 使用 bindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbindbind
  └── 防抖处理 resize
```

```javascript
// 大数据量折线图优化配置
const option = {
  dataset: {
    source: largeDataArray, // 10 万+ 数据点
  },
  xAxis: { type: 'value' },
  yAxis: { type: 'value' },
  series: [{
    type: 'line',
    large: true,              // 启用大数据优化
    largeThreshold: 5000,     // 数据量阈值
    sampling: 'lttb',         // LTTB 采样算法（保留特征点）
    progressive: 400,         // 渐进式渲染，每帧绘制 400 个点
    progressiveThreshold: 10000,
    animation: false,         // 关闭动画
    showSymbol: false,        // 不显示标记点
    lineStyle: { width: 1 },
  }],
  tooltip: { trigger: 'axis' },
  dataZoom: [
    { type: 'inside' },
    { type: 'slider' },
  ],
};
```

### 4.2 按需引入

```javascript
// ❌ 全量引入（打包体积 ~1MB）
import * as echarts from 'echarts';

// ✅ 按需引入（打包体积 ~200KB）
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
  CanvasRenderer,
]);
```

### 4.3 实例管理

```javascript
class ChartManager {
  constructor() {
    this.charts = new Map();
    this.resizeObserver = null;
  }

  init(dom, theme, opts) {
    // 避免重复初始化
    if (this.charts.has(dom)) {
      return this.charts.get(dom);
    }

    const chart = echarts.init(dom, theme, opts);
    this.charts.set(dom, chart);

    // 自动响应容器大小变化
    if (!this.resizeObserver) {
      this.resizeObserver = new ResizeObserver(
        this.debounce(() => this.resizeAll(), 200)
      );
    }
    this.resizeObserver.observe(dom);

    return chart;
  }

  dispose(dom) {
    const chart = this.charts.get(dom);
    if (chart) {
      chart.dispose();
      this.charts.delete(dom);
    }
  }

  resizeAll() {
    for (const chart of this.charts.values()) {
      chart.resize();
    }
  }

  debounce(fn, delay) {
    let timer = null;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }
}
```

---

## 五、ECharts 事件系统

```javascript
// 1. 绑定事件
chart.on('click', (params) => {
  console.log('点击了:', params.name, params.value);
});

// 2. 特定系列的事件
chart.on('click', 'series.bar', (params) => {
  console.log('点击了柱状图:', params.dataIndex);
});

// 3. 组件事件
chart.on('legendselectchanged', (params) => {
  console.log('图例切换:', params.selected);
});

// 4. 解绑事件
chart.off('click');

// 5. 一次性事件
chart.once('click', handler);

// 常见事件列表：
// click, dblclick, mouseover, mouseout, mousemove,
// legendselectchanged, datazoom, maproam, brushSelected
```

---

## 六、面试要点

### 高频面试题

**Q1: ECharts 的底层渲染原理是什么？**

> ECharts 基于自研的 ZRender 渲染引擎，采用分层架构：配置层（option）→ 数据层（Model）→ 视图层（View）→ 渲染层（ZRender）。ZRender 支持 Canvas 和 SVG 两种渲染后端，内部维护图形元素的树形结构，通过脏区检测实现局部重绘。

**Q2: ECharts 如何优化大数据量渲染？**

> 1. `large: true` 启用大数据模式，使用简化渲染路径
> 2. `sampling: 'lttb'` 数据采样，保留趋势特征
> 3. `progressive` 渐进式渲染，避免单帧卡顿
> 4. `dataZoom` 只渲染可视区域
> 5. 关闭动画和不必要的交互

**Q3: 如何实现 ECharts 按需加载？**

> 使用 `echarts/core` 分模块引入。核心模块 + 需要的图表类型（charts）+ 需要的组件（components）+ 渲染器（renderers）。配合 `echarts.use()` 注册。webpack 的 tree-shaking 可以自动移除未使用的代码。

**Q4: ECharts 的 custom 系列有什么用？**

> 当内置图表类型无法满足需求时，custom 系列允许通过 `renderItem` 函数完全自定义图形渲染逻辑。可以自由组合 rect、circle、path 等图形元素，实现甘特图、漏斗图、自定义仪表盘等。

**Q5: ECharts 在 React 中使用要注意什么？**

> 1. 在 useEffect 中初始化，return 的清理函数中 dispose
> 2. 使用 ResizeObserver 监听容器变化
> 3. 避免每次渲染都 setOption（做 diff 或使用 ref）
> 4. 组件卸载时必须 dispose，防止内存泄漏
