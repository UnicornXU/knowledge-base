---
sidebar_position: 2
title: 编译原理基础
difficulty: hard
tags:
  - computer-basics
  - compiler
  - ast
  - babel
  - parser
---

# 📝 编译原理基础

> **"不懂编译原理，就无法真正理解前端工具链"** —— Babel、TypeScript、ESLint、Prettier 的核心都是编译器。

## 一、编译器的基本流程

```
编译器流水线
═══════════════════════════════════════════════════════

源代码
  ↓
┌──────────────┐
│  词法分析     │  字符串 → Token 流
│  (Lexer)     │  "const x = 1" → [CONST, IDENT(x), ASSIGN, NUM(1)]
└──────┬───────┘
       ↓
┌──────────────┐
│  语法分析     │  Token 流 → AST（抽象语法树）
│  (Parser)    │  检查语法是否合法
└──────┬───────┘
       ↓
┌──────────────┐
│  语义分析     │  检查类型、作用域、引用是否正确
│  (Semantic)  │  变量是否声明？类型是否匹配？
└──────┬───────┘
       ↓
┌──────────────┐
│  代码优化     │  死代码消除、常量折叠、内联展开
│  (Optimizer) │
└──────┬───────┘
       ↓
┌──────────────┐
│  代码生成     │  AST → 目标代码
│  (Generator) │
└──────────────┘
  ↓
目标代码
```

## 二、词法分析（Lexical Analysis）

### 2.1 Token 类型

```
JavaScript Token 类型
═══════════════════════════════════════════════════════

标识符（Identifier）：变量名、函数名
  x, userName, getElementById

关键字（Keyword）：语言保留字
  const, let, var, function, if, else, return, class

字面量（Literal）：
  数字：42, 3.14, 0xff, 1e10
  字符串："hello", 'world', `template`
  布尔：true, false
  null, undefined

运算符（Operator）：
  算术：+, -, *, /, %
  比较：===, !==, <, >, <=, >=
  逻辑：&&, ||, !
  赋值：=, +=, -=

分隔符（Punctuation）：
  (, ), {, }, [, ], ;, ,, ., :
```

### 2.2 简易词法分析器

```js
function tokenize(code) {
  const tokens = [];
  let i = 0;

  while (i < code.length) {
    // 跳过空白和换行
    if (/\s/.test(code[i])) { i++; continue; }

    // 单行注释
    if (code[i] === '/' && code[i + 1] === '/') {
      while (i < code.length && code[i] !== '\n') i++;
      continue;
    }

    // 数字
    if (/\d/.test(code[i])) {
      let num = '';
      while (i < code.length && /[\d.]/.test(code[i])) num += code[i++];
      tokens.push({ type: 'NUMBER', value: parseFloat(num) });
      continue;
    }

    // 字符串
    if (code[i] === '"' || code[i] === "'") {
      const quote = code[i++];
      let str = '';
      while (i < code.length && code[i] !== quote) str += code[i++];
      i++; // 跳过闭合引号
      tokens.push({ type: 'STRING', value: str });
      continue;
    }

    // 标识符和关键字
    if (/[a-zA-Z_$]/.test(code[i])) {
      let id = '';
      while (i < code.length && /[a-zA-Z0-9_$]/.test(code[i])) id += code[i++];
      const keywords = ['const', 'let', 'var', 'function', 'return', 'if', 'else'];
      tokens.push({
        type: keywords.includes(id) ? 'KEYWORD' : 'IDENTIFIER',
        value: id,
      });
      continue;
    }

    // 运算符和分隔符
    const ops = ['+', '-', '*', '/', '=', '(', ')', '{', '}', ';', ','];
    if (ops.includes(code[i])) {
      tokens.push({ type: 'PUNCTUATION', value: code[i++] });
      continue;
    }

    throw new Error(`Unexpected character: ${code[i]}`);
  }

  return tokens;
}

// 示例
const tokens = tokenize('const x = 42;');
// [
//   { type: 'KEYWORD', value: 'const' },
//   { type: 'IDENTIFIER', value: 'x' },
//   { type: 'PUNCTUATION', value: '=' },
//   { type: 'NUMBER', value: 42 },
//   { type: 'PUNCTUATION', value: ';' },
// ]
```

## 三、语法分析（Syntax Analysis）

### 3.1 AST 结构

```
const x = 1 + 2; 的 AST
═══════════════════════════════════════════════════════

{
  type: "Program",
  body: [
    {
      type: "VariableDeclaration",
      kind: "const",
      declarations: [
        {
          type: "VariableDeclarator",
          id: {
            type: "Identifier",
            name: "x"
          },
          init: {
            type: "BinaryExpression",
            operator: "+",
            left: {
              type: "NumericLiteral",
              value: 1
            },
            right: {
              type: "NumericLiteral",
              value: 2
            }
          }
        }
      ]
    }
  ]
}
```

### 3.2 递归下降解析器

```js
// 简易递归下降解析器
class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  peek() { return this.tokens[this.pos]; }
  consume(type) {
    const token = this.tokens[this.pos];
    if (token.type !== type) {
      throw new Error(`Expected ${type}, got ${token.type}`);
    }
    this.pos++;
    return token;
  }

  // Program → Statement*
  parseProgram() {
    const body = [];
    while (this.pos < this.tokens.length) {
      body.push(this.parseStatement());
    }
    return { type: 'Program', body };
  }

  // Statement → VariableDeclaration | ExpressionStatement
  parseStatement() {
    if (this.peek()?.type === 'KEYWORD' &&
        ['const', 'let', 'var'].includes(this.peek().value)) {
      return this.parseVariableDeclaration();
    }
    return this.parseExpressionStatement();
  }

  // VariableDeclaration → Kind Identifier = Expression ;
  parseVariableDeclaration() {
    const kind = this.consume('KEYWORD').value;
    const name = this.consume('IDENTIFIER').value;
    this.consume('PUNCTUATION'); // =
    const init = this.parseExpression();
    this.consume('PUNCTUATION'); // ;
    return {
      type: 'VariableDeclaration',
      kind,
      declarations: [{
        type: 'VariableDeclarator',
        id: { type: 'Identifier', name },
        init,
      }],
    };
  }

  // Expression → Term (('+' | '-') Term)*
  parseExpression() {
    let left = this.parseTerm();
    while (this.peek()?.value === '+' || this.peek()?.value === '-') {
      const op = this.consume('PUNCTUATION').value;
      const right = this.parseTerm();
      left = { type: 'BinaryExpression', operator: op, left, right };
    }
    return left;
  }

  // Term → Factor (('*' | '/') Factor)*
  parseTerm() {
    let left = this.parseFactor();
    while (this.peek()?.value === '*' || this.peek()?.value === '/') {
      const op = this.consume('PUNCTUATION').value;
      const right = this.parseFactor();
      left = { type: 'BinaryExpression', operator: op, left, right };
    }
    return left;
  }

  // Factor → Number | Identifier | '(' Expression ')'
  parseFactor() {
    const token = this.peek();
    if (token.type === 'NUMBER') {
      this.pos++;
      return { type: 'NumericLiteral', value: token.value };
    }
    if (token.type === 'IDENTIFIER') {
      this.pos++;
      return { type: 'Identifier', name: token.value };
    }
    if (token.value === '(') {
      this.consume('PUNCTUATION');
      const expr = this.parseExpression();
      this.consume('PUNCTUATION');
      return expr;
    }
    throw new Error(`Unexpected token: ${token.value}`);
  }
}
```

## 四、AST 遍历与转换

### 4.1 Visitor 模式

```js
// AST 遍历器（Visitor 模式）
function traverse(ast, visitors) {
  function visit(node, parent) {
    if (!node || typeof node !== 'object') return;

    // 调用 enter 钩子
    const visitor = visitors[node.type];
    if (visitor?.enter) visitor.enter(node, parent);

    // 递归遍历子节点
    for (const key of Object.keys(node)) {
      if (key === 'type') continue;
      const child = node[key];
      if (Array.isArray(child)) {
        child.forEach(c => visit(c, node));
      } else if (child?.type) {
        visit(child, node);
      }
    }

    // 调用 exit 钩子
    if (visitor?.exit) visitor.exit(node, parent);
  }

  visit(ast, null);
}

// 使用示例：找到所有变量声明
const declarations = [];
traverse(ast, {
  VariableDeclarator: {
    enter(node) {
      declarations.push(node.id.name);
    },
  },
});
```

### 4.2 Babel 插件示例

```js
// Babel 插件：将箭头函数转为普通函数
const babel = require('@babel/core');

const plugin = {
  visitor: {
    ArrowFunctionExpression(path) {
      const { params, body } = path.node;
      // 箭头函数：(a, b) => a + b
      // 普通函数：function(a, b) { return a + b; }

      const isExpression = body.type !== 'BlockStatement';
      const newBody = isExpression
        ? { type: 'BlockStatement', body: [{ type: 'ReturnStatement', argument: body }] }
        : body;

      path.replaceWith({
        type: 'FunctionExpression',
        params,
        body: newBody,
      });
    },
  },
};
```

## 五、前端中的编译原理应用

```
编译原理在前端中的应用
═══════════════════════════════════════════════════════

1. Babel
   ES6+ → AST → 转换插件 → ES5 AST → 生成代码
   应用：语法降级、Polyfill 注入、代码压缩

2. TypeScript
   TS 代码 → AST → 类型检查 → JS 代码
   应用：类型检查、接口验证、代码提示

3. ESLint
   JS 代码 → AST → 规则检查 → 报告问题
   应用：代码规范、最佳实践、安全检查

4. Prettier
   代码 → AST（自定义格式）→ 重新生成格式化代码
   应用：代码格式统一

5. Vue 模板编译
   template → AST → 优化 → 渲染函数（render）
   应用：模板解析、静态提升、tree-shaking

6. Webpack/Vite
   模块 → AST → 分析 import/export → 依赖图 → 打包
   应用：模块打包、tree-shaking、代码分割

7. CSS 预处理器
   Sass/Less → AST → 编译 → CSS
   应用：变量、嵌套、混入
```

## 六、常见面试题

**Q1: Babel 的工作原理是什么？**

A: Babel 是一个 JavaScript 编译器，工作流程是：1）解析（Parse）—— 将源代码转为 AST；2）转换（Transform）—— 通过插件遍历和修改 AST；3）生成（Generate）—— 将 AST 转回代码。核心是 Visitor 模式，插件通过访问者模式来操作 AST 节点。

**Q2: TypeScript 的类型检查发生在哪个阶段？**

A: 发生在语义分析阶段。TypeScript 编译器先将 TS 代码解析为 AST，然后进行类型推断和类型检查，最后生成 JavaScript 代码。类型检查不涉及运行时，编译后类型信息被擦除。

**Q3: 什么是 AST？有什么用？**

A: AST（抽象语法树）是源代码的树形结构表示，每个节点代表语法中的一个构造。AST 是编译器中间表示，广泛用于代码分析、转换、优化。前端中 Babel、ESLint、Prettier 都基于 AST 工作。
