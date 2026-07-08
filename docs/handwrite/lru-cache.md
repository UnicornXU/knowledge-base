---
sidebar_position: 11
title: 手写 LRU 缓存
---

# ✍️ 手写 LRU 缓存（LRU Cache）

## 题目描述

设计并实现一个 LRU（Least Recently Used，最近最少使用）缓存机制。

**要求：**
- `LRUCache(capacity)` - 初始化缓存容量
- `get(key)` - 获取 key 对应的值，不存在返回 -1
- `put(key, value)` - 写入键值对，超出容量时淘汰最久未使用的

**时间复杂度要求：** `get` 和 `put` 都必须是 O(1)

## 核心思路

```
LRU 缓存策略：
- 最近访问的数据放在最前面
- 缓存满时，删除最后面（最久未使用）的数据

数据结构选择：
1. Map（利用插入顺序特性）
2. 哈希表 + 双向链表（经典实现）

Map 的特性：
- Map.keys() 按插入顺序返回
- Map.set() 已存在的 key，会更新并移到最后
- 利用这个特性可以轻松实现 LRU
```

```
双向链表实现：

head ↔ node1 ↔ node2 ↔ node3 ↔ tail

get(key): 将节点移到头部
put(key,value): 
  1. 存在：更新值，移到头部
  2. 不存在：插入头部
  3. 超出容量：删除尾部节点
```

## 实现代码

### 方法一：使用 Map（简洁版）

```javascript
/**
 * 使用 Map 实现 LRU 缓存
 * 利用 Map 的插入顺序特性
 */
class LRUCache {
  /**
   * @param {number} capacity - 缓存容量
   */
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  /**
   * 获取缓存值
   * @param {number} key
   * @returns {number} 值或 -1
   */
  get(key) {
    if (!this.cache.has(key)) {
      return -1;
    }

    // 获取值
    const value = this.cache.get(key);

    // 将 key 移到最后（标记为最近使用）
    // 先删除再插入，会更新位置
    this.cache.delete(key);
    this.cache.set(key, value);

    return value;
  }

  /**
   * 写入缓存
   * @param {number} key
   * @param {number} value
   */
  put(key, value) {
    // 如果 key 已存在，先删除
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // 插入新值（会自动排到最后）
    this.cache.set(key, value);

    // 如果超出容量，删除最久未使用的（第一个）
    if (this.cache.size > this.capacity) {
      // Map.keys().next().value 获取第一个 key
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }
}
```

### 方法二：哈希表 + 双向链表（经典版）

```javascript
/**
 * 双向链表节点
 */
class DoublyListNode {
  constructor(key = 0, value = 0) {
    this.key = key;
    this.value = value;
    this.prev = null;
    this.next = null;
  }
}

/**
 * 使用哈希表 + 双向链表实现 LRU 缓存
 * 更加高效，操作都是 O(1)
 */
class LRUCacheLinkedList {
  /**
   * @param {number} capacity - 缓存容量
   */
  constructor(capacity) {
    this.capacity = capacity;
    this.size = 0;
    this.cache = new Map(); // key -> node

    // 创建虚拟头尾节点，简化边界处理
    this.head = new DoublyListNode();
    this.tail = new DoublyListNode();

    // 连接头尾
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  /**
   * 将节点添加到头部（最近使用）
   * @param {DoublyListNode} node
   */
  addToHead(node) {
    node.prev = this.head;
    node.next = this.head.next;

    this.head.next.prev = node;
    this.head.next = node;
  }

  /**
   * 删除节点
   * @param {DoublyListNode} node
   */
  removeNode(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }

  /**
   * 将节点移到头部（标记为最近使用）
   * @param {DoublyListNode} node
   */
  moveToHead(node) {
    this.removeNode(node);
    this.addToHead(node);
  }

  /**
   * 删除尾部节点（最久未使用）
   * @returns {DoublyListNode}
   */
  removeTail() {
    const node = this.tail.prev;
    this.removeNode(node);
    return node;
  }

  /**
   * 获取缓存值
   * @param {number} key
   * @returns {number} 值或 -1
   */
  get(key) {
    if (!this.cache.has(key)) {
      return -1;
    }

    const node = this.cache.get(key);
    // 移到头部（标记为最近使用）
    this.moveToHead(node);

    return node.value;
  }

  /**
   * 写入缓存
   * @param {number} key
   * @param {number} value
   */
  put(key, value) {
    if (this.cache.has(key)) {
      // key 存在，更新值并移到头部
      const node = this.cache.get(key);
      node.value = value;
      this.moveToHead(node);
    } else {
      // key 不存在，创建新节点
      const node = new DoublyListNode(key, value);

      // 检查容量
      if (this.size >= this.capacity) {
        // 删除最久未使用的（尾部节点）
        const removed = this.removeTail();
        this.cache.delete(removed.key);
        this.size--;
      }

      // 添加到头部
      this.addToHead(node);
      this.cache.set(key, node);
      this.size++;
    }
  }
}
```

## 使用示例

```javascript
// ===== 使用 Map 版本 =====
const lru = new LRUCache(3);

lru.put(1, 'a');
lru.put(2, 'b');
lru.put(3, 'c');
// 缓存：[1='a', 2='b', 3='c']

console.log(lru.get(1)); // 'a'（1 变为最近使用）
// 缓存：[2='b', 3='c', 1='a']

lru.put(4, 'd'); // 超出容量，淘汰最久未使用的 2
// 缓存：[3='c', 1='a', 4='d']

console.log(lru.get(2)); // -1（已被淘汰）

lru.put(3, 'c2'); // 更新已存在的 key
// 缓存：[1='a', 4='d', 3='c2']

console.log(lru.get(3)); // 'c2'

// ===== 使用双向链表版本 =====
const lru2 = new LRUCacheLinkedList(2);

lru2.put(1, 1);
lru2.put(2, 2);
console.log(lru2.get(1)); // 1

lru2.put(3, 3); // 淘汰 key=2
console.log(lru2.get(2)); // -1

lru2.put(4, 4); // 淘汰 key=1
console.log(lru2.get(1)); // -1
console.log(lru2.get(3)); // 3
console.log(lru2.get(4)); // 4

// ===== 实际应用场景：缓存 API 请求 =====
class ApiCache {
  constructor(maxSize = 100) {
    this.cache = new LRUCache(maxSize);
  }

  async fetch(url) {
    // 先检查缓存
    const cached = this.cache.get(url);
    if (cached !== -1) {
      console.log('命中缓存:', url);
      return cached;
    }

    // 缓存未命中，发起请求
    console.log('请求接口:', url);
    const response = await fetch(url);
    const data = await response.json();

    // 存入缓存
    this.cache.put(url, data);

    return data;
  }
}
```

## 边界情况

- **容量为 0**：无法存储任何数据，get 总是返回 -1
- **重复 key**：put 相同 key，更新值并标记为最近使用
- **容量为 1**：每次 put 都会淘汰之前的数据
- **key 不存在**：get 返回 -1
- **并发访问**：LRU 缓存不是线程安全的（JavaScript 单线程，通常不需要考虑）

## 复杂度分析

### Map 版本
- **时间复杂度**：
  - `get`：O(1)
  - `put`：O(1)
- **空间复杂度**：O(capacity)

### 双向链表版本
- **时间复杂度**：
  - `get`：O(1)
  - `put`：O(1)
- **空间复杂度**：O(capacity)

## 面试追问

1. **为什么 LRU 缓存需要 O(1) 的时间复杂度？**
   - 缓存是为了加速访问，如果操作不是 O(1)，就失去了缓存的意义
   - 哈希表提供 O(1) 的查找
   - 双向链表提供 O(1) 的插入和删除

2. **Map 和 Object 的区别？为什么用 Map？**
   | 特性 | Map | Object |
   |------|-----|--------|
   | 键类型 | 任意类型 | 字符串/Symbol |
   | 顺序 | 插入顺序 | 无保证 |
   | 大小 | size 属性 | 需要手动计算 |
   | 性能 | 频繁增删更优 | 一般场景更优 |

3. **如何实现 LFU（Least Frequently Used）缓存？**
   - 使用两个哈希表：key->value 和 key->freq
   - 使用双向链表数组，按频率分组
   - 淘汰时删除频率最低的链表中最早的节点
   - 比 LRU 更复杂，需要维护频率信息

4. **如何实现一个支持过期时间的 LRU 缓存？**
   ```javascript
   class TTLCache {
     constructor(capacity, ttl = 60000) {
       this.capacity = capacity;
       this.ttl = ttl;
       this.cache = new Map();
     }

     get(key) {
       if (!this.cache.has(key)) return -1;
       const { value, expire } = this.cache.get(key);
       if (Date.now() > expire) {
         this.cache.delete(key);
         return -1;
       }
       this.cache.delete(key);
       this.cache.set(key, { value, expire });
       return value;
     }

     put(key, value) {
       if (this.cache.has(key)) this.cache.delete(key);
       this.cache.set(key, { value, expire: Date.now() + this.ttl });
       if (this.cache.size > this.capacity) {
         const firstKey = this.cache.keys().next().value;
         this.cache.delete(firstKey);
       }
     }
   }
   ```

5. **LRU 缓存在实际项目中的应用场景？**
   - 浏览器缓存（HTTP 缓存策略）
   - 数据库查询缓存
   - API 响应缓存
   - 图片/资源缓存
   - DNS 解析缓存
   - 操作系统页面置换算法

6. **为什么不直接使用 WeakMap？**
   - WeakMap 的 key 必须是对象
   - WeakMap 没有 size 属性，无法知道缓存大小
   - WeakMap 不可遍历，无法实现 LRU 淘汰策略
   - WeakMap 适合存储对象的私有数据，不适合 LRU 缓存

7. **如何实现一个线程安全的 LRU 缓存？**
   - JavaScript 是单线程，通常不需要考虑
   - 在 Web Worker 中，需要使用 SharedArrayBuffer + Atomics
   - 在其他语言中，可以使用互斥锁或读写锁
