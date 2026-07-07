---
sidebar_position: 1
title: 创建型模式
difficulty: medium
tags:
  - design-patterns
  - singleton
  - factory
  - builder
  - prototype
---

# 🏗️ 创建型模式

> **"创建型模式关注的是对象的创建方式"** —— 怎样创建对象更灵活、更高效、更可控。

## 一、单例模式（Singleton）

### 1.1 什么是单例？

```
单例模式 —— 全局只有一个实例
═══════════════════════════════════════════════════════

现实中的单例：
• 你是你爸妈唯一的孩子（独生子）
• 公司只有一个 CEO
• 浏览器只有一个 document

代码中的单例：
• 全局状态管理（Redux Store、Vuex Store）
• 数据库连接池
• 日志记录器
• 配置管理器
```

### 1.2 实现方式

```js
// ========== 方式一：类实现 ==========
class Store {
  static instance = null;

  static getInstance() {
    if (!Store.instance) {
      Store.instance = new Store();
    }
    return Store.instance;
  }

  constructor() {
    this.state = {};
    this.listeners = [];
  }

  getState() {
    return this.state;
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.listeners.forEach(fn => fn(this.state));
  }

  subscribe(fn) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }
}

// 使用
const store1 = Store.getInstance();
const store2 = Store.getInstance();
console.log(store1 === store2); // true — 同一个实例


// ========== 方式二：闭包实现 ==========
const createSingleton = (function () {
  let instance = null;

  return function (Constructor) {
    if (!instance) {
      instance = new Constructor();
    }
    return instance;
  };
})();

// 使用
const s1 = createSingleton(Store);
const s2 = createSingleton(Store);
console.log(s1 === s2); // true


// ========== 方式三：ES Module 天然单例 ==========
// store.js
export const store = createStore(reducer);  // 模块只会执行一次

// 任何地方 import store 都是同一个实例


// ========== 方式四：单例装饰器 ==========
function singleton(Constructor) {
  let instance;
  return function (...args) {
    if (!instance) {
      instance = new Constructor(...args);
    }
    return instance;
  };
}

const SingletonStore = singleton(Store);
const a = new SingletonStore();
const b = new SingletonStore();
console.log(a === b); // true
```

### 1.3 前端应用场景

```js
// 场景1：全局弹窗管理器
class ModalManager {
  static instance = null;

  static getInstance() {
    if (!ModalManager.instance) {
      ModalManager.instance = new ModalManager();
    }
    return ModalManager.instance;
  }

  constructor() {
    this.modal = null;
  }

  show({ title, content, onConfirm, onCancel }) {
    if (this.modal) {
      this.hide(); // 关闭上一个
    }
    this.modal = { title, content, onConfirm, onCancel };
    // 渲染弹窗...
    console.log('显示弹窗:', title);
  }

  hide() {
    this.modal = null;
    // 移除弹窗...
    console.log('关闭弹窗');
  }
}

// 全局只有一个弹窗管理器
const modal = ModalManager.getInstance();
modal.show({ title: '提示', content: '确定删除？' });


// 场景2：全局事件总线
class EventBus {
  static instance = null;

  static getInstance() {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  constructor() {
    this.events = {};
  }

  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  emit(event, ...args) {
    (this.events[event] || []).forEach(fn => fn(...args));
  }

  off(event, callback) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(fn => fn !== callback);
    }
  }
}

// 全局事件总线
const bus = EventBus.getInstance();
bus.on('userLogin', (user) => console.log('用户登录:', user));
bus.emit('userLogin', { name: 'Alice' });
```

### 1.4 注意事项

```
单例模式的注意事项
═══════════════════════════════════════════════════════

✅ 适用场景：
• 全局只需要一个实例（状态管理、弹窗管理）
• 需要共享资源（连接池、缓存）
• 需要统一入口（配置中心、日志器）

❌ 不适用场景：
• 需要多个实例（组件实例）
• 测试困难（单例有全局状态，不好 mock）
• 过度使用（不是所有工具类都需要单例）

⚠️ 注意：
• 单例有全局状态，测试时需要重置
• ES Module 的 import 是单例的，天然适合
• React/Vue 的 Store 本身就是单例，不需要手动实现
```

## 二、工厂模式（Factory）

### 2.1 什么是工厂？

```
工厂模式 —— 批量生产对象
═══════════════════════════════════════════════════════

现实中的工厂：
• 汽车工厂：根据订单生产不同型号的汽车
• 餐厅厨房：根据菜单制作不同的菜品

代码中的工厂：
• React.createElement —— 根据 type 创建不同的 React 元素
• document.createElement —— 根据 tagName 创建不同的 DOM 元素
• new Vue() —— 根据配置创建 Vue 实例
```

### 2.2 简单工厂

```js
// 简单工厂 —— 根据参数创建不同对象
class Button {
  constructor(text) {
    this.text = text;
  }
  render() {
    return `<button>${this.text}</button>`;
  }
}

class PrimaryButton extends Button {
  render() {
    return `<button class="btn-primary">${this.text}</button>`;
  }
}

class DangerButton extends Button {
  render() {
    return `<button class="btn-danger">${this.text}</button>`;
  }
}

class IconButton extends Button {
  constructor(text, icon) {
    super(text);
    this.icon = icon;
  }
  render() {
    return `<button class="btn-icon"><i class="${this.icon}"></i> ${this.text}</button>`;
  }
}

// 简单工厂函数
function createButton(type, text, options = {}) {
  switch (type) {
    case 'primary':
      return new PrimaryButton(text);
    case 'danger':
      return new DangerButton(text);
    case 'icon':
      return new IconButton(text, options.icon);
    default:
      return new Button(text);
  }
}

// 使用
const btn1 = createButton('primary', '提交');
const btn2 = createButton('danger', '删除');
const btn3 = createButton('icon', '保存', { icon: 'fa-save' });
```

### 2.3 工厂方法

```js
// 工厂方法 —— 让子类决定创建什么对象

// 抽象工厂
class NotificationFactory {
  create() {
    throw new Error('子类必须实现 create 方法');
  }

  send(message) {
    const notification = this.create();
    notification.show(message);
  }
}

// 具体工厂
class EmailNotificationFactory extends NotificationFactory {
  create() {
    return new EmailNotification();
  }
}

class SMSNotificationFactory extends NotificationFactory {
  create() {
    return new SMSNotification();
  }
}

class PushNotificationFactory extends NotificationFactory {
  create() {
    return new PushNotification();
  }
}

// 具体产品
class EmailNotification {
  show(message) {
    console.log(`📧 发送邮件: ${message}`);
  }
}

class SMSNotification {
  show(message) {
    console.log(`📱 发送短信: ${message}`);
  }
}

class PushNotification {
  show(message) {
    console.log(`🔔 推送通知: ${message}`);
  }
}

// 使用
function sendNotification(type, message) {
  const factories = {
    email: EmailNotificationFactory,
    sms: SMSNotificationFactory,
    push: PushNotificationFactory,
  };

  const Factory = factories[type];
  if (!Factory) throw new Error(`Unknown type: ${type}`);

  const factory = new Factory();
  factory.send(message);
}

sendNotification('email', '你的订单已发货');
sendNotification('sms', '验证码: 123456');
sendNotification('push', '你有一条新消息');
```

### 2.4 前端应用场景

```js
// 场景1：表单验证器工厂
function createValidator(rules) {
  const validators = {
    required: (value) => ({
      valid: value !== undefined && value !== null && value !== '',
      message: '此字段不能为空',
    }),
    minLength: (value, min) => ({
      valid: String(value).length >= min,
      message: `最少 ${min} 个字符`,
    }),
    maxLength: (value, max) => ({
      valid: String(value).length <= max,
      message: `最多 ${max} 个字符`,
    }),
    email: (value) => ({
      valid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message: '邮箱格式不正确',
    }),
    phone: (value) => ({
      valid: /^1[3-9]\d{9}$/.test(value),
      message: '手机号格式不正确',
    }),
  };

  return function validate(value) {
    for (const rule of rules) {
      const [type, ...params] = rule.split(':');
      const validator = validators[type];
      if (validator) {
        const result = validator(value, ...params);
        if (!result.valid) return result;
      }
    }
    return { valid: true, message: '' };
  };
}

// 使用
const usernameValidator = createValidator(['required', 'minLength:3', 'maxLength:20']);
const emailValidator = createValidator(['required', 'email']);

console.log(usernameValidator(''));        // { valid: false, message: '此字段不能为空' }
console.log(usernameValidator('ab'));       // { valid: false, message: '最少 3 个字符' }
console.log(usernameValidator('alice'));    // { valid: true, message: '' }


// 场景2：请求工厂
function createApi(baseURL) {
  return {
    get: (url, params) => fetch(`${baseURL}${url}?${new URLSearchParams(params)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }).then(r => r.json()),

    post: (url, data) => fetch(`${baseURL}${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json()),

    put: (url, data) => fetch(`${baseURL}${url}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json()),

    delete: (url) => fetch(`${baseURL}${url}`, {
      method: 'DELETE',
    }).then(r => r.json()),
  };
}

// 使用
const userApi = createApi('/api/users');
const orderApi = createApi('/api/orders');

userApi.get('/list', { page: 1 });
orderApi.post('/create', { items: [] });
```

## 三、建造者模式（Builder）

### 3.1 什么是建造者？

```
建造者模式 —— 分步骤构建复杂对象
═══════════════════════════════════════════════════════

现实中的建造者：
• 组装电脑：先选 CPU，再选内存，再选硬盘...
• 点汉堡：选面包 → 选肉饼 → 选蔬菜 → 选酱料

代码中的建造者：
• 链式调用 API
• 复杂配置对象的构建
• SQL 查询构建器
```

### 3.2 实现

```js
// 链式调用的建造者
class QueryBuilder {
  constructor(table) {
    this.table = table;
    this._where = [];
    this._orderBy = [];
    this._limit = null;
    this._offset = null;
    this._select = ['*'];
  }

  select(...columns) {
    this._select = columns;
    return this; // 返回 this 实现链式调用
  }

  where(condition) {
    this._where.push(condition);
    return this;
  }

  orderBy(column, direction = 'ASC') {
    this._orderBy.push(`${column} ${direction}`);
    return this;
  }

  limit(count) {
    this._limit = count;
    return this;
  }

  offset(count) {
    this._offset = count;
    return this;
  }

  build() {
    let sql = `SELECT ${this._select.join(', ')} FROM ${this.table}`;

    if (this._where.length > 0) {
      sql += ` WHERE ${this._where.join(' AND ')}`;
    }
    if (this._orderBy.length > 0) {
      sql += ` ORDER BY ${this._orderBy.join(', ')}`;
    }
    if (this._limit !== null) {
      sql += ` LIMIT ${this._limit}`;
    }
    if (this._offset !== null) {
      sql += ` OFFSET ${this._offset}`;
    }

    return sql;
  }
}

// 使用 —— 链式调用，清晰易读
const sql = new QueryBuilder('users')
  .select('id', 'name', 'email')
  .where('age > 18')
  .where('status = "active"')
  .orderBy('created_at', 'DESC')
  .limit(10)
  .offset(20)
  .build();

console.log(sql);
// SELECT id, name, email FROM users
// WHERE age > 18 AND status = "active"
// ORDER BY created_at DESC
// LIMIT 10 OFFSET 20
```

### 3.3 前端应用场景

```js
// 场景1：HTTP 请求构建器
class RequestBuilder {
  constructor() {
    this.config = {
      method: 'GET',
      headers: {},
      timeout: 30000,
    };
  }

  url(url) {
    this.config.url = url;
    return this;
  }

  method(method) {
    this.config.method = method;
    return this;
  }

  header(key, value) {
    this.config.headers[key] = value;
    return this;
  }

  auth(token) {
    this.config.headers['Authorization'] = `Bearer ${token}`;
    return this;
  }

  body(data) {
    this.config.body = JSON.stringify(data);
    this.config.headers['Content-Type'] = 'application/json';
    return this;
  }

  timeout(ms) {
    this.config.timeout = ms;
    return this;
  }

  async execute() {
    const { url, ...options } = this.config;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response.json();
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }
}

// 使用
const data = await new RequestBuilder()
  .url('/api/users')
  .method('POST')
  .auth('my-token')
  .body({ name: 'Alice', age: 25 })
  .timeout(5000)
  .execute();


// 场景2：表单构建器
class FormBuilder {
  constructor() {
    this.fields = [];
  }

  addField(config) {
    this.fields.push({
      type: 'text',
      required: false,
      ...config,
    });
    return this;
  }

  text(name, label, options = {}) {
    return this.addField({ type: 'text', name, label, ...options });
  }

  number(name, label, options = {}) {
    return this.addField({ type: 'number', name, label, ...options });
  }

  select(name, label, options = {}) {
    return this.addField({ type: 'select', name, label, ...options });
  }

  checkbox(name, label, options = {}) {
    return this.addField({ type: 'checkbox', name, label, ...options });
  }

  required() {
    const last = this.fields[this.fields.length - 1];
    if (last) last.required = true;
    return this;
  }

  build() {
    return this.fields;
  }
}

// 使用
const formConfig = new FormBuilder()
  .text('username', '用户名').required()
  .text('email', '邮箱').required()
  .number('age', '年龄')
  .select('role', '角色', {
    options: [
      { label: '管理员', value: 'admin' },
      { label: '用户', value: 'user' },
    ],
  })
  .checkbox('agree', '同意协议').required()
  .build();
```

## 四、原型模式（Prototype）

### 4.1 什么是原型？

```
原型模式 —— 复制已有对象
═══════════════════════════════════════════════════════

现实中的原型：
• 手机壳开模：先做一个原型，然后批量生产
• 印章：刻一个章，可以盖无数次

代码中的原型：
• Object.create() —— 基于原型创建新对象
• 深拷贝 —— 复制一个完全独立的对象
```

### 4.2 实现

```js
// 原型对象
const carPrototype = {
  brand: 'Unknown',
  color: 'white',
  wheels: 4,

  start() {
    console.log(`${this.brand} 启动`);
  },

  clone() {
    return Object.create(Object.getPrototypeOf(this), 
      Object.getOwnPropertyDescriptors(this)
    );
  },

  // 深拷贝版本
  deepClone() {
    return JSON.parse(JSON.stringify(this));
  },
};

// 基于原型创建新对象
const car1 = Object.create(carPrototype);
car1.brand = 'Tesla';
car1.color = 'red';

const car2 = Object.create(carPrototype);
car2.brand = 'BMW';
car2.color = 'black';

car1.start(); // Tesla 启动
car2.start(); // BMW 启动


// ========== 使用 class 语法 ==========
class Shape {
  constructor(type, color) {
    this.type = type;
    this.color = color;
  }

  clone() {
    return new Shape(this.type, this.color);
  }

  render() {
    console.log(`渲染 ${this.color} 的 ${this.type}`);
  }
}

class Circle extends Shape {
  constructor(color, radius) {
    super('circle', color);
    this.radius = radius;
  }

  clone() {
    return new Circle(this.color, this.radius);
  }
}

class Rectangle extends Shape {
  constructor(color, width, height) {
    super('rectangle', color);
    this.width = width;
    this.height = height;
  }

  clone() {
    return new Rectangle(this.color, this.width, this.height);
  }
}

// 使用
const redCircle = new Circle('red', 50);
const anotherCircle = redCircle.clone(); // 复制
anotherCircle.color = 'blue';

redCircle.render();    // 渲染 red 的 circle
anotherCircle.render(); // 渲染 blue 的 circle
```

### 4.3 深拷贝实现

```js
// 深拷贝（处理循环引用）
function deepClone(obj, cache = new WeakMap()) {
  // 基本类型直接返回
  if (obj === null || typeof obj !== 'object') return obj;

  // 处理循环引用
  if (cache.has(obj)) return cache.get(obj);

  // 处理特殊对象
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof RegExp) return new RegExp(obj);
  if (obj instanceof Map) {
    const map = new Map();
    cache.set(obj, map);
    obj.forEach((value, key) => {
      map.set(deepClone(key, cache), deepClone(value, cache));
    });
    return map;
  }
  if (obj instanceof Set) {
    const set = new Set();
    cache.set(obj, set);
    obj.forEach(value => {
      set.add(deepClone(value, cache));
    });
    return set;
  }

  // 处理数组和对象
  const clone = Array.isArray(obj) ? [] : {};
  cache.set(obj, clone);

  for (const key of Reflect.ownKeys(obj)) {
    clone[key] = deepClone(obj[key], cache);
  }

  return clone;
}

// 测试循环引用
const obj = { name: 'Alice' };
obj.self = obj; // 循环引用

const cloned = deepClone(obj);
console.log(cloned.self === cloned); // true — 正确处理循环引用
```
