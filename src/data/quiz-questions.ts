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
];

// 按分类统计题目数量
categories.forEach(cat => {
  cat.count = quizQuestions.filter(q => q.category === cat.key).length;
});
