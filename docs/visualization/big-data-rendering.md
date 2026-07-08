---
sidebar_position: 4
title: 大数据量渲染优化
difficulty: hard
tags:
  - 性能优化
  - 虚拟列表
  - web-worker
  - webgl
  - 大数据
---

# ⚡ 大数据量渲染优化

> **"当数据量达到 10 万、100 万级别时，常规 DOM 操作已经力不从心，必须使用专门的渲染策略"**

大数据量渲染是前端可视化中最具挑战性的问题之一。本节系统介绍虚拟列表、Canvas 分层渲染、Web Worker、WebGL 点渲染等核心优化技术。

## 一、问题分析

### 1.1 为什么大数据量渲染困难？

```
大数据量渲染的瓶颈
══════════════════════════════════════════════════

  数据量        DOM 节点数      渲染耗时      用户体验
  ──────        ──────────      ──────────    ──────────
  100           100             < 16ms        流畅 ✅
  1,000         1,000           ~ 50ms        卡顿 ⚠️
  10,000        10,000          ~ 500ms       明显卡顿 ❌
  100,000       100,000         ~ 5s          页面假死 💀
  1,000,000     不可行          OOM           崩溃 💀

  瓶颈分析：
  ├── DOM 操作：创建 10 万个 DOM 节点 ~ 3s
  ├── 布局计算：10 万个节点的 Layout ~ 2s
  ├── 绘制：10 万个节点的 Paint ~ 3s
  └── 内存：10 万个 DOM 节点 ~ 500MB
```

### 1.2 优化思路总览

```
大数据渲染优化策略
══════════════════════════════════════════════════

  ┌─────────────────────────────────────────────┐
  │  策略一：减少渲染节点                         │
  │  ├── 虚拟列表 / 虚拟滚动                     │
  │  ├── 分页加载                                │
  │  └── 数据抽样 / 降采样                       │
  ├─────────────────────────────────────────────┤
  │  策略二：降低单节点渲染成本                    │
  │  ├── Canvas 替代 DOM                         │
  │  ├── WebGL GPU 加速                          │
  │  └── CSS contain 限制重排范围                 │
  ├─────────────────────────────────────────────┤
  │  策略三：将计算移出主线程                      │
  │  ├── Web Worker 预处理数据                    │
  │  ├── OffscreenCanvas Worker 中渲染            │
  │  └── WASM 高性能计算                         │
  └─────────────────────────────────────────────┘
```

---

## 二、虚拟列表（Virtual Scrolling）

### 2.1 核心原理

```
虚拟列表原理
══════════════════════════════════════════════════

  可视区域（容器高度 400px，每项 40px，最多显示 10 项）

  ┌────────────────────────┐ ← 容器
  │  [0] item-0            │  ← scrollTop = 0
  │  [1] item-1            │
  │  [2] item-2            │
  │  [3] item-3            │
  │  [4] item-4            │
  │  [5] item-5            │
  │  [6] item-6            │
  │  [7] item-7            │
  │  [8] item-8            │
  │  [9] item-9            │
  └────────────────────────┘
  总数据 10,000 条，只渲染 10 条 DOM

  滚动后（scrollTop = 800）
  ┌────────────────────────┐
  │  占位元素（高度 800px）  │  ← 撑起滚动条
  ├────────────────────────┤
  │  [20] item-20          │  ← startIndex = 20
  │  [21] item-21          │
  │  ...                   │
  │  [29] item-29          │  ← endIndex = 29
  ├────────────────────────┤
  │  占位元素（高度 3920px） │  ← 撑起剩余高度
  └────────────────────────┘
```

### 2.2 基础实现

```javascript
class VirtualList {
  constructor(container, itemHeight, totalCount, renderItem) {
    this.container = container;
    this.itemHeight = itemHeight;
    this.totalCount = totalCount;
    this.renderItem = renderItem;

    // 可视区域能显示的条目数
    this.visibleCount = Math.ceil(container.clientHeight / itemHeight);

    // 创建内部结构
    this.content = document.createElement('div');
    this.content.style.position = 'relative';
    this.content.style.height = `${totalCount * itemHeight}px`;
    container.appendChild(this.content);

    // 缓冲区：上下各多渲染 5 项，减少滚动时的白屏
    this.bufferCount = 5;
    this.renderedItems = new Map();

    // 监听滚动
    container.addEventListener('scroll', this.onScroll.bind(this));
    this.onScroll();
  }

  onScroll() {
    const scrollTop = this.container.scrollTop;

    // 计算可见范围
    const startIndex = Math.max(0,
      Math.floor(scrollTop / this.itemHeight) - this.bufferCount
    );
    const endIndex = Math.min(this.totalCount - 1,
      startIndex + this.visibleCount + this.bufferCount * 2
    );

    // 移除不再可见的条目
    for (const [index, el] of this.renderedItems) {
      if (index < startIndex || index > endIndex) {
        el.remove();
        this.renderedItems.delete(index);
      }
    }

    // 添加新进入可见区域的条目
    for (let i = startIndex; i <= endIndex; i++) {
      if (!this.renderedItems.has(i)) {
        const el = this.renderItem(i);
        el.style.position = 'absolute';
        el.style.top = `${i * this.itemHeight}px`;
        el.style.height = `${this.itemHeight}px`;
        el.style.width = '100%';
        this.content.appendChild(el);
        this.renderedItems.set(i, el);
      }
    }
  }

  // 更新数据
  update(totalCount) {
    this.totalCount = totalCount;
    this.content.style.height = `${totalCount * this.itemHeight}px`;
    this.onScroll();
  }
}

// 使用示例
const container = document.getElementById('list-container');
const list = new VirtualList(container, 40, 100000, (index) => {
  const div = document.createElement('div');
  div.textContent = `Item ${index}`;
  div.style.padding = '0 16px';
  div.style.display = 'flex';
  div.style.alignItems = 'center';
  div.style.borderBottom = '1px solid #E5E7EB';
  return div;
});
```

### 2.3 动态高度虚拟列表

```javascript
// 动态高度的虚拟列表更复杂，需要预估或缓存每个条目的高度
class DynamicVirtualList {
  constructor(container, totalCount, renderItem) {
    this.container = container;
    this.totalCount = totalCount;
    this.renderItem = renderItem;

    // 缓存每个条目的高度和偏移量
    this.heightCache = new Map();
    this.offsetCache = new Map();

    // 估算高度（用于未测量的条目）
    this.estimatedHeight = 50;

    this.content = document.createElement('div');
    this.content.style.position = 'relative';
    container.appendChild(this.content);

    container.addEventListener('scroll', this.onScroll.bind(this));
  }

  // 获取条目偏移量（二分查找 + 缓存）
  getOffset(index) {
    if (this.offsetCache.has(index)) {
      return this.offsetCache.get(index);
    }
    // 简化实现：按估算高度计算
    const offset = index * this.estimatedHeight;
    this.offsetCache.set(index, offset);
    return offset;
  }

  // 测量并缓存实际高度
  measureItem(index, element) {
    const height = element.getBoundingClientRect().height;
    if (this.heightCache.get(index) !== height) {
      this.heightCache.set(index, height);
      // 高度变化后，后续条目的偏移量需要重新计算
      this.offsetCache.clear();
    }
  }

  onScroll() {
    const scrollTop = this.container.scrollTop;
    const containerHeight = this.container.clientHeight;

    // 二分查找 startIndex
    let startIndex = 0;
    for (let i = 0; i < this.totalCount; i++) {
      if (this.getOffset(i) + (this.heightCache.get(i) || this.estimatedHeight) > scrollTop) {
        startIndex = i;
        break;
      }
    }

    // 渲染可见条目
    let currentOffset = this.getOffset(startIndex);
    for (let i = startIndex; i < this.totalCount; i++) {
      if (currentOffset > scrollTop + containerHeight) break;

      const el = this.renderItem(i);
      el.style.position = 'absolute';
      el.style.top = `${currentOffset}px`;
      el.style.width = '100%';
      this.content.appendChild(el);
      this.measureItem(i, el);

      currentOffset += this.heightCache.get(i) || this.estimatedHeight;
    }

    // 更新总高度
    this.content.style.height = `${this.getOffset(this.totalCount - 1) +
      (this.heightCache.get(this.totalCount - 1) || this.estimatedHeight)}px`;
  }
}
```

---

## 三、Canvas 分层渲染

### 3.1 分层策略

```
Canvas 分层渲染架构
══════════════════════════════════════════════════

  层级          内容                更新频率
  ────          ────                ────────
  Layer 0       背景、网格线         极少（仅 resize 时）
  Layer 1       数据图形             数据变化时
  Layer 2       交互元素（hover）     鼠标移动时
  Layer 3       UI 控件              用户操作时

  ┌────────────────────────────┐
  │  Layer 3: UI（tooltip）     │  ← 最顶层
  ├────────────────────────────┤
  │  Layer 2: 交互（高亮）      │
  ├────────────────────────────┤
  │  Layer 1: 数据（散点）      │
  ├────────────────────────────┤
  │  Layer 0: 背景（网格）      │  ← 最底层
  └────────────────────────────┘
```

### 3.2 实现代码

```javascript
class MultiLayerCanvas {
  constructor(container, width, height) {
    this.layers = {};
    const layerNames = ['background', 'data', 'interaction', 'ui'];

    for (const name of layerNames) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: ${width}px;
        height: ${height}px;
      `;
      container.appendChild(canvas);
      this.layers[name] = {
        canvas,
        ctx: canvas.getContext('2d'),
        dirty: true,
      };
    }

    container.style.position = 'relative';
    container.style.width = `${width}px`;
    container.style.height = `${height}px`;
  }

  getCtx(layerName) {
    return this.layers[layerName].ctx;
  }

  markDirty(layerName) {
    this.layers[layerName].dirty = true;
  }

  render(drawFunctions) {
    for (const [name, layer] of Object.entries(this.layers)) {
      if (layer.dirty && drawFunctions[name]) {
        layer.ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
        drawFunctions[name](layer.ctx);
        layer.dirty = false;
      }
    }
  }
}
```

---

## 四、Web Worker 数据预处理

### 4.1 Worker 的作用

```
Web Worker 在大数据渲染中的角色
══════════════════════════════════════════════════

  主线程（Main Thread）         Worker 线程
  ──────────────────            ──────────────
  UI 渲染、用户交互              数据解析、计算
       │                            │
       │    postMessage(原始数据)     │
       │ ────────────────────────→ │
       │                            │ 数据排序/过滤
       │                            │ 坐标变换
       │                            │ 聚合计算
       │                            │ 碰撞检测
       │    postMessage(处理结果)     │
       │ ←──────────────────────── │
       │                            │
  只做渲染，不阻塞                不访问 DOM
```

### 4.2 Worker 实现

```javascript
// data-worker.js
self.onmessage = function (e) {
  const { type, data } = e.data;

  switch (type) {
    case 'processScatter': {
      const processed = processScatterData(data);
      self.postMessage({ type: 'scatterReady', data: processed });
      break;
    }
    case 'downsample': {
      const sampled = lttbDownsample(data.points, data.targetCount);
      self.postMessage({ type: 'sampleReady', data: sampled });
      break;
    }
  }
};

// LTTB 采样算法（Largest Triangle Three Buckets）
function lttbDownsample(data, threshold) {
  if (data.length <= threshold) return data;

  const sampled = [data[0]]; // 保留第一个点
  const bucketSize = (data.length - 2) / (threshold - 2);

  let prevIndex = 0;

  for (let i = 1; i < threshold - 1; i++) {
    const bucketStart = Math.floor((i - 1) * bucketSize) + 1;
    const bucketEnd = Math.min(
      Math.floor(i * bucketSize) + 1,
      data.length - 1
    );

    // 计算下一个桶的平均点
    const nextBucketStart = Math.floor(i * bucketSize) + 1;
    const nextBucketEnd = Math.min(
      Math.floor((i + 1) * bucketSize) + 1,
      data.length - 1
    );

    let avgX = 0, avgY = 0;
    for (let j = nextBucketStart; j < nextBucketEnd; j++) {
      avgX += data[j].x;
      avgY += data[j].y;
    }
    avgX /= (nextBucketEnd - nextBucketStart);
    avgY /= (nextBucketEnd - nextBucketStart);

    // 在当前桶中选择面积最大的点
    let maxArea = -1;
    let selectedIndex = bucketStart;
    const prevPoint = data[prevIndex];

    for (let j = bucketStart; j < bucketEnd; j++) {
      const area = Math.abs(
        (prevPoint.x - avgX) * (data[j].y - prevPoint.y) -
        (prevPoint.x - data[j].x) * (avgY - prevPoint.y)
      ) * 0.5;

      if (area > maxArea) {
        maxArea = area;
        selectedIndex = j;
      }
    }

    sampled.push(data[selectedIndex]);
    prevIndex = selectedIndex;
  }

  sampled.push(data[data.length - 1]); // 保留最后一个点
  return sampled;
}

// 处理散点数据（坐标变换、颜色映射等）
function processScatterData(rawData) {
  return rawData.map(item => ({
    x: normalizeX(item.value1),
    y: normalizeY(item.value2),
    radius: mapRadius(item.value3),
    color: mapColor(item.category),
    label: item.name,
  }));
}
```

### 4.3 主线程集成

```javascript
class DataProcessor {
  constructor(workerUrl) {
    this.worker = new Worker(workerUrl);
    this.callbacks = new Map();
    this.messageId = 0;

    this.worker.onmessage = (e) => {
      const { id, type, data } = e.data;
      const callback = this.callbacks.get(id);
      if (callback) {
        callback(data);
        this.callbacks.delete(id);
      }
    };
  }

  // 发送数据到 Worker 处理
  process(type, data) {
    return new Promise((resolve) => {
      const id = ++this.messageId;
      this.callbacks.set(id, resolve);
      this.worker.postMessage({ id, type, data });
    });
  }

  terminate() {
    this.worker.terminate();
  }
}

// 使用
const processor = new DataProcessor('data-worker.js');

async function renderChart(rawData) {
  // 在 Worker 中处理数据
  const processed = await processor.process('processScatter', rawData);

  // 主线程只负责渲染
  drawScatterChart(processed);
}
```

---

## 五、WebGL 点渲染

### 5.1 WebGL 大规模散点

```javascript
// 使用 WebGL 渲染 100 万个散点
class WebGLScatterPlot {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl', { antialias: true });
    this.initShaders();
    this.initBuffers();
  }

  initShaders() {
    const vertexSource = `
      attribute vec2 a_position;
      attribute vec4 a_color;
      attribute float a_size;
      uniform vec2 u_resolution;
      uniform vec2 u_translation;
      uniform vec2 u_scale;
      varying vec4 v_color;

      void main() {
        vec2 scaled = a_position * u_scale + u_translation;
        vec2 clipSpace = (scaled / u_resolution) * 2.0 - 1.0;
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
        gl_PointSize = a_size;
        v_color = a_color;
      }
    `;

    const fragmentSource = `
      precision mediump float;
      varying vec4 v_color;

      void main() {
        // 圆形点
        float dist = length(gl_PointCoord - vec2(0.5));
        if (dist > 0.5) discard;
        gl_FragColor = v_color;
      }
    `;

    this.program = this.createProgram(vertexSource, fragmentSource);
  }

  createProgram(vertexSource, fragmentSource) {
    const gl = this.gl;
    const vertexShader = this.createShader(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    return program;
  }

  createShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  }

  // 传入 100 万个点的数据
  setData(points) {
    const gl = this.gl;
    const positions = new Float32Array(points.length * 2);
    const colors = new Float32Array(points.length * 4);
    const sizes = new Float32Array(points.length);

    for (let i = 0; i < points.length; i++) {
      positions[i * 2] = points[i].x;
      positions[i * 2 + 1] = points[i].y;
      colors[i * 4] = points[i].r;
      colors[i * 4 + 1] = points[i].g;
      colors[i * 4 + 2] = points[i].b;
      colors[i * 4 + 3] = points[i].a;
      sizes[i] = points[i].size;
    }

    this.positionBuffer = this.createBuffer(positions);
    this.colorBuffer = this.createBuffer(colors);
    this.sizeBuffer = this.createBuffer(sizes);
    this.pointCount = points.length;
  }

  createBuffer(data) {
    const gl = this.gl;
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return buffer;
  }

  render(options = {}) {
    const gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.useProgram(this.program);

    // 设置 uniform
    const resLoc = gl.getUniformLocation(this.program, 'u_resolution');
    gl.uniform2f(resLoc, this.canvas.width, this.canvas.height);

    const transLoc = gl.getUniformLocation(this.program, 'u_translation');
    gl.uniform2f(transLoc, options.tx || 0, options.ty || 0);

    const scaleLoc = gl.getUniformLocation(this.program, 'u_scale');
    gl.uniform2f(scaleLoc, options.sx || 1, options.sy || 1);

    // 绑定属性
    this.bindAttribute('a_position', this.positionBuffer, 2);
    this.bindAttribute('a_color', this.colorBuffer, 4);
    this.bindAttribute('a_size', this.sizeBuffer, 1);

    gl.drawArrays(gl.POINTS, 0, this.pointCount);
  }

  bindAttribute(name, buffer, size) {
    const gl = this.gl;
    const loc = gl.getAttribLocation(this.program, name);
    gl.enableVertexAttribArray(loc);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
  }
}

// 使用：渲染 100 万个散点
const canvas = document.getElementById('gl-canvas');
const scatter = new WebGLScatterPlot(canvas);

// 生成 100 万个随机点
const points = Array.from({ length: 1000000 }, () => ({
  x: Math.random() * 800,
  y: Math.random() * 600,
  r: Math.random(),
  g: Math.random(),
  b: Math.random(),
  a: 0.7,
  size: 2 + Math.random() * 3,
}));

scatter.setData(points);
scatter.render(); // ~5ms 完成 100 万点的渲染
```

### 5.2 渲染性能对比

```
不同技术渲染 100,000 个数据点的性能对比
══════════════════════════════════════════════════

  技术            首次渲染    交互更新    内存占用
  ────            ────────    ────────    ────────
  DOM 元素         ~5000ms     不可用      ~2GB
  SVG 元素         ~3000ms     ~500ms      ~1.5GB
  Canvas 2D        ~200ms      ~100ms      ~200MB
  Canvas + 分层    ~150ms      ~20ms       ~250MB
  WebGL 点渲染     ~15ms       ~5ms        ~100MB
  WebGL + Worker   ~10ms       ~3ms        ~120MB

  结论：
  ├── 1,000 以内：SVG / DOM 即可
  ├── 1,000 ~ 10,000：Canvas 2D
  ├── 10,000 ~ 100,000：Canvas 分层 + 优化
  └── 100,000+：WebGL 是唯一选择
```

---

## 六、综合实战：万级数据地图散点

```javascript
// 综合运用多种优化技术渲染地图散点
class MapScatterRenderer {
  constructor(canvas, workerUrl) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.processor = new DataProcessor(workerUrl);
    this.layeredCanvas = new MultiLayerCanvas(
      canvas.parentElement, canvas.width, canvas.height
    );
  }

  async render(rawData) {
    // 1. Worker 预处理数据（坐标变换、聚合）
    const processed = await this.processor.process('processMapData', {
      data: rawData,
      bounds: this.getMapBounds(),
      zoom: this.currentZoom,
    });

    // 2. 离屏 Canvas 绘制背景（地图瓦片）
    if (!this.bgCanvas) {
      this.bgCanvas = document.createElement('canvas');
      this.bgCanvas.width = this.canvas.width;
      this.bgCanvas.height = this.canvas.height;
      this.renderMapBackground(this.bgCanvas.getContext('2d'));
    }

    // 3. 分层渲染
    this.layeredCanvas.render({
      background: (ctx) => {
        ctx.drawImage(this.bgCanvas, 0, 0);
      },
      data: (ctx) => {
        this.renderScatterPoints(ctx, processed.points);
      },
      interaction: (ctx) => {
        if (this.hoveredPoint) {
          this.renderHighlight(ctx, this.hoveredPoint);
        }
      },
      ui: (ctx) => {
        if (this.tooltipData) {
          this.renderTooltip(ctx, this.tooltipData);
        }
      },
    });
  }

  renderScatterPoints(ctx, points) {
    ctx.save();
    for (const point of points) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
      ctx.fillStyle = point.color;
      ctx.globalAlpha = point.opacity;
      ctx.fill();
    }
    ctx.restore();
  }
}
```

---

## 七、面试要点

### 高频面试题

**Q1: 虚拟列表的核心原理是什么？**

> 只渲染可视区域内的 DOM 元素。通过计算 scrollTop 确定 startIndex 和 endIndex，用占位元素撑起总高度，只创建可见范围内的真实 DOM。加上上下缓冲区减少滚动白屏。

**Q2: Canvas 分层渲染的意义？**

> 将不同更新频率的内容放在不同 Canvas 层。静态背景层极少重绘，数据层只在数据变化时重绘，交互层跟随鼠标移动重绘。避免因局部变化导致全量重绘，显著降低每帧绘制开销。

**Q3: Web Worker 在大数据渲染中的作用？**

> 将数据解析、排序、过滤、坐标变换、采样等 CPU 密集计算移到 Worker 线程，避免阻塞主线程的 UI 渲染和用户交互。Worker 不能操作 DOM，通过 postMessage 与主线程通信。

**Q4: WebGL 为什么比 Canvas 2D 快？**

> WebGL 利用 GPU 的大规模并行计算能力。100 万个点的顶点变换和片元着色在 GPU 上并行执行，而 Canvas 2D 是 CPU 逐像素绘制。对于大量同质图形（如散点），WebGL 有数量级的性能优势。

**Q5: LTTB 采样算法的原理？**

> LTTB（Largest Triangle Three Buckets）将数据分成 N 个桶，在每个桶中选择与前后桶平均值构成三角形面积最大的点。这样保留了数据的趋势特征（极值、拐点），在大幅减少数据量的同时保持可视化效果。

**Q6: 如何处理虚拟列表中动态高度的条目？**

> 1. 先用估算高度布局，渲染后测量实际高度并缓存
> 2. 高度变化后重建偏移量索引（可用前缀和数组加速）
> 3. 使用 ResizeObserver 监听条目高度变化
> 4. 二分查找快速定位 startIndex
