---
sidebar_position: 1
title: Canvas 编程与性能优化
difficulty: hard
tags:
  - canvas
  - webgl
  - 可视化
  - 动画
---

# 🖼️ Canvas 编程与性能优化

> **"Canvas 是一块画布，你用 JavaScript 的画笔在上面作画"** —— Canvas 是前端可视化最基础、最灵活的渲染技术。

## 一、Canvas 基础

### 1.1 Canvas 2D 坐标系

```
Canvas 2D 坐标系
────────────────────────────────────────

  (0,0) ─────────────────→ X (width)
    │
    │    ┌───────────┐
    │    │  绘图区域   │
    │    │           │
    │    └───────────┘
    │
    ↓
    Y (height)

  原点在左上角
  X 轴向右递增
  Y 轴向下递增
```

### 1.2 基本绘图 API

```javascript
// 获取 Canvas 上下文
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// 1. 绘制矩形
ctx.fillStyle = '#4F46E5';
ctx.fillRect(10, 10, 150, 100);

ctx.strokeStyle = '#EF4444';
ctx.lineWidth = 2;
ctx.strokeRect(10, 120, 150, 100);

// 2. 绘制路径
ctx.beginPath();
ctx.moveTo(200, 50);
ctx.lineTo(300, 50);
ctx.lineTo(250, 150);
ctx.closePath();
ctx.fillStyle = '#10B981';
ctx.fill();

// 3. 绘制圆弧
ctx.beginPath();
ctx.arc(400, 100, 50, 0, Math.PI * 2);
ctx.fillStyle = '#F59E0B';
ctx.fill();

// 4. 绘制文字
ctx.font = '16px sans-serif';
ctx.fillStyle = '#1F2937';
ctx.fillText('Hello Canvas', 200, 200);

// 5. 绘制贝塞尔曲线
ctx.beginPath();
ctx.moveTo(50, 300);
ctx.bezierCurveTo(150, 200, 250, 400, 350, 300);
ctx.strokeStyle = '#8B5CF6';
ctx.lineWidth = 3;
ctx.stroke();
```

### 1.3 Canvas 状态管理

```javascript
// save() 保存当前状态，restore() 恢复上一次保存的状态
ctx.save();                    // 保存状态 A
ctx.fillStyle = 'red';
ctx.fillRect(10, 10, 100, 100);

  ctx.save();                  // 保存状态 B
  ctx.fillStyle = 'blue';
  ctx.translate(200, 0);
  ctx.fillRect(10, 10, 100, 100);

  ctx.restore();               // 恢复状态 B

ctx.restore();                 // 恢复状态 A
// 此时 fillStyle 仍然是 'red'，translate 已重置
```

**状态栈包含以下属性：**
- `fillStyle`、`strokeStyle`、`globalAlpha`
- `lineWidth`、`lineCap`、`lineJoin`
- `transform`（矩阵变换）
- `clip`（裁剪区域）

---

## 二、Canvas 动画与 requestAnimationFrame

### 2.1 requestAnimationFrame 原理

```
浏览器渲染帧生命周期
────────────────────────────────────────

  ┌─────────┐   ┌──────────┐   ┌─────────┐   ┌──────────┐
  │  Input   │→│ rAF 回调  │→│  Layout  │→│  Paint   │→ Composite
  │  Events  │   │(你的代码) │   │  计算    │   │  绘制    │
  └─────────┘   └──────────┘   └─────────┘   └──────────┘

  关键特性：
  ├── 与浏览器刷新率同步（通常 60fps = 16.67ms/帧）
  ├── 页面不可见时自动暂停（省电）
  ├── 返回一个 ID，可用于取消
  └── 回调接收高精度时间戳参数
```

### 2.2 动画循环实现

```javascript
function createAnimationLoop(canvas) {
  const ctx = canvas.getContext('2d');
  let animationId = null;
  let lastTime = 0;

  // 动画状态
  const state = {
    x: 50,
    y: 50,
    vx: 200, // 水平速度（像素/秒）
    vy: 150, // 垂直速度
    radius: 20,
  };

  function update(deltaTime) {
    // 使用 deltaTime 保证帧率无关的运动
    state.x += state.vx * deltaTime;
    state.y += state.vy * deltaTime;

    // 边界反弹
    if (state.x - state.radius < 0 || state.x + state.radius > canvas.width) {
      state.vx *= -1;
    }
    if (state.y - state.radius < 0 || state.y + state.radius > canvas.height) {
      state.vy *= -1;
    }
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.arc(state.x, state.y, state.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#4F46E5';
    ctx.fill();
  }

  function loop(timestamp) {
    // 计算 deltaTime（秒），第一帧设为 0
    const deltaTime = lastTime ? (timestamp - lastTime) / 1000 : 0;
    lastTime = timestamp;

    update(deltaTime);
    render();

    animationId = requestAnimationFrame(loop);
  }

  return {
    start() {
      animationId = requestAnimationFrame(loop);
    },
    stop() {
      cancelAnimationFrame(animationId);
    },
  };
}
```

### 2.3 与 setTimeout/setInterval 的对比

| 特性 | requestAnimationFrame | setTimeout/setInterval |
|------|----------------------|----------------------|
| 同步刷新率 | 自动同步 | 不同步，可能丢帧 |
| 后台标签 | 自动暂停 | 继续执行，浪费资源 |
| 回调精度 | 高精度时间戳 | 无 |
| 多任务合并 | 浏览器自动合并 | 多个回调可能竞争 |
| 推荐场景 | 动画、游戏循环 | 延迟执行、轮询 |

---

## 三、离屏 Canvas（OffscreenCanvas）

### 3.1 为什么需要离屏 Canvas？

```
问题场景：频繁重绘复杂静态内容
────────────────────────────────────────

  每一帧都要重新绘制背景（1000 个元素）
       ↓
  主 Canvas 每帧耗时 15ms（接近 16.67ms 上限）
       ↓
  帧率下降，动画卡顿

解决方案：离屏 Canvas 缓存
────────────────────────────────────────

  1. 将静态内容绘制到离屏 Canvas（一次性）
  2. 每帧只将离屏 Canvas 作为图片绘制到主 Canvas
  3. 主 Canvas 每帧耗时降至 2ms
```

### 3.2 主线程离屏 Canvas

```javascript
// 创建离屏 Canvas
function createOffscreenCanvas(width, height) {
  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;
  return offscreen;
}

// 预渲染静态内容到离屏 Canvas
function prerenderBackground(offscreen) {
  const ctx = offscreen.getContext('2d');

  // 绘制复杂的静态背景（1000 个网格点）
  for (let i = 0; i < 50; i++) {
    for (let j = 0; j < 50; j++) {
      ctx.beginPath();
      ctx.arc(i * 20 + 10, j * 20 + 10, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#E5E7EB';
      ctx.fill();
    }
  }

  return offscreen;
}

// 主 Canvas 每帧只需要这一行
function renderFrame(mainCtx, offscreen, dynamicState) {
  // 1. 绘制缓存的背景（极快，相当于 drawImage）
  mainCtx.drawImage(offscreen, 0, 0);

  // 2. 只绘制动态内容
  mainCtx.beginPath();
  mainCtx.arc(dynamicState.x, dynamicState.y, 20, 0, Math.PI * 2);
  mainCtx.fillStyle = '#EF4444';
  mainCtx.fill();
}
```

### 3.3 Web Worker 中的 OffscreenCanvas

```javascript
// 主线程：将 Canvas 控制权转移到 Worker
const canvas = document.getElementById('canvas');
const offscreen = canvas.transferControlToOffscreen();
const worker = new Worker('render-worker.js');
worker.postMessage({ canvas: offscreen }, [offscreen]);

// render-worker.js（Worker 线程）
self.onmessage = function (e) {
  const canvas = e.data.canvas;
  const ctx = canvas.getContext('2d');

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // 在 Worker 中执行渲染逻辑，不阻塞主线程
    drawComplexScene(ctx);
    requestAnimationFrame(render);
  }

  render();
};
```

**OffscreenCanvas 的核心优势：**
- 渲染逻辑在 Worker 线程执行，不阻塞主线程
- 主线程可以专注于用户交互和业务逻辑
- 适合计算密集型的可视化场景

---

## 四、WebGL 基础

### 4.1 WebGL 渲染管线

```
WebGL 渲染管线（简化版）
══════════════════════════════════════════════════

  JavaScript                    GPU
  ──────────                    ───
  顶点数据 → 顶点缓冲区
                ↓
          ┌─────────────┐
          │  顶点着色器   │  ← 处理每个顶点的位置、颜色
          └──────┬──────┘
                 ↓
          ┌─────────────┐
          │  图元装配    │  ← 将顶点组装成三角形
          └──────┬──────┘
                 ↓
          ┌─────────────┐
          │  光栅化      │  ← 将三角形转为片元（像素）
          └──────┬──────┘
                 ↓
          ┌─────────────┐
          │  片元着色器   │  ← 计算每个像素的最终颜色
          └──────┬──────┘
                 ↓
          ┌─────────────┐
          │  帧缓冲区    │  ← 输出到屏幕
          └─────────────┘
```

### 4.2 WebGL 基础示例：绘制三角形

```javascript
// 1. 获取 WebGL 上下文
const canvas = document.getElementById('gl-canvas');
const gl = canvas.getContext('webgl');

// 2. 顶点着色器（GLSL）
const vertexShaderSource = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

// 3. 片元着色器（GLSL）
const fragmentShaderSource = `
  precision mediump float;
  uniform vec4 u_color;
  void main() {
    gl_FragColor = u_color;
  }
`;

// 4. 编译着色器
function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

// 5. 创建程序并链接
const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

// 6. 传入顶点数据
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
  0.0,  0.5,
  -0.5, -0.5,
  0.5, -0.5,
]), gl.STATIC_DRAW);

// 7. 绘制
gl.useProgram(program);
const positionLocation = gl.getAttribLocation(program, 'a_position');
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

const colorLocation = gl.getUniformLocation(program, 'u_color');
gl.uniform4f(colorLocation, 0.31, 0.27, 0.9, 1.0);

gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(1.0, 1.0, 1.0, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);
gl.drawArrays(gl.TRIANGLES, 0, 3);
```

---

## 五、Canvas 性能优化

### 5.1 常见优化手段

```
Canvas 性能优化清单
══════════════════════════════════════════════════

  📌 减少绘制次数
  ├── 批量绘制同类图形
  ├── 合并路径（一次 beginPath 多次 path 操作）
  └── 使用离屏 Canvas 缓存静态内容

  📌 减少绘制面积
  ├── 只重绘变化区域（脏矩形）
  ├── 分层 Canvas（背景层 + 动态层 + UI 层）
  └── 使用 clip() 限制绘制范围

  📌 减少状态切换
  ├── 按状态排序绘制（先画所有红色，再画所有蓝色）
  └── 避免频繁 save/restore

  📌 利用 GPU
  ├── 使用 WebGL 替代 2D（大规模数据）
  ├── willReadFrequently: false（默认）
  └── CSS transform 代替 Canvas 内部变换
```

### 5.2 分层 Canvas

```html
<!-- 多层 Canvas 堆叠 -->
<div class="canvas-container" style="position: relative;">
  <canvas id="bg-layer" style="position: absolute; top: 0; left: 0;"></canvas>
  <canvas id="main-layer" style="position: absolute; top: 0; left: 0;"></canvas>
  <canvas id="ui-layer" style="position: absolute; top: 0; left: 0;"></canvas>
</div>
```

```javascript
// 各层独立管理，按需重绘
class LayeredCanvas {
  constructor(container, width, height) {
    this.layers = {};
    this.layerNames = ['bg', 'main', 'ui'];

    for (const name of this.layerNames) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.style.cssText = 'position:absolute;top:0;left:0;';
      container.appendChild(canvas);
      this.layers[name] = {
        canvas,
        ctx: canvas.getContext('2d'),
        dirty: true,
      };
    }
  }

  // 只重绘标记为 dirty 的层
  render() {
    for (const name of this.layerNames) {
      const layer = this.layers[name];
      if (layer.dirty) {
        layer.ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
        this.drawLayer(name, layer.ctx);
        layer.dirty = false;
      }
    }
  }

  markDirty(name) {
    this.layers[name].dirty = true;
  }

  drawLayer(name, ctx) {
    // 各层的绘制逻辑由子类实现
  }
}
```

### 5.3 脏矩形优化

```javascript
class DirtyRectRenderer {
  constructor(ctx) {
    this.ctx = ctx;
    this.dirtyRects = [];
  }

  // 标记需要重绘的区域
  markDirty(x, y, width, height) {
    this.dirtyRects.push({ x, y, width, height });
  }

  // 只重绘脏区域
  render(objects) {
    if (this.dirtyRects.length === 0) return;

    // 合并脏矩形（简单策略：取外接矩形）
    const merged = this.mergeRects(this.dirtyRects);

    for (const rect of merged) {
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.rect(rect.x, rect.y, rect.width, rect.height);
      this.ctx.clip();
      this.ctx.clearRect(rect.x, rect.y, rect.width, rect.height);

      // 只绘制与脏区域相交的对象
      for (const obj of objects) {
        if (this.intersects(rect, obj.bounds)) {
          obj.draw(this.ctx);
        }
      }

      this.ctx.restore();
    }

    this.dirtyRects = [];
  }

  mergeRects(rects) {
    if (rects.length <= 1) return rects;
    const minX = Math.min(...rects.map(r => r.x));
    const minY = Math.min(...rects.map(r => r.y));
    const maxX = Math.max(...rects.map(r => r.x + r.width));
    const maxY = Math.max(...rects.map(r => r.y + r.height));
    return [{ x: minX, y: minY, width: maxX - minX, height: maxY - minY }];
  }

  intersects(a, b) {
    return !(a.x > b.x + b.width || a.x + a.width < b.x ||
             a.y > b.y + b.height || a.y + a.height < b.y);
  }
}
```

### 5.4 willReadFrequently 选项

```javascript
// 如果需要频繁读取像素（如 getImageData），设置此选项
const ctx = canvas.getContext('2d', { willReadFrequently: true });

// 这会让浏览器使用 CPU 缓存而非 GPU 纹理，避免回读开销
// 典型场景：像素级碰撞检测、图像滤镜处理
```

---

## 六、面试要点

### 高频面试题

**Q1: Canvas 和 SVG 的核心区别？**

> Canvas 是位图渲染，绘制后无法修改单个元素；SVG 是矢量渲染，每个图形元素都是 DOM 节点。Canvas 适合大量元素和像素级操作，SVG 适合需要独立交互的少量元素。

**Q2: requestAnimationFrame 的回调在什么时候执行？**

> 在浏览器下一次重绘之前执行，通常与显示器刷新率同步（60fps = 16.67ms）。页面不可见时会自动暂停。

**Q3: 离屏 Canvas 的作用是什么？**

> 将复杂的静态内容预渲染到离屏 Canvas，主 Canvas 每帧只需要 drawImage 一次，避免重复绘制。相当于"缓存"。

**Q4: Canvas 动画卡顿如何排查？**

> 1. 用 Chrome DevTools Performance 面板录制，查看长任务
> 2. 检查是否有不必要的重绘（分层 + 脏矩形）
> 3. 检查是否有阻塞主线程的计算（移至 Worker）
> 4. 减少 drawImage 和状态切换次数

**Q5: WebGL 比 Canvas 2D 快在哪？**

> WebGL 利用 GPU 并行计算，顶点和片元着色器在 GPU 上执行。Canvas 2D 是 CPU 逐像素绘制。对于大量图形或复杂计算，WebGL 有数量级的性能优势。
