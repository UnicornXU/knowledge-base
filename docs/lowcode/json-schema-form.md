---
sidebar_position: 2
title: JSON Schema 驱动的表单引擎
---

# JSON Schema 驱动的表单引擎

JSON Schema 表单引擎是低代码平台的核心能力之一，通过配置化的 JSON 描述自动生成表单 UI，实现"配置即表单"。

## 一、JSON Schema 基础规范

### 1.1 JSON Schema 标准

JSON Schema 是 IETF 标准（draft-07 / 2020-12），用于描述 JSON 数据的结构、类型和约束。

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "用户信息",
  "properties": {
    "name": {
      "type": "string",
      "title": "姓名",
      "minLength": 2,
      "maxLength": 20
    },
    "age": {
      "type": "integer",
      "title": "年龄",
      "minimum": 0,
      "maximum": 150
    },
    "email": {
      "type": "string",
      "format": "email",
      "title": "邮箱"
    },
    "role": {
      "type": "string",
      "title": "角色",
      "enum": ["admin", "editor", "viewer"],
      "enumNames": ["管理员", "编辑者", "查看者"]
    }
  },
  "required": ["name", "email"]
}
```

### 1.2 低代码平台的扩展 Schema

实际低代码平台通常在标准 JSON Schema 基础上扩展 UI 相关字段：

```json
{
  "type": "object",
  "properties": {
    "status": {
      "type": "string",
      "title": "状态",
      "ui:widget": "radio",
      "ui:options": {
        "buttonStyle": "solid"
      },
      "enum": ["active", "disabled"],
      "enumNames": ["启用", "禁用"]
    },
    "avatar": {
      "type": "string",
      "title": "头像",
      "ui:widget": "upload",
      "ui:options": {
        "accept": "image/*",
        "maxSize": 2048
      }
    },
    "bio": {
      "type": "string",
      "title": "简介",
      "ui:widget": "textarea",
      "ui:options": {
        "rows": 4,
        "maxLength": 500
      }
    }
  }
}
```

## 二、表单渲染引擎

### 2.1 渲染流程

```
JSON Schema
    │
    ▼
┌─────────────┐
│ Schema 解析  │  → 提取字段定义、类型、校验规则
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 字段映射     │  → type/ui:widget → 对应组件
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 递归渲染     │  → object 递归, array 遍历, 基础类型直接渲染
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ 表单实例     │  → 带状态管理的完整表单
└─────────────┘
```

### 2.2 核心渲染器实现

```typescript
import React from 'react';

interface SchemaFieldProps {
  schema: JSONSchema;
  name: string;
  value: any;
  onChange: (name: string, value: any) => void;
  errors?: string[];
}

// 组件映射表
const widgetMap: Record<string, React.ComponentType<any>> = {
  string: InputField,
  number: NumberField,
  boolean: SwitchField,
  enum: SelectField,
  array: ArrayField,
  object: ObjectField,
  textarea: TextareaField,
  upload: UploadField,
};

// 根据 schema 选择组件
function resolveWidget(schema: JSONSchema): string {
  if (schema['ui:widget']) return schema['ui:widget'];
  if (schema.enum) return 'enum';
  if (schema.type === 'string' && schema.maxLength && schema.maxLength > 100) {
    return 'textarea';
  }
  return schema.type ?? 'string';
}

// 递归渲染器
function SchemaField({ schema, name, value, onChange, errors }: SchemaFieldProps) {
  // object 类型：递归渲染子字段
  if (schema.type === 'object' && schema.properties) {
    return (
      <fieldset>
        {schema.title && <legend>{schema.title}</legend>}
        {Object.entries(schema.properties).map(([key, childSchema]) => (
          <SchemaField
            key={key}
            schema={childSchema as JSONSchema}
            name={`${name}.${key}`}
            value={value?.[key]}
            onChange={(childName, childValue) => {
              onChange(name, { ...value, [key]: childValue });
            }}
            errors={errors}
          />
        ))}
      </fieldset>
    );
  }

  // array 类型：渲染列表
  if (schema.type === 'array' && schema.items) {
    const items = Array.isArray(value) ? value : [];
    return (
      <fieldset>
        {schema.title && <legend>{schema.title}</legend>}
        {items.map((item: any, index: number) => (
          <SchemaField
            key={index}
            schema={schema.items as JSONSchema}
            name={`${name}[${index}]`}
            value={item}
            onChange={(childName, childValue) => {
              const newItems = [...items];
              newItems[index] = childValue;
              onChange(name, newItems);
            }}
          />
        ))}
        <button onClick={() => onChange(name, [...items, getDefault(schema.items)])}>
          添加
        </button>
      </fieldset>
    );
  }

  // 基础类型：直接渲染对应组件
  const widgetType = resolveWidget(schema);
  const Widget = widgetMap[widgetType] ?? InputField;
  return (
    <Widget
      label={schema.title}
      value={value}
      onChange={(v: any) => onChange(name, v)}
      errors={errors}
      {...schema['ui:options']}
    />
  );
}
```

### 2.3 默认值生成

```typescript
function getDefault(schema: JSONSchema): any {
  if (schema.default !== undefined) return schema.default;

  switch (schema.type) {
    case 'string':  return '';
    case 'number':
    case 'integer': return 0;
    case 'boolean': return false;
    case 'array':   return [];
    case 'object':
      if (!schema.properties) return {};
      return Object.fromEntries(
        Object.entries(schema.properties).map(([key, child]) => [
          key,
          getDefault(child as JSONSchema),
        ])
      );
    default: return null;
  }
}
```

## 三、校验联动与动态显隐

### 3.1 校验规则引擎

```typescript
// 基于 ajv 的校验引擎
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true, coerceTypes: true });
addFormats(ajv);

function validateForm(schema: JSONSchema, data: any): ValidationError[] {
  const validate = ajv.compile(schema);
  const valid = validate(data);

  if (valid) return [];

  return (validate.errors ?? []).map(err => ({
    path: err.instancePath,
    message: err.message ?? '校验失败',
    keyword: err.keyword,
    params: err.params,
  }));
}
```

### 3.2 联动规则定义

```typescript
// 联动规则描述
interface LinkageRule {
  // 触发条件
  when: {
    field: string;       // 字段路径
    operator: 'eq' | 'ne' | 'gt' | 'lt' | 'in' | 'empty' | 'notEmpty';
    value?: any;
  };
  // 执行动作
  then: {
    action: 'show' | 'hide' | 'enable' | 'disable' | 'setValue' | 'setOptions';
    target: string;      // 目标字段
    value?: any;
  };
}

// 联动规则示例
const rules: LinkageRule[] = [
  {
    when: { field: 'role', operator: 'eq', value: 'admin' },
    then: { action: 'show', target: 'permissions' },
  },
  {
    when: { field: 'country', operator: 'eq', value: 'CN' },
    then: { action: 'setOptions', target: 'province', value: chineseProvinces },
  },
  {
    when: { field: 'type', operator: 'in', value: ['company'] },
    then: { action: 'enable', target: 'taxId' },
  },
];
```

### 3.3 联动执行器

```typescript
class LinkageEngine {
  private rules: LinkageRule[];

  constructor(rules: LinkageRule[]) {
    this.rules = rules;
  }

  // 计算字段可见性、可用性等
  evaluate(formData: Record<string, any>): FieldStates {
    const states: FieldStates = {};

    for (const rule of this.rules) {
      const fieldValue = get(formData, rule.field);
      const conditionMet = this.evaluateCondition(fieldValue, rule.when);

      if (conditionMet) {
        switch (rule.then.action) {
          case 'show':
            states[rule.then.target] = { ...states[rule.then.target], visible: true };
            break;
          case 'hide':
            states[rule.then.target] = { ...states[rule.then.target], visible: false };
            break;
          case 'enable':
            states[rule.then.target] = { ...states[rule.then.target], disabled: false };
            break;
          case 'disable':
            states[rule.then.target] = { ...states[rule.then.target], disabled: true };
            break;
          case 'setValue':
            // 触发值变更（需在上层处理）
            break;
        }
      }
    }

    return states;
  }

  private evaluateCondition(value: any, condition: LinkageRule['when']): boolean {
    switch (condition.operator) {
      case 'eq':       return value === condition.value;
      case 'ne':       return value !== condition.value;
      case 'gt':       return value > condition.value;
      case 'lt':       return value < condition.value;
      case 'in':       return condition.value.includes(value);
      case 'empty':    return !value || (Array.isArray(value) && value.length === 0);
      case 'notEmpty': return !!value && !(Array.isArray(value) && value.length === 0);
      default:         return false;
    }
  }
}
```

### 3.4 动态 Schema 表达式

更灵活的方式是使用表达式直接写在 Schema 中：

```json
{
  "properties": {
    "cardType": {
      "type": "string",
      "title": "证件类型",
      "enum": ["idcard", "passport", "driverLicense"]
    },
    "cardNumber": {
      "type": "string",
      "title": "证件号码",
      "ui:visible": "{{formData.cardType !== undefined}}",
      "ui:pattern": {
        "idcard": "^[0-9]{17}[0-9X]$",
        "passport": "^[A-Z][0-9]{8}$",
        "driverLicense": "^[0-9]{12}$"
      },
      "ui:patternKey": "formData.cardType"
    }
  }
}
```

```typescript
// 表达式求值器
function evaluateExpression(expr: string, context: { formData: Record<string, any> }): any {
  // 安全的表达式解析（避免 eval）
  // 使用 astring 或自定义解析器
  const templateRegex = /\{\{(.+?)\}\}/g;
  return expr.replace(templateRegex, (_, path) => {
    return get(context, path.trim()) ?? '';
  });
}
```

## 四、自定义组件扩展

### 4.1 组件注册协议

```typescript
interface CustomWidget {
  // 组件名称（与 ui:widget 对应）
  name: string;
  // React 组件
  component: React.ComponentType<WidgetProps>;
  // 组件属性 Schema（用于属性面板配置）
  propsSchema?: JSONSchema;
  // 默认属性
  defaultProps?: Record<string, any>;
}

interface WidgetProps {
  value: any;
  onChange: (value: any) => void;
  schema: JSONSchema;
  disabled?: boolean;
  errors?: string[];
  [key: string]: any;
}
```

### 4.2 自定义组件示例

```typescript
// 颜色选择器组件
const ColorPickerWidget: React.FC<WidgetProps> = ({ value, onChange, schema }) => {
  const { presetColors, showAlpha } = schema['ui:options'] ?? {};

  return (
    <div className="color-picker-widget">
      <label>{schema.title}</label>
      <input
        type="color"
        value={value ?? '#000000'}
        onChange={(e) => onChange(e.target.value)}
      />
      {presetColors && (
        <div className="preset-colors">
          {presetColors.map((color: string) => (
            <div
              key={color}
              className={`color-swatch ${value === color ? 'active' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => onChange(color)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// 注册到引擎
formEngine.registerWidget('color', ColorPickerWidget);
```

### 4.3 自定义校验器

```typescript
// 注册自定义校验关键字
ajv.addKeyword({
  keyword: 'ui:uniqueIn',
  validate: function (schema: string[], data: any, parentSchema: any, dataCxt: any) {
    // 校验值在指定字段的数组中是否唯一
    const parentData = dataCxt.parentData;
    const siblingArray = get(parentData, schema[0]) ?? [];
    return !siblingArray.includes(data) || siblingArray.filter((v: any) => v === data).length <= 1;
  },
  error: {
    message: '值不能重复',
  },
});
```

## 五、面试要点

### 高频问题

1. **JSON Schema 表单引擎的渲染流程是什么？**
   - 解析 Schema → 字段映射（type/ui:widget → 组件）→ 递归渲染 → 状态管理

2. **如何实现表单联动？**
   - 方案一：声明式规则引擎（when/then）
   - 方案二：Schema 内嵌表达式（`{{formData.xxx}}`）
   - 方案三：计算属性（基于 MobX/Vue computed）

3. **表单校验如何与 Schema 结合？**
   - 使用 ajv 库直接基于 JSON Schema 校验
   - 扩展自定义关键字处理业务校验
   - 校验时机：onChange / onBlur / onSubmit

4. **如何处理循环依赖的联动？**
   - 设置最大递归深度
   - 使用脏标记避免无限循环
   - 将联动拆分为单向依赖链

### 设计要点

- Schema 驱动渲染，但不要过度抽象——复杂表单仍需定制组件
- 校验与渲染分离，校验结果通过 props 注入
- 联动规则需要考虑性能，避免每次输入都全量计算
