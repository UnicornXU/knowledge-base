---
sidebar_position: 4
title: "微前端通信方案"
difficulty: "medium"
tags: ["micro-frontend", "communication", "event-bus", "global-state"]
---

# 微前端通信方案

微前端架构下，子应用之间需要协同工作，但又需要保持松耦合。通信方案的选择直接影响系统的可维护性和扩展性。

## 通信方案总览

```
微前端通信方案
═══════════════════════════════════════════════════════

直接通信
├── Props 传递        —— 主应用 → 子应用（单向）
├── 回调函数          —— 子应用 → 主应用（反向）
└── 共享引用          —— 通过共同引用的实例通信

事件驱动
├── CustomEvent       —— 浏览器原生事件
├── Event Bus         —— 自定义事件总线
└── Broadcast Channel —— 跨标签页通信

状态共享
├── 全局状态管理      —— Redux / Zustand / Vuex
├── qiankun 全局状态  —— initGlobalState
└── 共享 Service      —— 共享的服务实例

URL 通信
├── URL 参数          —— 通过路由参数传递
└── URL Hash          —— 通过 hash 传递数据

存储通信
├── localStorage      —— 同源存储
├── sessionStorage    —— 会话存储
└── IndexedDB         —— 结构化存储
```

## 方案一：Props 传递

最简单直接的方式，适用于主应用向子应用传递数据。

```javascript
// 主应用
import { registerMicroApps } from 'qiankun';

const globalState = {
  user: { name: '张三', role: 'admin' },
  theme: 'dark',
  token: 'xxx-yyy',
};

registerMicroApps([
  {
    name: 'react-app',
    entry: '//localhost:7100',
    container: '#subapp-container',
    activeRule: '/react',
    props: {
      ...globalState,
      // 传递回调函数
      onLogin: (user) => console.log('用户登录:', user),
      onLogout: () => console.log('用户登出'),
      // 传递事件总线
      eventBus: createEventBus(),
    },
  },
]);

// 子应用接收
export async function mount(props) {
  console.log(props.user);      // { name: '张三', role: 'admin' }
  console.log(props.theme);     // 'dark'
  console.log(props.token);     // 'xxx-yyy'

  // 使用回调函数
  props.onLogin({ name: '李四' });

  // 存储 props 供组件使用
  globalProps = props;
}
```

## 方案二：CustomEvent

浏览器原生事件机制，实现跨应用的松耦合通信。

```javascript
// 事件工具类
class MicroEventBus {
  constructor() {
    this.events = new Map();
  }

  // 发送事件
  emit(event, data) {
    window.dispatchEvent(
      new CustomEvent(event, {
        detail: data,
      })
    );
  }

  // 监听事件
  on(event, callback) {
    const handler = (e) => callback(e.detail);
    window.addEventListener(event, handler);

    // 返回取消监听函数
    return () => window.removeEventListener(event, handler);
  }

  // 只监听一次
  once(event, callback) {
    const handler = (e) => {
      callback(e.detail);
      window.removeEventListener(event, handler);
    };
    window.addEventListener(event, handler);
  }
}

// 使用
const eventBus = new MicroEventBus();

// 子应用 A 发送
eventBus.emit('user-login', { name: '张三', id: 123 });

// 子应用 B 监听
const unsubscribe = eventBus.on('user-login', (user) => {
  console.log('收到用户登录事件:', user);
  updateUserUI(user);
});

// 取消监听
unsubscribe();
```

## 方案三：Broadcast Channel

适用于跨标签页通信，支持同源的不同窗口/标签页。

```javascript
// 创建频道
const channel = new BroadcastChannel('micro-frontend');

// 子应用 A 发送消息
channel.postMessage({
  type: 'USER_LOGIN',
  payload: { name: '张三', id: 123 },
});

// 子应用 B 监听消息
channel.onmessage = (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'USER_LOGIN':
      updateUserUI(payload);
      break;
    case 'THEME_CHANGE':
      updateTheme(payload.theme);
      break;
  }
};

// 关闭频道
channel.close();
```

## 方案四：qiankun 全局状态

qiankun 内置的全局状态管理方案。

```javascript
// 主应用
import { initGlobalState } from 'qiankun';

// 初始化全局状态
const actions = initGlobalState({
  user: null,
  token: '',
  theme: 'light',
  permissions: [],
});

// 监听状态变化
actions.onGlobalStateChange((state, prev) => {
  console.log('主应用监听到变化:', state);
  console.log('变化前:', prev);
});

// 修改状态
actions.setGlobalState({
  user: { name: '张三', role: 'admin' },
  token: 'new-token',
});

// 子应用
export async function mount(props) {
  // 监听全局状态变化
  props.onGlobalStateChange((state, prev) => {
    console.log('子应用监听到变化:', state);
    // 更新子应用状态
    store.commit('UPDATE_USER', state.user);
  }, true); // true 表示立即触发一次

  // 修改全局状态
  props.setGlobalState({ token: 'updated-token' });
}
```

## 方案五：共享状态库

通过共享的状态管理库实现跨应用状态同步。

```javascript
// shared/store.js - 共享的状态模块
// 通过 Module Federation 或 UMD 共享

import { createStore } from 'zustand';

export const useGlobalStore = createStore((set) => ({
  // 状态
  user: null,
  theme: 'light',
  notifications: [],

  // 操作
  setUser: (user) => set({ user }),
  setTheme: (theme) => set({ theme }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [...state.notifications, notification],
    })),
}));

// 子应用 A - 更新状态
import { useGlobalStore } from 'shared/store';

function LoginComponent() {
  const setUser = useGlobalStore((s) => s.setUser);

  const handleLogin = async () => {
    const user = await login();
    setUser(user); // 子应用 B 会自动收到更新
  };
}

// 子应用 B - 监听状态
import { useGlobalStore } from 'shared/store';

function HeaderComponent() {
  const user = useGlobalStore((s) => s.user);
  const theme = useGlobalStore((s) => s.theme);

  return (
    <header className={theme}>
      {user ? `欢迎, ${user.name}` : '请登录'}
    </header>
  );
}
```

## 方案六：URL 参数通信

通过 URL 传递数据，适合简单的数据传递和页面跳转场景。

```javascript
// 子应用 A 跳转到子应用 B，传递参数
function navigateToAppB(userId, tab) {
  // 通过 URL 参数传递
  window.history.pushState(
    {},
    '',
    `/app-b/user/${userId}?tab=${tab}&from=app-a`
  );
}

// 子应用 B 接收参数
function useQueryParams() {
  const [params, setParams] = useState(new URLSearchParams(
    window.location.search
  ));

  useEffect(() => {
    const handler = () => {
      setParams(new URLSearchParams(window.location.search));
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  return params;
}

// 使用
function UserDetail() {
  const params = useQueryParams();
  const tab = params.get('tab');      // 'profile'
  const from = params.get('from');    // 'app-a'
}
```

## 方案七：localStorage 通信

适用于需要持久化存储的场景。

```javascript
// storage-bus.js - 基于 localStorage 的通信
class StorageBus {
  constructor(prefix = 'micro-') {
    this.prefix = prefix;
    this.listeners = new Map();

    // 监听 storage 事件（跨标签页）
    window.addEventListener('storage', (e) => {
      if (e.key?.startsWith(this.prefix)) {
        const event = e.key.replace(this.prefix, '');
        const handlers = this.listeners.get(event) || [];
        const data = JSON.parse(e.newValue);
        handlers.forEach((handler) => handler(data));
      }
    });
  }

  // 发送消息
  emit(event, data) {
    const key = `${this.prefix}${event}`;
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now(),
    }));

    // 同标签页内也需要触发
    const handlers = this.listeners.get(event) || [];
    handlers.forEach((handler) => handler(data));

    // 清理（避免 localStorage 膨胀）
    setTimeout(() => localStorage.removeItem(key), 1000);
  }

  // 监听消息
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    return () => {
      const handlers = this.listeners.get(event) || [];
      const index = handlers.indexOf(callback);
      if (index > -1) handlers.splice(index, 1);
    };
  }
}

// 使用
const bus = new StorageBus('app-');

// 子应用 A
bus.emit('user-change', { name: '张三' });

// 子应用 B
bus.on('user-change', (user) => {
  console.log('用户变化:', user);
});
```

## 方案对比

| 方案 | 耦合度 | 数据流向 | 持久化 | 跨标签页 | 适用场景 |
|------|--------|----------|--------|----------|----------|
| Props 传递 | 高 | 主→子 | 否 | 否 | 简单数据传递 |
| CustomEvent | 低 | 双向 | 否 | 否 | 通用事件通信 |
| Broadcast Channel | 低 | 双向 | 否 | 是 | 跨标签页通信 |
| qiankun 全局状态 | 中 | 双向 | 否 | 否 | qiankun 项目 |
| 共享状态库 | 中 | 双向 | 可选 | 否 | 同技术栈共享状态 |
| URL 参数 | 低 | 单向 | 是 | 否 | 页面跳转传参 |
| localStorage | 低 | 双向 | 是 | 是 | 持久化数据共享 |

## 最佳实践

```
通信方案选择指南
═══════════════════════════════════════════════════════

场景 1：主应用传递配置给子应用
  推荐：Props 传递
  理由：简单直接，单向数据流

场景 2：子应用之间需要松耦合通信
  推荐：CustomEvent / Event Bus
  理由：解耦程度高，不依赖具体实现

场景 3：需要跨标签页同步状态
  推荐：Broadcast Channel + localStorage
  理由：原生支持，性能好

场景 4：多个子应用共享用户状态
  推荐：共享状态库（Zustand）或 qiankun 全局状态
  理由：响应式更新，状态管理规范

场景 5：子应用跳转并传递参数
  推荐：URL 参数
  理由：可分享、可刷新、可书签
```

## 面试要点

- **通信方案分类**：直接通信、事件驱动、状态共享、URL 通信、存储通信
- **CustomEvent 实现**：dispatchEvent + addEventListener，注意取消监听
- **Broadcast Channel**：跨标签页通信，同源限制
- **qiankun 全局状态**：initGlobalState + onGlobalStateChange + setGlobalState
- **Props 传递**：最简单但耦合度最高，适合简单的父子通信
- **Event Bus 原理**：发布订阅模式，emit/on/off/once
- **方案选型**：根据耦合度、数据流向、持久化需求、跨标签页需求选择
- **常见陷阱**：事件监听未取消导致内存泄漏、localStorage 容量限制、状态同步延迟
