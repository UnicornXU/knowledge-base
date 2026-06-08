export interface QuizOption {
  label: string;
  value: string;
}

export interface QuizQuestion {
  id: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'single' | 'multiple' | 'judge';
  question: string;
  code?: string;
  options: QuizOption[];
  answer: string | string[];
  explanation: {
    correct: string;
    thinking: string;
    pitfalls?: string;
  };
}

export const categories = [
  { key: 'javascript', label: 'JavaScript', icon: '🟨', count: 0 },
  { key: 'typescript', label: 'TypeScript', icon: '🔷', count: 0 },
  { key: 'react', label: 'React', icon: '⚛️', count: 0 },
  { key: 'vue', label: 'Vue', icon: '💚', count: 0 },
  { key: 'performance', label: '性能优化', icon: '🚀', count: 0 },
  { key: 'engineering', label: '工程化', icon: '🔧', count: 0 },
];

export const quizQuestions: QuizQuestion[] = [
  // ==================== JavaScript ====================
  {
    id: 1,
    category: 'javascript',
    difficulty: 'easy',
    type: 'single',
    question: '以下代码输出什么？',
    code: `console.log(typeof null);`,
    options: [
      { label: '"null"', value: 'a' },
      { label: '"undefined"', value: 'b' },
      { label: '"object"', value: 'c' },
      { label: '"boolean"', value: 'd' },
    ],
    answer: 'c',
    explanation: {
      correct: 'typeof null 返回 "object"，这是 JavaScript 从诞生就存在的历史遗留 Bug。',
      thinking: 'typeof 操作符对基本类型的返回：number/string/boolean/undefined/symbol/bigint/function/object。null 虽然是基本类型，但底层二进制表示以 000 开头，与对象的类型标签相同，所以 typeof 误判为 object。',
      pitfalls: '面试官可能追问"如何正确判断 null"，答案是 `value === null`。',
    },
  },
  {
    id: 2,
    category: 'javascript',
    difficulty: 'medium',
    type: 'single',
    question: '以下代码输出什么？',
    code: `var a = 10;
function foo() {
  console.log(a);
  var a = 20;
}
foo();`,
    options: [
      { label: '10', value: 'a' },
      { label: '20', value: 'b' },
      { label: 'undefined', value: 'c' },
      { label: 'ReferenceError', value: 'd' },
    ],
    answer: 'c',
    explanation: {
      correct: '输出 undefined。因为 var 存在变量提升（Hoisting），函数内部 var a 会被提升到函数顶部，但赋值不会提升。',
      thinking: '变量提升的执行顺序：1) 创建变量声明 → 2) 执行赋值 → 3) 使用变量。在 foo() 内部，a 的声明被提升，但 `a = 20` 还未执行，所以 console.log(a) 时 a 是 undefined。',
      pitfalls: '如果用 let/const 声明，会报 ReferenceError（暂时性死区 TDZ）。',
    },
  },
  {
    id: 3,
    category: 'javascript',
    difficulty: 'medium',
    type: 'single',
    question: '以下代码输出什么？',
    code: `const obj = { a: 1, b: 2 };
const { a, ...rest } = obj;
console.log(rest);`,
    options: [
      { label: '{ a: 1 }', value: 'a' },
      { label: '{ b: 2 }', value: 'b' },
      { label: '{ a: 1, b: 2 }', value: 'c' },
      { label: 'undefined', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'rest 是 { b: 2 }。解构赋值中的 ...rest 会收集剩余的可枚举属性。',
      thinking: '对象解构中 `...rest` 语法（ES2018 Rest Properties）会将未被解构的属性收集到一个新对象中。a 被单独解构走了，剩下的 b 就归 rest。',
      pitfalls: '注意：rest 参数只收集自身的可枚举属性，不包含原型链上的属性。',
    },
  },
  {
    id: 4,
    category: 'javascript',
    difficulty: 'hard',
    type: 'single',
    question: '以下代码输出什么？',
    code: `console.log(1);
setTimeout(() => console.log(2), 0);
Promise.resolve().then(() => console.log(3));
console.log(4);`,
    options: [
      { label: '1 2 3 4', value: 'a' },
      { label: '1 4 2 3', value: 'b' },
      { label: '1 4 3 2', value: 'c' },
      { label: '1 3 4 2', value: 'd' },
    ],
    answer: 'c',
    explanation: {
      correct: '输出 1 4 3 2。这是事件循环（Event Loop）的经典题目。',
      thinking: '执行顺序：1) 同步代码先执行 → 输出 1、4；2) 微任务队列（Promise.then）优先于宏任务队列（setTimeout）→ 输出 3；3) 最后执行宏任务 → 输出 2。关键：微任务 > 宏任务。',
      pitfalls: '面试高频考点：宏任务包括 setTimeout/setInterval/I/O，微任务包括 Promise.then/MutationObserver/queueMicrotask。',
    },
  },
  {
    id: 5,
    category: 'javascript',
    difficulty: 'medium',
    type: 'single',
    question: '以下代码输出什么？',
    code: `const arr = [1, 2, 3];
const [a, ...b] = arr;
console.log(a, b);`,
    options: [
      { label: '1 [2, 3]', value: 'a' },
      { label: '[1, 2] 3', value: 'b' },
      { label: '1 [1, 2, 3]', value: 'c' },
      { label: 'undefined [1, 2, 3]', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: 'a 是 1，b 是 [2, 3]。数组解构中 ...b 收集剩余元素组成新数组。',
      thinking: '数组解构按位置匹配：第 1 个元素赋给 a，剩余的 [2, 3] 收集到 b。注意 b 是一个新数组，不是原数组的引用。',
      pitfalls: '与对象解构不同，数组解构是按顺序匹配的，变量名可以任意取。',
    },
  },
  {
    id: 6,
    category: 'javascript',
    difficulty: 'hard',
    type: 'single',
    question: '以下代码输出什么？',
    code: `function foo() {
  console.log(this);
}
foo();
foo.call(null);`,
    options: [
      { label: 'window, window', value: 'a' },
      { label: 'window, null', value: 'b' },
      { label: 'undefined, null', value: 'c' },
      { label: '在严格模式下不同', value: 'd' },
    ],
    answer: 'd',
    explanation: {
      correct: 'this 的指向取决于调用方式和严格模式。非严格模式下 foo() 的 this 是全局对象，call(null) 也是全局对象；严格模式下两者都是 undefined/null。',
      thinking: 'this 绑定规则：1) 默认绑定：独立调用 → 严格模式为 undefined，非严格为全局对象；2) 隐式绑定：obj.foo() → obj；3) 显式绑定：call/apply/bind → 指定对象；4) new 绑定：新创建的对象。',
      pitfalls: '箭头函数没有自己的 this，它继承外层作用域的 this。',
    },
  },
  {
    id: 7,
    category: 'javascript',
    difficulty: 'easy',
    type: 'judge',
    question: 'let 和 var 的区别之一是 let 不存在变量提升。',
    options: [
      { label: '正确', value: 'true' },
      { label: '错误', value: 'false' },
    ],
    answer: 'false',
    explanation: {
      correct: '错误。let 也存在变量提升，但存在"暂时性死区"（TDZ），在声明前访问会报 ReferenceError。',
      thinking: 'let/const 的变量提升：它们也会被提升到作用域顶部，但在声明语句执行前不可访问（TDZ）。var 提升后初始值为 undefined，let/const 提升后处于未初始化状态。',
      pitfalls: '这是面试常见陷阱。准确说法是：let 有提升，但有 TDZ；var 有提升，没有 TDZ。',
    },
  },
  {
    id: 8,
    category: 'javascript',
    difficulty: 'medium',
    type: 'single',
    question: '以下哪个方法会改变原数组？',
    options: [
      { label: 'Array.prototype.map()', value: 'a' },
      { label: 'Array.prototype.filter()', value: 'b' },
      { label: 'Array.prototype.splice()', value: 'c' },
      { label: 'Array.prototype.slice()', value: 'd' },
    ],
    answer: 'c',
    explanation: {
      correct: 'splice() 会改变原数组，用于添加/删除/替换元素。map/filter/slice 都返回新数组。',
      thinking: '判断方法是否改变原数组的关键：返回值是什么？如果返回"新数组"则不改变原数组（map/filter/slice/concat），如果"就地修改"则改变原数组（splice/sort/reverse/fill/copyWithin）。',
      pitfalls: '注意 splice 和 slice 的区别：splice 改变原数组，slice 不改变。',
    },
  },
  {
    id: 9,
    category: 'javascript',
    difficulty: 'hard',
    type: 'single',
    question: '以下代码输出什么？',
    code: `const promise = new Promise((resolve, reject) => {
  resolve(1);
  reject(2);
  resolve(3);
});
promise.then(
  val => console.log(val),
  err => console.log(err)
);`,
    options: [
      { label: '1', value: 'a' },
      { label: '2', value: 'b' },
      { label: '3', value: 'c' },
      { label: '1 2 3', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: '输出 1。Promise 的状态一旦改变就不可逆，只有第一次 resolve/reject 生效。',
      thinking: 'Promise 有三种状态：pending → fulfilled / rejected。状态只能从 pending 变为 fulfilled 或 rejected，且只能改变一次。后续的 resolve(3) 和 reject(2) 都会被忽略。',
      pitfalls: '这个特性可以用来实现"只取第一个结果"的竞态模式。',
    },
  },
  {
    id: 10,
    category: 'javascript',
    difficulty: 'medium',
    type: 'single',
    question: '以下代码输出什么？',
    code: `console.log([] == false);
console.log([] == ![]);`,
    options: [
      { label: 'true, true', value: 'a' },
      { label: 'true, false', value: 'b' },
      { label: 'false, true', value: 'c' },
      { label: 'false, false', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: '两个都输出 true。这是隐式类型转换的经典题目。',
      thinking: '1) [] == false：[] 转为字符串 ""，再转为数字 0；false 转为数字 0；0 == 0 → true。2) [] == ![]：![] 是 false（[] 是 truthy），所以变成 [] == false，同上 → true。',
      pitfalls: '建议日常开发始终使用 === 严格相等，避免隐式转换带来的困惑。',
    },
  },
  {
    id: 11,
    category: 'javascript',
    difficulty: 'easy',
    type: 'single',
    question: '以下哪个不是 JavaScript 的基本数据类型？',
    options: [
      { label: 'string', value: 'a' },
      { label: 'number', value: 'b' },
      { label: 'object', value: 'c' },
      { label: 'boolean', value: 'd' },
    ],
    answer: 'c',
    explanation: {
      correct: 'object 不是基本数据类型，它是引用类型。基本类型：string、number、boolean、null、undefined、symbol、bigint。',
      thinking: 'JavaScript 数据类型分两类：基本类型（Primitive）存在栈中，引用类型（Reference）存在堆中。typeof 的返回值中，"object" 包含普通对象、数组、null、RegExp 等。',
      pitfalls: 'typeof null === "object" 是历史 Bug，但 typeof [] === "object" 是正确的。',
    },
  },
  {
    id: 12,
    category: 'javascript',
    difficulty: 'hard',
    type: 'single',
    question: '以下代码输出什么？',
    code: `async function foo() {
  console.log(1);
  await bar();
  console.log(2);
}
function bar() {
  console.log(3);
}
console.log(4);
foo();
console.log(5);`,
    options: [
      { label: '4 1 3 5 2', value: 'a' },
      { label: '4 1 3 2 5', value: 'b' },
      { label: '4 1 5 3 2', value: 'c' },
      { label: '1 3 4 5 2', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: '输出 4 1 3 5 2。',
      thinking: '1) 先执行同步代码 console.log(4) → 输出 4；2) 调用 foo()，执行 console.log(1) → 输出 1；3) await bar()，bar() 是同步函数，执行 console.log(3) → 输出 3；4) await 后面的代码（console.log(2)）进入微任务队列；5) 继续执行 console.log(5) → 输出 5；6) 同步代码执行完，执行微任务 → 输出 2。',
      pitfalls: 'await 会暂停 async 函数的执行，但 await 后面的表达式是同步执行的（除非它本身返回 Promise）。',
    },
  },

  // ==================== TypeScript ====================
  {
    id: 13,
    category: 'typescript',
    difficulty: 'easy',
    type: 'single',
    question: 'TypeScript 中 any 和 unknown 的区别是什么？',
    options: [
      { label: '没有区别，完全相同', value: 'a' },
      { label: 'any 可以赋值给任何类型，unknown 不可以', value: 'b' },
      { label: 'unknown 更宽松，any 更严格', value: 'c' },
      { label: 'any 只能用于函数参数', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'any 会绕过类型检查，可以赋值给任何类型也可以被任何类型赋值；unknown 是类型安全的 any，必须先做类型收窄才能使用。',
      thinking: 'any 的问题：它"关闭"了 TypeScript 的类型检查，等于放弃了类型安全。unknown 更安全：你可以把任何值赋给 unknown，但在使用前必须 typeof/类型断言来收窄类型。',
      pitfalls: '最佳实践：尽量用 unknown 代替 any，必须用 any 时添加注释说明原因。',
    },
  },
  {
    id: 14,
    category: 'typescript',
    difficulty: 'medium',
    type: 'single',
    question: '以下 TypeScript 代码中，哪个类型注解是正确的？',
    code: `function add(a: number, b: number) {
  return a + b;
}
const result: ??? = add(1, 2);`,
    options: [
      { label: 'any', value: 'a' },
      { label: 'number', value: 'b' },
      { label: 'string', value: 'c' },
      { label: 'void', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'result 的类型应该是 number。TypeScript 会自动推断函数返回值类型。',
      thinking: 'TypeScript 的类型推断（Type Inference）：当函数参数都是 number 时，a + b 的结果 TypeScript 会自动推断为 number。通常不需要手动标注返回值类型，让 TypeScript 推断即可。',
      pitfalls: 'void 表示函数没有返回值，不是"任意类型"。',
    },
  },
  {
    id: 15,
    category: 'typescript',
    difficulty: 'medium',
    type: 'single',
    question: 'interface 和 type 的主要区别是什么？',
    options: [
      { label: '完全相同，可以互换使用', value: 'a' },
      { label: 'interface 可以声明合并，type 不可以', value: 'b' },
      { label: 'type 可以声明合并，interface 不可以', value: 'c' },
      { label: 'interface 只能用于类', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'interface 支持声明合并（同名 interface 会自动合并），type 不支持。两者在大多数场景下可以互换。',
      thinking: 'interface 特有：声明合并、extends 继承、implements 实现。type 特有：联合类型、交叉类型、元组、映射类型、条件类型。选择建议：定义对象形状用 interface，需要联合/交叉/高级类型用 type。',
      pitfalls: '声明合并是 interface 独有的特性，同名 interface 会自动合并属性。',
    },
  },
  {
    id: 16,
    category: 'typescript',
    difficulty: 'hard',
    type: 'single',
    question: '以下代码的类型是什么？',
    code: `type IsString<T> = T extends string ? true : false;
type Result = IsString<"hello">;`,
    options: [
      { label: 'boolean', value: 'a' },
      { label: 'true', value: 'b' },
      { label: 'string', value: 'c' },
      { label: '"hello"', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'Result 的类型是 true。这是条件类型（Conditional Type）的用法。',
      thinking: '条件类型语法：`T extends U ? X : Y`。当 T 是 "hello"（string 的子类型）时，条件成立，返回 true 字面量类型。',
      pitfalls: '注意区分 `extends` 在条件类型和泛型约束中的不同含义。',
    },
  },

  // ==================== React ====================
  {
    id: 17,
    category: 'react',
    difficulty: 'easy',
    type: 'single',
    question: 'React 中 useState 的返回值是什么？',
    options: [
      { label: '只有当前状态值', value: 'a' },
      { label: '[state, setState] 数组', value: 'b' },
      { label: '{ state, setState } 对象', value: 'c' },
      { label: '一个 Promise', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'useState 返回一个数组 [当前状态值, 更新函数]，通常用解构赋值使用。',
      thinking: '为什么是数组而不是对象？因为数组解构可以自定义变量名：`const [count, setCount] = useState(0)`。如果是对象，key 名是固定的，多次使用时需要重命名。',
      pitfalls: 'setState 是异步的，调用后不会立即更新 state。',
    },
  },
  {
    id: 18,
    category: 'react',
    difficulty: 'medium',
    type: 'single',
    question: '以下代码有什么问题？',
    code: `function App() {
  const [count, setCount] = useState(0);

  function handleClick() {
    setCount(count + 1);
    setCount(count + 1);
    setCount(count + 1);
  }

  return <button onClick={handleClick}>{count}</button>;
}`,
    options: [
      { label: '点击后 count 变成 3', value: 'a' },
      { label: '点击后 count 变成 1', value: 'b' },
      { label: '代码会报错', value: 'c' },
      { label: '点击后 count 变成 3，但只渲染一次', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: '点击后 count 变成 1，不是 3。因为三次 setCount 使用的都是同一个 count（闭包捕获的值 0）。',
      thinking: 'React 的状态更新是"批处理"的：在同一个事件处理函数中多次 setState 会被合并。而且 `count + 1` 中的 count 是闭包捕获的当前渲染周期的值（0），所以三次都是 0 + 1 = 1。',
      pitfalls: '如果想基于前一个状态更新，使用函数式更新：`setCount(prev => prev + 1)`。',
    },
  },
  {
    id: 19,
    category: 'react',
    difficulty: 'medium',
    type: 'single',
    question: 'useEffect 的清理函数什么时候执行？',
    options: [
      { label: '只在组件卸载时执行', value: 'a' },
      { label: '每次 effect 执行前和组件卸载时', value: 'b' },
      { label: '只在依赖变化时执行', value: 'c' },
      { label: '每次渲染后都执行', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: '清理函数在每次 effect 重新执行前（依赖变化时）和组件卸载时执行。',
      thinking: '执行顺序：1) 组件挂载 → 执行 effect；2) 依赖变化 → 先执行上一次的清理函数 → 再执行新的 effect；3) 组件卸载 → 执行最后一次的清理函数。这确保了旧的副作用被正确清理。',
      pitfalls: '不要把清理函数理解为"只在卸载时执行"，这是常见误区。',
    },
  },
  {
    id: 20,
    category: 'react',
    difficulty: 'hard',
    type: 'single',
    question: '以下代码中，Child 组件会重新渲染几次？',
    code: `function Parent() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>
        {count}
      </button>
      <Child />
    </div>
  );
}

const Child = React.memo(function Child() {
  console.log('Child render');
  return <div>Child</div>;
});`,
    options: [
      { label: '每次点击都渲染', value: 'a' },
      { label: '只在挂载时渲染一次', value: 'b' },
      { label: '渲染 2 次', value: 'c' },
      { label: '不确定', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'Child 只在挂载时渲染一次。React.memo 会对比 props，Child 没有 props，所以不会重新渲染。',
      thinking: 'React.memo 的工作原理：对组件的 props 进行浅比较，如果 props 没变则跳过渲染。Child 组件没有任何 props，所以 Parent 的 re-render 不会触发 Child 的 re-render。',
      pitfalls: '如果 Child 有函数类型的 prop 且父组件没有用 useCallback，则 React.memo 会失效。',
    },
  },
  {
    id: 21,
    category: 'react',
    difficulty: 'medium',
    type: 'single',
    question: 'React 中 key 的作用是什么？',
    options: [
      { label: '给元素添加唯一标识，方便 CSS 选择', value: 'a' },
      { label: '帮助 React 识别哪些元素变化了，优化 Diff 算法', value: 'b' },
      { label: '用于事件绑定', value: 'c' },
      { label: '用于数据传递', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'key 帮助 React 的 Diff 算法识别哪些元素是新增、删除或移动的，从而最小化 DOM 操作。',
      thinking: '没有 key 时，React 按索引比较，列表重排时会导致大量不必要的 DOM 更新。有稳定的 key（如 id），React 可以准确识别元素的移动，只更新必要的 DOM。',
      pitfalls: '不要用 index 作为 key（当列表会重排/增删时），会导致状态混乱和性能问题。',
    },
  },
  {
    id: 22,
    category: 'react',
    difficulty: 'hard',
    type: 'single',
    question: '以下代码输出什么？',
    code: `function App() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log('effect:', count);
  }, [count]);

  console.log('render:', count);

  return <button onClick={() => setCount(1)}>Click</button>;
}`,
    options: [
      { label: 'render: 0 → 点击 → render: 1 → effect: 1', value: 'a' },
      { label: 'render: 0 → effect: 0 → 点击 → render: 1 → effect: 1', value: 'b' },
      { label: 'render: 0 → 点击 → effect: 1 → render: 1', value: 'c' },
      { label: 'effect: 0 → render: 0 → 点击 → effect: 1 → render: 1', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'render 在 effect 之前执行。首次渲染：先 render，再执行 effect。点击后：先 render，再执行 effect。',
      thinking: 'React 的执行顺序：1) render 阶段（纯函数，计算 Virtual DOM）→ 2) commit 阶段（更新 DOM）→ 3) useLayoutEffect → 4) useEffect（异步，不阻塞绘制）。所以 console.log("render") 先于 effect 执行。',
      pitfalls: 'useEffect 是异步执行的（浏览器绘制后），useLayoutEffect 是同步执行的（DOM 更新后、绘制前）。',
    },
  },

  // ==================== Vue ====================
  {
    id: 23,
    category: 'vue',
    difficulty: 'easy',
    type: 'single',
    question: 'Vue 3 中 Composition API 的核心函数是什么？',
    options: [
      { label: 'data()', value: 'a' },
      { label: 'setup()', value: 'b' },
      { label: 'created()', value: 'c' },
      { label: 'mounted()', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'setup() 是 Composition API 的入口，在组件创建之前执行。在 <script setup> 语法糖中，整个 script 块就是 setup。',
      thinking: 'Composition API 的设计目的：将同一功能的逻辑聚合在一起（而非按选项分散）。setup 中可以使用 ref/reactive/computed/watch 等函数来组织逻辑。',
      pitfalls: 'setup 中不能访问 this，因为组件实例还未创建。',
    },
  },
  {
    id: 24,
    category: 'vue',
    difficulty: 'medium',
    type: 'single',
    question: 'ref 和 reactive 的区别是什么？',
    options: [
      { label: 'ref 用于基本类型，reactive 用于对象类型', value: 'a' },
      { label: 'ref 需要 .value 访问，reactive 不需要', value: 'b' },
      { label: '两者完全相同', value: 'c' },
      { label: 'ref 是 Vue 2 的 API，reactive 是 Vue 3 的', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'ref 需要通过 .value 访问和修改值，reactive 返回的是 Proxy 对象可以直接访问属性。ref 也可以包装对象。',
      thinking: 'ref 的原理：对基本类型使用 Object.defineProperty 的 getter/setter 包装；对对象类型内部调用 reactive。reactive 只能用于对象类型（Array/Object/Map/Set），传入基本类型会报警告。',
      pitfalls: '在模板中使用 ref 不需要 .value（Vue 自动解包），但在 JS 中需要。',
    },
  },
  {
    id: 25,
    category: 'vue',
    difficulty: 'medium',
    type: 'single',
    question: 'Vue 的 computed 和 watch 有什么区别？',
    options: [
      { label: 'computed 有缓存，watch 没有', value: 'a' },
      { label: 'computed 用于异步操作，watch 用于同步', value: 'b' },
      { label: 'computed 必须有返回值，watch 可以没有', value: 'c' },
      { label: 'A 和 C 都正确', value: 'd' },
    ],
    answer: 'd',
    explanation: {
      correct: 'computed 有缓存（依赖不变则不重新计算）且必须有返回值；watch 没有缓存且可以执行副作用（不需要返回值）。',
      thinking: '选择依据：需要从已有数据派生新数据 → computed；需要在数据变化时执行副作用（API 请求、DOM 操作、埋点）→ watch。computed 是声明式的（描述"是什么"），watch 是命令式的（描述"做什么"）。',
      pitfalls: '不要在 computed 中执行副作用，它应该是纯函数。',
    },
  },
  {
    id: 26,
    category: 'vue',
    difficulty: 'hard',
    type: 'single',
    question: 'Vue 3 的响应式原理是什么？',
    options: [
      { label: 'Object.defineProperty', value: 'a' },
      { label: 'Proxy', value: 'b' },
      { label: '脏检查（Dirty Checking）', value: 'c' },
      { label: '发布-订阅模式', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'Vue 3 使用 Proxy 实现响应式，替代了 Vue 2 的 Object.defineProperty。',
      thinking: 'Proxy 的优势：1) 可以监听属性的新增和删除（Vue 2 不行）；2) 可以监听数组索引和 length 变化；3) 可以监听 Map/Set 等集合类型；4) 性能更好（不需要递归初始化所有属性）。Vue 3 的响应式系统是"发布-订阅"模式的 Proxy 实现。',
      pitfalls: 'Vue 2 的 Object.defineProperty 只能监听已存在的属性，所以需要 Vue.set() 来添加响应式属性。',
    },
  },
  {
    id: 27,
    category: 'vue',
    difficulty: 'easy',
    type: 'single',
    question: 'v-if 和 v-show 的区别是什么？',
    options: [
      { label: '没有区别，完全相同', value: 'a' },
      { label: 'v-if 不渲染 DOM，v-show 用 CSS 隐藏', value: 'b' },
      { label: 'v-show 不渲染 DOM，v-if 用 CSS 隐藏', value: 'c' },
      { label: 'v-if 只能用于单个元素', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'v-if 为 false 时不会渲染 DOM 元素（条件渲染）；v-show 始终渲染 DOM，为 false 时用 display: none 隐藏。',
      thinking: '选择依据：切换频率高 → v-show（避免频繁创建/销毁 DOM）；条件很少改变 → v-if（减少初始渲染开销）。v-if 有更高的切换开销，v-show 有更高的初始渲染开销。',
      pitfalls: 'v-if 可以配合 v-else-if / v-else 使用，v-show 不行。',
    },
  },

  // ==================== 性能优化 ====================
  {
    id: 28,
    category: 'performance',
    difficulty: 'easy',
    type: 'single',
    question: '以下哪个 CSS 属性的动画性能最好？',
    options: [
      { label: 'width', value: 'a' },
      { label: 'left', value: 'b' },
      { label: 'transform', value: 'c' },
      { label: 'margin', value: 'd' },
    ],
    answer: 'c',
    explanation: {
      correct: 'transform 的动画性能最好，因为它只触发合成（Composite），不触发重排和重绘。',
      thinking: 'CSS 属性的渲染开销：1) transform/opacity/filter → 只触发 Composite（GPU 加速，最便宜）；2) color/background → 触发 Paint + Composite；3) width/height/margin/left → 触发 Layout + Paint + Composite（最贵）。',
      pitfalls: 'will-change: transform 可以提前将元素提升到合成层，但不要滥用（会增加内存消耗）。',
    },
  },
  {
    id: 29,
    category: 'performance',
    difficulty: 'medium',
    type: 'single',
    question: '首屏加载优化中，以下哪个策略最有效？',
    options: [
      { label: '压缩所有代码到一个文件', value: 'a' },
      { label: '代码分割 + 路由懒加载', value: 'b' },
      { label: '把所有 CSS 内联到 HTML', value: 'c' },
      { label: '关闭所有缓存', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: '代码分割 + 路由懒加载可以显著减少首屏需要加载的 JS 体积，是最有效的首屏优化策略之一。',
      thinking: '首屏优化的核心：减少首屏需要的资源。代码分割将代码拆成多个 chunk，路由懒加载只加载当前路由需要的代码，首屏只需加载主包（通常 200-500KB），而非整个应用（可能 2MB+）。',
      pitfalls: '合并到一个文件在 HTTP/1.1 下可以减少请求数，但在 HTTP/2 下多路复用使得多个小文件更好（更利于缓存和并行加载）。',
    },
  },
  {
    id: 30,
    category: 'performance',
    difficulty: 'medium',
    type: 'single',
    question: '什么是重排（Reflow）？以下哪个操作会触发重排？',
    options: [
      { label: '修改元素颜色', value: 'a' },
      { label: '读取 offsetWidth', value: 'b' },
      { label: '修改 opacity', value: 'c' },
      { label: '修改 transform', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: '读取 offsetWidth 会触发强制同步布局（Forced Synchronous Layout），因为浏览器需要先计算布局才能返回准确的值。',
      thinking: '重排（Layout）是重新计算元素位置和大小的过程。读取布局属性（offset/scroll/client 系列、getComputedStyle、getBoundingClientRect）会强制浏览器立即执行布局计算，即使之前的样式修改还未生效。',
      pitfalls: '批量读取、批量写入可以减少重排次数。或者使用 FastDOM 库来自动批处理。',
    },
  },
  {
    id: 31,
    category: 'performance',
    difficulty: 'hard',
    type: 'single',
    question: 'Web Vitals 中的 CLS 衡量的是什么？',
    options: [
      { label: '页面加载速度', value: 'a' },
      { label: '用户交互响应时间', value: 'b' },
      { label: '页面布局的视觉稳定性', value: 'c' },
      { label: '资源加载效率', value: 'd' },
    ],
    answer: 'c',
    explanation: {
      correct: 'CLS（Cumulative Layout Shift）衡量页面布局的视觉稳定性，即页面元素是否有意外移动。',
      thinking: 'CLS 的计算：偏移距离 × 偏移面积。常见的 CLS 来源：1) 没有尺寸的图片/视频；2) 动态注入的内容（广告、弹窗）；3) 动态调整大小的字体。目标值 < 0.1。',
      pitfalls: '只有"意外"的布局偏移才计入 CLS，用户交互触发的偏移（500ms 内）不计入。',
    },
  },

  // ==================== 工程化 ====================
  {
    id: 32,
    category: 'engineering',
    difficulty: 'easy',
    type: 'single',
    question: 'Webpack 中 loader 和 plugin 的区别是什么？',
    options: [
      { label: 'loader 处理文件，plugin 扩展构建流程', value: 'a' },
      { label: 'loader 是内置的，plugin 需要安装', value: 'b' },
      { label: 'loader 处理 JS，plugin 处理 CSS', value: 'c' },
      { label: '没有区别', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: 'loader 用于转换模块内容（如 babel-loader 转译 JS、css-loader 处理 CSS）；plugin 用于扩展构建流程（如 HtmlWebpackPlugin 生成 HTML、MiniCssExtractPlugin 提取 CSS）。',
      thinking: 'loader 工作在"模块打包"阶段，对单个文件做转换（链式调用，从右到左执行）。plugin 工作在整个构建生命周期，通过 Tapable 钩子机制介入各个阶段。',
      pitfalls: 'loader 的执行顺序是从右到左、从下到上：use: ["style-loader", "css-loader"] 先执行 css-loader 再执行 style-loader。',
    },
  },
  {
    id: 33,
    category: 'engineering',
    difficulty: 'medium',
    type: 'single',
    question: 'Tree Shaking 的原理是什么？',
    options: [
      { label: '运行时删除未使用的代码', value: 'a' },
      { label: '基于 ES Module 的静态分析，删除未导入的导出', value: 'b' },
      { label: '压缩代码减小体积', value: 'c' },
      { label: '代码混淆', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'Tree Shaking 依赖 ES Module 的静态结构（import/export），在构建时分析哪些导出没有被导入，然后删除这些"死代码"。',
      thinking: 'ES Module 的 import/export 是静态的（编译时确定），CommonJS 的 require/module.exports 是动态的（运行时确定）。只有 ES Module 才能做 Tree Shaking，因为编译器可以在不执行代码的情况下分析依赖关系。',
      pitfalls: 'CommonJS 模块（如大部分 npm 包）不能被 Tree Shaking。所以推荐使用 ES Module 版本的库（如 lodash-es 而非 lodash）。',
    },
  },
  {
    id: 34,
    category: 'engineering',
    difficulty: 'medium',
    type: 'single',
    question: 'HTTP/2 相比 HTTP/1.1 最重要的改进是什么？',
    options: [
      { label: '支持 HTTPS', value: 'a' },
      { label: '多路复用（Multiplexing）', value: 'b' },
      { label: '更大的请求头', value: 'c' },
      { label: '更快的 DNS 解析', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: '多路复用是 HTTP/2 最重要的改进，允许在单个 TCP 连接上并行发送多个请求和响应，解决了 HTTP/1.1 的队头阻塞问题。',
      thinking: 'HTTP/1.1 的问题：浏览器最多同时开 6 个 TCP 连接，每个连接内请求是串行的（队头阻塞）。HTTP/2 的改进：1) 多路复用：一个连接并行多个请求；2) 头部压缩（HPACK）；3) 服务端推送；4) 二进制分帧。',
      pitfalls: 'HTTPS 不是 HTTP/2 的特性，但主流浏览器只支持基于 TLS 的 HTTP/2。',
    },
  },
  {
    id: 35,
    category: 'engineering',
    difficulty: 'easy',
    type: 'single',
    question: 'Git 中 rebase 和 merge 的区别是什么？',
    options: [
      { label: '完全相同，可以互换使用', value: 'a' },
      { label: 'merge 保留分支历史，rebase 线性化提交历史', value: 'b' },
      { label: 'rebase 保留分支历史，merge 线性化提交历史', value: 'c' },
      { label: 'rebase 不能用于公共分支', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'merge 会创建一个合并提交，保留完整的分支历史；rebase 会将提交"重放"到目标分支上，形成线性历史。',
      thinking: '选择建议：1) 个人分支整理提交 → rebase（保持历史整洁）；2) 合并到公共分支 → merge（保留合并记录）。核心原则：不要对已经推送到远程的公共分支做 rebase（会改变提交历史）。',
      pitfalls: 'rebase 改变了提交的 hash，如果其他人基于旧提交工作，会导致冲突和混乱。',
    },
  },
  {
    id: 36,
    category: 'engineering',
    difficulty: 'medium',
    type: 'single',
    question: '什么是 CI/CD？',
    options: [
      { label: '一种编程语言', value: 'a' },
      { label: '持续集成/持续部署，自动化代码集成和发布流程', value: 'b' },
      { label: '一种数据库技术', value: 'c' },
      { label: '一种前端框架', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'CI（持续集成）：频繁地将代码合并到主分支，自动运行测试。CD（持续部署/交付）：自动将通过测试的代码部署到生产环境。',
      thinking: 'CI/CD 的价值：1) 尽早发现集成问题；2) 减少手动操作的错误；3) 加速发布周期。典型流程：push → lint → test → build → deploy。常用工具：GitHub Actions、GitLab CI、Jenkins。',
      pitfalls: 'CD 有两种：Continuous Delivery（持续交付，手动触发部署）和 Continuous Deployment（持续部署，全自动部署到生产）。',
    },
  },

  // ==================== JavaScript 补充 ====================
  {
    id: 37,
    category: 'javascript',
    difficulty: 'medium',
    type: 'single',
    question: '以下代码输出什么？',
    code: `const a = { x: 1 };
const b = a;
b.x = 2;
console.log(a.x);`,
    options: [
      { label: '1', value: 'a' },
      { label: '2', value: 'b' },
      { label: 'undefined', value: 'c' },
      { label: 'ReferenceError', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: '输出 2。对象是引用类型，b = a 只是复制了引用地址，a 和 b 指向同一个对象。',
      thinking: 'JavaScript 中基本类型（string/number/boolean）赋值是"值复制"，引用类型（object/array/function）赋值是"引用复制"。修改 b.x 实际上修改的是同一个对象的 x 属性。',
      pitfalls: '如果想"深拷贝"一个对象，可以用 structuredClone(obj)、JSON.parse(JSON.stringify(obj)) 或递归拷贝。',
    },
  },
  {
    id: 38,
    category: 'javascript',
    difficulty: 'easy',
    type: 'single',
    question: '以下哪个方法可以阻止对象属性被修改？',
    options: [
      { label: 'Object.freeze()', value: 'a' },
      { label: 'Object.assign()', value: 'b' },
      { label: 'Object.keys()', value: 'c' },
      { label: 'Object.create()', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: 'Object.freeze() 冻结对象，使其不可添加、删除、修改属性。',
      thinking: 'Object 的限制方法：1) Object.freeze() 冻结（最严格）；2) Object.seal() 密封（不能增删，可以改）；3) Object.preventExtensions()（不能新增）。三者严格程度：freeze > seal > preventExtensions。',
      pitfalls: 'freeze 是浅冻结，嵌套对象的属性仍然可以修改。深冻结需要递归 freeze。',
    },
  },
  {
    id: 39,
    category: 'javascript',
    difficulty: 'hard',
    type: 'single',
    question: '以下代码输出什么？',
    code: `for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}`,
    options: [
      { label: '0 1 2', value: 'a' },
      { label: '3 3 3', value: 'b' },
      { label: 'undefined undefined undefined', value: 'c' },
      { label: '0 0 0', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: '输出 3 3 3。var 声明的 i 是函数级作用域，三个回调共享同一个 i，循环结束后 i 已经是 3。',
      thinking: 'var 是函数作用域，for 循环中的 var i 实际上是全局（或外层函数）的同一个变量。setTimeout 是异步的，等回调执行时循环已经结束，i 已经是 3。',
      pitfalls: '修复方法：1) 用 let 代替 var（块作用域）；2) 用 IIFE 创建闭包：(function(j){ setTimeout(() => console.log(j), 0); })(i)。',
    },
  },
  {
    id: 40,
    category: 'javascript',
    difficulty: 'medium',
    type: 'single',
    question: '以下代码输出什么？',
    code: `console.log('5' + 3);
console.log('5' - 3);`,
    options: [
      { label: '53, 2', value: 'a' },
      { label: '8, 2', value: 'b' },
      { label: '53, 53', value: 'c' },
      { label: '8, 8', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: '输出 "53" 和 2。+ 号遇到字符串会拼接，- 号会把字符串转为数字。',
      thinking: 'JavaScript 的隐式类型转换规则：1) + 号：只要有一个操作数是字符串，就做字符串拼接；2) - * / %：会把操作数转为数字再运算。所以 "5" + 3 = "53"（拼接），"5" - 3 = 2（转数字）。',
      pitfalls: '这是经典的隐式转换陷阱，建议显式转换：Number("5") + 3 或 String(5) + "3"。',
    },
  },
  {
    id: 41,
    category: 'javascript',
    difficulty: 'easy',
    type: 'single',
    question: '以下哪个不是 ES6 新增的特性？',
    options: [
      { label: '箭头函数', value: 'a' },
      { label: 'Promise', value: 'b' },
      { label: 'var 关键字', value: 'c' },
      { label: '模板字符串', value: 'd' },
    ],
    answer: 'c',
    explanation: {
      correct: 'var 是 ES3 就有的关键字。ES6 新增了 let/const，但没有移除 var。',
      thinking: 'ES6（ES2015）主要新增：let/const、箭头函数、模板字符串、解构赋值、Promise、class、Module（import/export）、Symbol、Map/Set、Proxy/Reflect、Iterator/Generator 等。',
      pitfalls: '虽然 var 仍然可用，但现代开发推荐使用 let/const 代替 var。',
    },
  },
  {
    id: 42,
    category: 'javascript',
    difficulty: 'medium',
    type: 'single',
    question: '以下代码输出什么？',
    code: `const arr = [1, 2, 3, 4, 5];
const result = arr.reduce((acc, cur) => acc + cur, 0);
console.log(result);`,
    options: [
      { label: '[1, 2, 3, 4, 5]', value: 'a' },
      { label: '15', value: 'b' },
      { label: 'NaN', value: 'c' },
      { label: 'undefined', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: '输出 15。reduce 对数组元素累加，初始值为 0，最终返回 0+1+2+3+4+5=15。',
      thinking: 'reduce(callback, initialValue) 的 callback 参数：acc（累加器）、cur（当前值）、index（索引）、array（原数组）。initialValue 作为第一次回调的 acc，如果不提供则用数组第一个元素。',
      pitfalls: '如果不提供 initialValue 且数组为空，reduce 会报错。空数组必须提供初始值。',
    },
  },
  {
    id: 43,
    category: 'javascript',
    difficulty: 'hard',
    type: 'single',
    question: '以下代码输出什么？',
    code: `function* gen() {
  yield 1;
  yield 2;
  return 3;
}
const g = gen();
console.log(g.next());
console.log(g.next());
console.log(g.next());`,
    options: [
      { label: '{value:1,done:false} {value:2,done:false} {value:3,done:false}', value: 'a' },
      { label: '{value:1,done:false} {value:2,done:false} {value:3,done:true}', value: 'b' },
      { label: '1 2 3', value: 'c' },
      { label: '{value:1,done:true} {value:2,done:true} {value:3,done:true}', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'yield 返回 {done: false, value: ...}，return 返回 {done: true, value: ...}。',
      thinking: 'Generator 函数返回迭代器。yield 产生的值 done 为 false（还有下一个），return 产生的值 done 为 true（迭代结束）。for...of 循环会忽略 done: true 的值，所以 return 的值不会被遍历到。',
      pitfalls: 'yield 和 return 的区别：yield 暂停执行可以恢复，return 终止生成器。for...of 不会消费 return 的值。',
    },
  },
  {
    id: 44,
    category: 'javascript',
    difficulty: 'easy',
    type: 'judge',
    question: 'Symbol() === Symbol() 的结果是 true。',
    options: [
      { label: '正确', value: 'true' },
      { label: '错误', value: 'false' },
    ],
    answer: 'false',
    explanation: {
      correct: '错误。每次调用 Symbol() 都会创建一个唯一的值，即使描述相同也不相等。',
      thinking: 'Symbol 的核心特性是唯一性。Symbol("foo") !== Symbol("foo")。如果需要共享 Symbol，使用 Symbol.for("foo") === Symbol.for("foo")（全局 Symbol 注册表）。',
      pitfalls: 'Symbol 常用于对象的唯一属性键，避免属性名冲突。',
    },
  },
  {
    id: 45,
    category: 'javascript',
    difficulty: 'medium',
    type: 'single',
    question: '以下代码输出什么？',
    code: `const map = new Map();
map.set('a', 1);
map.set('a', 2);
console.log(map.size);`,
    options: [
      { label: '1', value: 'a' },
      { label: '2', value: 'b' },
      { label: '报错', value: 'c' },
      { label: 'undefined', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: '输出 1。Map 的 key 是唯一的，重复 set 同一个 key 会覆盖值，但 size 不变。',
      thinking: 'Map vs Object 的 key：Map 的 key 可以是任意类型（对象、函数、基本类型），Object 的 key 只能是字符串或 Symbol。Map 保持插入顺序，Object 在 ES6 后也保持但有例外。',
      pitfalls: 'Map 的 key 使用 SameValueZero 比较，NaN === NaN 为 true，所以 NaN 也可以作为 key。',
    },
  },
  {
    id: 46,
    category: 'javascript',
    difficulty: 'hard',
    type: 'single',
    question: '以下代码输出什么？',
    code: `class A {
  constructor() { this.x = 1; }
  getX() { return this.x; }
}
class B extends A {
  constructor() {
    super();
    this.x = 2;
  }
}
const b = new B();
console.log(b.getX());`,
    options: [
      { label: '1', value: 'a' },
      { label: '2', value: 'b' },
      { label: 'undefined', value: 'c' },
      { label: 'ReferenceError', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: '输出 2。super() 调用父类构造函数后，子类可以覆盖 this.x。',
      thinking: 'class 继承中：1) 子类 constructor 必须先调用 super() 才能使用 this；2) super() 执行父类构造函数，设置 this.x = 1；3) 接下来子类 this.x = 2 覆盖了它。',
      pitfalls: '如果子类没有 constructor，会自动添加一个调用 super(...args) 的构造函数。',
    },
  },
  {
    id: 47,
    category: 'javascript',
    difficulty: 'medium',
    type: 'single',
    question: '以下代码输出什么？',
    code: `console.log(0.1 + 0.2 === 0.3);`,
    options: [
      { label: 'true', value: 'a' },
      { label: 'false', value: 'b' },
      { label: '报错', value: 'c' },
      { label: 'NaN', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: '输出 false。0.1 + 0.2 = 0.30000000000000004，这是浮点数精度问题。',
      thinking: 'IEEE 754 双精度浮点数无法精确表示某些小数（如 0.1），就像十进制无法精确表示 1/3 一样。解决方法：Math.abs(0.1 + 0.2 - 0.3) < Number.EPSILON 或使用 toFixed()。',
      pitfalls: '金融计算不要用浮点数，用整数（分）计算或使用 decimal.js 等库。',
    },
  },
  {
    id: 48,
    category: 'javascript',
    difficulty: 'easy',
    type: 'single',
    question: 'Array.isArray([]) 的结果是什么？',
    options: [
      { label: 'true', value: 'a' },
      { label: 'false', value: 'b' },
      { label: 'undefined', value: 'c' },
      { label: '报错', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: '返回 true。Array.isArray() 是判断一个值是否为数组的可靠方法。',
      thinking: '判断数组的方法：1) Array.isArray(arr) ✅ 推荐；2) arr instanceof Array ✅（跨 iframe 有问题）；3) Object.prototype.toString.call(arr) === "[object Array]" ✅；4) typeof arr ❌ 返回 "object"。',
      pitfalls: 'typeof [] 返回 "object"，不能用来判断数组。',
    },
  },
  {
    id: 49,
    category: 'javascript',
    difficulty: 'medium',
    type: 'single',
    question: '以下代码输出什么？',
    code: `const obj = {
  name: 'Alice',
  greet: function() {
    console.log(this.name);
  },
  greetArrow: () => {
    console.log(this.name);
  }
};
obj.greet();
obj.greetArrow();`,
    options: [
      { label: 'Alice Alice', value: 'a' },
      { label: 'Alice undefined', value: 'b' },
      { label: 'undefined undefined', value: 'c' },
      { label: 'Alice 报错', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: '输出 "Alice" 和 undefined（在模块/严格模式下）。箭头函数没有自己的 this，继承外层作用域的 this。',
      thinking: '普通函数的 this 是调用时决定的（obj.greet() → this = obj）。箭头函数的 this 是定义时决定的（外层作用域，在全局作用域下 this = window/module.exports）。',
      pitfalls: '对象的方法不应该用箭头函数定义，因为箭头函数的 this 不指向对象本身。',
    },
  },
  {
    id: 50,
    category: 'javascript',
    difficulty: 'hard',
    type: 'single',
    question: '以下代码输出什么？',
    code: `async function async1() {
  console.log('async1 start');
  await async2();
  console.log('async1 end');
}
async function async2() {
  console.log('async2');
}
console.log('script start');
setTimeout(() => console.log('setTimeout'), 0);
async1();
new Promise(resolve => {
  console.log('promise1');
  resolve();
}).then(() => console.log('promise2'));
console.log('script end');`,
    options: [
      { label: 'script start → async1 start → async2 → promise1 → script end → async1 end → promise2 → setTimeout', value: 'a' },
      { label: 'script start → async1 start → async2 → promise1 → script end → promise2 → async1 end → setTimeout', value: 'b' },
      { label: 'script start → async1 start → async2 → script end → promise1 → async1 end → promise2 → setTimeout', value: 'c' },
      { label: 'script start → async1 start → async2 → promise1 → script end → promise2 → setTimeout → async1 end', value: 'a2' },
    ],
    answer: 'a',
    explanation: {
      correct: 'script start → async1 start → async2 → promise1 → script end → async1 end → promise2 → setTimeout',
      thinking: '1) 同步：script start → async1 start → async2 → promise1 → script end；2) 微任务：async1 end → promise2；3) 宏任务：setTimeout。关键：await 后面的代码进入微任务队列，微任务按入队顺序执行。',
      pitfalls: '注意 await async2() 中 async2 是同步执行的，await 暂停的是后面的 console.log("async1 end")。',
    },
  },
  {
    id: 51,
    category: 'javascript',
    difficulty: 'easy',
    type: 'single',
    question: '以下哪个方法可以将类数组对象转为真正的数组？',
    options: [
      { label: 'Array.from()', value: 'a' },
      { label: 'Array.of()', value: 'b' },
      { label: 'Array.prototype.slice()', value: 'c' },
      { label: 'A 和 C 都可以', value: 'd' },
    ],
    answer: 'd',
    explanation: {
      correct: 'Array.from() 和 Array.prototype.slice.call() 都可以将类数组转为数组。',
      thinking: '类数组对象（如 arguments、NodeList、TypedArray）有 length 属性但没有数组方法。转换方法：1) Array.from(arrayLike)（ES6 推荐）；2) [...arrayLike]（展开运算符，需要可迭代）；3) Array.prototype.slice.call(arrayLike)。',
      pitfalls: '展开运算符要求对象实现了 Symbol.iterator，而 Array.from 只需要有 length 属性。',
    },
  },
  {
    id: 52,
    category: 'javascript',
    difficulty: 'medium',
    type: 'single',
    question: '以下代码输出什么？',
    code: `const obj = { a: 1, b: 2, c: 3 };
const { a, ...rest } = obj;
console.log(JSON.stringify(rest));`,
    options: [
      { label: '{"b":2,"c":3}', value: 'a' },
      { label: '{"a":1,"b":2,"c":3}', value: 'b' },
      { label: '{"a":1}', value: 'c' },
      { label: '{}', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: 'rest 是 { b: 2, c: 3 }。解构中的 ...rest 收集剩余的可枚举自有属性。',
      thinking: '对象 rest 语法（ES2018）：将未被解构的属性收集到新对象。注意：rest 只收集自有属性（不含原型链），且是浅拷贝。',
      pitfalls: '对象 rest 语法只在解构赋值中使用，不能用于普通对象字面量（ES2018 之前）。',
    },
  },
  {
    id: 53,
    category: 'javascript',
    difficulty: 'hard',
    type: 'single',
    question: '以下代码输出什么？',
    code: `let a = 3;
let b = new Number(3);
console.log(a == b);
console.log(a === b);`,
    options: [
      { label: 'true, true', value: 'a' },
      { label: 'true, false', value: 'b' },
      { label: 'false, true', value: 'c' },
      { label: 'false, false', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: '== 返回 true（值相等），=== 返回 false（类型不同）。',
      thinking: 'new Number(3) 创建的是 Number 包装对象，不是基本类型。== 会进行类型转换（对象转原始值），所以 a == b 为 true。=== 不做类型转换，number !== object，所以为 false。',
      pitfalls: '永远不要使用 new Number/String/Boolean() 创建包装对象，直接用字面量 3、"str"、true。',
    },
  },
  {
    id: 54,
    category: 'javascript',
    difficulty: 'easy',
    type: 'single',
    question: '以下代码输出什么？',
    code: `console.log([1, 2, 3].includes(2));
console.log([1, 2, 3].includes(4));`,
    options: [
      { label: 'true, false', value: 'a' },
      { label: 'false, true', value: 'b' },
      { label: 'true, true', value: 'c' },
      { label: '2, -1', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: 'includes() 返回布尔值，表示数组是否包含指定元素。',
      thinking: 'Array.prototype.includes(value, fromIndex)：从 fromIndex 开始搜索，使用 SameValueZero 比较（NaN === NaN 为 true）。与 indexOf 的区别：includes 对 NaN 有效，indexOf 对 NaN 无效。',
      pitfalls: 'includes 使用 SameValueZero 比较，+0 和 -0 被视为相等。',
    },
  },
  {
    id: 55,
    category: 'javascript',
    difficulty: 'medium',
    type: 'single',
    question: '以下代码输出什么？',
    code: `const p1 = Promise.resolve(1);
const p2 = Promise.reject(2);
const p3 = Promise.resolve(3);

Promise.all([p1, p2, p3])
  .then(console.log)
  .catch(console.log);`,
    options: [
      { label: '[1, 2, 3]', value: 'a' },
      { label: '2', value: 'b' },
      { label: '[1, 3]', value: 'c' },
      { label: '1', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: '输出 2。Promise.all 遇到第一个 reject 就立即进入 catch。',
      thinking: 'Promise.all 的特性：所有 Promise 都 resolve 才 resolve（返回结果数组）；任何一个 reject 就立即 reject（返回第一个 reject 的值）。如果想等待所有结果，用 Promise.allSettled()。',
      pitfalls: 'Promise.all 是"快速失败"模式。Promise.allSettled 是"全部完成"模式，不管成功失败都等待。',
    },
  },
  {
    id: 56,
    category: 'javascript',
    difficulty: 'hard',
    type: 'single',
    question: '以下代码输出什么？',
    code: `const arr = [1, 2, 3];
arr[10] = 11;
console.log(arr.length);
console.log(arr[5]);`,
    options: [
      { label: '4, undefined', value: 'a' },
      { label: '11, undefined', value: 'b' },
      { label: '11, 报错', value: 'c' },
      { label: '4, 报错', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'length 是 11，arr[5] 是 undefined。数组长度自动更新为最大索引 + 1。',
      thinking: 'JavaScript 数组的 length 属性是"最大索引 + 1"（不是元素个数）。arr[10] = 11 设置了索引 10，所以 length 变为 11。索引 4-9 的位置是"空槽"（empty），访问返回 undefined。',
      pitfalls: '稀疏数组（有空槽）可能导致意外行为。遍历时用 forEach 会跳过空槽，for...in 也会。',
    },
  },

  // ==================== TypeScript 补充 ====================
  {
    id: 57,
    category: 'typescript',
    difficulty: 'easy',
    type: 'single',
    question: 'TypeScript 中 never 类型表示什么？',
    options: [
      { label: '任何类型', value: 'a' },
      { label: '永远不会返回的值（如抛出异常的函数）', value: 'b' },
      { label: '空值', value: 'c' },
      { label: '未定义', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'never 表示永远不会发生的类型，通常用于总是抛出异常或无限循环的函数。',
      thinking: 'never 的使用场景：1) 总是抛出异常的函数：function throwError(): never { throw new Error(); }；2) 无限循环：function infiniteLoop(): never { while(true) {} }；3) 类型收窄的穷尽检查。',
      pitfalls: 'never 和 void 的区别：void 表示函数返回 undefined（正常返回），never 表示函数永远不会返回（异常或死循环）。',
    },
  },
  {
    id: 58,
    category: 'typescript',
    difficulty: 'medium',
    type: 'single',
    question: '以下代码中，哪个类型注解能让函数返回值类型自动推断？',
    code: `function add(a: number, b: number) {
  return a + b;
}
// result 的类型是什么？`,
    options: [
      { label: 'any', value: 'a' },
      { label: 'number', value: 'b' },
      { label: 'void', value: 'c' },
      { label: 'unknown', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'TypeScript 会自动推断返回值类型为 number。',
      thinking: 'TypeScript 的类型推断（Type Inference）非常强大：当参数类型确定时，表达式 a + b 的结果类型也能自动推断。通常不需要手动标注返回值类型，让 TypeScript 推断即可。',
      pitfalls: '虽然可以不写返回值类型，但在公共 API 中显式标注返回值类型是好习惯（文档性 + 防止意外改变）。',
    },
  },
  {
    id: 59,
    category: 'typescript',
    difficulty: 'medium',
    type: 'single',
    question: '以下代码有什么问题？',
    code: `interface User {
  name: string;
  age: number;
}
const user: User = {
  name: 'Alice',
};
console.log(user);`,
    options: [
      { label: '没有问题', value: 'a' },
      { label: '缺少 age 属性，类型错误', value: 'b' },
      { label: '运行时报错', value: 'c' },
      { label: 'name 应该是 number 类型', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: '缺少 age 属性，TypeScript 编译时报错：Property age is missing in type。',
      thinking: 'TypeScript 的"结构化类型"（Structural Typing）：对象必须包含接口定义的所有必需属性。如果 age 是可选的（age?: number），则可以省略。',
      pitfalls: '可选属性用 ? 标记：interface User { name: string; age?: number }。',
    },
  },
  {
    id: 60,
    category: 'typescript',
    difficulty: 'hard',
    type: 'single',
    question: '以下代码中 Result 的类型是什么？',
    code: `type Pick2<T, K extends keyof T> = {
  [P in K]: T[P];
};
type User = { name: string; age: number; email: string };
type Result = Pick2<User, 'name' | 'age'>;`,
    options: [
      { label: '{ name: string; age: number; email: string }', value: 'a' },
      { label: '{ name: string; age: number }', value: 'b' },
      { label: '{ name: string }', value: 'c' },
      { label: '报错', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'Result 是 { name: string; age: number }。这是 TypeScript 内置 Pick 工具类型的实现原理。',
      thinking: '映射类型（Mapped Types）语法：[P in K] 遍历联合类型 K 的每个成员，T[P] 获取 T 中对应属性的类型。keyof T 获取 T 的所有键组成的联合类型。',
      pitfalls: '这是 TypeScript 类型体操的基础，理解了映射类型就能理解大部分工具类型的实现。',
    },
  },
  {
    id: 61,
    category: 'typescript',
    difficulty: 'easy',
    type: 'single',
    question: '以下哪个不是 TypeScript 的基本类型？',
    options: [
      { label: 'string', value: 'a' },
      { label: 'number', value: 'b' },
      { label: 'boolean', value: 'c' },
      { label: 'float', value: 'd' },
    ],
    answer: 'd',
    explanation: {
      correct: 'TypeScript（和 JavaScript）没有 float 类型，所有数字都是 number（IEEE 754 双精度浮点数）。',
      thinking: 'TypeScript 的基本类型：string、number、boolean、null、undefined、symbol、bigint、void、never、any、unknown、enum、tuple。',
      pitfalls: 'TypeScript 没有 float/double/int 的区分，所有数字都是 number 类型。',
    },
  },
  {
    id: 62,
    category: 'typescript',
    difficulty: 'medium',
    type: 'single',
    question: '以下代码中，哪种方式是正确的泛型约束？',
    code: `// 要求 T 必须有 length 属性
function getLength<T>(obj: T): number {
  return obj.length; // 报错：T 上不存在 length
}`,
    options: [
      { label: 'function getLength<T extends { length: number }>(obj: T)', value: 'a' },
      { label: 'function getLength<T = { length: number }>(obj: T)', value: 'b' },
      { label: 'function getLength<T implements { length: number }>(obj: T)', value: 'c' },
      { label: 'function getLength<T satisfies { length: number }>(obj: T)', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: '使用 extends 关键字约束泛型：T extends { length: number } 表示 T 必须有 length 属性。',
      thinking: '泛型约束语法：`<T extends Constraint>`。Constraint 可以是接口、类型、联合类型等。extends 在这里是"约束"的意思，不是"继承"。',
      pitfalls: 'extends 用于泛型约束，implements 用于类实现接口。泛型参数不能用 implements。',
    },
  },
  {
    id: 63,
    category: 'typescript',
    difficulty: 'hard',
    type: 'single',
    question: '以下代码中 Result 的类型是什么？',
    code: `type Exclude2<T, U> = T extends U ? never : T;
type Result = Exclude2<'a' | 'b' | 'c', 'a'>;`,
    options: [
      { label: "'a' | 'b' | 'c'", value: 'a' },
      { label: "'b' | 'c'", value: 'b' },
      { label: 'never', value: 'c' },
      { label: "'a'", value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: "Result 是 'b' | 'c'。这是 TypeScript 内置 Exclude 工具类型的实现。",
      thinking: '条件类型分配律：当 T 是联合类型时，T extends U ? X : Y 会分配到每个成员。(a extends a ? never : a) | (b extends a ? never : b) | (c extends a ? never : c) = never | b | c = b | c。',
      pitfalls: '条件类型的分配律是 TypeScript 类型体操的核心概念，理解它就能理解 Exclude、Extract 等工具类型。',
    },
  },
  {
    id: 64,
    category: 'typescript',
    difficulty: 'easy',
    type: 'judge',
    question: 'TypeScript 的枚举（enum）在编译后会被移除。',
    options: [
      { label: '正确', value: 'true' },
      { label: '错误', value: 'false' },
    ],
    answer: 'false',
    explanation: {
      correct: '错误。普通 enum 编译后会生成 JavaScript 对象代码（运行时存在）。const enum 才会在编译时被内联移除。',
      thinking: 'TypeScript enum 的编译产物：1) 普通 enum → 生成双向映射对象；2) const enum → 内联值，不生成对象（性能更好但不能动态访问）。',
      pitfalls: '现代 TypeScript 推荐用 as const 对象代替 enum，更轻量且支持 Tree Shaking。',
    },
  },
  {
    id: 65,
    category: 'typescript',
    difficulty: 'medium',
    type: 'single',
    question: '以下代码中，Partial 的作用是什么？',
    code: `interface User {
  name: string;
  age: number;
  email: string;
}
type PartialUser = Partial<User>;`,
    options: [
      { label: '所有属性变为可选', value: 'a' },
      { label: '所有属性变为只读', value: 'b' },
      { label: '所有属性变为必填', value: 'c' },
      { label: '删除所有属性', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: 'Partial<T> 将 T 的所有属性变为可选（加 ? 修饰符）。',
      thinking: '常用工具类型：1) Partial<T> 所有属性可选；2) Required<T> 所有属性必填；3) Readonly<T> 所有属性只读；4) Pick<T, K> 选取部分属性；5) Omit<T, K> 排除部分属性；6) Record<K, V> 构造键值对类型。',
      pitfalls: 'Partial 是浅层的，嵌套对象的属性不会自动变为可选。需要深层 Partial 要自己实现递归版本。',
    },
  },

  // ==================== React 补充 ====================
  {
    id: 66,
    category: 'react',
    difficulty: 'easy',
    type: 'single',
    question: 'React 中，以下哪个不是 Hook 的规则？',
    options: [
      { label: '只能在函数组件中调用 Hook', value: 'a' },
      { label: '只能在函数顶部调用 Hook', value: 'b' },
      { label: 'Hook 可以放在条件语句中', value: 'c' },
      { label: '自定义 Hook 必须以 use 开头', value: 'd' },
    ],
    answer: 'c',
    explanation: {
      correct: 'Hook 不能放在条件语句、循环或嵌套函数中，必须在组件顶层调用。',
      thinking: 'Hook 规则：1) 只在函数组件或自定义 Hook 中调用；2) 只在顶层调用（不能在 if/for/嵌套函数中）；3) 自定义 Hook 以 use 开头。原因是 React 依赖调用顺序来匹配 Hook 的状态。',
      pitfalls: '如果需要条件判断，把条件放在 Hook 内部：if (condition) { useEffect(...) } 是错的，useEffect(() => { if (condition) {...} }) 是对的。',
    },
  },
  {
    id: 67,
    category: 'react',
    difficulty: 'medium',
    type: 'single',
    question: '以下代码有什么问题？',
    code: `function App() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(data => setData(data));
  }, []);

  return <div>{data.name}</div>;
}`,
    options: [
      { label: '没有问题', value: 'a' },
      { label: 'data 初始为 null，访问 data.name 会报错', value: 'b' },
      { label: 'useEffect 不能发请求', value: 'c' },
      { label: 'fetch 不返回 Promise', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'data 初始为 null，首次渲染时 data.name 会报 TypeError。',
      thinking: '修复方法：1) 条件渲染：data ? <div>{data.name}</div> : <Loading />；2) 可选链：data?.name；3) 初始值：useState({ name: "" })。',
      pitfalls: '异步数据的初始值问题很常见，务必处理 loading 状态。',
    },
  },
  {
    id: 68,
    category: 'react',
    difficulty: 'hard',
    type: 'single',
    question: '以下代码中，useRef 的作用是什么？',
    code: `function Stopwatch() {
  const [time, setTime] = useState(0);
  const timerRef = useRef(null);

  const start = () => {
    timerRef.current = setInterval(() => {
      setTime(t => t + 1);
    }, 1000);
  };

  const stop = () => {
    clearInterval(timerRef.current);
  };

  return <div>{time} <button onClick={start}>Start</button> <button onClick={stop}>Stop</button></div>;
}`,
    options: [
      { label: '存储定时器 ID，用于清除定时器', value: 'a' },
      { label: '存储时间值', value: 'b' },
      { label: '触发重新渲染', value: 'c' },
      { label: '没有实际作用', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: 'useRef 存储定时器 ID，修改 ref.current 不会触发重新渲染。',
      thinking: 'useRef 的用途：1) 保存 DOM 引用；2) 保存可变值（定时器 ID、上一次的值等）；3) 修改 ref.current 不触发 re-render（与 useState 的区别）。',
      pitfalls: '如果用 useState 存储定时器 ID，每次 setTimerId 都会触发不必要的 re-render。',
    },
  },
  {
    id: 69,
    category: 'react',
    difficulty: 'easy',
    type: 'single',
    question: 'React 中，Fragment (<></>) 的作用是什么？',
    options: [
      { label: '添加样式', value: 'a' },
      { label: '包裹多个元素但不产生额外 DOM 节点', value: 'b' },
      { label: '处理事件', value: 'c' },
      { label: '条件渲染', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'Fragment 允许返回多个元素而不在 DOM 中添加额外的包裹节点。',
      thinking: 'React 要求组件返回单个根元素。以前需要用 <div> 包裹，但这会产生多余的 DOM 节点。Fragment（<></> 或 <React.Fragment>）解决了这个问题。',
      pitfalls: '短语法 <></> 不支持 key，需要 key 时用 <React.Fragment key={...}>。',
    },
  },
  {
    id: 70,
    category: 'react',
    difficulty: 'medium',
    type: 'single',
    question: '以下代码中，哪个是正确的自定义 Hook？',
    options: [
      { label: 'function useCounter() { const [count, setCount] = useState(0); return { count, increment: () => setCount(c => c + 1) }; }', value: 'a' },
      { label: 'function Counter() { const [count, setCount] = useState(0); return <div>{count}</div>; }', value: 'b' },
      { label: 'const useCounter = () => <div>Counter</div>', value: 'c' },
      { label: 'class useCounter { state = { count: 0 } }', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: '自定义 Hook 是以 use 开头的函数，内部可以调用其他 Hook，返回任意值。',
      thinking: '自定义 Hook 的本质：提取可复用的状态逻辑。它不是组件（不返回 JSX），而是一个函数。调用自定义 Hook 时，每次调用都有独立的状态。',
      pitfalls: '自定义 Hook 必须以 use 开头，否则 React 的 ESLint 插件无法检查 Hook 规则。',
    },
  },
  {
    id: 71,
    category: 'react',
    difficulty: 'hard',
    type: 'single',
    question: 'React 18 的并发特性中，useTransition 的作用是什么？',
    options: [
      { label: '延迟渲染非紧急更新，保持 UI 响应', value: 'a' },
      { label: '强制同步渲染', value: 'b' },
      { label: '清除组件缓存', value: 'c' },
      { label: '管理路由跳转', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: 'useTransition 标记非紧急的状态更新，让 React 优先处理用户输入等紧急任务。',
      thinking: 'useTransition 返回 [isPending, startTransition]。startTransition 内的状态更新被标记为"低优先级"，可以被用户输入等高优先级更新打断。典型场景：搜索框输入时延迟更新搜索结果。',
      pitfalls: 'startTransition 内不能用于控制输入框的值（输入框需要立即响应）。',
    },
  },
  {
    id: 72,
    category: 'react',
    difficulty: 'medium',
    type: 'single',
    question: '以下代码输出什么？',
    code: `function Parent() {
  console.log('Parent render');
  const [count, setCount] = useState(0);
  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>+</button>
      <Child />
    </div>
  );
}
function Child() {
  console.log('Child render');
  return <div>Child</div>;
}`,
    options: [
      { label: 'Parent render → Child render（首次），点击后只有 Parent render', value: 'a' },
      { label: 'Parent render → Child render（每次都是）', value: 'b' },
      { label: '只有 Parent render', value: 'c' },
      { label: '只有 Child render', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: '每次 Parent re-render，Child 也会 re-render，因为没有用 React.memo。',
      thinking: 'React 的默认行为：父组件 re-render 时，所有子组件都会 re-render，即使 props 没变。使用 React.memo 包裹子组件可以避免不必要的 re-render。',
      pitfalls: '不是所有 re-render 都需要优化。只有当 re-render 导致明显性能问题时才需要 React.memo。',
    },
  },
  {
    id: 73,
    category: 'react',
    difficulty: 'easy',
    type: 'single',
    question: '以下哪个不是 React 18 的新特性？',
    options: [
      { label: 'Concurrent Mode（并发模式）', value: 'a' },
      { label: 'Automatic Batching（自动批处理）', value: 'b' },
      { label: 'useId Hook', value: 'c' },
      { label: 'componentWillMount 生命周期', value: 'd' },
    ],
    answer: 'd',
    explanation: {
      correct: 'componentWillMount 已在 React 16.3 被标记为不安全，React 18 中已移除。',
      thinking: 'React 18 新特性：1) createRoot API；2) 自动批处理（setState 不再需要手动批处理）；3) Suspense 改进；4) useId/useTransition/useDeferredValue/useSyncExternalStore/useInsertionEffect 等新 Hook。',
      pitfalls: 'componentWillMount → UNSAFE_componentWillMount → 移除。使用 constructor 或 componentDidMount 代替。',
    },
  },
  {
    id: 74,
    category: 'react',
    difficulty: 'medium',
    type: 'single',
    question: '以下代码中，useMemo 和 useCallback 的区别是什么？',
    code: `// 用法 A
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);

// 用法 B
const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);`,
    options: [
      { label: 'useMemo 缓存计算结果，useCallback 缓存函数引用', value: 'a' },
      { label: '两者完全相同', value: 'b' },
      { label: 'useMemo 用于异步，useCallback 用于同步', value: 'c' },
      { label: 'useCallback 是 useMemo 的别名', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: 'useMemo 缓存"值"（返回计算结果），useCallback 缓存"函数"（返回函数引用）。',
      thinking: 'useCallback(fn, deps) 等价于 useMemo(() => fn, deps)。useMemo 在依赖变化时重新计算并返回新的值；useCallback 在依赖变化时返回新的函数引用。',
      pitfalls: 'useCallback 通常配合 React.memo 使用，防止子组件因为函数引用变化而 re-render。',
    },
  },

  // ==================== Vue 补充 ====================
  {
    id: 75,
    category: 'vue',
    difficulty: 'easy',
    type: 'single',
    question: 'Vue 3 的 Composition API 相比 Options API 的优势是什么？',
    options: [
      { label: '代码更少', value: 'a' },
      { label: '相关逻辑聚合在一起，便于维护', value: 'b' },
      { label: '性能更好', value: 'c' },
      { label: '不需要学习新语法', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'Composition API 的核心优势是将同一功能的逻辑聚合在一起（而非按 data/methods/computed 分散）。',
      thinking: 'Options API 的问题：一个功能的逻辑分散在 data、methods、computed、watch 等选项中，组件越大越难维护。Composition API 用 setup() 把相关逻辑放在一起，还可以提取为可复用的组合式函数（Composables）。',
      pitfalls: 'Composition API 不是 Options API 的替代品，两者可以共存。小组件用 Options API 更直观。',
    },
  },
  {
    id: 76,
    category: 'vue',
    difficulty: 'medium',
    type: 'single',
    question: '以下代码中，toRef 的作用是什么？',
    code: `const state = reactive({ count: 0, name: 'Alice' });
const countRef = toRef(state, 'count');`,
    options: [
      { label: '创建 state 的深拷贝', value: 'a' },
      { label: '创建 state.count 的 ref 引用，修改会同步到原对象', value: 'b' },
      { label: '将 state 转为 ref', value: 'c' },
      { label: '创建一个只读的 ref', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'toRef 创建一个与原对象属性同步的 ref，修改 countRef.value 会同步修改 state.count。',
      thinking: 'toRef vs toRefs：toRef(obj, key) 创建单个属性的 ref；toRefs(obj) 创建所有属性的 ref 对象。两者都保持与原对象的响应式连接。',
      pitfalls: '解构 reactive 对象会丢失响应式，用 toRefs 可以保持：const { count } = toRefs(state)。',
    },
  },
  {
    id: 77,
    category: 'vue',
    difficulty: 'medium',
    type: 'single',
    question: '以下代码中，watchEffect 和 watch 的区别是什么？',
    code: `// 用法 A
watchEffect(() => {
  console.log(count.value);
});

// 用法 B
watch(count, (newVal, oldVal) => {
  console.log(newVal, oldVal);
});`,
    options: [
      { label: 'watchEffect 自动收集依赖，watch 需要手动指定', value: 'a' },
      { label: '两者完全相同', value: 'b' },
      { label: 'watchEffect 不能访问旧值', value: 'c' },
      { label: 'A 和 C 都正确', value: 'd' },
    ],
    answer: 'd',
    explanation: {
      correct: 'watchEffect 自动收集依赖且不能访问旧值；watch 手动指定监听源且可以访问新旧值。',
      thinking: '选择依据：1) 需要旧值 → watch；2) 需要懒执行（immediate: false）→ watch；3) 依赖多个响应式数据且不想逐一列出 → watchEffect。',
      pitfalls: 'watchEffect 立即执行（类似 immediate: true 的 watch），首次执行时没有旧值。',
    },
  },
  {
    id: 78,
    category: 'vue',
    difficulty: 'hard',
    type: 'single',
    question: 'Vue 3 的编译器对模板做了哪些优化？',
    options: [
      { label: '静态提升（Hoist Static）', value: 'a' },
      { label: '补丁标记（Patch Flags）', value: 'b' },
      { label: '树结构打平（Tree Flattening）', value: 'c' },
      { label: '以上都是', value: 'd' },
    ],
    answer: 'd',
    explanation: {
      correct: 'Vue 3 编译器的三大优化：静态提升、补丁标记、树结构打平。',
      thinking: '1) 静态提升：不变的节点只创建一次，复用；2) 补丁标记：标记动态绑定的类型（文本/属性/类等），diff 时只比较标记的部分；3) 树结构打平：将模板中的静态/动态节点分开，diff 时跳过静态节点。',
      pitfalls: '这些优化是 Vue 3 性能提升的主要原因，开发者不需要手动优化。',
    },
  },
  {
    id: 79,
    category: 'vue',
    difficulty: 'easy',
    type: 'single',
    question: 'Vue 中 nextTick 的作用是什么？',
    options: [
      { label: '延迟执行代码到下一个宏任务', value: 'a' },
      { label: '等待 DOM 更新完成后执行回调', value: 'b' },
      { label: '创建异步组件', value: 'c' },
      { label: '处理路由跳转', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'nextTick 返回一个 Promise，在 DOM 更新完成后执行。',
      thinking: 'Vue 的 DOM 更新是异步的：修改数据后 DOM 不会立即更新，而是放入队列中批量更新。nextTick 在 DOM 更新完成后执行，用于获取更新后的 DOM。',
      pitfalls: '在 Composition API 中，直接 await nextTick() 即可，不需要回调。',
    },
  },
  {
    id: 80,
    category: 'vue',
    difficulty: 'medium',
    type: 'single',
    question: '以下代码中，provide/inject 的作用是什么？',
    code: `// 祖先组件
provide('theme', 'dark');

// 后代组件（任意层级）
const theme = inject('theme', 'light');`,
    options: [
      { label: '父子组件通信', value: 'a' },
      { label: '跨层级组件通信，祖先向后代传递数据', value: 'b' },
      { label: '全局状态管理', value: 'c' },
      { label: '事件总线', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'provide/inject 实现跨层级组件通信，祖先 provide 的数据，任意后代都可以 inject 获取。',
      thinking: 'provide/inject vs props：props 只能逐层传递（prop drilling），provide/inject 可以跨越任意层级。inject 的第二个参数是默认值。',
      pitfalls: 'provide/inject 默认不是响应式的。要实现响应式，需要 provide 一个 ref 或 reactive 对象。',
    },
  },
  {
    id: 81,
    category: 'vue',
    difficulty: 'easy',
    type: 'single',
    question: 'Vue Router 中，router-link 和 router-view 的作用分别是什么？',
    options: [
      { label: 'router-link 用于导航，router-view 用于渲染匹配的组件', value: 'a' },
      { label: '两者功能相同', value: 'b' },
      { label: 'router-link 渲染组件，router-view 用于导航', value: 'c' },
      { label: 'router-link 处理状态，router-view 处理事件', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: 'router-link 生成导航链接（类似 <a> 标签），router-view 是路由出口（渲染匹配的组件）。',
      thinking: 'Vue Router 的核心概念：1) 路由配置（routes）定义路径和组件的映射；2) router-link 用于声明式导航；3) router-view 是组件渲染的位置；4) useRouter/useRoute 用于编程式导航。',
      pitfalls: 'router-link 默认渲染为 <a> 标签，可以用 tag 属性改为其他标签。',
    },
  },
  {
    id: 82,
    category: 'vue',
    difficulty: 'medium',
    type: 'single',
    question: 'Pinia 相比 Vuex 的优势是什么？',
    options: [
      { label: '更少的模板代码', value: 'a' },
      { label: '支持 TypeScript 类型推断', value: 'b' },
      { label: '模块化设计，不需要嵌套模块', value: 'c' },
      { label: '以上都是', value: 'd' },
    ],
    answer: 'd',
    explanation: {
      correct: 'Pinia 是 Vue 的下一代状态管理库，API 更简洁、支持 TypeScript、模块化设计。',
      thinking: 'Pinia vs Vuex：1) 去掉了 mutations，只有 state、getters、actions；2) 完美支持 TypeScript；3) 每个 store 独立，不需要嵌套模块；4) 体积更小；5) 支持 Composition API 风格。',
      pitfalls: 'Pinia 是 Vue 官方推荐的状态管理方案，Vuex 5 已被 Pinia 取代。',
    },
  },

  // ==================== 性能优化补充 ====================
  {
    id: 83,
    category: 'performance',
    difficulty: 'easy',
    type: 'single',
    question: '以下哪个不是减少首屏加载时间的有效方法？',
    options: [
      { label: '代码分割', value: 'a' },
      { label: '图片懒加载', value: 'b' },
      { label: '增大 JavaScript 文件', value: 'c' },
      { label: '使用 CDN', value: 'd' },
    ],
    answer: 'c',
    explanation: {
      correct: '增大 JavaScript 文件会增加下载时间，是性能优化的反面。',
      thinking: '首屏优化的核心原则：减少首屏需要的资源量。代码分割只加载当前路由的代码；图片懒加载延迟加载视口外的图片；CDN 让资源离用户更近。',
      pitfalls: '优化要基于数据，用 Lighthouse 等工具找到真正的瓶颈。',
    },
  },
  {
    id: 84,
    category: 'performance',
    difficulty: 'medium',
    type: 'single',
    question: '以下代码中，防抖和节流的区别是什么？',
    code: `// 防抖
const debouncedFn = debounce(fn, 300);

// 节流
const throttledFn = throttle(fn, 300);`,
    options: [
      { label: '防抖等停止操作后执行，节流固定频率执行', value: 'a' },
      { label: '两者完全相同', value: 'b' },
      { label: '防抖固定频率执行，节流等停止后执行', value: 'c' },
      { label: '防抖用于事件监听，节流用于定时器', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: '防抖（debounce）：等用户停止操作后才执行；节流（throttle）：固定时间间隔执行一次。',
      thinking: '使用场景：1) 防抖：搜索输入（等用户停 typing 再搜索）、窗口 resize；2) 节流：滚动事件（固定频率检测位置）、按钮防重复点击。',
      pitfalls: '防抖适合"只关心最终结果"的场景，节流适合"持续触发但需要控制频率"的场景。',
    },
  },
  {
    id: 85,
    category: 'performance',
    difficulty: 'medium',
    type: 'single',
    question: '什么是关键渲染路径（CRP）？',
    options: [
      { label: '从 HTML 到屏幕像素的完整过程', value: 'a' },
      { label: 'JavaScript 的执行路径', value: 'b' },
      { label: 'CSS 的加载顺序', value: 'c' },
      { label: '图片的渲染过程', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: '关键渲染路径是从 HTML/CSS 到屏幕像素的完整过程：HTML → DOM → CSSOM → Render Tree → Layout → Paint → Composite。',
      thinking: '优化 CRP 的策略：1) 减少关键资源数量（内联关键 CSS）；2) 减少关键资源大小（压缩）；3) 减少关键路径长度（预加载、减少往返次数）。',
      pitfalls: 'CSS 是渲染阻塞资源（CSSOM 未构建完不渲染），JS 是解析阻塞资源（执行时暂停 HTML 解析）。',
    },
  },
  {
    id: 86,
    category: 'performance',
    difficulty: 'hard',
    type: 'single',
    question: '以下哪种图片格式支持动画且压缩率最高？',
    options: [
      { label: 'GIF', value: 'a' },
      { label: 'PNG', value: 'b' },
      { label: 'WebP', value: 'c' },
      { label: 'AVIF', value: 'd' },
    ],
    answer: 'd',
    explanation: {
      correct: 'AVIF 压缩率最高，支持动画、透明通道，比 WebP 更高效。',
      thinking: '图片格式对比：1) JPEG 照片压缩好，不支持透明；2) PNG 无损，支持透明，体积大；3) GIF 动画，颜色有限（256色）；4) WebP 综合优秀，比 JPEG 小 25-35%；5) AVIF 最新，比 WebP 再小 20%。',
      pitfalls: 'AVIF 的浏览器支持不如 WebP 广泛，建议用 <picture> 标签做降级。',
    },
  },
  {
    id: 87,
    category: 'performance',
    difficulty: 'easy',
    type: 'single',
    question: '以下哪个不是 Web Vitals 核心指标？',
    options: [
      { label: 'LCP（最大内容绘制）', value: 'a' },
      { label: 'FID（首次输入延迟）', value: 'b' },
      { label: 'DOM 节点数量', value: 'c' },
      { label: 'CLS（累计布局偏移）', value: 'd' },
    ],
    answer: 'c',
    explanation: {
      correct: 'DOM 节点数量不是 Web Vitals 核心指标。核心指标是 LCP、FID（已被 INP 取代）、CLS。',
      thinking: 'Web Vitals 核心指标：1) LCP 衡量加载性能（< 2.5s）；2) INP 衡量交互响应（< 200ms，已取代 FID）；3) CLS 衡量视觉稳定性（< 0.1）。',
      pitfalls: 'FID 已被 INP（Interaction to Next Paint）取代，INP 更全面地衡量交互响应。',
    },
  },
  {
    id: 88,
    category: 'performance',
    difficulty: 'medium',
    type: 'single',
    question: 'HTTP 缓存中，强缓存和协商缓存的优先级是什么？',
    options: [
      { label: '强缓存优先于协商缓存', value: 'a' },
      { label: '协商缓存优先于强缓存', value: 'b' },
      { label: '两者同时生效', value: 'c' },
      { label: '取决于服务器配置', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: '强缓存优先。浏览器先检查强缓存（Cache-Control/Expires），未命中才发起协商缓存请求（ETag/Last-Modified）。',
      thinking: '缓存判断流程：1) 检查 Cache-Control max-age → 未过期直接用缓存（200 from cache）；2) 过期了 → 发请求带 If-None-Match/If-Modified-Since → 服务器返回 304 或 200。',
      pitfalls: 'Cache-Control: no-cache 不是"不缓存"，而是"每次都协商"。no-store 才是不缓存。',
    },
  },
  {
    id: 89,
    category: 'performance',
    difficulty: 'hard',
    type: 'single',
    question: '什么是长任务（Long Task）？如何优化？',
    options: [
      { label: '执行时间超过 50ms 的任务，会阻塞主线程', value: 'a' },
      { label: '超过 1 秒的网络请求', value: 'b' },
      { label: '超过 1MB 的资源文件', value: 'c' },
      { label: '超过 100 行的函数', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: '长任务是执行时间超过 50ms 的 JavaScript 任务，会阻塞主线程导致页面卡顿。',
      thinking: '优化长任务的方法：1) 时间切片（requestAnimationFrame 分帧执行）；2) scheduler.yield() 让出主线程；3) Web Worker 将计算移出主线程；4) requestIdleCallback 利用空闲时间。',
      pitfalls: '50ms 是阈值：超过 50ms 的任务可能导致用户可感知的卡顿（目标是每帧 16.67ms）。',
    },
  },

  // ==================== 工程化补充 ====================
  {
    id: 90,
    category: 'engineering',
    difficulty: 'easy',
    type: 'single',
    question: 'npm 和 yarn 的区别是什么？',
    options: [
      { label: '完全相同', value: 'a' },
      { label: 'yarn 安装速度更快，支持离线缓存', value: 'b' },
      { label: 'npm 功能更强大', value: 'c' },
      { label: 'yarn 只能用于 React 项目', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'yarn 最初为解决 npm 的性能问题而诞生，支持并行安装、离线缓存、锁文件。',
      thinking: '包管理器对比：1) npm 最老牌，v7+ 支持 workspaces；2) yarn 速度快，yarn.lock 保证一致性；3) pnpm 磁盘效率最高（硬链接），monorepo 支持好；4) bun 新兴，速度极快。',
      pitfalls: '不要混用不同包管理器的锁文件（package-lock.json vs yarn.lock vs pnpm-lock.yaml）。',
    },
  },
  {
    id: 91,
    category: 'engineering',
    difficulty: 'medium',
    type: 'single',
    question: 'ESLint 和 Prettier 的区别是什么？',
    options: [
      { label: 'ESLint 检查代码质量，Prettier 格式化代码风格', value: 'a' },
      { label: '两者功能完全相同', value: 'b' },
      { label: 'ESLint 格式化代码，Prettier 检查质量', value: 'c' },
      { label: 'ESLint 只用于 JavaScript，Prettier 支持所有语言', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: 'ESLint 负责代码质量（潜在错误、最佳实践），Prettier 负责代码格式（缩进、引号、分号）。',
      thinking: '分工：1) ESLint 检查逻辑问题（未使用变量、类型错误、安全隐患）；2) Prettier 统一代码风格（格式化）。两者配合使用，用 eslint-config-prettier 关闭 ESLint 中与 Prettier 冲突的规则。',
      pitfalls: 'ESLint 有些规则和 Prettier 冲突（如缩进、引号），需要用 eslint-config-prettier 关闭。',
    },
  },
  {
    id: 92,
    category: 'engineering',
    difficulty: 'medium',
    type: 'single',
    question: 'Vite 为什么比 Webpack 快？',
    options: [
      { label: '使用原生 ES Module，开发环境不需要打包', value: 'a' },
      { label: '使用更好的压缩算法', value: 'b' },
      { label: '支持更少的文件格式', value: 'c' },
      { label: '只支持 Vue 项目', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: 'Vite 开发环境利用浏览器原生 ES Module，不需要打包，按需编译，冷启动极快。',
      thinking: 'Vite 的优势：1) 开发环境：ESM + 按需编译（只编译当前请求的文件）；2) 生产环境：用 Rollup 打包（Tree Shaking 好）；3) 依赖预构建（esbuild 处理 node_modules）。',
      pitfalls: 'Vite 生产环境用 Rollup 打包，开发环境用 ESM，两套机制。',
    },
  },
  {
    id: 93,
    category: 'engineering',
    difficulty: 'hard',
    type: 'single',
    question: 'Monorepo 的优势是什么？',
    options: [
      { label: '多个项目共享代码和依赖', value: 'a' },
      { label: '提高构建速度', value: 'b' },
      { label: '减少磁盘占用', value: 'c' },
      { label: 'A 和 B 都是', value: 'd' },
    ],
    answer: 'd',
    explanation: {
      correct: 'Monorepo 让多个项目共享代码和依赖，统一版本管理，增量构建提高速度。',
      thinking: 'Monorepo 工具：1) Lerna（早期主流）；2) Nx（功能强大，增量构建）；3) Turborepo（Vercel 出品，简单高效）；4) pnpm workspaces（轻量级）。',
      pitfalls: 'Monorepo 适合中大型项目，小项目用 Multirepo（多仓库）更简单。',
    },
  },
  {
    id: 94,
    category: 'engineering',
    difficulty: 'easy',
    type: 'single',
    question: 'Docker 的核心概念是什么？',
    options: [
      { label: '容器化：将应用及其依赖打包成标准化单元', value: 'a' },
      { label: '虚拟机：模拟完整的操作系统', value: 'b' },
      { label: '版本控制：管理代码版本', value: 'c' },
      { label: '包管理：安装依赖', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: 'Docker 的核心是容器化，将应用和依赖打包成轻量级、可移植的容器。',
      thinking: 'Docker vs 虚拟机：Docker 容器共享宿主机内核，启动秒级，体积小；虚拟机有独立 OS，启动分钟级，体积大。Docker 核心概念：镜像（Image）、容器（Container）、仓库（Registry）。',
      pitfalls: 'Docker 不是虚拟机，容器之间共享宿主机内核，隔离性不如虚拟机。',
    },
  },
  {
    id: 95,
    category: 'engineering',
    difficulty: 'medium',
    type: 'single',
    question: '什么是 SSR（服务端渲染）？它解决了什么问题？',
    options: [
      { label: '在服务器上执行 JavaScript，返回完整的 HTML', value: 'a' },
      { label: '在浏览器中渲染页面', value: 'b' },
      { label: '预编译 CSS 文件', value: 'c' },
      { label: '压缩 JavaScript 代码', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: 'SSR 在服务器上执行 JS，返回完整的 HTML，解决了 SPA 首屏白屏和 SEO 问题。',
      thinking: 'SPA 的问题：1) 首屏白屏（需要下载、执行 JS 后才能渲染）；2) SEO 不友好（爬虫看到空 HTML）。SSR 解决：服务器直接返回渲染好的 HTML，首屏快，SEO 友好。',
      pitfalls: 'SSR 增加服务器压力，需要处理 hydration（客户端激活）问题。Next.js、Nuxt.js 是主流 SSR 框架。',
    },
  },
  {
    id: 96,
    category: 'engineering',
    difficulty: 'easy',
    type: 'single',
    question: 'TypeScript 相比 JavaScript 的主要优势是什么？',
    options: [
      { label: '运行速度更快', value: 'a' },
      { label: '静态类型检查，提前发现错误', value: 'b' },
      { label: '语法更简洁', value: 'c' },
      { label: '不需要编译', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'TypeScript 的核心优势是静态类型检查，在编译时发现类型错误，提高代码质量和开发体验。',
      thinking: 'TypeScript 的优势：1) 类型安全（编译时检查）；2) 更好的 IDE 支持（智能提示、重构）；3) 代码即文档（类型就是最好的文档）；4) 更容易重构。',
      pitfalls: 'TypeScript 不是万能的，增加了学习成本和开发时间。小项目/原型开发可能不需要。',
    },
  },
  {
    id: 97,
    category: 'engineering',
    difficulty: 'medium',
    type: 'single',
    question: 'Git 中的 cherry-pick 是什么？',
    options: [
      { label: '选择特定的提交应用到当前分支', value: 'a' },
      { label: '删除特定的提交', value: 'b' },
      { label: '合并两个分支', value: 'c' },
      { label: '创建新分支', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: 'cherry-pick 将指定的提交应用到当前分支，用于"挑选"特定的修改。',
      thinking: '使用场景：1) 把 bugfix 从开发分支应用到生产分支；2) 把某个功能的部分提交移到另一个分支。用法：git cherry-pick <commit-hash>。',
      pitfalls: 'cherry-pick 会创建新的提交 hash（内容相同但 hash 不同），可能导致重复合并。',
    },
  },
  {
    id: 98,
    category: 'engineering',
    difficulty: 'hard',
    type: 'single',
    question: '什么是 CDN 的回源（Origin）？',
    options: [
      { label: 'CDN 节点没有缓存时，向源站请求资源', value: 'a' },
      { label: '用户直接访问源站', value: 'b' },
      { label: 'CDN 节点之间的资源同步', value: 'c' },
      { label: '清除 CDN 缓存', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: '回源是 CDN 节点没有缓存或缓存过期时，向源站（原始服务器）请求资源的过程。',
      thinking: '减少回源的方法：1) 设置合理的缓存时间；2) 使用 stale-while-revalidate（过期后先返回旧内容，后台更新）；3) 预热缓存（提前将资源推送到 CDN）；4) 使用 Origin Shield（中间层缓存）。',
      pitfalls: '大量同时回源可能导致源站压力过大（缓存击穿），需要做回源合并。',
    },
  },
  {
    id: 99,
    category: 'engineering',
    difficulty: 'easy',
    type: 'single',
    question: '什么是 Semantic Versioning（语义化版本）？',
    options: [
      { label: '版本号格式为 major.minor.patch', value: 'a' },
      { label: '每次发布都递增版本号', value: 'b' },
      { label: '使用日期作为版本号', value: 'c' },
      { label: '随机生成版本号', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: '语义化版本格式：MAJOR.MINOR.PATCH。MAJOR 不兼容的改动，MINOR 向后兼容的新功能，PATCH 向后兼容的 Bug 修复。',
      thinking: '版本号规则：1) MAJOR：不兼容的 API 改动（breaking change）；2) MINOR：向后兼容的新功能；3) PATCH：向后兼容的 Bug 修复。前置版本号（0.x.x）表示开发阶段。',
      pitfalls: '^1.2.3 表示 >=1.2.3 <2.0.0（允许 minor 和 patch 更新），~1.2.3 表示 >=1.2.3 <1.3.0（只允许 patch 更新）。',
    },
  },
  {
    id: 100,
    category: 'engineering',
    difficulty: 'medium',
    type: 'single',
    question: '什么是 Webpack 的 code splitting？',
    options: [
      { label: '将代码拆分成多个 chunk，按需加载', value: 'a' },
      { label: '压缩代码减小体积', value: 'b' },
      { label: '将 CSS 从 JS 中分离', value: 'c' },
      { label: '删除未使用的代码', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: 'Code Splitting 将代码拆分成多个 chunk，实现按需加载，减少首屏加载时间。',
      thinking: 'Code Splitting 的方式：1) 入口起点（entry）手动分割；2) 动态导入（import()）按需加载；3) splitChunks 提取公共依赖（vendor、common）。',
      pitfalls: 'Code Splitting 不等于 Tree Shaking。Tree Shaking 删除未使用的代码，Code Splitting 拆分代码为多个文件。',
    },
  },
];

// 按分类统计题目数量
categories.forEach(cat => {
  cat.count = quizQuestions.filter(q => q.category === cat.key).length;
});
categories.forEach(cat => {
  cat.count = quizQuestions.filter(q => q.category === cat.key).length;
});
