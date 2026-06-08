---
sidebar_position: 5
title: 框架性能优化
tags:
  - 性能优化
  - React
  - Vue
  - 框架
---

# ⚡ 框架性能优化

> **"框架帮你管理了复杂度，但也带来了新的性能挑战——理解框架的运行机制，才能写出高效的代码"**

React 和 Vue 都用了虚拟 DOM，但"虚拟 DOM 快"是个误解。虚拟 DOM 的真正价值是**让你不用手动优化 DOM 操作**，但它本身是有开销的。让我们看看如何配合框架，而不是对抗框架。

## 一、React 性能优化

### 1.1 React 渲染机制

```
React 渲染流程
─────────────────────────────────────────────

State 变化
    ↓
触发 Re-render（当前组件 + 所有子组件）😱
    ↓
生成新的 Virtual DOM
    ↓
Diff 算法对比新旧 Virtual DOM
    ↓
只更新变化的 DOM 节点

问题：即使子组件的 props 没变，也会重新渲染！
```

### 1.2 React.memo——避免无意义渲染

```javascript
// ❌ 每次父组件渲染，子组件都会跟着渲染
function UserCard({ user }) {
  console.log('UserCard 渲染了');
  return (
    <div className="card">
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  );
}

// ✅ 只有 props 变化时才渲染
const UserCard = React.memo(function UserCard({ user }) {
  console.log('UserCard 渲染了');
  return (
    <div className="card">
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  );
});

// ✅ 自定义比较函数（更精细的控制）
const UserCard = React.memo(
  function UserCard({ user }) {
    return (
      <div className="card">
        <h3>{user.name}</h3>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // 只比较 user.id，id 一样就不重新渲染
    return prevProps.user.id === nextProps.user.id;
  }
);
```

### 1.3 useMemo 和 useCallback

```javascript
// ❌ 每次渲染都创建新的函数和对象
function Parent() {
  const [count, setCount] = useState(0);

  // 每次渲染都是新函数 → 子组件 React.memo 失效
  const handleClick = () => {
    console.log('clicked');
  };

  // 每次渲染都是新对象 → 子组件 React.memo 失效
  const config = { theme: 'dark', size: 'large' };

  return <Child onClick={handleClick} config={config} />;
}

// ✅ 使用 useMemo 和 useCallback 稳定引用
function Parent() {
  const [count, setCount] = useState(0);

  // 函数引用稳定
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []); // 依赖数组为空，永远不会变

  // 对象引用稳定
  const config = useMemo(() => ({
    theme: 'dark',
    size: 'large',
  }), []); // 依赖数组为空，永远不会变

  // 只在 count 变化时重新计算
  const expensiveResult = useMemo(() => {
    return heavyComputation(count);
  }, [count]);

  return <Child onClick={handleClick} config={config} />;
}
```

### 1.4 状态下沉——减少渲染范围

```javascript
// ❌ 状态放在顶层，整个应用重新渲染
function App() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div>
      <Header />  {/* 每次输入都重新渲染 */}
      <Sidebar />  {/* 每次输入都重新渲染 */}
      <SearchInput value={searchTerm} onChange={setSearchTerm} />
      <SearchResults term={searchTerm} />
      <Footer />  {/* 每次输入都重新渲染 */}
    </div>
  );
}

// ✅ 把状态下沉到需要的组件
function App() {
  return (
    <div>
      <Header />
      <Sidebar />
      <SearchSection />  {/* 状态封装在这里面 */}
      <Footer />
    </div>
  );
}

function SearchSection() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <>
      <SearchInput value={searchTerm} onChange={setSearchTerm} />
      <SearchResults term={searchTerm} />
    </>
  );
}
```

### 1.5 使用 useDeferredValue 延迟更新

```javascript
// 搜索场景：输入框立即响应，搜索结果延迟更新
function SearchPage() {
  const [query, setQuery] = useState('');

  // 延迟更新的值，不会阻塞输入框
  const deferredQuery = useDeferredValue(query);

  // 当 deferredQuery 变化时才执行搜索
  const results = useMemo(() => {
    return searchItems(deferredQuery);
  }, [deferredQuery]);

  return (
    <div>
      {/* 输入框立即响应 */}
      <input value={query} onChange={e => setQuery(e.target.value)} />

      {/* 搜索结果延迟更新，用样式标记是否在加载中 */}
      <div style={{ opacity: query !== deferredQuery ? 0.6 : 1 }}>
        <SearchResults items={results} />
      </div>
    </div>
  );
}
```

### 1.6 虚拟列表

```javascript
// 使用 react-window 优化长列表
import { FixedSizeList } from 'react-window';

function VirtualList({ items }) {
  const Row = useCallback(({ index, style }) => (
    <div style={style} className="list-item">
      <img src={items[index].avatar} alt="" />
      <span>{items[index].name}</span>
    </div>
  ), [items]);

  return (
    <FixedSizeList
      height={600}
      width="100%"
      itemCount={items.length}
      itemSize={72}  // 每行高度
      overscanCount={10}  // 预渲染 10 行
    >
      {Row}
    </FixedSizeList>
  );
}
```

### 1.7 React 性能优化清单

```
React 性能优化检查清单
─────────────────────────────────────────────

✅ 组件级优化
├── React.memo 包裹纯展示组件
├── useCallback 稳定函数引用
├── useMemo 缓存计算结果
└── 状态下沉到最小范围

✅ 列表优化
├── 给列表项加 key（用唯一 id，不要用 index）
├── 长列表用虚拟滚动
└── 列表项用 React.memo

✅ 渲染优化
├── 避免在渲染中创建新对象/函数
├── 使用 useDeferredValue 延迟非关键更新
├── 使用 Suspense + lazy 做代码分割
└── 使用 Profiler 找出慢组件

✅ 状态管理优化
├── 拆分 Context，避免无关组件重渲染
├── 使用 Zustand/Jotai 等细粒度状态库
└── selector 函数精确订阅状态
```

---

## 二、Vue 性能优化

### 2.1 Vue 的响应式机制

```
Vue 3 响应式流程
─────────────────────────────────────────────

ref() / reactive() 创建响应式数据
    ↓
数据被 Proxy 代理
    ↓
组件渲染时读取数据 → 收集依赖
    ↓
数据变化时 → 触发依赖 → 精确更新组件

Vue 的优势：自动追踪依赖，只有用到的数据变化才触发重渲染
```

### 2.2 computed 和 watch 的正确使用

```vue
<script setup>
import { ref, computed, watch } from 'vue';

const items = ref([...]);
const filter = ref('all');

// ✅ computed：自动缓存，依赖不变就不重新计算
const filteredItems = computed(() => {
  console.log('计算 filteredItems'); // 只在 items 或 filter 变化时执行
  return items.value.filter(item => {
    if (filter.value === 'all') return true;
    return item.status === filter.value;
  });
});

// ✅ computed 链式派生
const sortedItems = computed(() => {
  return [...filteredItems.value].sort((a, b) => b.score - a.score);
});

// ✅ watch：处理副作用
watch(filter, (newVal, oldVal) => {
  console.log(`筛选条件从 ${oldVal} 变为 ${newVal}`);
  // 发送埋点请求等副作用
});

// ❌ 避免在 watch 中修改状态导致无限循环
watch(someValue, (newVal) => {
  // someValue = newVal + 1; // 危险！
});
</script>
```

### 2.3 v-once 和 v-memo

```vue
<template>
  <!-- ✅ v-once：只渲染一次，永不更新 -->
  <header v-once>
    <h1>{{ appTitle }}</h1>
    <p>{{ appDescription }}</p>
  </header>

  <!-- ✅ v-memo：条件缓存（Vue 3.2+） -->
  <div
    v-for="item in list"
    :key="item.id"
    v-memo="[item.id === selectedId, item.lastUpdated]"
  >
    <!-- 只有选中状态或更新时间变化时才重新渲染 -->
    <p>{{ item.name }}</p>
    <p>{{ item.description }}</p>
    <span v-if="item.id === selectedId">选中</span>
  </div>
</template>
```

### 2.4 组件懒加载

```vue
<script setup>
import { defineAsyncComponent } from 'vue';

// ✅ 异步组件：需要时才加载
const HeavyChart = defineAsyncComponent(() =>
  import('./components/HeavyChart.vue')
);

// ✅ 带加载状态和错误处理
const AdminPanel = defineAsyncComponent({
  loader: () => import('./components/AdminPanel.vue'),
  loadingComponent: LoadingSpinner,
  errorComponent: ErrorDisplay,
  delay: 200,        // 200ms 后才显示 loading
  timeout: 10000,    // 10 秒超时
});
</script>

<template>
  <Suspense>
    <template #default>
      <HeavyChart />
    </template>
    <template #fallback>
      <div>加载中...</div>
    </template>
  </Suspense>
</template>
```

### 2.5 大型列表优化

```vue
<script setup>
import { ref } from 'vue';

const items = ref(Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  name: `Item ${i}`,
})));
</script>

<template>
  <!-- ✅ 使用虚拟滚动组件 -->
  <RecycleScroller
    :items="items"
    :item-size="50"
    key-field="id"
    v-slot="{ item }"
  >
    <div class="list-item">
      <span>{{ item.name }}</span>
    </div>
  </RecycleScroller>

  <!-- 或者使用 v-intersection 自己实现 -->
  <div v-for="item in visibleItems" :key="item.id">
    {{ item.name }}
  </div>
</template>
```

### 2.6 Vue 性能优化清单

```
Vue 性能优化检查清单
─────────────────────────────────────────────

✅ 响应式优化
├── shallowRef / shallowReactive 减少深度代理
├── toRaw() 获取原始对象避免代理开销
├── markRaw() 标记不需要响应式的对象
└── 合理使用 computed 缓存派生数据

✅ 模板优化
├── v-once 渲染静态内容
├── v-memo 缓存列表项（大数据表格）
├── v-if vs v-show 合理选择
└── 长列表使用虚拟滚动

✅ 组件优化
├── defineAsyncComponent 异步加载
├── keepAlive 缓存组件状态
├── props 稳定引用，避免不必要更新
└── 大组件拆分，减少单组件复杂度

✅ 构建优化
├── Tree Shaking 移除未使用代码
├── 按需导入 UI 库（unplugin-vue-components）
└── 图片懒加载（v-lazy）
```

---

## 三、通用优化策略

### 3.1 组件设计模式

```javascript
// 容器组件 vs 展示组件

// 容器组件：处理逻辑和状态
function UserListContainer() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers().then(data => {
      setUsers(data);
      setLoading(false);
    });
  }, []);

  // 展示组件只负责渲染
  return <UserList users={users} loading={loading} />;
}

// 展示组件：纯渲染，易优化
const UserList = React.memo(function UserList({ users, loading }) {
  if (loading) return <Skeleton />;

  return (
    <ul>
      {users.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </ul>
  );
});
```

### 3.2 状态管理优化

```javascript
// Zustand：精确订阅，避免无关重渲染
import { create } from 'zustand';

const useStore = create((set) => ({
  count: 0,
  name: 'Alice',
  increment: () => set((state) => ({ count: state.count + 1 })),
  setName: (name) => set({ name }),
}));

// ❌ 订阅整个 store → count 变化时这个组件也会重渲染
function Display() {
  const { name } = useStore(); // 但只用了 name
  return <div>{name}</div>;
}

// ✅ 使用 selector 精确订阅
function Display() {
  const name = useStore((state) => state.name); // 只在 name 变化时重渲染
  return <div>{name}</div>;
}

// ✅ 使用 shallow 比较对象
import { shallow } from 'zustand/shallow';

function Display() {
  const { name, age } = useStore(
    (state) => ({ name: state.name, age: state.age }),
    shallow // 浅比较，避免引用不同但值相同的重渲染
  );
  return <div>{name} ({age})</div>;
}
```

### 3.3 图片和资源优化

```javascript
// React 图片懒加载
import { lazy, Suspense } from 'react';

// 使用 Intersection Observer
function LazyImage({ src, alt, ...props }) {
  const imgRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef}>
      {isVisible ? (
        <img src={src} alt={alt} {...props} />
      ) : (
        <div className="image-placeholder" style={{ aspectRatio: '16/9' }} />
      )}
    </div>
  );
}
```

---

## 四、实战案例

### 案例：React 仪表盘优化

**优化前：**
- 首屏渲染：2.5 秒
- 筛选时卡顿：300ms 延迟
- 内存占用：150MB

**优化措施：**

```javascript
// 1. 代码分割
const Dashboard = lazy(() => import('./Dashboard'));
const Settings = lazy(() => import('./Settings'));

// 2. 状态下沉
function App() {
  return (
    <Layout>
      <Suspense fallback={<Skeleton />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

// 3. 虚拟列表
const TransactionList = memo(function TransactionList({ transactions }) {
  return (
    <FixedSizeList
      height={400}
      itemCount={transactions.length}
      itemSize={60}
    >
      {({ index, style }) => (
        <TransactionRow
          style={style}
          transaction={transactions[index]}
        />
      )}
    </FixedSizeList>
  );
});

// 4. useDeferredValue
function FilterSection() {
  const [filter, setFilter] = useState('');
  const deferredFilter = useDeferredValue(filter);

  const results = useMemo(
    () => filterData(deferredFilter),
    [deferredFilter]
  );

  return (
    <>
      <input value={filter} onChange={e => setFilter(e.target.value)} />
      <Results data={results} loading={filter !== deferredFilter} />
    </>
  );
}
```

**优化后：**
- 首屏渲染：0.8 秒 ⬇️ 68%
- 筛选卡顿：消除 ⬇️ 100%
- 内存占用：60MB ⬇️ 60%

---

## 🎯 高频面试题

### 1. React 中如何避免不必要的渲染？

**答：**

```
React 避免不必要渲染的方法
─────────────────────────────────────────────

1. React.memo
   └── 包裹纯展示组件，只有 props 变化才渲染

2. useMemo
   └── 缓存计算结果，依赖不变就不重新计算

3. useCallback
   └── 稳定函数引用，配合 React.memo 使用

4. 状态下沉
   └── 把状态放到最小范围的组件中

5. 拆分 Context
   └── 多个独立 Context 避免无关组件重渲染

6. useDeferredValue / useTransition
   └── 延迟非关键更新，保持 UI 响应

7. key 的正确使用
   └── 列表用唯一 id 作为 key，不要用 index
```

### 2. Vue 的 computed 和 watch 有什么区别？

**答：**

| 特性 | computed | watch |
|------|----------|-------|
| **用途** | 派生状态 | 副作用 |
| **返回值** | 有 | 无 |
| **缓存** | 自动缓存 | 不缓存 |
| **触发** | 依赖变化自动更新 | 手动指定监听源 |
| **适用场景** | 模板中使用的计算值 | 异步请求、埋点、DOM 操作 |

```vue
<script setup>
// ✅ computed：派生状态
const fullName = computed(() => `${firstName.value} ${lastName.value}`);

// ✅ watch：副作用
watch(firstName, async (newVal) => {
  await fetchUserData(newVal); // 异步操作
  sendAnalytics('name-changed'); // 埋点
});
</script>
```

### 3. 如何优化大型表单的性能？

**答：**

```javascript
// 1. 拆分表单组件
const BasicInfo = memo(function BasicInfo() { /* ... */ });
const AddressInfo = memo(function AddressInfo() { /* ... */ });

// 2. 使用 useTransition 标记低优先级更新
function Form() {
  const [isPending, startTransition] = useTransition();

  const handleChange = (e) => {
    // 高优先级：输入框立即响应
    setInputValue(e.target.value);

    // 低优先级：验证等延迟执行
    startTransition(() => {
      validateField(e.target.value);
      updatePreview(e.target.value);
    });
  };

  return (
    <form>
      <input onChange={handleChange} />
      {isPending && <span>验证中...</span>}
    </form>
  );
}

// 3. 防抖验证
const debouncedValidate = useMemo(
  () => debounce(validateField, 300),
  []
);
```

---

## 📚 推荐资源

- [React 官方性能优化文档](https://react.dev/reference/react/memo)
- [Vue 性能优化指南](https://vuejs.org/guide/best-practices/performance.html)
- [React Profiler 使用指南](https://react.dev/reference/react/Profiler)
- [Vue DevTools 性能分析](https://devtools.vuejs.org/guide/performance.html)
- [Web Vitals 与框架](https://web.dev/vitals-frameworks/)
