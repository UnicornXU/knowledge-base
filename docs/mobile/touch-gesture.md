---
sidebar_position: 6
title: '触摸与手势交互'
difficulty: 'hard'
tags: ['移动端', 'touch', '手势', '交互']
---

# 触摸与手势交互

移动端交互的核心是触摸事件。理解触摸事件体系、解决历史遗留问题（300ms延迟、点击穿透）、实现常用手势识别，是构建流畅移动端体验的基础。

## Touch 事件体系

### 触摸事件类型

| 事件        | 触发时机                  | 类比鼠标事件 |
| ----------- | ------------------------- | ------------ |
| touchstart  | 手指触碰屏幕              | mousedown    |
| touchmove   | 手指在屏幕上滑动          | mousemove    |
| touchend    | 手指离开屏幕              | mouseup      |
| touchcancel | 系统取消触摸（来电/弹窗） | -            |

### 事件对象属性

```javascript
element.addEventListener('touchstart', (e) => {
  // touches: 当前屏幕上所有触摸点
  // targetTouches: 当前元素上的触摸点
  // changedTouches: 引起事件的触摸点（在touchend中特别有用）

  const touch = e.touches[0];
  console.log({
    identifier: touch.identifier, // 触摸点唯一标识
    clientX: touch.clientX, // 相对视口的X坐标
    clientY: touch.clientY, // 相对视口的Y坐标
    pageX: touch.pageX, // 相对页面的X坐标
    pageY: touch.pageY, // 相对页面的Y坐标
    screenX: touch.screenX, // 相对屏幕的X坐标
    screenY: touch.screenY, // 相对屏幕的Y坐标
    target: touch.target, // 触摸点所在的DOM元素
    radiusX: touch.radiusX, // 触摸椭圆X半径
    radiusY: touch.radiusY, // 触摸椭圆Y半径
    force: touch.force, // 压力值 0-1
  });
});
```

:::info 注意
`touchend` 事件的 `e.touches` 为空（因为手指已离开），要获取最后的触摸位置需使用 `e.changedTouches[0]`。
:::

## Touch vs Mouse vs Pointer 事件对比

| 特性       | Touch Events | Mouse Events | Pointer Events    |
| ---------- | ------------ | ------------ | ----------------- |
| 多点触控   | ✓            | ✗            | ✓                 |
| 触控笔支持 | ✗            | ✗            | ✓                 |
| 统一API    | ✗            | ✗            | ✓                 |
| 兼容性     | 移动端极好   | 全平台       | 现代浏览器        |
| 事件前缀   | touch-       | mouse-       | pointer-          |
| 取消操作   | touchcancel  | -            | pointercancel     |
| 捕获       | -            | setCapture   | setPointerCapture |

```javascript
// Pointer Events - 统一处理触摸/鼠标/触控笔
element.addEventListener('pointerdown', (e) => {
  console.log(e.pointerType); // 'mouse' | 'touch' | 'pen'
  console.log(e.pressure); // 压力值
  console.log(e.pointerId); // 指针ID（多点触控）
});
```

:::tip 推荐
新项目优先使用 **Pointer Events**，它统一了所有输入设备的处理。当需要精细的多指手势控制时，再配合 Touch Events 使用。
:::

## 300ms 延迟问题

### 历史原因

早期移动浏览器需要判断用户是"单击"还是"双击缩放"，因此在 `touchend` 后等待 300ms 才触发 `click` 事件。

```
touchstart → touchend → [等待300ms] → click
                         ↑ 这段延迟导致交互不跟手
```

### 现代解决方案

**方案一：viewport 设置（推荐）**

```html
<!-- 禁止缩放，浏览器无需等待双击判断 -->
<meta name="viewport" content="width=device-width" />
```

现代浏览器（Chrome 32+、iOS 9.3+）在检测到 `width=device-width` 后自动移除 300ms 延迟。

**方案二：touch-action CSS 属性**

```css
/* 告知浏览器不需要处理双击缩放 */
.btn {
  touch-action: manipulation;
}

/* 全局禁用 */
html {
  touch-action: manipulation;
}
```

**FastClick 原理与为什么不再需要**

```javascript
// FastClick 核心原理（简化）
// 1. 监听 touchend
// 2. 立即派发一个合成的 click 事件
// 3. 阻止 300ms 后的原生 click

element.addEventListener('touchend', function (e) {
  e.preventDefault();
  const clickEvent = new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
  });
  e.target.dispatchEvent(clickEvent);
});
```

:::warning 不再需要 FastClick
2024 年以后，所有主流浏览器已原生解决 300ms 延迟。使用 `<meta name="viewport">` + `touch-action: manipulation` 即可。FastClick 反而会引入兼容性问题。
:::

## 手势识别实现

### 单击/双击/长按

```javascript
class GestureDetector {
  constructor(element) {
    this.el = element;
    this.tapTimeout = null;
    this.longTapTimeout = null;
    this.tapCount = 0;
    this.startTime = 0;
    this.startX = 0;
    this.startY = 0;
    this.callbacks = {};

    this._bindEvents();
  }

  on(event, callback) {
    this.callbacks[event] = callback;
    return this;
  }

  _emit(event, data) {
    this.callbacks[event]?.call(this, data);
  }

  _bindEvents() {
    this.el.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      this.startX = touch.clientX;
      this.startY = touch.clientY;
      this.startTime = Date.now();

      // 长按检测（超过750ms）
      this.longTapTimeout = setTimeout(() => {
        this._emit('longTap', {x: this.startX, y: this.startY});
      }, 750);
    });

    this.el.addEventListener('touchmove', (e) => {
      // 移动超过10px取消长按
      const touch = e.touches[0];
      if (Math.abs(touch.clientX - this.startX) > 10 || Math.abs(touch.clientY - this.startY) > 10) {
        clearTimeout(this.longTapTimeout);
      }
    });

    this.el.addEventListener('touchend', (e) => {
      clearTimeout(this.longTapTimeout);
      const duration = Date.now() - this.startTime;

      if (duration < 300) {
        this.tapCount++;
        clearTimeout(this.tapTimeout);
        this.tapTimeout = setTimeout(() => {
          if (this.tapCount === 1) this._emit('tap', e);
          if (this.tapCount >= 2) this._emit('doubleTap', e);
          this.tapCount = 0;
        }, 250);
      }
    });
  }
}

// 使用
const gesture = new GestureDetector(document.getElementById('app'));
gesture
  .on('tap', () => console.log('单击'))
  .on('doubleTap', () => console.log('双击'))
  .on('longTap', () => console.log('长按'));
```

### 滑动方向判断

```javascript
function detectSwipe(element, callback) {
  let startX, startY, startTime;
  const threshold = 50; // 最小滑动距离
  const maxTime = 300; // 最大滑动时间

  element.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    startTime = Date.now();
  });

  element.addEventListener('touchend', (e) => {
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;
    const deltaTime = Date.now() - startTime;

    if (deltaTime > maxTime) return;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (Math.max(absX, absY) < threshold) return;

    let direction;
    if (absX > absY) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }

    callback({
      direction,
      deltaX,
      deltaY,
      velocity: Math.max(absX, absY) / deltaTime,
    });
  });
}

// 使用
detectSwipe(document.body, ({direction, velocity}) => {
  console.log(`滑动方向: ${direction}, 速度: ${velocity}`);
});
```

### 双指缩放（Pinch）

```javascript
function detectPinch(element, callback) {
  let initialDistance = 0;
  let currentScale = 1;

  function getDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  element.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      initialDistance = getDistance(e.touches);
      e.preventDefault();
    }
  });

  element.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2) {
      const currentDistance = getDistance(e.touches);
      const scale = currentDistance / initialDistance;
      currentScale = Math.min(Math.max(scale, 0.5), 3); // 限制范围

      callback({
        scale: currentScale,
        center: {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        },
      });
      e.preventDefault();
    }
  });
}

// 使用
detectPinch(imageEl, ({scale, center}) => {
  imageEl.style.transform = `scale(${scale})`;
});
```

## 惯性滚动

```javascript
class MomentumScroll {
  constructor(element) {
    this.el = element;
    this.position = 0;
    this.velocity = 0;
    this.lastY = 0;
    this.lastTime = 0;
    this.animationId = null;

    this._bindEvents();
  }

  _bindEvents() {
    this.el.addEventListener('touchstart', (e) => {
      cancelAnimationFrame(this.animationId);
      this.lastY = e.touches[0].clientY;
      this.lastTime = Date.now();
      this.velocity = 0;
    });

    this.el.addEventListener('touchmove', (e) => {
      const currentY = e.touches[0].clientY;
      const currentTime = Date.now();
      const deltaY = currentY - this.lastY;
      const deltaTime = currentTime - this.lastTime;

      this.velocity = deltaY / (deltaTime || 1);
      this.position += deltaY;
      this._updatePosition();

      this.lastY = currentY;
      this.lastTime = currentTime;
      e.preventDefault();
    });

    this.el.addEventListener('touchend', () => {
      this._startMomentum();
    });
  }

  _startMomentum() {
    const friction = 0.95; // 摩擦系数
    const minVelocity = 0.1;

    const animate = () => {
      this.velocity *= friction;
      if (Math.abs(this.velocity) < minVelocity) return;

      this.position += this.velocity * 16; // 约16ms一帧
      this._updatePosition();
      this.animationId = requestAnimationFrame(animate);
    };

    this.animationId = requestAnimationFrame(animate);
  }

  _updatePosition() {
    this.el.style.transform = `translateY(${this.position}px)`;
  }
}
```

## 手势库对比

| 特性       | Hammer.js  | AlloyFinger | use-gesture (React) |
| ---------- | ---------- | ----------- | ------------------- |
| 体积       | 7.3KB gzip | 3.3KB gzip  | 8.5KB gzip          |
| 框架依赖   | 无         | 无          | React               |
| 手势类型   | 全面       | 全面        | 全面                |
| 多指支持   | ✓          | ✓           | ✓                   |
| TypeScript | 有类型     | 无          | 原生 TS             |
| 维护状态   | 停止维护   | 低频        | 活跃                |
| 适用场景   | 传统项目   | 轻量需求    | React 项目          |

## 点击穿透问题

### 问题描述

上层元素绑定 `touchstart` 隐藏后，300ms 后的 `click` 事件会触发在下层元素上。

```javascript
// 蒙层点击关闭 → 下层按钮被意外点击
overlay.addEventListener('touchstart', () => {
  overlay.style.display = 'none';
  // 300ms后 click 穿透到下面的按钮
});
```

### 解决方案

```javascript
// 方案1：使用 click 事件代替 touchstart（最简单）
overlay.addEventListener('click', () => {
  overlay.style.display = 'none';
});

// 方案2：延迟隐藏
overlay.addEventListener('touchstart', () => {
  setTimeout(() => {
    overlay.style.display = 'none';
  }, 350);
});

// 方案3：阻止默认事件
overlay.addEventListener('touchstart', (e) => {
  e.preventDefault();
  overlay.style.display = 'none';
});

// 方案4：pointer-events 过渡
overlay.addEventListener('touchstart', () => {
  overlay.style.display = 'none';
  document.body.style.pointerEvents = 'none';
  setTimeout(() => {
    document.body.style.pointerEvents = '';
  }, 350);
});
```

:::tip 现代最佳实践
在配置了 `touch-action: manipulation` 且无 300ms 延迟的现代浏览器中，点击穿透问题已基本不存在。统一使用 `click` 事件（或 Pointer Events）即可。
:::

## 面试高频题

### Q1：touch 事件和 click 事件的触发顺序是什么？

**答：** touchstart → touchmove → touchend → (300ms延迟) → mousedown → mouseup → click。现代浏览器在配置 viewport 后不再有 300ms 延迟。

### Q2：如何实现一个流畅的移动端拖拽？

**答：** 使用 touchstart 记录初始位置，touchmove 中计算偏移并更新 transform（比 top/left 性能好），touchend 结束。关键优化：使用 `will-change: transform`、`touch-action: none` 阻止默认滚动、requestAnimationFrame 节流渲染。

### Q3：300ms 延迟是什么？现在还存在吗？

**答：** 历史上移动浏览器为判断双击缩放会等待 300ms 才触发 click。现代浏览器（Chrome 32+/iOS 9.3+）在设置 `width=device-width` 的 viewport 或 `touch-action: manipulation` 后已自动去除。FastClick 等库已无必要。

### Q4：什么是点击穿透？怎么解决？

**答：** 上层元素在 touchstart 中隐藏后，300ms 后的 click 事件穿透到下层。解决：①统一使用 click 事件；②延迟 350ms 隐藏；③e.preventDefault() 阻止后续事件链；④现代浏览器无 300ms 延迟则不存在此问题。

### Q5：Pointer Events 相比 Touch Events 有什么优势？

**答：** Pointer Events 统一了鼠标、触控、触控笔的事件处理，提供 pointerType 区分输入来源、setPointerCapture 捕获指针、pressure 压力感应等特性。代码一套逻辑兼容所有设备，是 W3C 推荐的标准。
