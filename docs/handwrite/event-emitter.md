---
sidebar_position: 8
title: 手写 EventEmitter
---

# ✍️ 手写 EventEmitter

## 题目描述

实现一个事件发射器（EventEmitter），支持事件的订阅、触发、取消订阅等操作。

**需要实现的方法：**
- `on(event, listener)` - 订阅事件
- `emit(event, ...args)` - 触发事件
- `off(event, listener)` - 取消订阅
- `once(event, listener)` - 只订阅一次

## 核心思路

```
发布-订阅模式：

Publisher（发布者）
    ↓ emit('click', data)
EventEmitter（事件中心）
    ├── listeners['click'] = [fn1, fn2, fn3]
    └── listeners['data'] = [fn4, fn5]
    ↓ 依次调用
Subscriber（订阅者）
    fn1(data), fn2(data), fn3(data)
```

```
数据结构：
{
  'event1': [listener1, listener2, listener3],
  'event2': [listener4, listener5]
}
```

关键点：
1. 使用 Map 或对象存储事件和对应的监听器数组
2. 支持同一个事件绑定多个监听器
3. once 实现：触发一次后自动取消订阅
4. off 实现：从监听器数组中移除指定函数

## 实现代码

### 基础版

```javascript
/**
 * 基础版 EventEmitter
 */
class EventEmitter {
  constructor() {
    // 使用 Map 存储事件和监听器
    this.events = new Map();
  }

  /**
   * 订阅事件
   * @param {string} event - 事件名称
   * @param {Function} listener - 监听器函数
   * @returns {EventEmitter} 返回 this，支持链式调用
   */
  on(event, listener) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(listener);
    return this;
  }

  /**
   * 触发事件
   * @param {string} event - 事件名称
   * @param {...*} args - 传递给监听器的参数
   * @returns {boolean} 是否有监听器被调用
   */
  emit(event, ...args) {
    if (!this.events.has(event)) {
      return false;
    }

    // 获取该事件的所有监听器并依次调用
    const listeners = this.events.get(event);
    for (const listener of listeners) {
      listener.apply(this, args);
    }

    return true;
  }

  /**
   * 取消订阅
   * @param {string} event - 事件名称
   * @param {Function} listener - 要移除的监听器函数
   * @returns {EventEmitter} 返回 this，支持链式调用
   */
  off(event, listener) {
    if (!this.events.has(event)) {
      return this;
    }

    const listeners = this.events.get(event);
    const index = listeners.indexOf(listener);

    if (index > -1) {
      listeners.splice(index, 1);
    }

    // 如果该事件没有监听器了，删除该事件
    if (listeners.length === 0) {
      this.events.delete(event);
    }

    return this;
  }

  /**
   * 只订阅一次
   * @param {string} event - 事件名称
   * @param {Function} listener - 监听器函数
   * @returns {EventEmitter} 返回 this，支持链式调用
   */
  once(event, listener) {
    // 创建一个包装函数，触发后自动取消订阅
    const onceWrapper = (...args) => {
      this.off(event, onceWrapper);
      listener.apply(this, args);
    };

    // 保存原始函数的引用，方便 off 时使用
    onceWrapper._original = listener;

    return this.on(event, onceWrapper);
  }
}
```

### 完整版（支持更多功能）

```javascript
/**
 * 完整版 EventEmitter
 * 支持通配符、prepend、listenerCount 等
 */
class EventEmitterComplete {
  constructor() {
    this.events = new Map();
  }

  /**
   * 订阅事件
   * @param {string} event - 事件名称
   * @param {Function} listener - 监听器函数
   * @param {Object} options - 选项
   * @param {boolean} options.prepend - 是否插入到监听器数组开头
   * @returns {EventEmitterComplete}
   */
  on(event, listener, options = {}) {
    if (typeof listener !== 'function') {
      throw new TypeError('Listener must be a function');
    }

    if (!this.events.has(event)) {
      this.events.set(event, []);
    }

    const listeners = this.events.get(event);

    if (options.prepend) {
      listeners.unshift(listener);
    } else {
      listeners.push(listener);
    }

    return this;
  }

  /**
   * 在监听器数组开头插入
   */
  prependListener(event, listener) {
    return this.on(event, listener, { prepend: true });
  }

  /**
   * 触发事件
   */
  emit(event, ...args) {
    if (!this.events.has(event)) {
      return false;
    }

    // 创建副本，避免在遍历过程中修改原数组
    const listeners = [...this.events.get(event)];

    for (const listener of listeners) {
      listener.apply(this, args);
    }

    return true;
  }

  /**
   * 取消订阅
   */
  off(event, listener) {
    if (!this.events.has(event)) {
      return this;
    }

    const listeners = this.events.get(event);
    const index = listeners.indexOf(listener);

    if (index > -1) {
      listeners.splice(index, 1);
    }

    if (listeners.length === 0) {
      this.events.delete(event);
    }

    return this;
  }

  /**
   * 只订阅一次
   */
  once(event, listener) {
    const onceWrapper = (...args) => {
      this.off(event, onceWrapper);
      listener.apply(this, args);
    };

    onceWrapper._original = listener;

    return this.on(event, onceWrapper);
  }

  /**
   * 取消某个事件的所有监听器
   * @param {string} event - 事件名称
   * @returns {EventEmitterComplete}
   */
  removeAllListeners(event) {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
    return this;
  }

  /**
   * 获取某个事件的监听器数量
   * @param {string} event - 事件名称
   * @returns {number}
   */
  listenerCount(event) {
    return this.events.has(event) ? this.events.get(event).length : 0;
  }

  /**
   * 获取某个事件的所有监听器
   * @param {string} event - 事件名称
   * @returns {Function[]}
   */
  listeners(event) {
    return this.events.has(event) ? [...this.events.get(event)] : [];
  }

  /**
   * 获取所有已注册的事件名
   * @returns {string[]}
   */
  eventNames() {
    return [...this.events.keys()];
  }
}
```

## 使用示例

```javascript
// ===== 基本用法 =====
const emitter = new EventEmitter();

// 订阅事件
emitter.on('click', (data) => {
  console.log('点击事件:', data);
});

emitter.on('click', (data) => {
  console.log('另一个监听器:', data);
});

// 触发事件
emitter.emit('click', { x: 100, y: 200 });
// 输出：
// 点击事件: { x: 100, y: 200 }
// 另一个监听器: { x: 100, y: 200 }

// ===== once 只订阅一次 =====
emitter.once('init', (config) => {
  console.log('初始化:', config);
});

emitter.emit('init', { debug: true }); // 输出：初始化: { debug: true }
emitter.emit('init', { debug: false }); // 不输出（已被移除）

// ===== off 取消订阅 =====
const handler = (data) => console.log('处理数据:', data);
emitter.on('data', handler);

emitter.emit('data', 'test'); // 输出：处理数据: test

emitter.off('data', handler);
emitter.emit('data', 'test'); // 无输出

// ===== 链式调用 =====
emitter
  .on('event1', () => console.log('1'))
  .on('event2', () => console.log('2'))
  .emit('event1')
  .emit('event2');

// ===== 实现简单组件通信 =====
class EventBus {
  constructor() {
    this.emitter = new EventEmitter();
  }

  subscribe(event, callback) {
    this.emitter.on(event, callback);
    // 返回取消订阅函数
    return () => this.emitter.off(event, callback);
  }

  publish(event, data) {
    this.emitter.emit(event, data);
  }
}

const bus = new EventBus();

// 组件 A 订阅
const unsubscribe = bus.subscribe('userUpdate', (user) => {
  console.log('收到用户更新:', user);
});

// 组件 B 发布
bus.publish('userUpdate', { name: 'Alice', age: 25 });

// 取消订阅
unsubscribe();
```

## 边界情况

- **重复订阅**：同一个函数可以多次绑定到同一个事件，会执行多次
- **取消不存在的订阅**：调用 off 移除不存在的监听器，不会报错
- **触发不存在的事件**：emit 返回 false，不会报错
- **遍历时移除**：在事件回调中移除监听器时，需要使用副本避免问题
- **内存泄漏**：组件销毁时应调用 removeAllListeners 清理
- **this 上下文**：listener 中的 this 指向 EventEmitter 实例

## 复杂度分析

- **时间复杂度**：
  - `on`/`prependListener`：O(1)
  - `emit`：O(n)，n 为监听器数量
  - `off`：O(n)，需要查找监听器索引
  - `once`：O(1)
- **空间复杂度**：O(n)，n 为事件和监听器的总数

## 面试追问

1. **发布-订阅模式和观察者模式有什么区别？**
   | 特性 | 观察者模式 | 发布-订阅模式 |
   |------|-----------|--------------|
   | 耦合度 | 主题和观察者直接通信 | 通过事件中心解耦 |
   | 中介 | 无 | 事件中心（EventEmitter） |
   | 灵活性 | 较低 | 更灵活，支持多个发布者/订阅者 |

2. **如何实现事件的优先级？**
   ```javascript
   // 使用 prependListener
   emitter.prependListener('data', () => {
     console.log('高优先级处理');
   });

   emitter.on('data', () => {
     console.log('普通优先级处理');
   });
   ```

3. **如何防止内存泄漏？**
   - 组件销毁时调用 `removeAllListeners()`
   - 使用 once 替代不需要手动取消的订阅
   - React 中使用 useEffect 的清理函数

4. **Node.js 的 EventEmitter 和浏览器的 EventTarget 有什么区别？**
   | 特性 | EventEmitter | EventTarget |
   |------|-------------|-------------|
   | 错误处理 | 支持 error 事件 | 不支持 |
   | 通配符 | 支持 * 通配符 | 不支持 |
   | 最大监听数 | 可设置 | 无限制 |
   | 运行环境 | Node.js | 浏览器 |

5. **如何实现支持通配符的事件订阅？**
   ```javascript
   emitter.on('*', (event, ...args) => {
     console.log(`捕获所有事件: ${event}`, args);
   });
   ```

6. **如何实现最大监听数限制？**
   ```javascript
   class EventEmitterWithLimit extends EventEmitter {
     constructor(maxListeners = 10) {
       super();
       this.maxListeners = maxListeners;
     }

     on(event, listener) {
       if (this.listenerCount(event) >= this.maxListeners) {
         console.warn(`警告: ${event} 事件的监听器数量已达到上限 ${this.maxListeners}`);
       }
       return super.on(event, listener);
     }
   }
   ```
