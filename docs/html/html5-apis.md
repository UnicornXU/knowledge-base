---
sidebar_position: 4
title: 'HTML5 新特性与 API'
difficulty: 'medium'
tags: ['html5', 'API', '拖拽', '地理位置', 'History']
---

# HTML5 新特性与 API

## HTML5 新特性全景概览

| 分类   | 特性           | 说明                             |
| ------ | -------------- | -------------------------------- |
| 语义   | 新标签         | header、nav、article、section 等 |
| 表单   | 新 input 类型  | email、date、range、color 等     |
| 多媒体 | audio/video    | 原生音视频支持，无需 Flash       |
| 图形   | Canvas/SVG     | 2D绘图、矢量图形                 |
| 存储   | Web Storage    | localStorage/sessionStorage      |
| 通信   | WebSocket      | 全双工实时通信                   |
| 离线   | Service Worker | 离线应用、后台同步               |
| 拖拽   | Drag and Drop  | 原生拖放 API                     |
| 定位   | Geolocation    | 获取用户地理位置                 |
| 历史   | History API    | 无刷新操作浏览器历史             |
| 并发   | Web Worker     | 多线程计算                       |
| 文件   | File API       | 本地文件读取                     |

## Drag and Drop API

### 事件流

拖拽操作涉及**拖拽源**和**放置目标**两个角色：

| 事件        | 触发对象 | 触发时机                           |
| ----------- | -------- | ---------------------------------- |
| `dragstart` | 拖拽源   | 开始拖拽时                         |
| `drag`      | 拖拽源   | 拖拽过程中持续触发                 |
| `dragend`   | 拖拽源   | 拖拽结束（不管是否放置成功）       |
| `dragenter` | 目标     | 拖拽进入目标区域                   |
| `dragover`  | 目标     | 在目标区域上方移动（必须阻止默认） |
| `dragleave` | 目标     | 离开目标区域                       |
| `drop`      | 目标     | 在目标区域释放                     |

:::warning 关键点
必须在 `dragover` 事件中调用 `e.preventDefault()`，否则 `drop` 事件不会触发！浏览器默认不允许放置。
:::

### 实战：文件拖拽上传

```html
<div id="drop-zone" class="drop-zone">
  <p>将文件拖拽到这里上传</p>
</div>
<div id="preview"></div>
```

```javascript
const dropZone = document.getElementById('drop-zone');
const preview = document.getElementById('preview');

// 必须阻止 dragover 的默认行为
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
  dropZone.classList.add('active');
});

dropZone.addEventListener('dragleave', (e) => {
  dropZone.classList.remove('active');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('active');

  const files = e.dataTransfer.files;
  Array.from(files).forEach((file) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = document.createElement('img');
        img.src = event.target.result;
        img.style.maxWidth = '200px';
        preview.appendChild(img);
      };
      reader.readAsDataURL(file);
    }
  });
});

// 元素间拖拽
const draggable = document.getElementById('draggable');
draggable.addEventListener('dragstart', (e) => {
  e.dataTransfer.setData('text/plain', draggable.id);
  e.dataTransfer.effectAllowed = 'move';
});
```

### dataTransfer 对象

| 属性/方法                 | 说明                             |
| ------------------------- | -------------------------------- |
| `setData(type, data)`     | 设置拖拽数据                     |
| `getData(type)`           | 获取拖拽数据（仅在 drop 中可用） |
| `files`                   | 拖入的文件列表                   |
| `effectAllowed`           | 允许的操作类型（copy/move/link） |
| `dropEffect`              | 实际的操作类型                   |
| `setDragImage(img, x, y)` | 自定义拖拽预览图                 |

## History API

### 核心方法

```javascript
// 添加历史记录（不刷新页面）
history.pushState(state, title, url);

// 替换当前历史记录
history.replaceState(state, title, url);

// 前进/后退
history.back();
history.forward();
history.go(-2); // 后退两步
```

| 参数    | 说明                       | 示例                |
| ------- | -------------------------- | ------------------- |
| `state` | 与新历史条目关联的状态对象 | `{ page: 'about' }` |
| `title` | 标题（大多数浏览器忽略）   | `''`                |
| `url`   | 新的 URL（必须同源）       | `/about`            |

### SPA 路由实现原理

```javascript
// 简易 SPA 路由
class Router {
  constructor() {
    this.routes = {};
    window.addEventListener('popstate', (e) => {
      this.handleRoute(location.pathname, e.state);
    });
  }

  register(path, handler) {
    this.routes[path] = handler;
  }

  navigate(path, state = {}) {
    history.pushState(state, '', path);
    this.handleRoute(path, state);
  }

  handleRoute(path, state) {
    const handler = this.routes[path];
    if (handler) handler(state);
  }
}

// 使用
const router = new Router();
router.register('/', () => renderHome());
router.register('/about', () => renderAbout());

// 导航链接拦截
document.addEventListener('click', (e) => {
  if (e.target.matches('a[data-route]')) {
    e.preventDefault();
    router.navigate(e.target.getAttribute('href'));
  }
});
```

:::info popstate 触发时机
`popstate` 只在用户点击前进/后退按钮时触发，调用 `pushState`/`replaceState` **不会触发** popstate。
:::

## Geolocation API

### 基本用法

```javascript
// 获取当前位置
navigator.geolocation.getCurrentPosition(
  (position) => {
    console.log('纬度:', position.coords.latitude);
    console.log('经度:', position.coords.longitude);
    console.log('精度:', position.coords.accuracy, '米');
    console.log('海拔:', position.coords.altitude);
    console.log('速度:', position.coords.speed);
  },
  (error) => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        console.error('用户拒绝授权');
        break;
      case error.POSITION_UNAVAILABLE:
        console.error('位置不可用');
        break;
      case error.TIMEOUT:
        console.error('请求超时');
        break;
    }
  },
  {
    enableHighAccuracy: true, // 高精度（GPS，更耗电）
    timeout: 10000, // 超时时间
    maximumAge: 0, // 不使用缓存
  },
);
```

### 持续监听位置

```javascript
// 持续监听
const watchId = navigator.geolocation.watchPosition(
  (position) => {
    updateMap(position.coords.latitude, position.coords.longitude);
  },
  (error) => console.error(error),
  {enableHighAccuracy: true},
);

// 停止监听
navigator.geolocation.clearWatch(watchId);
```

:::tip 权限处理最佳实践
先检查权限状态再请求，避免直接弹出授权弹窗：

```javascript
const permission = await navigator.permissions.query({name: 'geolocation'});
if (permission.state === 'granted') {
  // 直接获取
} else if (permission.state === 'prompt') {
  // 展示说明后再请求
} else {
  // 已拒绝，引导用户到设置
}
```

:::

## Web Storage

### localStorage vs sessionStorage

| 特性     | localStorage              | sessionStorage           |
| -------- | ------------------------- | ------------------------ |
| 生命周期 | 永久（需手动删除）        | 会话结束即清除           |
| 作用域   | 同源所有标签页共享        | 仅当前标签页             |
| 容量     | 通常 5-10MB               | 通常 5-10MB              |
| 事件     | 跨标签页触发 storage 事件 | 不触发                   |
| 使用场景 | 用户偏好、缓存数据        | 临时表单数据、一次性状态 |

### API 用法

```javascript
// 基本 CRUD
localStorage.setItem('theme', 'dark');
const theme = localStorage.getItem('theme'); // 'dark'
localStorage.removeItem('theme');
localStorage.clear(); // 清空所有

// 存储复杂对象（必须序列化）
const user = {name: '张三', age: 25};
localStorage.setItem('user', JSON.stringify(user));
const stored = JSON.parse(localStorage.getItem('user'));
```

### storage 事件（跨标签通信）

```javascript
// 在其他标签页监听 storage 变化
window.addEventListener('storage', (e) => {
  console.log('变更的 key:', e.key);
  console.log('旧值:', e.oldValue);
  console.log('新值:', e.newValue);
  console.log('来源 URL:', e.url);

  if (e.key === 'theme') {
    applyTheme(e.newValue);
  }
});
```

:::warning 注意事项

- storage 事件只在**其他标签页**触发，当前页面的修改不会触发自身的 storage 事件
- 所有值都以**字符串**存储，存对象必须 `JSON.stringify`
- 超出容量会抛出 `QuotaExceededError`
  :::

## Canvas vs SVG

| 对比维度 | Canvas                | SVG              |
| -------- | --------------------- | ---------------- |
| 渲染方式 | 像素（位图）          | 矢量（DOM节点）  |
| 性能     | 大量对象时优          | 少量复杂图形时优 |
| 事件处理 | 需手动计算点击区域    | DOM 事件天然支持 |
| 缩放     | 放大失真              | 无限缩放不失真   |
| 动画     | requestAnimationFrame | CSS/SMIL/JS      |
| SEO      | 不可索引              | 可索引（DOM）    |
| 适用场景 | 游戏、粒子、实时图表  | 图标、图表、地图 |
| 内存     | 固定（画布大小）      | 随元素数量增长   |

### 选型建议

```
需要实时渲染大量对象（>1000）？ → Canvas
需要高交互性（拖拽、点击元素）？ → SVG
需要无损缩放？ → SVG
做游戏/粒子效果？ → Canvas
做数据图表/信息图？ → SVG（或 Canvas 库如 ECharts）
```

### 快速示例

```html
<!-- Canvas -->
<canvas id="myCanvas" width="400" height="200"></canvas>
<script>
  const ctx = document.getElementById('myCanvas').getContext('2d');
  ctx.fillStyle = '#4CAF50';
  ctx.fillRect(10, 10, 100, 80);
  ctx.beginPath();
  ctx.arc(200, 100, 50, 0, Math.PI * 2);
  ctx.fill();
</script>

<!-- SVG -->
<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="10" width="100" height="80" fill="#4CAF50" />
  <circle cx="200" cy="100" r="50" fill="#4CAF50" />
</svg>
```

## 其他重要 API 简介

### Notification API

```javascript
// 请求权限
const permission = await Notification.requestPermission();

if (permission === 'granted') {
  const notification = new Notification('新消息', {
    body: '你收到了一条新消息',
    icon: '/icon.png',
    tag: 'message', // 同 tag 通知会替换
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };
}
```

### Fullscreen API

```javascript
// 进入全屏
async function enterFullscreen(element) {
  if (element.requestFullscreen) {
    await element.requestFullscreen();
  }
}

// 退出全屏
document.exitFullscreen();

// 监听全屏变化
document.addEventListener('fullscreenchange', () => {
  console.log('当前全屏元素:', document.fullscreenElement);
});
```

### Clipboard API

```javascript
// 写入剪贴板
await navigator.clipboard.writeText('要复制的文本');

// 读取剪贴板
const text = await navigator.clipboard.readText();

// 复制图片
const blob = await fetch('/image.png').then((r) => r.blob());
await navigator.clipboard.write([new ClipboardItem({'image/png': blob})]);
```

## 面试高频题

### 1. HTML5 有哪些新特性？

**答**：语义化标签（header/nav/article等）、新表单控件（date/email/range）、多媒体（audio/video）、Canvas/SVG、Web Storage、Geolocation、History API、Drag&Drop、WebSocket、Web Worker、File API 等。

### 2. pushState 和 replaceState 的区别？

**答**：`pushState` 在历史栈中**新增**一条记录，用户可以后退回去；`replaceState` **替换**当前记录，不增加历史栈长度。都不会触发 popstate 事件，也不会刷新页面。

### 3. localStorage、sessionStorage 和 Cookie 的区别？

**答**：①容量：Cookie 4KB，Storage 5-10MB；②生命周期：localStorage 永久，sessionStorage 会话级，Cookie 可设过期时间；③请求携带：Cookie 自动随请求发送，Storage 不会；④API：Storage 有 getItem/setItem，Cookie 需要手动解析字符串。

### 4. 如何实现前端路由？有几种方式？

**答**：两种方式：①Hash 模式：监听 `hashchange` 事件，URL 带 `#`；②History 模式：使用 `pushState` + 监听 `popstate`，URL 美观但需要服务端配合（所有路由返回 index.html）。

### 5. Canvas 和 SVG 如何选择？

**答**：大量动态对象（游戏/粒子）→ Canvas（不保留DOM，重绘高效）；少量交互图形（图表/图标）→ SVG（DOM 事件天然支持、无损缩放）。超过 1000 个对象时 SVG 性能明显下降。

### 6. 拖拽 API 中为什么必须阻止 dragover 的默认行为？

**答**：浏览器默认不允许元素作为放置目标。必须在 `dragover` 中调用 `preventDefault()` 来告诉浏览器"这里可以放置"，否则 `drop` 事件不会被触发。
