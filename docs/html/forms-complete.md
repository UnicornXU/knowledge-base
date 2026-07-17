---
sidebar_position: 3
title: '表单与输入控件深入'
difficulty: 'medium'
tags: ['html', '表单', '验证', 'FormData']
---

# 表单与输入控件深入

## 表单基础

### form 元素核心属性

```html
<form action="/api/submit" method="POST" enctype="multipart/form-data" novalidate autocomplete="off">
  <!-- 表单控件 -->
</form>
```

| 属性           | 值           | 说明           |
| -------------- | ------------ | -------------- |
| `action`       | URL          | 提交目标地址   |
| `method`       | GET/POST     | 提交方式       |
| `enctype`      | 见下表       | 编码类型       |
| `novalidate`   | boolean      | 跳过原生验证   |
| `autocomplete` | on/off       | 浏览器自动填充 |
| `target`       | _self/_blank | 响应显示位置   |

### 编码类型对比

| enctype                             | 使用场景         | 数据格式                  |
| ----------------------------------- | ---------------- | ------------------------- |
| `application/x-www-form-urlencoded` | 默认，纯文本表单 | `key=value&key2=value2`   |
| `multipart/form-data`               | 文件上传         | boundary 分隔的多部分数据 |
| `text/plain`                        | 调试用           | 纯文本，不编码            |

:::warning 注意
上传文件时**必须**使用 `multipart/form-data`，否则文件数据不会被正确发送。
:::

## 输入控件完整列表

### input type 全枚举

| type             | 功能     | 示例值           | 移动端键盘     |
| ---------------- | -------- | ---------------- | -------------- |
| `text`           | 单行文本 | 任意文字         | 标准键盘       |
| `password`       | 密码     | 掩码显示         | 标准键盘       |
| `email`          | 邮箱     | user@example.com | 带@的键盘      |
| `tel`            | 电话     | 13800138000      | 数字拨号盘     |
| `url`            | 网址     | https://...      | 带.com的键盘   |
| `number`         | 数字     | 42               | 数字键盘       |
| `range`          | 范围滑块 | 0-100            | 滑块控件       |
| `date`           | 日期     | 2024-01-15       | 日期选择器     |
| `time`           | 时间     | 14:30            | 时间选择器     |
| `datetime-local` | 日期时间 | 2024-01-15T14:30 | 日期时间选择器 |
| `month`          | 年月     | 2024-01          | 月份选择器     |
| `week`           | 年周     | 2024-W03         | 周选择器       |
| `color`          | 颜色     | #ff0000          | 颜色选择器     |
| `file`           | 文件     | 文件对象         | 文件浏览器     |
| `checkbox`       | 复选框   | on/off           | 复选框         |
| `radio`          | 单选     | 组内选一         | 单选框         |
| `hidden`         | 隐藏字段 | 不可见           | 无             |
| `search`         | 搜索     | 带清除按钮       | 标准键盘       |
| `submit`         | 提交按钮 | -                | 按钮           |
| `reset`          | 重置按钮 | -                | 按钮           |
| `image`          | 图片按钮 | -                | 按钮           |
| `button`         | 通用按钮 | -                | 按钮           |

### 其他表单控件

```html
<!-- 下拉选择 -->
<select name="city" multiple>
  <optgroup label="华东">
    <option value="sh">上海</option>
    <option value="hz">杭州</option>
  </optgroup>
</select>

<!-- 多行文本 -->
<textarea name="bio" rows="4" cols="50" maxlength="500"></textarea>

<!-- 数据列表（自动补全） -->
<input list="browsers" name="browser" />
<datalist id="browsers">
  <option value="Chrome"></option>
  <option value="Firefox"></option>
  <option value="Safari"></option>
</datalist>

<!-- 进度条 / 度量 -->
<progress value="70" max="100">70%</progress>
<meter value="0.7" min="0" max="1" low="0.3" high="0.8">70%</meter>

<!-- 输出（计算结果） -->
<output name="result" for="a b">42</output>
```

## 原生表单验证

### 约束验证属性

| 属性                    | 作用     | 适用类型            |
| ----------------------- | -------- | ------------------- |
| `required`              | 必填     | 所有                |
| `minlength`/`maxlength` | 长度限制 | text, textarea      |
| `min`/`max`             | 数值范围 | number, date, range |
| `step`                  | 步进值   | number, range       |
| `pattern`               | 正则验证 | text, tel, email    |
| `multiple`              | 允许多值 | email, file         |

### 实战示例

```html
<form id="register-form">
  <label for="username">用户名（3-16位字母数字）：</label>
  <input
    type="text"
    id="username"
    name="username"
    required
    minlength="3"
    maxlength="16"
    pattern="[a-zA-Z0-9]+"
    title="只允许字母和数字"
  />

  <label for="email">邮箱：</label>
  <input type="email" id="email" name="email" required />

  <label for="age">年龄（18-120）：</label>
  <input type="number" id="age" name="age" min="18" max="120" required />

  <button type="submit">注册</button>
</form>
```

### 自定义错误信息（setCustomValidity）

```javascript
const password = document.getElementById('password');
const confirm = document.getElementById('confirm-password');

confirm.addEventListener('input', () => {
  if (confirm.value !== password.value) {
    confirm.setCustomValidity('两次密码不一致');
  } else {
    confirm.setCustomValidity(''); // 清除错误 = 验证通过
  }
});

// 完整的验证状态检查
const form = document.getElementById('register-form');
form.addEventListener('submit', (e) => {
  if (!form.checkValidity()) {
    e.preventDefault();
    // 手动触发验证 UI
    form.reportValidity();
  }
});
```

:::tip Validity State API
每个表单元素的 `validity` 属性返回 `ValidityState` 对象，包含 `valueMissing`、`typeMismatch`、`patternMismatch`、`tooShort`、`tooLong`、`rangeUnderflow`、`rangeOverflow`、`customError` 等布尔属性。
:::

## FormData API 完整用法

### 基本用法

```javascript
// 从表单构造
const form = document.querySelector('form');
const formData = new FormData(form);

// 手动构造
const data = new FormData();
data.append('name', '张三');
data.append('avatar', fileInput.files[0]);

// 常用方法
data.get('name'); // '张三'
data.getAll('hobbies'); // ['reading', 'coding']
data.has('name'); // true
data.set('name', '李四'); // 覆盖
data.delete('name'); // 删除
data.entries(); // 迭代器
```

### 配合 fetch 发送

```javascript
// 发送表单数据（自动设置 Content-Type 为 multipart/form-data）
async function submitForm(form) {
  const formData = new FormData(form);

  try {
    const response = await fetch('/api/submit', {
      method: 'POST',
      body: formData, // ⚠️ 不要手动设置 Content-Type
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    console.log('提交成功:', result);
  } catch (error) {
    console.error('提交失败:', error);
  }
}
```

:::warning 重要
使用 FormData 配合 fetch 时，**不要手动设置 Content-Type**！浏览器会自动生成包含 boundary 的正确 header。
:::

### 转换为其他格式

```javascript
// FormData → URLSearchParams（用于 GET 请求）
const params = new URLSearchParams(formData);
fetch(`/api/search?${params}`);

// FormData → JSON 对象
const jsonData = Object.fromEntries(formData.entries());
// 注意：多值字段需要特殊处理
const fullData = {};
for (const [key, value] of formData.entries()) {
  if (fullData[key]) {
    fullData[key] = [].concat(fullData[key], value);
  } else {
    fullData[key] = value;
  }
}
```

## 文件上传

### 单文件 & 多文件

```html
<!-- 单文件 -->
<input type="file" id="avatar" accept="image/*" />

<!-- 多文件 -->
<input type="file" id="photos" multiple accept="image/png,image/jpeg" />

<!-- 文件夹上传 -->
<input type="file" id="folder" webkitdirectory />
```

### 拖拽上传实战

```javascript
const dropZone = document.getElementById('drop-zone');

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  const files = e.dataTransfer.files;
  handleUpload(files);
});

async function handleUpload(files) {
  const formData = new FormData();
  for (const file of files) {
    formData.append('files', file);
  }

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });
  console.log(await response.json());
}
```

### 上传进度监控

```javascript
function uploadWithProgress(file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    });

    xhr.addEventListener('load', () => resolve(xhr.response));
    xhr.addEventListener('error', () => reject(new Error('Upload failed')));

    xhr.open('POST', '/api/upload');
    xhr.send(formData);
  });
}

// 使用
uploadWithProgress(file, (percent) => {
  progressBar.style.width = `${percent}%`;
  progressText.textContent = `${percent}%`;
});
```

## 自定义表单控件（ElementInternals）

```javascript
class StarRating extends HTMLElement {
  static formAssociated = true; // 声明为表单关联元素

  constructor() {
    super();
    this._internals = this.attachInternals();
    this._value = 0;
    this.attachShadow({mode: 'open'});
  }

  connectedCallback() {
    this.render();
  }

  set value(val) {
    this._value = val;
    this._internals.setFormValue(val); // 设置表单值
    this.render();
  }

  get value() {
    return this._value;
  }

  // 原生验证支持
  get validity() {
    return this._internals.validity;
  }
  get validationMessage() {
    return this._internals.validationMessage;
  }
  checkValidity() {
    return this._internals.checkValidity();
  }
}

customElements.define('star-rating', StarRating);
```

```html
<form>
  <star-rating name="rating" required></star-rating>
  <button type="submit">提交评分</button>
</form>
```

## 表单可访问性

### label 关联（必须！）

```html
<!-- 方式1：for 属性关联 -->
<label for="email">邮箱地址：</label>
<input type="email" id="email" name="email" />

<!-- 方式2：嵌套关联 -->
<label>
  邮箱地址：
  <input type="email" name="email" />
</label>
```

### fieldset + legend 分组

```html
<fieldset>
  <legend>收货地址</legend>
  <label for="province">省份：</label>
  <input type="text" id="province" name="province" />
  <label for="city">城市：</label>
  <input type="text" id="city" name="city" />
</fieldset>
```

### ARIA 增强

```html
<div role="group" aria-labelledby="shipping-heading">
  <h3 id="shipping-heading">配送方式</h3>
  <input type="radio" id="express" name="shipping" aria-describedby="express-desc" />
  <label for="express">快递</label>
  <p id="express-desc" class="hint">预计1-3天送达</p>
</div>

<!-- 错误提示关联 -->
<input type="email" id="email" aria-invalid="true" aria-describedby="email-error" />
<p id="email-error" role="alert">请输入有效的邮箱地址</p>
```

:::info 可访问性清单

- 每个输入控件都必须有 label
- 相关控件用 fieldset 分组
- 错误信息用 `aria-describedby` 关联
- 必填字段用 `aria-required="true"` 或 `required`
- 无效状态用 `aria-invalid="true"` 标记
  :::

## 面试高频题

### 1. GET 和 POST 提交表单有什么区别？

**答**：GET 将数据放在 URL 查询参数中（有长度限制、会被缓存、不安全），适合搜索/筛选；POST 将数据放在请求体中（无长度限制、不缓存），适合创建/修改数据和文件上传。

### 2. 如何实现不用 JS 的表单验证？

**答**：使用 HTML5 原生约束属性：`required`、`pattern`、`min/max`、`minlength/maxlength`、`type`（email/url/number 自带格式校验）。配合 `:valid`、`:invalid` CSS 伪类控制样式。

### 3. FormData 和 JSON 提交的区别？

**答**：FormData 使用 `multipart/form-data` 编码，支持文件上传；JSON 使用 `application/json`，结构更灵活但不能直接传文件。FormData 不需要手动设置 Content-Type（浏览器自动带 boundary）。

### 4. 如何监控文件上传进度？

**答**：使用 `XMLHttpRequest` 的 `xhr.upload.onprogress` 事件（Fetch API 原生不支持上传进度）。事件对象的 `loaded` 和 `total` 属性可计算百分比。

### 5. input type="hidden" 有什么用？

**答**：在表单中携带用户不可见但需要提交的数据，如 CSRF token、编辑记录的 ID、表单版本号等。不会在页面上渲染任何内容。

### 6. 如何实现一个自定义的表单控件？

**答**：使用 Web Components + `ElementInternals` API：①设置 `static formAssociated = true`；②通过 `attachInternals()` 获取 internals 对象；③用 `setFormValue()` 设置表单值；④可选实现 `formResetCallback` 等生命周期。
