---
sidebar_position: 3
title: 设计模式
difficulty: medium
tags:
  - computer-basics
  - design-patterns
  - singleton
  - observer
  - strategy
---

# 🏗️ 设计模式

> **"设计模式是面向对象设计的经验总结"** —— 设计模式不是银弹，但能帮你写出更优雅、更可维护的代码。

## 一、设计模式分类

```
23 种经典设计模式（GoF）
═══════════════════════════════════════════════════════

创建型（5种）—— 对象创建机制
├── 单例模式     Singleton
├── 工厂方法     Factory Method
├── 抽象工厂     Abstract Factory
├── 建造者模式   Builder
└── 原型模式     Prototype

结构型（7种）—— 对象组合方式
├── 适配器模式   Adapter
├── 桥接模式     Bridge
├── 组合模式     Composite
├── 装饰器模式   Decorator
├── 外观模式     Facade
├── 享元模式     Flyweight
└── 代理模式     Proxy

行为型（11种）—— 对象交互方式
├── 观察者模式   Observer
├── 策略模式     Strategy
├── 命令模式     Command
├── 状态模式     State
├── 模板方法     Template Method
├── 迭代器模式   Iterator
├── 中介者模式   Mediator
├── 备忘录模式   Memento
├── 解释器模式   Interpreter
├── 职责链模式   Chain of Responsibility
└── 访问者模式   Visitor
```

## 二、前端常用设计模式

### 2.1 单例模式（Singleton）

```js
// 单例模式 —— 全局唯一实例
class Singleton {
  static instance = null;

  static getInstance() {
    if (!Singleton.instance) {
      Singleton.instance = new Singleton();
    }
    return Singleton.instance;
  }
}

// 前端中的单例：
// 1. 全局状态管理（Redux Store、Vuex Store）
// 2. 数据库连接池
// 3. 日志记录器
// 4. 配置管理器

// 闭包实现单例
const createSingleton = (function () {
  let instance = null;
  return function (constructor) {
    if (!instance) {
      instance = constructor();
    }
    return instance;
  };
})();

// ES Module 天然单例
// store.js
export const store = createStore(reducer);  // 模块只会被执行一次
```

### 2.2 观察者模式（Observer）

```js
// 观察者模式 —— 一对多的依赖关系
class EventEmitter {
  constructor() {
    this.events = new Map();
  }

  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(callback);
    return () => this.off(event, callback); // 返回取消订阅函数
  }

  off(event, callback) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) callbacks.splice(index, 1);
    }
  }

  emit(event, ...args) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(...args));
    }
  }

  once(event, callback) {
    const wrapper = (...args) => {
      callback(...args);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }
}

// 使用示例
const emitter = new EventEmitter();
const unsub = emitter.on('data', (data) => console.log(data));
emitter.emit('data', { message: 'hello' });
unsub(); // 取消订阅

// 前端中的观察者模式：
// 1. DOM 事件监听 addEventListener
// 2. Vue 的响应式系统（Watcher + Dep）
// 3. RxJS 的 Observable
// 4. Node.js 的 EventEmitter
// 5. WebSocket 消息订阅
```

### 2.3 发布-订阅模式（Publish-Subscribe）

```js
// 发布-订阅 vs 观察者
// 观察者：Subject 直接通知 Observer
// 发布-订阅：通过事件中心（Event Channel）解耦

class PubSub {
  constructor() {
    this.subscribers = {};
  }

  subscribe(topic, callback) {
    if (!this.subscribers[topic]) {
      this.subscribers[topic] = [];
    }
    this.subscribers[topic].push(callback);
    return () => this.unsubscribe(topic, callback);
  }

  publish(topic, data) {
    if (!this.subscribers[topic]) return;
    this.subscribers[topic].forEach(cb => cb(data));
  }

  unsubscribe(topic, callback) {
    if (!this.subscribers[topic]) return;
    this.subscribers[topic] = this.subscribers[topic]
      .filter(cb => cb !== callback);
  }
}
```

### 2.4 策略模式（Strategy）

```js
// 策略模式 —— 定义算法族，使它们可以互换
// 用对象映射替代 if-else / switch

// 验证策略
const strategies = {
  required(value) {
    if (!value || value.trim() === '') return '此字段不能为空';
  },
  minLength(value, min) {
    if (value.length < min) return `最少 ${min} 个字符`;
  },
  maxLength(value, max) {
    if (value.length > max) return `最多 ${max} 个字符`;
  },
  email(value) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return '邮箱格式不正确';
  },
  phone(value) {
    if (!/^1[3-9]\d{9}$/.test(value)) return '手机号格式不正确';
  },
};

// 验证器
class Validator {
  constructor() {
    this.rules = [];
  }

  add(value, rules) {
    for (const rule of rules) {
      const [strategy, ...params] = rule.split(':');
      this.rules.push(() => strategies[strategy](value, ...params));
    }
    return this;
  }

  validate() {
    for (const rule of this.rules) {
      const error = rule();
      if (error) return error;
    }
    return null;
  }
}

// 使用
const validator = new Validator();
validator
  .add('username', ['required', 'minLength:3', 'maxLength:20'])
  .add('email', ['required', 'email'])
  .add('phone', ['phone']);

const error = validator.validate();
```

### 2.5 工厂模式（Factory）

```js
// 简单工厂 —— 根据参数创建不同对象
class ButtonFactory {
  static create(type, text) {
    switch (type) {
      case 'primary':
        return new PrimaryButton(text);
      case 'secondary':
        return new SecondaryButton(text);
      case 'danger':
        return new DangerButton(text);
      default:
        throw new Error(`Unknown button type: ${type}`);
    }
  }
}

// 工厂函数 —— 更函数式的写法
function createStore(reducer, initialState) {
  // 根据参数配置创建 store
  let state = initialState;
  const listeners = [];

  return {
    getState: () => state,
    dispatch: (action) => {
      state = reducer(state, action);
      listeners.forEach(fn => fn());
    },
    subscribe: (fn) => {
      listeners.push(fn);
      return () => {
        const idx = listeners.indexOf(fn);
        if (idx > -1) listeners.splice(idx, 1);
      };
    },
  };
}

// 前端中的工厂模式：
// React.createElement —— 根据 type 创建不同的 React 元素
// Vue 的 h() 函数
// document.createElement
// new XMLHttpRequest()
```

### 2.6 代理模式（Proxy）

```js
// 代理模式 —— 控制对象的访问
// ES6 原生 Proxy 就是代理模式的实现

// 1. 数据验证代理
const validator = {
  set(target, prop, value) {
    if (prop === 'age' && (typeof value !== 'number' || value < 0)) {
      throw new Error('Age must be a positive number');
    }
    target[prop] = value;
    return true;
  },
};

const person = new Proxy({}, validator);
person.age = 25;  // ✅
// person.age = -1; // ❌ Error

// 2. 缓存代理
function createCachedFetch() {
  const cache = new Map();
  return new Proxy(fetch, {
    apply(target, thisArg, args) {
      const url = args[0];
      if (cache.has(url)) {
        return Promise.resolve(cache.get(url));
      }
      return target.apply(thisArg, args).then(response => {
        cache.set(url, response.clone());
        return response;
      });
    },
  });
}

// 3. Vue 3 响应式系统就是基于 Proxy
const state = new Proxy({ count: 0 }, {
  get(target, key) {
    track(target, key);  // 依赖收集
    return target[key];
  },
  set(target, key, value) {
    target[key] = value;
    trigger(target, key);  // 触发更新
    return true;
  },
});
```

### 2.7 装饰器模式（Decorator）

```js
// 装饰器模式 —— 动态添加功能，不修改原代码

// 函数装饰器
function logExecutionTime(fn) {
  return function (...args) {
    console.time(fn.name);
    const result = fn.apply(this, args);
    console.timeEnd(fn.name);
    return result;
  };
}

function addLogging(fn) {
  return function (...args) {
    console.log(`Calling ${fn.name} with`, args);
    return fn.apply(this, args);
  };
}

// 使用
function heavyCalculation(n) {
  let sum = 0;
  for (let i = 0; i < n; i++) sum += i;
  return sum;
}

const enhancedCalculation = logExecutionTime(addLogging(heavyCalculation));
enhancedCalculation(1000000);

// TypeScript 装饰器
function sealed(constructor) {
  Object.seal(constructor);
  Object.seal(constructor.prototype);
}

@sealed
class Greeter {
  greeting: string;
  constructor(message: string) {
    this.greeting = message;
  }
}

// 前端中的装饰器模式：
// React HOC（高阶组件）
// TypeScript 装饰器
// ES Decorators 提案
// Koa 的中间件洋葱模型
```

### 2.8 适配器模式（Adapter）

```js
// 适配器模式 —— 接口转换

// 旧接口
class OldApi {
  getRequest(url, callback) {
    fetch(url).then(res => res.json()).then(data => callback(null, data));
  }
}

// 新接口
class NewApi {
  async get(url) {
    const res = await fetch(url);
    return res.json();
  }
}

// 适配器 —— 将旧接口适配为新接口
class ApiAdapter {
  constructor(oldApi) {
    this.oldApi = oldApi;
  }

  get(url) {
    return new Promise((resolve, reject) => {
      this.oldApi.getRequest(url, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }
}

// 前端中的适配器模式：
// axios 适配器（浏览器 XMLHttpRequest / Node.js http）
// 不同图表库的数据格式适配
// 第三方 SDK 的接口统一
```

## 三、设计模式在前端框架中的应用

```
前端框架中的设计模式
═══════════════════════════════════════════════════════

React:
├── 观察者模式：useState/useEffect 的依赖追踪
├── 组合模式：组件树的递归渲染
├── 工厂模式：React.createElement
├── 策略模式：reconciler（协调器）
└── 代理模式：React.forwardRef

Vue:
├── 观察者模式：响应式系统（Dep + Watcher）
├── 代理模式：Proxy 实现数据劫持
├── 发布-订阅：EventBus（Vue 2）
├── 工厂模式：createApp
├── 装饰器模式：mixins / composables
└── 策略模式：模板编译优化

Angular:
├── 依赖注入：DI 容器
├── 观察者模式：RxJS Observable
├── 装饰器模式：@Component、@Injectable
├── 代理模式：Zone.js 变更检测
└── 工厂模式：FactoryProvider
```

## 四、常见面试题

**Q1: 观察者模式和发布-订阅模式的区别？**

A: 观察者模式中，Subject 直接通知 Observer，两者是直接耦合的；发布-订阅模式通过事件中心解耦，发布者和订阅者互不知道对方的存在。Vue 2 的 `$emit`/`$on` 是发布-订阅，响应式系统是观察者。

**Q2: 策略模式和状态模式的区别？**

A: 策略模式是客户端主动选择算法，算法之间是平等的；状态模式是对象根据内部状态自动切换行为，状态之间有转换关系。策略模式用对象映射替代 if-else，状态模式用状态机管理状态转换。

**Q3: 代理模式和装饰器模式的区别？**

A: 代理模式控制对象的访问（如缓存、验证、权限），装饰器模式动态添加功能（如日志、计时）。代理关注"能不能访问"，装饰器关注"增加什么功能"。ES6 的 `Proxy` 是代理模式，HOC 是装饰器模式。
