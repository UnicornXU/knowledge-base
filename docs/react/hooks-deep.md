---
sidebar_position: 1
title: 'Hooks 深入'
difficulty: 'medium'
tags: ['react', 'hooks']
---

# Hooks 深入

## useState 的工作原理

:::warning 概念演示
以下是**极度简化**的演示代码，仅用于理解 useState 的基本思想。真实 React 实现与此完全不同。
:::

```javascript
// 简化版实现
let state;
let index = 0;

function useState(initialValue) {
  if (state === undefined) {
    state = initialValue;
  }
  const currentIndex = index;
  function setState(newValue) {
    state = typeof newValue === 'function' ? newValue(state) : newValue;
    render(); // 触发重新渲染
  }
  return [state, setState];
}
```

:::info 真实实现
React 内部使用 **Fiber 架构**中的 Hook 链表来管理状态：

- 每个组件的 Fiber 节点有一个 `memoizedState` 属性，指向 Hook 链表的头节点
- 每次调用 `useState` 会创建/读取链表中的一个节点
- 这就是为什么 Hook 不能在条件语句中调用——必须保证链表顺序一致
- 多个 `useState` 通过链表的 `next` 指针依次关联

```javascript
// React 源码中的简化结构
type Hook = {
  memoizedState: any,    // 当前状态值
  queue: UpdateQueue,     // 更新队列
  next: Hook | null,      // 指向下一个 Hook
};
```

:::

## useEffect vs useLayoutEffect

```javascript
// useEffect：异步执行，不阻塞渲染
useEffect(() => {
  // 在浏览器完成绘制后执行
  document.title = `Count: ${count}`;
}, [count]);

// useLayoutEffect：同步执行，阻塞渲染
useLayoutEffect(() => {
  // 在 DOM 变更后、浏览器绘制前执行
  // 适合需要同步读取 DOM 布局的场景
  const rect = ref.current.getBoundingClientRect();
  setWidth(rect.width);
}, []);
```

| 特性         | useEffect      | useLayoutEffect    |
| ------------ | -------------- | ------------------ |
| 执行时机     | 浏览器绘制后   | DOM 变更后、绘制前 |
| 是否阻塞渲染 | 否             | 是                 |
| 适用场景     | 数据获取、订阅 | DOM 测量、同步更新 |

## 自定义 Hook

```javascript
// 防抖 Hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// 使用
function SearchComponent() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery) {
      fetchResults(debouncedQuery);
    }
  }, [debouncedQuery]);

  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}
```

## useMemo 和 useCallback

```javascript
// useMemo：缓存计算结果
const expensiveResult = useMemo(() => {
  return heavyComputation(data);
}, [data]);

// useCallback：缓存函数引用
const handleClick = useCallback(() => {
  onClick(id);
}, [id, onClick]);
```

## 关键点

- Hooks 必须在函数组件顶层调用，不能在循环/条件中使用
- `useEffect` 的清理函数在下一次 effect 执行前和组件卸载时调用
- `useMemo` 缓存值，`useCallback` 缓存函数
- 过度使用 `useMemo`/`useCallback` 反而可能降低性能
