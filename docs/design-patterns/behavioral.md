---
sidebar_position: 3
title: 行为型模式
difficulty: hard
tags:
  - design-patterns
  - observer
  - pubsub
  - strategy
  - command
  - state
  - chain-of-responsibility
---

# ⚡ 行为型模式

> **"行为型模式关注的是对象之间如何通信"** —— 对象之间怎样传递消息、怎样协作完成任务。

## 一、观察者模式（Observer）

### 1.1 什么是观察者？

```
观察者模式 —— 一个变了，自动通知其他人
═══════════════════════════════════════════════════════

现实中的观察者：
• 微信公众号 —— 你关注了，发文章你就能收到
• 天气预报 —— 天气变了，订阅的人自动收到通知
• 股票行情 —— 股价变了，关注的股民自动看到

代码中的观察者：
• DOM 事件 —— addEventListener
• Vue 响应式 —— 数据变了，视图自动更新
• React useEffect —— 依赖变了，副作用自动执行
```

### 1.2 实现

```js
// 被观察者（Subject）
class EventEmitter {
  constructor() {
    this.events = new Map();
  }

  // 订阅
  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event).add(callback);

    // 返回取消订阅函数
    return () => this.off(event, callback);
  }

  // 取消订阅
  off(event, callback) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  // 触发事件
  emit(event, ...args) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach(cb => {
        try {
          cb(...args);
        } catch (err) {
          console.error(`Event ${event} handler error:`, err);
        }
      });
    }
  }

  // 只订阅一次
  once(event, callback) {
    const wrapper = (...args) => {
      callback(...args);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }
}

// 使用
const emitter = new EventEmitter();

// 订阅
const unsub = emitter.on('userLogin', (user) => {
  console.log('用户登录:', user.name);
});

emitter.on('userLogin', (user) => {
  console.log('更新 UI:', user.name);
});

// 触发
emitter.emit('userLogin', { name: 'Alice' });
// 用户登录: Alice
// 更新 UI: Alice

// 取消订阅
unsub();

// 只订阅一次
emitter.once('ready', () => {
  console.log('只执行一次');
});
emitter.emit('ready'); // 只执行一次
emitter.emit('ready'); // 无输出
```

### 1.3 前端应用场景

```js
// 场景1：组件间通信
class ComponentBus {
  static emitter = new EventEmitter();

  static emit(event, data) {
    this.emitter.emit(event, data);
  }

  static on(event, callback) {
    return this.emitter.on(event, callback);
  }
}

// 组件 A —— 发送消息
ComponentBus.emit('cart:add', { productId: 1, quantity: 1 });

// 组件 B —— 接收消息
ComponentBus.on('cart:add', (item) => {
  console.log('购物车更新:', item);
});


// 场景2：状态变化监听
class Store {
  constructor(initialState = {}) {
    this.state = initialState;
    this.emitter = new EventEmitter();
  }

  getState() {
    return this.state;
  }

  setState(newState) {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...newState };
    this.emitter.emit('change', this.state, oldState);
  }

  subscribe(callback) {
    return this.emitter.on('change', callback);
  }
}

// 使用
const store = new Store({ count: 0 });

store.subscribe((newState, oldState) => {
  console.log(`count: ${oldState.count} → ${newState.count}`);
});

store.setState({ count: 1 }); // count: 0 → 1
store.setState({ count: 2 }); // count: 1 → 2
```

## 二、发布-订阅模式（Pub-Sub）

### 2.1 与观察者的区别

```
观察者 vs 发布-订阅
═══════════════════════════════════════════════════════

观察者模式：
  Subject ──直接通知──→ Observer1
           ──直接通知──→ Observer2
  （Subject 知道 Observer 的存在）

发布-订阅模式：
  Publisher ──发布──→ Event Channel ──分发──→ Subscriber1
                                       ──分发──→ Subscriber2
  （Publisher 和 Subscriber 互不知道对方）

区别：
• 观察者：Subject 和 Observer 直接耦合
• 发布-订阅：通过 Event Channel 解耦
```

### 2.2 实现

```js
class PubSub {
  constructor() {
    this.topics = new Map();       // 主题 → 订阅者集合
    this.history = new Map();      // 历史消息（支持回放）
  }

  // 订阅
  subscribe(topic, callback) {
    if (!this.topics.has(topic)) {
      this.topics.set(topic, new Set());
    }
    this.topics.get(topic).add(callback);

    // 如果有历史消息，立即回放最后一条
    const history = this.history.get(topic);
    if (history && history.length > 0) {
      callback(history[history.length - 1]);
    }

    // 返回取消订阅函数
    return () => this.unsubscribe(topic, callback);
  }

  // 发布
  publish(topic, data) {
    const subscribers = this.topics.get(topic);
    if (subscribers) {
      subscribers.forEach(cb => {
        try {
          cb(data);
        } catch (err) {
          console.error(`Topic ${topic} handler error:`, err);
        }
      });
    }

    // 保存历史
    if (!this.history.has(topic)) {
      this.history.set(topic, []);
    }
    this.history.get(topic).push(data);
  }

  // 取消订阅
  unsubscribe(topic, callback) {
    const subscribers = this.topics.get(topic);
    if (subscribers) {
      subscribers.delete(callback);
    }
  }

  // 取消所有订阅
  unsubscribeAll(topic) {
    this.topics.delete(topic);
  }
}

// 使用
const pubsub = new PubSub();

// 订阅
pubsub.subscribe('order:created', (order) => {
  console.log('发送邮件:', order.id);
});

pubsub.subscribe('order:created', (order) => {
  console.log('更新库存:', order.items);
});

// 发布
pubsub.publish('order:created', {
  id: 'ORD001',
  items: [{ productId: 1, quantity: 2 }],
});
// 发送邮件: ORD001
// 更新库存: [{ productId: 1, quantity: 2 }]
```

## 三、策略模式（Strategy）

### 3.1 什么是策略？

```
策略模式 —— 算法可以互相替换
═══════════════════════════════════════════════════════

现实中的策略：
• 导航路线 —— 最快路线、最短路线、不走高速
• 会员折扣 —— 普通用户、VIP、SVIP 不同折扣
• 支付方式 —— 微信支付、支付宝、银行卡

代码中的策略：
• 表单验证 —— 不同字段用不同验证规则
• 排序算法 —— 根据场景选择不同排序
• 请求方式 —— 根据环境选择不同请求策略
```

### 3.2 实现

```js
// ========== 用对象映射替代 if-else ==========

// ❌ 错误：大量的 if-else
function calculatePrice(type, price) {
  if (type === 'normal') {
    return price;
  } else if (type === 'vip') {
    return price * 0.8;
  } else if (type === 'svip') {
    return price * 0.6;
  } else if (type === 'employee') {
    return price * 0.5;
  }
}

// ✅ 正确：策略模式
const pricingStrategies = {
  normal: (price) => price,
  vip: (price) => price * 0.8,
  svip: (price) => price * 0.6,
  employee: (price) => price * 0.5,
};

function calculatePrice(type, price) {
  const strategy = pricingStrategies[type];
  if (!strategy) throw new Error(`Unknown type: ${type}`);
  return strategy(price);
}

console.log(calculatePrice('vip', 100));     // 80
console.log(calculatePrice('svip', 100));    // 60
```

### 3.3 表单验证策略

```js
// 验证策略集合
const validationStrategies = {
  required(value) {
    if (!value || value.trim() === '') return '此字段不能为空';
  },

  minLength(value, min) {
    if (value && value.length < Number(min)) return `最少 ${min} 个字符`;
  },

  maxLength(value, max) {
    if (value && value.length > Number(max)) return `最多 ${max} 个字符`;
  },

  email(value) {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return '邮箱格式不正确';
  },

  phone(value) {
    if (value && !/^1[3-9]\d{9}$/.test(value)) return '手机号格式不正确';
  },

  number(value) {
    if (value && isNaN(Number(value))) return '必须是数字';
  },

  min(value, min) {
    if (value && Number(value) < Number(min)) return `不能小于 ${min}`;
  },

  max(value, max) {
    if (value && Number(value) > Number(max)) return `不能大于 ${max}`;
  },

  pattern(value, regex) {
    if (value && !new RegExp(regex).test(value)) return '格式不正确';
  },
};

// 表单验证器
class FormValidator {
  constructor() {
    this.rules = new Map();
  }

  addField(name, rules) {
    this.rules.set(name, rules);
    return this;
  }

  validate(formData) {
    const errors = {};

    for (const [field, rules] of this.rules) {
      const value = formData[field];

      for (const rule of rules) {
        const [strategyName, ...params] = rule.split(':');
        const strategy = validationStrategies[strategyName];

        if (strategy) {
          const error = strategy(value, ...params);
          if (error) {
            if (!errors[field]) errors[field] = [];
            errors[field].push(error);
          }
        }
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }
}

// 使用
const validator = new FormValidator();
validator
  .addField('username', ['required', 'minLength:3', 'maxLength:20'])
  .addField('email', ['required', 'email'])
  .addField('phone', ['phone'])
  .addField('age', ['number', 'min:0', 'max:150']);

const result = validator.validate({
  username: 'ab',
  email: 'invalid-email',
  phone: '123',
  age: 'abc',
});

console.log(result);
// {
//   valid: false,
//   errors: {
//     username: ['最少 3 个字符'],
//     email: ['邮箱格式不正确'],
//     phone: ['手机号格式不正确'],
//     age: ['必须是数字']
//   }
// }
```

## 四、命令模式（Command）

### 4.1 什么是命令？

```
命令模式 —— 把操作封装成对象
═══════════════════════════════════════════════════════

现实中的命令：
• 餐厅点单 —— 写在纸上，厨房按单做菜
• 遥控器按钮 —— 每个按钮对应一个命令
• 军事命令 —— 将军下令，士兵执行

代码中的命令：
• 撤销/重做 —— 把操作存起来，可以回退
• 任务队列 —— 把操作排队，按顺序执行
• 宏录制 —— 录制一系列操作，可以回放
```

### 4.2 实现撤销/重做

```js
// 命令接口
class Command {
  execute() { throw new Error('子类必须实现 execute'); }
  undo() { throw new Error('子类必须实现 undo'); }
}

// 具体命令：添加元素
class AddCommand extends Command {
  constructor(editor, element) {
    super();
    this.editor = editor;
    this.element = element;
  }

  execute() {
    this.editor.addElement(this.element);
  }

  undo() {
    this.editor.removeElement(this.element);
  }
}

// 具体命令：删除元素
class RemoveCommand extends Command {
  constructor(editor, element) {
    super();
    this.editor = editor;
    this.element = element;
    this.index = -1;
  }

  execute() {
    this.index = this.editor.elements.indexOf(this.element);
    this.editor.removeElement(this.element);
  }

  undo() {
    this.editor.addElementAt(this.element, this.index);
  }
}

// 具体命令：移动元素
class MoveCommand extends Command {
  constructor(editor, element, newX, newY) {
    super();
    this.editor = editor;
    this.element = element;
    this.newX = newX;
    this.newY = newY;
    this.oldX = 0;
    this.oldY = 0;
  }

  execute() {
    this.oldX = this.element.x;
    this.oldY = this.element.y;
    this.element.x = this.newX;
    this.element.y = this.newY;
  }

  undo() {
    this.element.x = this.oldX;
    this.element.y = this.oldY;
  }
}

// 命令管理器（支持撤销/重做）
class CommandManager {
  constructor() {
    this.history = [];       // 已执行的命令
    this.undoneStack = [];   // 已撤销的命令
  }

  execute(command) {
    command.execute();
    this.history.push(command);
    this.undoneStack = []; // 执行新命令后清空重做栈
  }

  undo() {
    const command = this.history.pop();
    if (command) {
      command.undo();
      this.undoneStack.push(command);
    }
  }

  redo() {
    const command = this.undoneStack.pop();
    if (command) {
      command.execute();
      this.history.push(command);
    }
  }

  canUndo() {
    return this.history.length > 0;
  }

  canRedo() {
    return this.undoneStack.length > 0;
  }
}

// 使用
const manager = new CommandManager();
const editor = { elements: [], addElement(e) { this.elements.push(e); } };

manager.execute(new AddCommand(editor, { type: 'rect', x: 0, y: 0 }));
manager.execute(new AddCommand(editor, { type: 'circle', x: 100, y: 100 }));
console.log(editor.elements.length); // 2

manager.undo();
console.log(editor.elements.length); // 1

manager.redo();
console.log(editor.elements.length); // 2
```

## 五、状态模式（State）

### 5.1 什么是状态？

```
状态模式 —— 状态决定行为
═══════════════════════════════════════════════════════

现实中的状态：
• 订单状态 —— 待付款→已付款→已发货→已完成
• 红绿灯 —— 红灯停、绿灯行、黄灯等
• 游戏角色 —— 待机、攻击、受伤、死亡

代码中的状态：
• Promise —— pending → fulfilled / rejected
• 请求状态 —— idle → loading → success / error
• 组件状态 —— 根据状态渲染不同 UI
```

### 5.2 实现

```js
// 状态类
class State {
  constructor(name) {
    this.name = name;
  }

  handle(context) {
    throw new Error('子类必须实现 handle');
  }

  toString() {
    return this.name;
  }
}

// 具体状态
class PendingState extends State {
  constructor() { super('pending'); }

  handle(context) {
    console.log('请求中...');
    // 模拟异步请求
    setTimeout(() => {
      if (Math.random() > 0.3) {
        context.setState(new SuccessState({ data: 'Hello' }));
      } else {
        context.setState(new ErrorState(new Error('网络错误')));
      }
    }, 1000);
  }
}

class SuccessState extends State {
  constructor(data) {
    super('success');
    this.data = data;
  }

  handle(context) {
    console.log('请求成功:', this.data);
  }
}

class ErrorState extends State {
  constructor(error) {
    super('error');
    this.error = error;
  }

  handle(context) {
    console.log('请求失败:', this.error.message);
    console.log('3 秒后重试...');
    setTimeout(() => context.setState(new PendingState()), 3000);
  }
}

// 上下文
class RequestContext {
  constructor() {
    this.state = new PendingState();
  }

  setState(state) {
    console.log(`状态变更: ${this.state} → ${state}`);
    this.state = state;
    this.state.handle(this);
  }

  start() {
    this.state.handle(this);
  }
}

// 使用
const context = new RequestContext();
context.start();
// 状态变更: pending → pending
// 请求中...
// 状态变更: pending → success
// 请求成功: Hello
```

### 5.3 React 中的状态模式

```jsx
// 用状态模式管理请求状态
function useFetchState() {
  const [state, setState] = useState({
    status: 'idle', // idle | loading | success | error
    data: null,
    error: null,
  });

  const actions = {
    idle: { fetch: () => setState({ status: 'loading', data: null, error: null }) },
    loading: {
      success: (data) => setState({ status: 'success', data, error: null }),
      error: (error) => setState({ status: 'error', data: null, error }),
    },
    success: { reset: () => setState({ status: 'idle', data: null, error: null }) },
    error: { retry: () => setState({ status: 'loading', data: null, error: null }) },
  };

  return { state, actions: actions[state.status] || {} };
}

// 使用
function UserProfile({ userId }) {
  const { state, actions } = useFetchState();

  useEffect(() => {
    actions.fetch?.();
    fetchUser(userId)
      .then(data => actions.success?.(data))
      .catch(err => actions.error?.(err));
  }, [userId]);

  if (state.status === 'loading') return <Loading />;
  if (state.status === 'error') return <Error onRetry={actions.retry} />;
  if (state.status === 'success') return <UserCard user={state.data} />;
  return null;
}
```

## 六、职责链模式（Chain of Responsibility）

### 6.1 什么是职责链？

```
职责链模式 —— 请求沿链传递，直到有人处理
═══════════════════════════════════════════════════════

现实中的职责链：
• 审批流程 —— 员工→主管→经理→总裁
• 请假流程 —— 1天内主管批，3天内经理批，3天以上总裁批
• 售后服务 —— 客服→技术→经理→投诉部门

代码中的职责链：
• Express/Koa 中间件
• 事件冒泡（DOM Event Bubbling）
• Vue/React 的插件系统
```

### 6.2 实现

```js
// 中间件类
class Middleware {
  constructor(name) {
    this.name = name;
    this.next = null;
  }

  setNext(middleware) {
    this.next = middleware;
    return middleware; // 支持链式调用
  }

  handle(request) {
    if (this.next) {
      return this.next.handle(request);
    }
    return null;
  }
}

// 具体中间件：日志
class LoggingMiddleware extends Middleware {
  handle(request) {
    console.log(`[${this.name}] 请求:`, request);
    return super.handle(request);
  }
}

// 具体中间件：认证
class AuthMiddleware extends Middleware {
  handle(request) {
    if (!request.token) {
      console.log(`[${this.name}] 未登录，拒绝访问`);
      return { error: 'Unauthorized' };
    }
    console.log(`[${this.name}] 认证通过`);
    return super.handle(request);
  }
}

// 具体中间件：权限检查
class PermissionMiddleware extends Middleware {
  constructor(name, requiredRole) {
    super(name);
    this.requiredRole = requiredRole;
  }

  handle(request) {
    if (request.role !== this.requiredRole) {
      console.log(`[${this.name}] 权限不足`);
      return { error: 'Forbidden' };
    }
    console.log(`[${this.name}] 权限检查通过`);
    return super.handle(request);
  }
}

// 具体中间件：业务处理
class BusinessMiddleware extends Middleware {
  handle(request) {
    console.log(`[${this.name}] 处理业务逻辑`);
    return { success: true, data: '操作成功' };
  }
}

// 构建职责链
const chain = new LoggingMiddleware('日志');
chain
  .setNext(new AuthMiddleware('认证'))
  .setNext(new PermissionMiddleware('权限', 'admin'))
  .setNext(new BusinessMiddleware('业务'));

// 使用
console.log('--- 测试1：正常请求 ---');
chain.handle({ token: 'xxx', role: 'admin', data: {} });
// [日志] 请求: { token: 'xxx', role: 'admin', data: {} }
// [认证] 认证通过
// [权限] 权限检查通过
// [业务] 处理业务逻辑
// 返回: { success: true, data: '操作成功' }

console.log('--- 测试2：未登录 ---');
chain.handle({ data: {} });
// [日志] 请求: { data: {} }
// [认证] 未登录，拒绝访问
// 返回: { error: 'Unauthorized' }

console.log('--- 测试3：权限不足 ---');
chain.handle({ token: 'xxx', role: 'user', data: {} });
// [日志] 请求: { token: 'xxx', role: 'user', data: {} }
// [认证] 认证通过
// [权限] 权限不足
// 返回: { error: 'Forbidden' }
```

### 6.3 Koa 中间件（洋葱模型）

```js
// Koa 中间件就是职责链模式
const Koa = require('koa');
const app = new Koa();

// 中间件 1：日志
app.use(async (ctx, next) => {
  const start = Date.now();
  console.log('→ 请求开始');
  await next(); // 传递给下一个中间件
  const ms = Date.now() - start;
  console.log(`← 请求结束，耗时 ${ms}ms`);
});

// 中间件 2：认证
app.use(async (ctx, next) => {
  const token = ctx.headers.authorization;
  if (!token) {
    ctx.status = 401;
    ctx.body = { error: 'Unauthorized' };
    return; // 不调用 next()，中断链条
  }
  ctx.user = verifyToken(token);
  await next();
});

// 中间件 3：业务处理
app.use(async (ctx) => {
  ctx.body = { message: 'Hello', user: ctx.user };
});

// 执行顺序（洋葱模型）：
// → 中间件1 开始
//   → 中间件2 开始
//     → 中间件3 执行
//   ← 中间件2 结束
// ← 中间件1 结束
```
