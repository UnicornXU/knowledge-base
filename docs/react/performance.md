---
sidebar_position: 4
title: "性能优化"
difficulty: "medium"
tags: ["react", "performance"]
---

# 性能优化

## React.memo

```javascript
// 避免不必要的重渲染
const ExpensiveComponent = React.memo(function ExpensiveComponent({ data, onClick }) {
  console.log('ExpensiveComponent render');
  return <div onClick={onClick}>{data.name}</div>;
});

// 自定义比较函数
const MemoizedComponent = React.memo(
  MyComponent,
  (prevProps, nextProps) => {
    return prevProps.id === nextProps.id;
  }
);
```

## useMemo 和 useCallback

```javascript
function Parent({ items, onItemClick }) {
  // ✅ 缓存计算结果，items 变化时才重新计算
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  // ✅ 缓存函数引用，配合 React.memo 使用
  const handleClick = useCallback((id) => {
    onItemClick(id);
  }, [onItemClick]);

  return (
    <List items={sortedItems} onItemClick={handleClick} />
  );
}
```

## 代码分割

```javascript
import { lazy, Suspense } from 'react';

// 路由级别代码分割
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}
```

## 虚拟列表

```javascript
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }) {
  const parentRef = useRef(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: `${virtualRow.start}px`,
              height: `${virtualRow.size}px`,
            }}
          >
            {items[virtualRow.index].name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 性能分析工具

```javascript
// React DevTools Profiler
// 控制台中使用
import { Profiler } from 'react';

function onRenderCallback(id, phase, actualDuration) {
  console.log(`${id} ${phase}: ${actualDuration}ms`);
}

<Profiler id="App" onRender={onRenderCallback}>
  <App />
</Profiler>
```

## 关键点

- `React.memo` 在 props 不变时跳过重渲染
- `useMemo` 缓存计算结果，`useCallback` 缓存函数引用
- 大列表使用虚拟滚动（react-virtual / react-window）
- 路由级别做代码分割，减少首屏加载体积
- React DevTools Profiler 是性能分析的首选工具
