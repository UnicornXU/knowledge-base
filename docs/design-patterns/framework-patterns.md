---
sidebar_position: 4
title: 前端框架中的设计模式
difficulty: hard
tags:
  - design-patterns
  - react
  - vue
  - angular
  - framework
---

# 🖥️ 前端框架中的设计模式

> **"框架的设计处处体现着设计模式"** —— 理解框架背后的设计模式，能让你更好地使用框架、排查问题、设计架构。

## 一、React 中的设计模式

### 1.1 工厂模式 — createElement

```jsx
// React.createElement 就是工厂模式
const element = React.createElement(
  'div',
  { className: 'container' },
  React.createElement('h1', null, 'Hello'),
  React.createElement('p', null, 'World')
);

// JSX 是 createElement 的语法糖
const element = (
  <div className="container">
    <h1>Hello</h1>
    <p>World</p>
  </div>
);

// 根据 type 创建不同的 Fiber 节点
// 原生元素 → ReactDOMComponent
// 类组件 → ReactClassComponent
// 函数组件 → ReactFunctionalComponent
```

### 1.2 组合模式 — 组件树

```jsx
// React 组件就是组合模式
function App() {
  return (
    <Layout>              {/* 组合节点 */}
      <Header />          {/* 叶子 */}
      <Main>              {/* 组合节点 */}
        <Sidebar />       {/* 叶子 */}
        <Content>         {/* 组合节点 */}
          <ArticleList /> {/* 叶子 */}
        </Content>
      </Main>
      <Footer />          {/* 叶子 */}
    </Layout>
  );
}

// React 递归渲染整棵树
// 每个组件 render 返回子组件，形成树形结构
```

### 1.3 装饰器模式 — 高阶组件（HOC）

```jsx
// 高阶组件就是装饰器模式
function withAuth(WrappedComponent) {
  return function AuthWrapper(props) {
    const { user, loading } = useAuth();

    if (loading) return <Loading />;
    if (!user) return <Redirect to="/login" />;

    return <WrappedComponent {...props} user={user} />;
  };
}

function withLogger(WrappedComponent) {
  return function LoggerWrapper(props) {
    useEffect(() => {
      console.log('组件挂载:', WrappedComponent.name);
      return () => console.log('组件卸载:', WrappedComponent.name);
    }, []);

    return <WrappedComponent {...props} />;
  };
}

// 叠加装饰器
const EnhancedDashboard = withLogger(withAuth(Dashboard));

// 或者用 compose 组合
const enhance = compose(withLogger, withAuth);
const EnhancedDashboard = enhance(Dashboard);
```

### 1.4 观察者模式 — Hooks 响应式

```jsx
// useEffect 就是观察者模式
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  // userId 是"被观察的数据"
  // 当 userId 变化时，回调自动执行
  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]); // 依赖数组 = 观察的目标

  return <div>{user?.name}</div>;
}

// useSyncExternalStore — 外部状态订阅
function useStore(selector) {
  return useSyncExternalStore(
    store.subscribe,     // 订阅函数
    () => selector(store.getState()) // 读取函数
  );
}
```

### 1.5 代理模式 — React 代理渲染

```jsx
// React.memo — 缓存代理
const MemoizedComponent = React.memo(function ExpensiveComponent({ data }) {
  // 只有 data 变化时才重新渲染
  return <div>{expensiveRender(data)}</div>;
});

// useMemo — 计算缓存代理
function SearchResults({ query }) {
  const results = useMemo(() => {
    return expensiveSearch(query); // 缓存计算结果
  }, [query]);

  return <List data={results} />;
}

// useCallback — 函数缓存代理
function Parent() {
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []); // 空依赖 = 永远不变

  return <Child onClick={handleClick} />;
}
```

## 二、Vue 中的设计模式

### 2.1 代理模式 — 响应式系统

```js
// Vue 3 用 Proxy 实现响应式
const state = reactive({ count: 0 });

// 访问 state.count 时 → get 拦截 → 依赖收集
// 修改 state.count 时 → set 拦截 → 触发更新

// 简化的响应式实现
function reactive(target) {
  return new Proxy(target, {
    get(target, key, receiver) {
      track(target, key);  // 收集依赖
      return Reflect.get(target, key, receiver);
    },
    set(target, key, value, receiver) {
      const result = Reflect.set(target, key, value, receiver);
      trigger(target, key); // 触发更新
      return result;
    },
  });
}
```

### 2.2 观察者模式 — Watcher + Dep

```js
// Vue 2 的响应式原理
// 每个响应式属性有一个 Dep（依赖收集器）
// 每个组件有一个 Watcher（观察者）

class Dep {
  static target = null;
  constructor() {
    this.subs = new Set();
  }

  depend() {
    if (Dep.target) {
      this.subs.add(Dep.target);
    }
  }

  notify() {
    this.subs.forEach(watcher => watcher.update());
  }
}

class Watcher {
  constructor(vm, key, callback) {
    this.vm = vm;
    this.key = key;
    this.callback = callback;
    Dep.target = this;
    this.value = vm[key]; // 触发 get，收集依赖
    Dep.target = null;
  }

  update() {
    const newValue = this.vm[this.key];
    if (newValue !== this.value) {
      this.callback(newValue, this.value);
      this.value = newValue;
    }
  }
}

// 数据劫持
function defineReactive(obj, key, value) {
  const dep = new Dep();

  Object.defineProperty(obj, key, {
    get() {
      dep.depend(); // 收集依赖
      return value;
    },
    set(newVal) {
      if (newVal !== value) {
        value = newVal;
        dep.notify(); // 触发更新
      }
    },
  });
}
```

### 2.3 发布-订阅模式 — EventBus

```js
// Vue 2 的 EventBus
class VueEventBus {
  constructor() {
    this.events = {};
  }

  $on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  $emit(event, ...args) {
    (this.events[event] || []).forEach(cb => cb(...args));
  }

  $off(event, callback) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
  }

  $once(event, callback) {
    const wrapper = (...args) => {
      callback(...args);
      this.$off(event, wrapper);
    };
    this.$on(event, wrapper);
  }
}

// 使用
const bus = new VueEventBus();
bus.$on('userLogin', (user) => console.log(user));
bus.$emit('userLogin', { name: 'Alice' });

// Vue 3 推荐用 mitt 或 tiny-emitter
import mitt from 'mitt';
const emitter = mitt();
emitter.on('userLogin', (user) => console.log(user));
```

### 2.4 策略模式 — 指令系统

```js
// Vue 的内置指令就是策略模式
const strategies = {
  v-if: {
    bind(el, binding) { /* 初始化 */ },
    update(el, binding) {
      if (binding.value) {
        el.style.display = '';
      } else {
        el.style.display = 'none';
      }
    },
  },
  v-show: {
    bind(el, binding) { /* 初始化 */ },
    update(el, binding) {
      el.style.display = binding.value ? '' : 'none';
    },
  },
  v-for: {
    bind(el, binding) { /* 初始化 */ },
    update(el, binding) {
      // 列表渲染逻辑
    },
  },
};
```

## 三、通用框架模式

### 3.1 中间件模式

```js
// Express/Koa 的中间件模式
class MiddlewarePipeline {
  constructor() {
    this.middlewares = [];
  }

  use(middleware) {
    this.middlewares.push(middleware);
    return this; // 链式调用
  }

  async execute(context) {
    let index = 0;

    const next = async () => {
      if (index < this.middlewares.length) {
        const middleware = this.middlewares[index++];
        await middleware(context, next);
      }
    };

    await next();
    return context;
  }
}

// 使用
const pipeline = new MiddlewarePipeline();

pipeline.use(async (ctx, next) => {
  console.log('中间件1: 开始');
  ctx.startTime = Date.now();
  await next();
  ctx.duration = Date.now() - ctx.startTime;
  console.log(`中间件1: 结束，耗时 ${ctx.duration}ms`);
});

pipeline.use(async (ctx, next) => {
  console.log('中间件2: 开始');
  ctx.data = { message: 'Hello' };
  await next();
  console.log('中间件2: 结束');
});

pipeline.use(async (ctx) => {
  console.log('中间件3: 处理业务');
  ctx.result = ctx.data.message.toUpperCase();
});

pipeline.execute({}).then(ctx => {
  console.log('结果:', ctx.result); // HELLO
});
```

### 3.2 依赖注入模式

```js
// 依赖注入 —— 不在内部创建依赖，从外部传入
// Angular 的核心模式

// ❌ 紧耦合
class UserService {
  constructor() {
    this.api = new ApiClient(); // 直接创建依赖
    this.cache = new CacheManager();
  }
}

// ✅ 依赖注入
class UserService {
  constructor(api, cache) {
    this.api = api;       // 从外部注入
    this.cache = cache;
  }
}

// 简单的 DI 容器
class Container {
  constructor() {
    this.services = new Map();
  }

  register(name, factory) {
    this.services.set(name, factory);
  }

  resolve(name) {
    const factory = this.services.get(name);
    if (!factory) throw new Error(`Service ${name} not found`);
    return factory(this);
  }
}

// 使用
const container = new Container();
container.register('api', () => new ApiClient('/api'));
container.register('cache', () => new CacheManager());
container.register('userService', (c) =>
  new UserService(c.resolve('api'), c.resolve('cache'))
);

const userService = container.resolve('userService');
```

### 3.3 Render Props / Slots 模式

```jsx
// React Render Props —— 行为共享
function MouseTracker({ render }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return render(position);
}

// 使用
<MouseTracker render={({ x, y }) => (
  <div>鼠标位置: {x}, {y}</div>
)} />

// Vue Slots —— 内容分发
// <template>
//   <div class="card">
//     <div class="card-header">
//       <slot name="header">默认标题</slot>
//     </div>
//     <div class="card-body">
//       <slot>默认内容</slot>
//     </div>
//   </div>
// </template>
```

## 四、设计模式总结

```
前端框架中的设计模式速查表
═══════════════════════════════════════════════════════

模式            React                 Vue                  Angular
──────────     ──────────            ──────────           ──────────
工厂模式        createElement         h()                  Component
组合模式        组件树                组件树                组件树
代理模式        Proxy                 Proxy 响应式          Zone.js
观察者模式      useEffect/依赖        Watcher+Dep          RxJS Observable
发布-订阅       Context               EventBus             Event Emitter
策略模式        useReducer            指令系统              DI 策略
装饰器模式      HOC                   Mixins/Composables   Decorator
命令模式        Redux Action          Mutation             Action
中间件模式      Redux Middleware      插件系统              Interceptor
依赖注入        Context               provide/inject       DI 系统
```

## 五、常见面试题

**Q1: React 中用到了哪些设计模式？**

A: 1）工厂模式（createElement）；2）组合模式（组件树）；3）装饰器模式（HOC）；4）观察者模式（useEffect）；5）代理模式（React.memo/useMemo）；6）策略模式（reconciler 协调器）。

**Q2: Vue 的响应式用了什么设计模式？**

A: Vue 3 用 Proxy（代理模式）实现数据劫持，配合观察者模式（Dep + Watcher）实现依赖收集和自动更新。Vue 2 用 Object.defineProperty（也是代理）实现。整体是观察者模式的应用。

**Q3: HOC 和 Hooks 的区别？分别用了什么设计模式？**

A: HOC 是装饰器模式，通过包装组件增强功能，但会增加组件嵌套。Hooks 是函数式编程的组合模式，通过函数复用状态逻辑，更简洁。HOC 适合增强渲染逻辑，Hooks 适合复用状态逻辑。
