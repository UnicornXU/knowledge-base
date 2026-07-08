---
sidebar_position: 4
title: "前端权限方案设计"
difficulty: "high"
tags: ["architecture", "permission", "rbac", "dynamic-route"]
---

# 前端权限方案设计

## 为什么前端需要权限系统？

```
没有权限系统的应用：
═══════════════════

普通员工打开管理后台...

┌─────────────────────────────────────────┐
│  管理后台                               │
│  ┌─────────────────────────────────┐    │
│  │  用户管理                        │    │
│  │  ├── [查看用户]  ✅ 能看到       │    │
│  │  ├── [编辑用户]  ✅ 能点（出错）  │    │
│  │  ├── [删除用户]  ✅ 能点（出错）  │    │
│  │  └── [分配权限]  ✅ 能点（出错）  │    │
│  │                                 │    │
│  │  系统设置                        │    │
│  │  ├── [修改配置]  ✅ 能点（危险）  │    │
│  │  └── [清除数据]  ✅ 能点（危险）  │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘

后果：
1. 用户体验差（能看到但不能用）
2. 安全风险（绕过前端直接调 API）
3. 数据泄露（看到不该看的信息）
```

## 一、RBAC 权限模型

### 1.1 RBAC 基本概念

```
RBAC (Role-Based Access Control) 基于角色的访问控制：
═══════════════════════════════════════════════════════

用户 (User) ──→ 角色 (Role) ──→ 权限 (Permission)

┌────────┐     ┌────────┐     ┌────────────────┐
│ 用户 A  │────→│ 管理员  │────→│ 用户管理       │
└────────┘     │        │     │ 系统设置       │
               │        │     │ 数据导出       │
┌────────┐     └────────┘     └────────────────┘
│ 用户 B  │────→┌────────┐     ┌────────────────┐
└────────┘     │ 普通员工 │────→│ 查看数据       │
               │        │     │ 编辑个人信息    │
               └────────┘     └────────────────┘

优势：
1. 用户和权限解耦
2. 角色便于批量管理
3. 权限变更只需调整角色
```

### 1.2 权限数据结构

```typescript
// 权限模型定义
interface Permission {
  id: string;
  code: string;        // 权限编码，如 'user:create'
  name: string;        // 权限名称
  type: 'menu' | 'button' | 'data';  // 权限类型
  resource: string;    // 资源标识
}

interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}

interface User {
  id: string;
  name: string;
  roles: Role[];
  permissions: Permission[];  // 合并后的权限列表
}

// 权限编码规范
const PERMISSIONS = {
  // 用户管理
  'user:view': '查看用户',
  'user:create': '创建用户',
  'user:edit': '编辑用户',
  'user:delete': '删除用户',
  'user:export': '导出用户',
  
  // 角色管理
  'role:view': '查看角色',
  'role:create': '创建角色',
  'role:edit': '编辑角色',
  'role:delete': '删除角色',
  
  // 系统设置
  'system:config:view': '查看配置',
  'system:config:edit': '修改配置',
} as const;
```

### 1.3 权限存储与获取

```typescript
// stores/permission.store.ts
import { create } from 'zustand';

interface PermissionStore {
  permissions: string[];       // 权限编码列表
  roles: string[];             // 角色列表
  menus: MenuItem[];           // 菜单配置
  loaded: boolean;
  
  fetchPermissions: () => Promise<void>;
  hasPermission: (code: string) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyPermission: (codes: string[]) => boolean;
  hasAllPermissions: (codes: string[]) => boolean;
}

export const usePermissionStore = create<PermissionStore>((set, get) => ({
  permissions: [],
  roles: [],
  menus: [],
  loaded: false,

  fetchPermissions: async () => {
    const { permissions, roles, menus } = await permissionApi.getUserPermissions();
    set({ permissions, roles, menus, loaded: true });
  },

  hasPermission: (code: string) => {
    return get().permissions.includes(code);
  },

  hasRole: (role: string) => {
    return get().roles.includes(role);
  },

  hasAnyPermission: (codes: string[]) => {
    return codes.some((code) => get().permissions.includes(code));
  },

  hasAllPermissions: (codes: string[]) => {
    return codes.every((code) => get().permissions.includes(code));
  },
}));
```

## 二、按钮级权限控制

### 2.1 权限指令/组件

```tsx
// components/Permission/index.tsx
interface PermissionProps {
  code: string | string[];     // 权限编码
  mode?: 'any' | 'all';       // any: 任一满足，all: 全部满足
  fallback?: React.ReactNode;  // 无权限时的替代内容
  children: React.ReactNode;
}

export function Permission({
  code,
  mode = 'any',
  fallback = null,
  children,
}: PermissionProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissionStore();

  const codes = Array.isArray(code) ? code : [code];
  
  const hasAccess = mode === 'any'
    ? hasAnyPermission(codes)
    : hasAllPermissions(codes);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// 使用示例
function UserActions({ user }: { user: User }) {
  return (
    <div>
      <Permission code="user:view">
        <Button onClick={() => viewUser(user.id)}>查看</Button>
      </Permission>
      
      <Permission code="user:edit">
        <Button onClick={() => editUser(user.id)}>编辑</Button>
      </Permission>
      
      <Permission code="user:delete" fallback={<Tooltip title="无权限"><Button disabled>删除</Button></Tooltip>}>
        <Button danger onClick={() => deleteUser(user.id)}>删除</Button>
      </Permission>
      
      <Permission code={['user:edit', 'user:delete']} mode="all">
        <Button>批量操作</Button>
      </Permission>
    </div>
  );
}
```

### 2.2 权限 Hook

```tsx
// hooks/usePermission.ts
export function usePermission() {
  const store = usePermissionStore();

  const checkPermission = useCallback(
    (code: string | string[], mode: 'any' | 'all' = 'any') => {
      const codes = Array.isArray(code) ? code : [code];
      return mode === 'any'
        ? store.hasAnyPermission(codes)
        : store.hasAllPermissions(codes);
    },
    [store]
  );

  return {
    ...store,
    checkPermission,
  };
}

// 使用示例
function UserPage() {
  const { checkPermission } = usePermission();

  const canEdit = checkPermission('user:edit');
  const canDelete = checkPermission('user:delete');
  const canExport = checkPermission('user:export');

  return (
    <div>
      <Table dataSource={users} />
      <div className="actions">
        {canEdit && <Button>编辑</Button>}
        {canDelete && <Button danger>删除</Button>}
        {canExport && <Button>导出</Button>}
      </div>
    </div>
  );
}
```

### 2.3 权限高阶组件

```tsx
// hoc/withPermission.tsx
interface WithPermissionOptions {
  code: string | string[];
  mode?: 'any' | 'all';
  fallback?: React.ComponentType;
}

export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithPermissionOptions
) {
  return function PermissionWrapper(props: P) {
    const { checkPermission } = usePermission();
    const { code, mode = 'any', fallback: Fallback } = options;

    const hasAccess = checkPermission(code, mode);

    if (!hasAccess) {
      return Fallback ? <Fallback /> : null;
    }

    return <WrappedComponent {...props} />;
  };
}

// 使用示例
const DeleteButton = withPermission(
  Button,
  { code: 'user:delete', fallback: DisabledButton }
);
```

## 三、动态路由

### 3.1 动态路由生成流程

```
动态路由生成流程：
═════════════════

1. 用户登录
   ↓
2. 获取用户权限和菜单
   ↓
3. 过滤有权限的菜单
   ↓
4. 根据菜单生成路由配置
   ↓
5. 注册到路由器
   ↓
6. 渲染菜单和页面

┌──────────┐    ┌──────────┐    ┌──────────┐
│ 登录接口  │───→│ 权限接口  │───→│ 菜单配置  │
└──────────┘    └──────────┘    └──────────┘
                                      │
                                      ↓
┌──────────┐    ┌──────────┐    ┌──────────┐
│ 渲染页面  │←───│ 注册路由  │←───│ 过滤菜单  │
└──────────┘    └──────────┘    └──────────┘
```

### 3.2 动态路由实现

```typescript
// services/permission.service.ts
import { lazy } from 'react';

// 路由组件映射表
const componentMap: Record<string, React.LazyExoticComponent<any>> = {
  'Dashboard': lazy(() => import('@/pages/Dashboard')),
  'UserList': lazy(() => import('@/pages/user/UserList')),
  'UserDetail': lazy(() => import('@/pages/user/UserDetail')),
  'RoleList': lazy(() => import('@/pages/role/RoleList')),
  'SystemConfig': lazy(() => import('@/pages/system/Config')),
};

// 将后端菜单转换为路由配置
function transformMenuToRoutes(menus: MenuItem[]): RouteObject[] {
  return menus
    .filter((menu) => menu.type === 'page')  // 只处理页面类型
    .map((menu) => {
      const Component = componentMap[menu.component];
      
      if (!Component) {
        console.warn(`Component not found: ${menu.component}`);
        return null;
      }

      const route: RouteObject = {
        path: menu.path,
        element: (
          <RouteGuard permissions={menu.permissions}>
            <Suspense fallback={<PageLoading />}>
              <Component />
            </Suspense>
          </RouteGuard>
        ),
      };

      // 递归处理子菜单
      if (menu.children?.length) {
        route.children = transformMenuToRoutes(menu.children);
      }

      return route;
    })
    .filter(Boolean) as RouteObject[];
}
```

### 3.3 动态路由 Hook

```typescript
// hooks/useDynamicRoutes.ts
import { useState, useEffect } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { usePermissionStore } from '@/stores/permission.store';

export function useDynamicRoutes() {
  const [router, setRouter] = useState<any>(null);
  const { menus, fetchPermissions, loaded } = usePermissionStore();

  useEffect(() => {
    if (!loaded) {
      fetchPermissions();
    }
  }, [loaded]);

  useEffect(() => {
    if (loaded && menus.length > 0) {
      // 生成动态路由
      const dynamicRoutes = transformMenuToRoutes(menus);
      
      // 合并静态路由和动态路由
      const allRoutes = [
        ...staticRoutes,
        {
          path: '/app',
          element: <AppLayout />,
          children: dynamicRoutes,
        },
      ];

      const newRouter = createBrowserRouter(allRoutes);
      setRouter(newRouter);
    }
  }, [loaded, menus]);

  return { router, loading: !loaded };
}

// App.tsx
function App() {
  const { router, loading } = useDynamicRoutes();

  if (loading || !router) {
    return <FullPageLoading />;
  }

  return <RouterProvider router={router} />;
}
```

### 3.4 动态菜单生成

```tsx
// components/DynamicMenu/index.tsx
import { Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePermissionStore } from '@/stores/permission.store';

export function DynamicMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  const { menus } = usePermissionStore();

  // 将菜单配置转换为 antd Menu 格式
  const menuItems = transformMenuItems(menus);

  return (
    <Menu
      mode="inline"
      selectedKeys={[location.pathname]}
      items={menuItems}
      onClick={({ key }) => navigate(key)}
    />
  );
}

function transformMenuItems(menus: MenuItem[]): MenuProps['items'] {
  return menus.map((menu) => ({
    key: menu.path,
    icon: menu.icon ? <Icon name={menu.icon} /> : null,
    label: menu.name,
    children: menu.children?.length
      ? transformMenuItems(menu.children)
      : undefined,
  }));
}
```

## 四、数据权限

### 4.1 数据权限类型

```
数据权限类型：
═════════════

1. 全部数据 —— 管理员可看所有数据
2. 本部门数据 —— 部门经理可看本部门数据
3. 本部门及下级 —— 区域经理可看本区域所有数据
4. 仅本人数据 —— 普通员工只能看自己的数据
5. 自定义数据 —— 指定特定数据范围

┌─────────────────────────────────────────────┐
│                  数据权限矩阵                 │
├──────────┬──────────┬──────────┬─────────────┤
│ 角色      │ 用户数据  │ 订单数据  │ 报表数据    │
├──────────┼──────────┼──────────┼─────────────┤
│ 超级管理员│ 全部      │ 全部      │ 全部        │
│ 部门经理  │ 本部门    │ 本部门    │ 本部门      │
│ 普通员工  │ 仅本人    │ 仅本人    │ 仅本人      │
└──────────┴──────────┴──────────┴─────────────┘
```

### 4.2 数据权限实现

```typescript
// utils/dataPermission.ts
interface DataPermissionConfig {
  field: string;           // 权限字段，如 'departmentId'
  type: 'all' | 'department' | 'self' | 'custom';
  value?: any;             // 自定义值
}

export function filterByDataPermission<T extends Record<string, any>>(
  data: T[],
  permission: DataPermissionConfig,
  currentUser: User
): T[] {
  switch (permission.type) {
    case 'all':
      return data;
    
    case 'department':
      return data.filter(
        (item) => item[permission.field] === currentUser.departmentId
      );
    
    case 'self':
      return data.filter(
        (item) => item[permission.field] === currentUser.id
      );
    
    case 'custom':
      return data.filter(
        (item) => permission.value.includes(item[permission.field])
      );
    
    default:
      return [];
  }
}

// API 请求时传递数据权限参数
async function fetchUsers(params: QueryParams) {
  const { dataPermission } = usePermissionStore();
  
  const requestParams = {
    ...params,
    // 根据数据权限类型添加过滤条件
    ...(dataPermission.type === 'department' && {
      departmentId: currentUser.departmentId,
    }),
    ...(dataPermission.type === 'self' && {
      userId: currentUser.id,
    }),
  };

  return httpClient.get('/users', { params: requestParams });
}
```

### 4.3 数据权限 Hook

```typescript
// hooks/useDataPermission.ts
export function useDataPermission(resource: string) {
  const { currentUser } = useAuthStore();
  const { dataPermissions } = usePermissionStore();

  const permission = useMemo(() => {
    return dataPermissions.find((p) => p.resource === resource);
  }, [dataPermissions, resource]);

  const filterData = useCallback(
    <T extends Record<string, any>>(data: T[]): T[] => {
      if (!permission) return [];
      return filterByDataPermission(data, permission, currentUser);
    },
    [permission, currentUser]
  );

  const getRequestParams = useCallback(() => {
    if (!permission) return {};

    switch (permission.type) {
      case 'department':
        return { departmentId: currentUser.departmentId };
      case 'self':
        return { userId: currentUser.id };
      default:
        return {};
    }
  }, [permission, currentUser]);

  return {
    permission,
    filterData,
    getRequestParams,
    isAll: permission?.type === 'all',
    isDepartment: permission?.type === 'department',
    isSelf: permission?.type === 'self',
  };
}
```

## 五、权限系统最佳实践

### 5.1 权限初始化流程

```typescript
// hooks/usePermissionInit.ts
export function usePermissionInit() {
  const { fetchPermissions, loaded } = usePermissionStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && !loaded) {
      fetchPermissions();
    }
  }, [isAuthenticated, loaded]);

  return { loaded };
}

// App.tsx
function App() {
  const { loaded } = usePermissionInit();

  if (!loaded) {
    return <FullPageLoading />;
  }

  return <RouterProvider router={router} />;
}
```

### 5.2 权限缓存策略

```typescript
// stores/permission.store.ts
const usePermissionStore = create<PermissionStore>()(
  persist(
    (set, get) => ({
      // ... 其他状态
      
      fetchPermissions: async () => {
        // 检查缓存是否有效
        const cached = get();
        if (cached.loaded && cached.cacheTime) {
          const isExpired = Date.now() - cached.cacheTime > 5 * 60 * 1000;
          if (!isExpired) return;
        }

        const data = await permissionApi.getUserPermissions();
        set({
          ...data,
          loaded: true,
          cacheTime: Date.now(),
        });
      },
    }),
    {
      name: 'permission-store',
      partialize: (state) => ({
        permissions: state.permissions,
        roles: state.roles,
        menus: state.menus,
        cacheTime: state.cacheTime,
      }),
    }
  )
);
```

### 5.3 权限变更处理

```typescript
// 权限变更时重新获取
function usePermissionSync() {
  const { fetchPermissions } = usePermissionStore();

  useEffect(() => {
    // 监听权限变更事件
    const unsubscribe = eventBus.on('permission:changed', () => {
      fetchPermissions();
    });

    return unsubscribe;
  }, []);
}

// 角色变更时重新获取
function useRoleSync() {
  const { fetchPermissions } = usePermissionStore();

  useEffect(() => {
    const unsubscribe = eventBus.on('role:changed', () => {
      fetchPermissions();
    });

    return unsubscribe;
  }, []);
}
```

## 六、完整权限系统架构

### 6.1 架构图

```
前端权限系统架构：
═════════════════

┌─────────────────────────────────────────────────────────┐
│                    表现层                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ 路由守卫  │  │ 按钮权限  │  │ 数据权限  │              │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘              │
│        │             │             │                     │
├────────┴─────────────┴─────────────┴─────────────────────┤
│                    权限服务层                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │  usePermissionStore                              │   │
│  │  ├── permissions: string[]                       │   │
│  │  ├── roles: string[]                             │   │
│  │  ├── menus: MenuItem[]                           │   │
│  │  ├── hasPermission(code): boolean                │   │
│  │  ├── hasRole(role): boolean                      │   │
│  │  └── filterByDataPermission(data, config): T[]   │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                    数据层                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ 权限接口  │  │ 菜单接口  │  │ 用户接口  │              │
│  └──────────┘  └──────────┘  └──────────┘              │
└─────────────────────────────────────────────────────────┘
```

### 6.2 权限检查清单

```typescript
// utils/permissionCheck.ts
export const permissionCheck = {
  // 路由权限
  route: {
    canAccess: (route: RouteConfig, user: User): boolean => {
      if (!route.meta?.auth) return true;
      if (!route.meta?.roles) return true;
      return route.meta.roles.some((role) => user.roles.includes(role));
    },
  },

  // 按钮权限
  button: {
    canClick: (code: string, permissions: string[]): boolean => {
      return permissions.includes(code);
    },
  },

  // 数据权限
  data: {
    canView: (item: any, permission: DataPermissionConfig, user: User): boolean => {
      switch (permission.type) {
        case 'all': return true;
        case 'department': return item.departmentId === user.departmentId;
        case 'self': return item.userId === user.id;
        default: return false;
      }
    },
  },
};
```

## 面试要点

### 常见面试问题

1. **RBAC 权限模型是什么？**
   - 基于角色的访问控制
   - 用户 → 角色 → 权限的三层结构
   - 便于权限的批量管理和维护

2. **如何实现按钮级权限控制？**
   - 权限组件：根据权限编码显示/隐藏
   - 权限 Hook：在逻辑中判断权限
   - 权限高阶组件：包装需要权限的组件

3. **动态路由如何实现？**
   - 根据后端菜单配置生成路由
   - 路由懒加载，按需加载页面
   - 权限守卫，检查路由访问权限

4. **数据权限有哪些类型？**
   - 全部数据、本部门数据、本部门及下级、仅本人数据
   - 后端过滤为主，前端过滤为辅
   - API 请求时传递权限参数

### 关键要点

- **RBAC 模型**：用户、角色、权限三层结构
- **按钮级权限**：权限组件、权限 Hook、权限 HOC
- **动态路由**：根据权限动态生成路由配置
- **数据权限**：后端过滤为主，前端辅助展示
- **权限缓存**：缓存权限数据，减少请求
- **权限变更**：监听变更事件，及时更新权限
