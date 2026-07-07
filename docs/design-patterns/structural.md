---
sidebar_position: 2
title: 结构型模式
difficulty: medium
tags:
  - design-patterns
  - proxy
  - decorator
  - adapter
  - facade
  - composite
---

# 🔧 结构型模式

> **"结构型模式关注的是对象之间如何组合"** —— 怎样把对象拼在一起，让整体功能更强大。

## 一、代理模式（Proxy）

### 1.1 什么是代理？

```
代理模式 —— 控制对象的访问
═══════════════════════════════════════════════════════

现实中的代理：
• 明星经纪人 —— 明星不直接接活，通过经纪人
• 房产中介 —— 租房通过中介，不直接找房东
• VPN 代理 —— 通过代理服务器访问目标网站

代码中的代理：
• ES6 Proxy —— JavaScript 原生代理
• Vue 3 响应式 —— 用 Proxy 代理数据
• 图片懒加载 —— 代理图片的加载时机
```

### 1.2 ES6 Proxy 实现

```js
// ========== 基础用法 ==========
const person = {
  name: 'Alice',
  age: 25,
  _secret: 'xxx',
};

const proxy = new Proxy(person, {
  // 拦截读取
  get(target, prop) {
    if (prop.startsWith('_')) {
      throw new Error(`不能访问私有属性 ${prop}`);
    }
    console.log(`读取 ${prop}`);
    return target[prop];
  },

  // 拦截设置
  set(target, prop, value) {
    if (prop === 'age' && (typeof value !== 'number' || value < 0)) {
      throw new Error('年龄必须是正数');
    }
    console.log(`设置 ${prop} = ${value}`);
    target[prop] = value;
    return true;
  },
});

console.log(proxy.name);    // 读取 name → Alice
proxy.age = 30;              // 设置 age = 30
// console.log(proxy._secret); // ❌ Error: 不能访问私有属性 _secret
// proxy.age = -1;             // ❌ Error: 年龄必须是正数
```

### 1.3 前端应用场景

```js
// 场景1：数据验证代理
function createValidator(schema) {
  return new Proxy({}, {
    set(target, prop, value) {
      const rules = schema[prop];
      if (!rules) {
        target[prop] = value;
        return true;
      }

      for (const rule of rules) {
        const error = rule(value);
        if (error) {
          throw new Error(`${prop}: ${error}`);
        }
      }

      target[prop] = value;
      return true;
    },
  });
}

// 使用
const user = createValidator({
  name: [
    (v) => !v && '不能为空',
    (v) => v && v.length > 50 && '不能超过50个字符',
  ],
  age: [
    (v) => typeof v !== 'number' && '必须是数字',
    (v) => v < 0 || v > 150 && '年龄范围 0-150',
  ],
  email: [
    (v) => v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && '邮箱格式不正确',
  ],
});

user.name = 'Alice';  // ✅
user.age = 25;         // ✅
// user.age = -1;      // ❌ Error: 年龄范围 0-150
// user.name = '';      // ❌ Error: 不能为空


// 场景2：缓存代理
function createCachedFunction(fn) {
  const cache = new Map();

  return new Proxy(fn, {
    apply(target, thisArg, args) {
      const key = JSON.stringify(args);

      if (cache.has(key)) {
        console.log('从缓存读取');
        return cache.get(key);
      }

      const result = target.apply(thisArg, args);
      cache.set(key, result);
      console.log('计算并缓存');
      return result;
    },
  });
}

// 使用
const expensiveCalculation = createCachedFunction((n) => {
  console.log('执行昂贵的计算...');
  let sum = 0;
  for (let i = 0; i < n; i++) sum += i;
  return sum;
});

expensiveCalculation(1000000); // 执行昂贵的计算... 计算并缓存
expensiveCalculation(1000000); // 从缓存读取


// 场景3：图片懒加载代理
function createLazyImage(src) {
  let loaded = false;
  let realSrc = '';

  return new Proxy({ src }, {
    get(target, prop) {
      if (prop === 'src') {
        if (!loaded) {
          // 返回占位图，触发真实加载
          setTimeout(() => {
            const img = new Image();
            img.onload = () => {
              loaded = true;
              realSrc = src;
              // 触发视图更新...
            };
            img.src = src;
          }, 0);
          return '/placeholder.png';
        }
        return realSrc;
      }
      return target[prop];
    },
  });
}
```

### 1.4 Vue 3 响应式原理

```js
// Vue 3 响应式的核心就是 Proxy
function reactive(obj) {
  return new Proxy(obj, {
    get(target, key, receiver) {
      const result = Reflect.get(target, key, receiver);
      track(target, key);  // 依赖收集
      return result;
    },
    set(target, key, value, receiver) {
      const oldValue = target[key];
      const result = Reflect.set(target, key, value, receiver);
      if (oldValue !== value) {
        trigger(target, key);  // 触发更新
      }
      return result;
    },
  });
}

// 简化的依赖收集
const targetMap = new WeakMap();

function track(target, key) {
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }
  let dep = depsMap.get(key);
  if (!dep) {
    dep = new Set();
    depsMap.set(key, dep);
  }
  // dep.add(activeEffect); // 添加当前的副作用函数
}

function trigger(target, key) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return;
  const dep = depsMap.get(key);
  if (dep) {
    dep.forEach(effect => effect()); // 执行所有依赖
  }
}
```

## 二、装饰器模式（Decorator）

### 2.1 什么是装饰器？

```
装饰器模式 —— 动态给对象添加功能
═══════════════════════════════════════════════════════

现实中的装饰器：
• 手机壳 —— 给手机加上保护功能，不影响原有功能
• 蛋糕装饰 —— 在蛋糕上加水果、奶油，蛋糕本身不变
• 衣服穿搭 —— 在基础款上加配饰，人还是那个人

代码中的装饰器：
• 不修改原函数/对象的前提下增加功能
• 多个装饰器可以叠加使用
• 符合"开闭原则"（对扩展开放，对修改关闭）
```

### 2.2 函数装饰器

```js
// ========== 基础装饰器 ==========

// 装饰器：添加日志
function withLogging(fn) {
  return function (...args) {
    console.log(`调用 ${fn.name}，参数:`, args);
    const result = fn.apply(this, args);
    console.log(`${fn.name} 返回:`, result);
    return result;
  };
}

// 装饰器：添加计时
function withTiming(fn) {
  return function (...args) {
    const start = performance.now();
    const result = fn.apply(this, args);
    const end = performance.now();
    console.log(`${fn.name} 耗时: ${(end - start).toFixed(2)}ms`);
    return result;
  };
}

// 装饰器：添加错误处理
function withErrorHandling(fn) {
  return function (...args) {
    try {
      return fn.apply(this, args);
    } catch (err) {
      console.error(`${fn.name} 出错:`, err.message);
      return null;
    }
  };
}

// 装饰器：添加缓存
function withCache(fn) {
  const cache = new Map();
  return function (...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

// 使用
function add(a, b) {
  return a + b;
}

// 叠加多个装饰器
const enhancedAdd = withLogging(withTiming(add));
enhancedAdd(1, 2);
// 调用 add，参数: [1, 2]
// add 耗时: 0.01ms
// add 返回: 3


// ========== 组合装饰器的工具函数 ==========
function compose(...decorators) {
  return function (fn) {
    return decorators.reduce((enhanced, decorator) => decorator(enhanced), fn);
  };
}

const enhance = compose(withLogging, withTiming, withCache);
const superAdd = enhance(add);
superAdd(1, 2);
```

### 2.3 TypeScript 装饰器

```typescript
// TypeScript 装饰器语法
function log(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    console.log(`调用 ${propertyKey}，参数:`, args);
    const result = originalMethod.apply(this, args);
    console.log(`${propertyKey} 返回:`, result);
    return result;
  };

  return descriptor;
}

function throttle(delay: number) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    let lastCall = 0;

    descriptor.value = function (...args: any[]) {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        return originalMethod.apply(this, args);
      }
    };

    return descriptor;
  };
}

class UserService {
  @log
  getUser(id: number) {
    return { id, name: 'Alice' };
  }

  @throttle(300)
  onScroll(event: Event) {
    console.log('处理滚动');
  }
}
```

### 2.4 高阶组件（HOC）

```jsx
// React 中的装饰器模式 —— 高阶组件
function withAuth(WrappedComponent) {
  return function AuthComponent(props) {
    const { user, loading } = useAuth();

    if (loading) return <Loading />;
    if (!user) return <Redirect to="/login" />;

    return <WrappedComponent {...props} user={user} />;
  };
}

function withErrorBoundary(WrappedComponent) {
  return class ErrorBoundary extends React.Component {
    state = { hasError: false };

    static getDerivedStateFromError() {
      return { hasError: true };
    }

    render() {
      if (this.state.hasError) {
        return <ErrorPage />;
      }
      return <WrappedComponent {...this.props} />;
    }
  };
}

// 叠加使用
const ProtectedDashboard = withAuth(withErrorBoundary(Dashboard));
```

## 三、适配器模式（Adapter）

### 3.1 什么是适配器？

```
适配器模式 —— 让不兼容的接口能一起工作
═══════════════════════════════════════════════════════

现实中的适配器：
• 电源适配器 —— 220V 转 5V，给手机充电
• 转接头 —— USB-C 转 Lightning
• 翻译官 —— 中文和英文之间的翻译

代码中的适配器：
• 旧 API 适配新接口
• 第三方库的接口统一
• 不同数据格式的转换
```

### 3.2 实现

```js
// ========== 旧接口适配新接口 ==========

// 旧接口（不能修改）
class OldApi {
  getRequest(url, callback) {
    fetch(url)
      .then(res => res.json())
      .then(data => callback(null, data))
      .catch(err => callback(err));
  }

  postRequest(url, data, callback) {
    fetch(url, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' },
    })
      .then(res => res.json())
      .then(data => callback(null, data))
      .catch(err => callback(err));
  }
}

// 适配器 —— 将旧接口适配为 Promise
class ApiAdapter {
  constructor(oldApi) {
    this.api = oldApi;
  }

  get(url) {
    return new Promise((resolve, reject) => {
      this.api.getRequest(url, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }

  post(url, data) {
    return new Promise((resolve, reject) => {
      this.api.postRequest(url, data, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }
}

// 使用 —— 旧接口用新语法
const api = new ApiAdapter(new OldApi());
const users = await api.get('/api/users');
await api.post('/api/users', { name: 'Alice' });


// ========== 数据格式适配 ==========

// 后端返回的数据格式
const backendData = {
  user_name: 'Alice',
  user_age: 25,
  created_at: '2024-01-01T00:00:00Z',
  is_active: true,
};

// 前端需要的数据格式
// {
//   userName: 'Alice',
//   userAge: 25,
//   createdAt: Date,
//   isActive: true,
// }

// 数据适配器
function adaptUser(backendUser) {
  return {
    userName: backendUser.user_name,
    userAge: backendUser.user_age,
    createdAt: new Date(backendUser.created_at),
    isActive: backendUser.is_active,
  };
}

// 通用适配器工厂
function createAdapter(mapping) {
  return function (source) {
    const result = {};
    for (const [sourceKey, targetKey] of Object.entries(mapping)) {
      if (typeof targetKey === 'function') {
        result[sourceKey] = targetKey(source);
      } else {
        result[sourceKey] = source[targetKey];
      }
    }
    return result;
  };
}

const adaptUser2 = createAdapter({
  userName: 'user_name',
  userAge: 'user_age',
  createdAt: (src) => new Date(src.created_at),
  isActive: 'is_active',
});

const user = adaptUser2(backendData);
```

## 四、外观模式（Facade）

### 4.1 什么是外观？

```
外观模式 —— 提供简化的统一接口
═══════════════════════════════════════════════════════

现实中的外观：
• 电视机遥控器 —— 一个按钮完成开机、调台、调音量
• 餐厅服务员 —— 你只需点菜，不用自己去厨房
• 电脑开机键 —— 按一下，硬件自检、启动系统全搞定

代码中的外观：
• jQuery —— 简化 DOM 操作
• axios —— 简化 HTTP 请求
• 工具函数库 —— 简化常见操作
```

### 4.2 实现

```js
// ========== 子系统 ==========
class AudioSystem {
  on() { console.log('音响系统开启'); }
  off() { console.log('音响系统关闭'); }
  setVolume(level) { console.log(`音量设置为 ${level}`); }
}

class VideoSystem {
  on() { console.log('投影仪开启'); }
  off() { console.log('投影仪关闭'); }
  setInput(source) { console.log(`信号源切换到 ${source}`); }
}

class LightSystem {
  dim(level) { console.log(`灯光调暗到 ${level}%`); }
  brighten() { console.log('灯光调亮'); }
}

class DVDPlayer {
  on() { console.log('DVD 播放器开启'); }
  off() { console.log('DVD 播放器关闭'); }
  play(movie) { console.log(`播放电影: ${movie}`); }
}

// ========== 外观 ==========
class HomeTheaterFacade {
  constructor() {
    this.audio = new AudioSystem();
    this.video = new VideoSystem();
    this.lights = new LightSystem();
    this.dvd = new DVDPlayer();
  }

  watchMovie(movie) {
    console.log('--- 准备看电影 ---');
    this.lights.dim(10);
    this.video.on();
    this.video.setInput('DVD');
    this.audio.on();
    this.audio.setVolume(7);
    this.dvd.on();
    this.dvd.play(movie);
    console.log('--- 开始享受电影 ---');
  }

  endMovie() {
    console.log--- 关闭家庭影院 ---');
    this.dvd.off();
    this.audio.off();
    this.video.off();
    this.lights.brighten();
    console.log('--- 已关闭 ---');
  }
}

// 使用 —— 一个方法搞定所有操作
const theater = new HomeTheaterFacade();
theater.watchMovie('复仇者联盟');
theater.endMovie();
```

### 4.3 前端应用场景

```js
// 场景：浏览器 API 外观
const BrowserFacade = {
  // 统一的本地存储接口
  storage: {
    get(key) {
      try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
      } catch {
        return null;
      }
    },
    set(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    },
    remove(key) {
      localStorage.removeItem(key);
    },
    clear() {
      localStorage.clear();
    },
  },

  // 统一的通知接口
  notify: {
    async requestPermission() {
      if (!('Notification' in window)) return false;
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    },
    send(title, options = {}) {
      if (Notification.permission === 'granted') {
        new Notification(title, options);
      }
    },
  },

  // 统一的剪贴板接口
  clipboard: {
    async copy(text) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // 降级方案
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        return true;
      }
    },
    async paste() {
      try {
        return await navigator.clipboard.readText();
      } catch {
        return '';
      }
    },
  },
};

// 使用 —— 简洁统一
BrowserFacade.storage.set('user', { name: 'Alice' });
BrowserFacade.notify.send('新消息', { body: '你好' });
await BrowserFacade.clipboard.copy('复制的内容');
```

## 五、组合模式（Composite）

### 5.1 什么是组合？

```
组合模式 —— 树形结构的统一处理
═══════════════════════════════════════════════════════

现实中的组合：
• 公司组织架构 —— CEO → VP → 总监 → 员工
• 文件系统 —— 文件夹包含文件和子文件夹
• 菜单系统 —— 菜单项包含子菜单和按钮

代码中的组合：
• React 组件树 —— 组件包含子组件
• DOM 树 —— 元素包含子元素
• 菜单/权限树 —— 菜单包含子菜单
```

### 5.2 实现

```js
// 组件基类
class Component {
  constructor(name) {
    this.name = name;
  }

  add(component) { throw new Error('叶子节点不能添加子组件'); }
  remove(component) { throw new Error('叶子节点不能移除子组件'); }
  display(depth = 0) { throw new Error('子类必须实现 display'); }
}

// 叶子节点
class MenuItem extends Component {
  constructor(name, action) {
    super(name);
    this.action = action;
  }

  display(depth = 0) {
    console.log(`${'  '.repeat(depth)}├── ${this.name}`);
  }

  click() {
    console.log(`执行: ${this.name}`);
    this.action?.();
  }
}

// 组合节点
class MenuGroup extends Component {
  constructor(name) {
    super(name);
    this.children = [];
  }

  add(component) {
    this.children.push(component);
    return this;
  }

  remove(component) {
    this.children = this.children.filter(c => c !== component);
  }

  display(depth = 0) {
    console.log(`${'  '.repeat(depth)}├── 📁 ${this.name}`);
    this.children.forEach(child => child.display(depth + 1));
  }

  click() {
    this.children.forEach(child => child.click());
  }
}

// 使用 —— 构建菜单树
const menu = new MenuGroup('主菜单');

const fileMenu = new MenuGroup('文件');
fileMenu
  .add(new MenuItem('新建', () => console.log('新建文件')))
  .add(new MenuItem('打开', () => console.log('打开文件')))
  .add(new MenuItem('保存', () => console.log('保存文件')));

const editMenu = new MenuGroup('编辑');
editMenu
  .add(new MenuItem('撤销', () => console.log('撤销')))
  .add(new MenuItem('重做', () => console.log('重做')));

const helpMenu = new MenuGroup('帮助');
helpMenu
  .add(new MenuItem('关于', () => console.log('关于...')));

menu.add(fileMenu).add(editMenu).add(helpMenu);

menu.display();
// ├── 📁 主菜单
//   ├── 📁 文件
//     ├── 新建
//     ├── 打开
//     └── 保存
//   ├── 📁 编辑
//     ├── 撤销
//     └── 重做
//   └── 📁 帮助
//     └── 关于
```

### 5.3 React 中的组合模式

```jsx
// React 组件就是组合模式的典型应用
function App() {
  return (
    <Layout>           {/* 组合节点 */}
      <Header />       {/* 叶子节点 */}
      <Content>        {/* 组合节点 */}
        <Sidebar />    {/* 叶子节点 */}
        <Main>         {/* 组合节点 */}
          <Article />  {/* 叶子节点 */}
        </Main>
      </Content>
      <Footer />       {/* 叶子节点 */}
    </Layout>
  );
}

// 递归渲染树形数据
function TreeNode({ data }) {
  return (
    <div className="tree-node">
      <div className="node-label">{data.name}</div>
      {data.children && (
        <div className="node-children">
          {data.children.map((child, index) => (
            <TreeNode key={index} data={child} />
          ))}
        </div>
      )}
    </div>
  );
}
```
