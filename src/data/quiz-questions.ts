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

  // ==================== JavaScript 再补充 ====================
  {
    id: 101,
    category: 'javascript',
    difficulty: 'easy',
    type: 'single',
    question: '以下哪个方法可以在数组末尾添加元素？',
    options: [
      { label: 'push()', value: 'a' },
      { label: 'pop()', value: 'b' },
      { label: 'shift()', value: 'c' },
      { label: 'unshift()', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: 'push() 在数组末尾添加元素并返回新长度。',
      thinking: '数组方法：push 末尾添加、pop 末尾删除、unshift 头部添加、shift 头部删除。四个方法都会修改原数组。',
      pitfalls: 'pop/shift 返回被删除的元素，push/unshift 返回新长度。',
    },
  },
  {
    id: 102,
    category: 'javascript',
    difficulty: 'medium',
    type: 'single',
    question: '以下代码输出什么？',
    code: `const arr = [1, 2, 3];
const mapped = arr.map(x => x * 2).filter(x => x > 3);
console.log(mapped);`,
    options: [
      { label: '[2, 4, 6]', value: 'a' },
      { label: '[4, 6]', value: 'b' },
      { label: '[1, 2, 3]', value: 'c' },
      { label: '[3, 4, 5, 6]', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: '先 map 得到 [2, 4, 6]，再 filter 留下大于 3 的 [4, 6]。',
      thinking: '链式调用：map 返回新数组，filter 返回新数组。两次操作都不会修改原数组。这是函数式编程的常见模式。',
      pitfalls: '如果数组很大，链式调用会创建多个中间数组。性能敏感场景可以用 reduce 一次完成。',
    },
  },
  {
    id: 103,
    category: 'javascript',
    difficulty: 'hard',
    type: 'single',
    question: '以下代码输出什么？',
    code: `const obj = { a: 1, b: 2 };
Object.defineProperty(obj, 'c', {
  value: 3,
  enumerable: false,
});
console.log(Object.keys(obj));
console.log(obj.c);`,
    options: [
      { label: "['a', 'b', 'c'], 3", value: 'a' },
      { label: "['a', 'b'], 3", value: 'b' },
      { label: "['a', 'b'], undefined", value: 'c' },
      { label: "['a', 'b', 'c'], undefined", value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: "Object.keys 返回 ['a', 'b']（不包含不可枚举属性），obj.c 是 3。",
      thinking: 'Object.defineProperty 可以定义属性的特性：value（值）、writable（可写）、enumerable（可枚举）、configurable（可配置）。enumerable: false 使属性不会出现在 for...in 和 Object.keys 中。',
      pitfalls: 'Object.keys 只返回可枚举的自有属性。Object.getOwnPropertyNames 返回所有自有属性（包括不可枚举的）。',
    },
  },
  {
    id: 104,
    category: 'javascript',
    difficulty: 'medium',
    type: 'single',
    question: '以下代码输出什么？',
    code: `function foo(a, b = 2) {
  return a + b;
}
console.log(foo(3));
console.log(foo(3, undefined));
console.log(foo(3, null));`,
    options: [
      { label: '5, 5, 3', value: 'a' },
      { label: '5, 5, 5', value: 'b' },
      { label: 'NaN, NaN, NaN', value: 'c' },
      { label: '5, NaN, 3', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: 'foo(3) → 3+2=5；foo(3, undefined) → 3+2=5（undefined 触发默认值）；foo(3, null) → 3+0=3（null 不触发默认值，null 转为 0）。',
      thinking: '默认参数只在参数为 undefined 时生效。null 不会触发默认值。foo(3, null) 中 b = null，null + 3 = 3（null 转为数字 0）。',
      pitfalls: '只有 undefined 会触发默认值，null、0、"" 都不会。',
    },
  },
  {
    id: 105,
    category: 'javascript',
    difficulty: 'easy',
    type: 'judge',
    question: 'const 声明的对象，其属性不能被修改。',
    options: [
      { label: '正确', value: 'true' },
      { label: '错误', value: 'false' },
    ],
    answer: 'false',
    explanation: {
      correct: '错误。const 只保证变量引用不变（不能重新赋值），对象的属性可以修改。',
      thinking: 'const 的含义：1) 不能重新赋值（const a = 1; a = 2 报错）；2) 必须初始化（const a 报错）；3) 有暂时性死区。但对象的属性不受限制（const obj = {}; obj.x = 1 是合法的）。',
      pitfalls: '如果想冻结对象，使用 Object.freeze()。但 freeze 也只是浅冻结。',
    },
  },
  {
    id: 106,
    category: 'javascript',
    difficulty: 'medium',
    type: 'single',
    question: '以下代码输出什么？',
    code: `console.log(Promise.resolve(1));
console.log(Promise.resolve(2).then(console.log));
console.log(3);`,
    options: [
      { label: 'Promise, Promise, 3', value: 'a' },
      { label: '1, 2, 3', value: 'b' },
      { label: 'Promise, 2, 3', value: 'c' },
      { label: '1, Promise, 3', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: '第一个输出 Promise 对象（then 前），第二个输出 Promise 对象（then 返回新 Promise），第三个输出 3。2 在微任务中输出。',
      thinking: 'Promise.resolve(1) 返回一个已解决的 Promise 对象，直接 console.log 会打印 Promise 而不是值。.then(console.log) 在微任务中执行，同步代码先输出。',
      pitfalls: '想获取 Promise 的值，必须用 .then() 或 await。',
    },
  },
  {
    id: 107,
    category: 'javascript',
    difficulty: 'hard',
    type: 'single',
    question: '以下代码输出什么？',
    code: `let x = 1;
function foo(x) {
  x = 2;
}
foo(x);
console.log(x);`,
    options: [
      { label: '1', value: 'a' },
      { label: '2', value: 'b' },
      { label: 'undefined', value: 'c' },
      { label: '报错', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: '输出 1。函数参数 x 是局部变量，修改它不影响外部的 x。',
      thinking: 'JavaScript 的函数参数是"值传递"（基本类型传值，引用类型传引用地址）。函数内部的 x 是形参，与外部的 x 是两个不同的变量。',
      pitfalls: '如果是对象：function foo(obj) { obj.x = 2 }，则外部对象的 x 会被修改（因为传的是引用地址）。',
    },
  },
  {
    id: 108,
    category: 'javascript',
    difficulty: 'easy',
    type: 'single',
    question: '以下哪个是正确的箭头函数写法？',
    options: [
      { label: 'const fn = (x) => { return x * 2; }', value: 'a' },
      { label: 'const fn = x => { return x * 2; }', value: 'b' },
      { label: 'const fn = x => x * 2', value: 'c' },
      { label: '以上都是', value: 'd' },
    ],
    answer: 'd',
    explanation: {
      correct: '以上都是正确的箭头函数写法。',
      thinking: '箭头函数的简写：1) 只有一个参数时可以省略括号：x => ...；2) 函数体只有一条语句时可以省略大括号和 return：x => x * 2；3) 返回对象时需要加括号：x => ({ key: x })。',
      pitfalls: '返回对象字面量时必须加括号，否则大括号会被解析为函数体：x => { key: x } 是错的，x => ({ key: x }) 是对的。',
    },
  },
  {
    id: 109,
    category: 'javascript',
    difficulty: 'medium',
    type: 'single',
    question: '以下代码输出什么？',
    code: `const set = new Set([1, 2, 2, 3, 3, 3]);
console.log(set.size);`,
    options: [
      { label: '6', value: 'a' },
      { label: '3', value: 'b' },
      { label: '4', value: 'c' },
      { label: '报错', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: '输出 3。Set 自动去重，只保留唯一值。',
      thinking: 'Set 是 ES6 新增的数据结构，存储唯一值。去重使用 SameValueZero 算法（NaN === NaN 为 true）。常用场景：数组去重 [...new Set(arr)]。',
      pitfalls: 'Set 中对象是按引用比较的：new Set([{}, {}]).size === 2。',
    },
  },
  {
    id: 110,
    category: 'javascript',
    difficulty: 'hard',
    type: 'single',
    question: '以下代码输出什么？',
    code: `const obj = {
  value: 42,
  getValue: function() { return this.value; }
};
const { getValue } = obj;
console.log(getValue());`,
    options: [
      { label: '42', value: 'a' },
      { label: 'undefined', value: 'b' },
      { label: '报错', value: 'c' },
      { label: 'null', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: '输出 undefined。解构后 getValue 变成独立函数，this 不再指向 obj。',
      thinking: '解构赋值 const { getValue } = obj 等价于 const getValue = obj.getValue。调用 getValue() 时是独立调用，this 指向全局对象（严格模式为 undefined）。',
      pitfalls: '想保持 this 绑定，使用 getValue.call(obj) 或箭头函数（但箭头函数不能用作方法）。',
    },
  },
  {
    id: 111,
    category: 'javascript',
    difficulty: 'easy',
    type: 'single',
    question: 'typeof undefined 的结果是什么？',
    options: [
      { label: '"undefined"', value: 'a' },
      { label: '"object"', value: 'b' },
      { label: '"null"', value: 'c' },
      { label: '报错', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: 'typeof undefined 返回 "undefined"。',
      thinking: 'typeof 的返回值：number、string、boolean、undefined、object、function、symbol、bigint。typeof null === "object" 是 Bug。',
      pitfalls: '判断 undefined 用 === undefined，判断 null 用 === null。typeof 只在判断未声明变量时有用。',
    },
  },
  {
    id: 112,
    category: 'javascript',
    difficulty: 'medium',
    type: 'single',
    question: '以下代码输出什么？',
    code: `function* fibonacci() {
  let [a, b] = [0, 1];
  while (true) {
    yield a;
    [a, b] = [b, a + b];
  }
}
const fib = fibonacci();
console.log(fib.next().value);
console.log(fib.next().value);
console.log(fib.next().value);
console.log(fib.next().value);`,
    options: [
      { label: '0, 1, 1, 2', value: 'a' },
      { label: '1, 1, 2, 3', value: 'b' },
      { label: '0, 0, 0, 0', value: 'c' },
      { label: '报错：无限循环', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: '输出 0, 1, 1, 2。Generator 函数可以惰性生成无限序列。',
      thinking: 'Generator 的 yield 是惰性的：每次调用 next() 才执行到下一个 yield。while(true) 不会死循环，因为 yield 会暂停执行。斐波那契数列：0, 1, 1, 2, 3, 5, 8...',
      pitfalls: 'Generator 适合生成无限序列或大数据流，不需要一次性生成所有值。',
    },
  },
  {
    id: 113,
    category: 'javascript',
    difficulty: 'medium',
    type: 'single',
    question: '以下代码输出什么？',
    code: `console.log(!!0);
console.log(!!'');
console.log(!!null);
console.log(!!undefined);
console.log(!!NaN);
console.log(!!1);
console.log(!!'hello');`,
    options: [
      { label: 'false false false false false true true', value: 'a' },
      { label: 'true true true true true true true', value: 'b' },
      { label: 'false false false false false false false', value: 'c' },
      { label: '报错', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: '0、空字符串、null、undefined、NaN 是 falsy 值，其他都是 truthy。',
      thinking: 'JavaScript 的 falsy 值只有 7 个：false、0、-0、0n（BigInt）、""、null、undefined、NaN。其他所有值都是 truthy（包括空对象 {}、空数组 []）。',
      pitfalls: '空对象和空数组是 truthy！if ([]) {} 会执行。判断空数组用 arr.length === 0。',
    },
  },
  {
    id: 114,
    category: 'javascript',
    difficulty: 'hard',
    type: 'single',
    question: '以下代码输出什么？',
    code: 'class Animal {\n  constructor(name) {\n    this.name = name;\n  }\n  speak() {\n    return this.name + " makes a noise.";\n  }\n}\nclass Dog extends Animal {\n  speak() {\n    return this.name + " barks.";\n  }\n}\nconst d = new Dog("Mitzie");\nconsole.log(d.speak());\nconsole.log(Animal.prototype.speak.call(d));',
    options: [
      { label: 'Mitzie barks. Mitzie makes a noise.', value: 'a' },
      { label: 'Mitzie barks. Mitzie barks.', value: 'b' },
      { label: 'Mitzie makes a noise. Mitzie makes a noise.', value: 'c' },
      { label: '报错', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: 'd.speak() 调用 Dog 的 speak（多态），Animal.prototype.speak.call(d) 强制调用父类的 speak。',
      thinking: '方法重写（Override）：子类定义同名方法会覆盖父类。可以通过 父类.prototype.方法.call(this) 调用父类方法。',
      pitfalls: 'ES6 class 没有 super.method() 调用父类普通方法的语法（只能在 constructor 中用 super()）。',
    },
  },
  {
    id: 115,
    category: 'javascript',
    difficulty: 'easy',
    type: 'single',
    question: '以下哪个不是 JavaScript 的循环语句？',
    options: [
      { label: 'for', value: 'a' },
      { label: 'while', value: 'b' },
      { label: 'do...while', value: 'c' },
      { label: 'foreach', value: 'd' },
    ],
    answer: 'd',
    explanation: {
      correct: 'foreach 不是循环语句，是数组方法 forEach（注意大小写）。',
      thinking: 'JavaScript 的循环语句：for、while、do...while、for...in（遍历可枚举属性）、for...of（遍历可迭代对象）。forEach 是数组方法，不是语句。',
      pitfalls: 'forEach 不能 break/continue/return 提前退出。需要提前退出用 for...of 或 for 循环。',
    },
  },

  // ==================== 网络 & 浏览器 ====================
  {
    id: 116,
    category: 'engineering',
    difficulty: 'easy',
    type: 'single',
    question: 'HTTP 状态码 304 表示什么？',
    options: [
      { label: '请求成功', value: 'a' },
      { label: '重定向', value: 'b' },
      { label: '资源未修改，使用缓存', value: 'c' },
      { label: '服务器错误', value: 'd' },
    ],
    answer: 'c',
    explanation: {
      correct: '304 Not Modified 表示资源未修改，客户端可以使用缓存。',
      thinking: '常见状态码：200 成功、301 永久重定向、302 临时重定向、304 未修改、400 请求错误、401 未授权、403 禁止、404 未找到、500 服务器错误、502 网关错误、503 服务不可用。',
      pitfalls: '304 是协商缓存的结果，不是错误。',
    },
  },
  {
    id: 117,
    category: 'engineering',
    difficulty: 'medium',
    type: 'single',
    question: '以下哪个不是同源策略限制的操作？',
    options: [
      { label: '读取 Cookie', value: 'a' },
      { label: '发送 GET 请求', value: 'b' },
      { label: '读取 DOM', value: 'c' },
      { label: '读取 localStorage', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: '同源策略不限制发送请求（表单提交、script 标签加载等），只限制读取响应。',
      thinking: '同源策略限制：1) 读取 Cookie/localStorage；2) 读取 DOM；3) 发送 AJAX 请求后读取响应。不限制：1) 发送请求（但不能读响应）；2) script/img/link 标签加载资源。',
      pitfalls: 'CORS（跨域资源共享）是同源策略的例外，服务器设置 Access-Control-Allow-Origin 头部来允许跨域读取响应。',
    },
  },
  {
    id: 118,
    category: 'engineering',
    difficulty: 'medium',
    type: 'single',
    question: '以下哪个不是浏览器的存储方式？',
    options: [
      { label: 'Cookie', value: 'a' },
      { label: 'localStorage', value: 'b' },
      { label: 'sessionStorage', value: 'c' },
      { label: 'cacheStorage', value: 'd' },
    ],
    answer: 'd',
    explanation: {
      correct: 'cacheStorage 不是标准的浏览器存储 API（Cache API 是 Service Worker 的一部分，不是通用存储）。',
      thinking: '浏览器存储：1) Cookie（4KB，每次请求携带，有过期时间）；2) localStorage（5-10MB，永久存储，同源共享）；3) sessionStorage（5-10MB，会话级，标签页独立）；4) IndexedDB（大量数据，异步 API）。',
      pitfalls: 'localStorage 是同步 API，大量数据会阻塞主线程。大数据用 IndexedDB。',
    },
  },
  {
    id: 119,
    category: 'engineering',
    difficulty: 'hard',
    type: 'single',
    question: '什么是浏览器的渲染阻塞？以下哪种资源会阻塞渲染？',
    options: [
      { label: 'JavaScript 文件', value: 'a' },
      { label: 'CSS 文件', value: 'b' },
      { label: '图片', value: 'c' },
      { label: '字体文件', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'CSS 是渲染阻塞资源：CSSOM 未构建完成前，浏览器不会渲染页面。',
      thinking: '资源的阻塞特性：1) CSS 渲染阻塞（阻塞后续渲染）；2) JS 解析阻塞（阻塞后续 HTML 解析，除非 async/defer）；3) 图片不阻塞（异步加载）；4) 字体不阻塞渲染但可能导致 FOIT/FOUT。',
      pitfalls: 'JS 会阻塞 CSS 的下载（在 CSS 之后的 JS 会等待 CSS 下载完成）。所以 CSS 放头部，JS 放底部或用 async/defer。',
    },
  },
  {
    id: 120,
    category: 'engineering',
    difficulty: 'easy',
    type: 'single',
    question: '以下哪个不是 HTTP 请求方法？',
    options: [
      { label: 'GET', value: 'a' },
      { label: 'POST', value: 'b' },
      { label: 'FETCH', value: 'c' },
      { label: 'DELETE', value: 'd' },
    ],
    answer: 'c',
    explanation: {
      correct: 'FETCH 不是 HTTP 方法，是浏览器的 API。HTTP 方法有 GET、POST、PUT、DELETE、PATCH、HEAD、OPTIONS 等。',
      thinking: '常见 HTTP 方法：GET（获取）、POST（创建）、PUT（全量更新）、PATCH（部分更新）、DELETE（删除）、OPTIONS（预检请求）、HEAD（只获取头部）。',
      pitfalls: 'fetch() 是浏览器 API，不是 HTTP 方法。它默认使用 GET 方法。',
    },
  },
  {
    id: 121,
    category: 'engineering',
    difficulty: 'medium',
    type: 'single',
    question: '以下哪个不是跨域解决方案？',
    options: [
      { label: 'CORS', value: 'a' },
      { label: 'JSONP', value: 'b' },
      { label: 'Cookie', value: 'c' },
      { label: '代理服务器', value: 'd' },
    ],
    answer: 'c',
    explanation: {
      correct: 'Cookie 不是跨域解决方案，反而是同源策略限制的对象。',
      thinking: '跨域解决方案：1) CORS（服务端设置 Access-Control-Allow-Origin）；2) JSONP（利用 script 标签不受同源限制）；3) 代理服务器（同源服务器转发请求）；4) postMessage（跨窗口通信）；5) WebSocket。',
      pitfalls: 'CORS 是最标准的跨域方案。JSONP 只支持 GET 请求，有安全风险。',
    },
  },
  {
    id: 122,
    category: 'engineering',
    difficulty: 'hard',
    type: 'single',
    question: '什么是浏览器的事件循环（Event Loop）？',
    options: [
      { label: '一种循环遍历 DOM 的机制', value: 'a' },
      { label: '协调同步代码、微任务和宏任务执行的机制', value: 'b' },
      { label: '处理用户点击事件的机制', value: 'c' },
      { label: '管理内存回收的机制', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: '事件循环协调同步代码、微任务和宏任务的执行顺序。',
      thinking: '事件循环的执行顺序：1) 执行同步代码（调用栈）；2) 执行所有微任务（Promise.then、MutationObserver）；3) 执行一个宏任务（setTimeout、setInterval、I/O）；4) 重复步骤 2-3。',
      pitfalls: '微任务优先于宏任务。Promise.then 是微任务，setTimeout 是宏任务。',
    },
  },
  {
    id: 123,
    category: 'engineering',
    difficulty: 'easy',
    type: 'single',
    question: '什么是 WebSocket？',
    options: [
      { label: '一种 HTTP 请求方法', value: 'a' },
      { label: '全双工通信协议，支持服务器主动推送', value: 'b' },
      { label: '一种 CSS 布局方式', value: 'c' },
      { label: '一种 JavaScript 框架', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'WebSocket 是全双工通信协议，建立连接后服务器和客户端可以互相主动发送数据。',
      thinking: 'WebSocket vs HTTP：1) HTTP 是请求-响应模式（客户端发起）；2) WebSocket 是全双工（双方都可以主动发送）；3) WebSocket 适合实时应用（聊天、游戏、股票行情）。',
      pitfalls: 'WebSocket 需要服务器支持（ws:// 或 wss://），不是所有服务器都支持。',
    },
  },
  {
    id: 124,
    category: 'engineering',
    difficulty: 'medium',
    type: 'single',
    question: '以下哪个不是浏览器的缓存位置？',
    options: [
      { label: 'Service Worker Cache', value: 'a' },
      { label: 'Memory Cache', value: 'b' },
      { label: 'Disk Cache', value: 'c' },
      { label: 'CPU Cache', value: 'd' },
    ],
    answer: 'd',
    explanation: {
      correct: 'CPU Cache 是处理器缓存，不是浏览器缓存。',
      thinking: '浏览器缓存位置（优先级从高到低）：1) Service Worker Cache（可编程控制）；2) Memory Cache（内存，页面关闭即失效）；3) Disk Cache（硬盘，持久化）；4) Push Cache（HTTP/2，会话级）。',
      pitfalls: 'from memory cache 和 from disk cache 都是强缓存命中，区别在于存储位置。',
    },
  },
  {
    id: 125,
    category: 'engineering',
    difficulty: 'hard',
    type: 'single',
    question: '什么是 TLS 握手？',
    options: [
      { label: 'TCP 连接的建立过程', value: 'a' },
      { label: 'HTTPS 建立安全连接时的密钥协商过程', value: 'b' },
      { label: 'HTTP 请求的发送过程', value: 'c' },
      { label: 'DNS 解析过程', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'TLS 握手是 HTTPS 建立安全连接时，客户端和服务器协商加密算法和密钥的过程。',
      thinking: 'HTTPS = HTTP + TLS。TLS 握手过程：1) 客户端发送支持的加密算法列表；2) 服务器选择算法并发送证书；3) 客户端验证证书；4) 双方协商出对称密钥；5) 后续通信使用对称加密。',
      pitfalls: 'TLS 握手会增加 1-2 个 RTT 的延迟。TLS 1.3 优化为 1-RTT 甚至 0-RTT。',
    },
  },

  // ==================== CSS & HTML ====================
  {
    id: 126,
    category: 'performance',
    difficulty: 'easy',
    type: 'single',
    question: '以下哪个 CSS 选择器性能最好？',
    options: [
      { label: 'div .container .item', value: 'a' },
      { label: '.container .item', value: 'b' },
      { label: '#header .nav .item', value: 'c' },
      { label: '* .item', value: 'd' },
    ],
    answer: 'c',
    explanation: {
      correct: 'ID 选择器最快（哈希查找），类选择器次之，标签选择器再次，通配符最慢。',
      thinking: 'CSS 选择器性能（从快到慢）：1) ID 选择器 #id；2) 类选择器 .class；3) 标签选择器 div；4) 相邻兄弟 + 通用兄弟 ~ 子选择器 >；5) 后代选择器（空格）；6) 通配符 *；7) 属性选择器 [attr]。',
      pitfalls: '现代浏览器对选择器性能已经优化很多，通常不需要过度担心。避免过深的嵌套和通配符即可。',
    },
  },
  {
    id: 127,
    category: 'performance',
    difficulty: 'medium',
    type: 'single',
    question: '什么是 BFC（块级格式化上下文）？',
    options: [
      { label: '一种 CSS 布局模式', value: 'a' },
      { label: '一个独立的渲染区域，内部布局不影响外部', value: 'b' },
      { label: '一种 JavaScript 运行环境', value: 'c' },
      { label: '一种 HTML 语义化标签', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'BFC 是一个独立的渲染区域，内部元素的布局不会影响外部元素。',
      thinking: '触发 BFC 的条件：1) float 不为 none；2) position 为 absolute 或 fixed；3) overflow 不为 visible；4) display 为 flex/grid/inline-block/table 等。BFC 可以解决外边距重叠、清除浮动等问题。',
      pitfalls: 'BFC 不是 CSS 属性，是一种"渲染规则"。通过设置特定属性来触发。',
    },
  },
  {
    id: 128,
    category: 'performance',
    difficulty: 'medium',
    type: 'single',
    question: '以下哪种布局方式最适合等分布局？',
    options: [
      { label: 'float', value: 'a' },
      { label: 'position: absolute', value: 'b' },
      { label: 'Flexbox', value: 'c' },
      { label: 'display: inline-block', value: 'd' },
    ],
    answer: 'c',
    explanation: {
      correct: 'Flexbox 的 flex: 1 或 flex-grow: 1 可以轻松实现等分布局。',
      thinking: '布局方式选择：1) 简单两栏/三栏 → float 或 Flexbox；2) 等分布局 → Flexbox 或 Grid；3) 复杂网格 → Grid；4) 文本环绕 → float；5) 垂直居中 → Flexbox 或 Grid。',
      pitfalls: 'float 需要清除浮动，inline-block 有空白间隙，Flexbox/Grid 更现代更方便。',
    },
  },
  {
    id: 129,
    category: 'performance',
    difficulty: 'hard',
    type: 'single',
    question: '什么是 CSS 的层叠上下文（Stacking Context）？',
    options: [
      { label: 'CSS 的继承机制', value: 'a' },
      { label: '决定元素在 Z 轴上显示顺序的规则', value: 'b' },
      { label: 'CSS 的选择器优先级', value: 'c' },
      { label: 'CSS 的盒模型', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: '层叠上下文决定了元素在 Z 轴上的显示顺序（谁在上面，谁在下面）。',
      thinking: '层叠顺序（从低到高）：1) 层叠上下文的背景和边框；2) z-index 为负；3) 块级盒子；4) 浮动盒子；5) 行内盒子；6) z-index: 0/auto；7) z-index 为正。',
      pitfalls: 'position: relative/absolute + z-index 会创建新的层叠上下文。嵌套的层叠上下文在父级内部比较。',
    },
  },
  {
    id: 130,
    category: 'performance',
    difficulty: 'easy',
    type: 'single',
    question: '以下哪个不是 CSS 的盒模型属性？',
    options: [
      { label: 'margin', value: 'a' },
      { label: 'padding', value: 'b' },
      { label: 'border', value: 'c' },
      { label: 'shadow', value: 'd' },
    ],
    answer: 'd',
    explanation: {
      correct: 'shadow 不是盒模型属性。盒模型由 content、padding、border、margin 组成。',
      thinking: 'CSS 盒模型：1) content（内容区）；2) padding（内边距）；3) border（边框）；4) margin（外边距）。box-sizing: border-box 让 width/height 包含 padding 和 border。',
      pitfalls: 'box-sizing: border-box 是现代开发的推荐设置，避免了 padding 和 border 导致的尺寸溢出问题。',
    },
  },
  {
    id: 131,
    category: 'performance',
    difficulty: 'medium',
    type: 'single',
    question: '以下哪种方式可以实现 CSS 垂直居中？',
    options: [
      { label: 'display: flex; align-items: center;', value: 'a' },
      { label: 'display: grid; place-items: center;', value: 'b' },
      { label: 'position: absolute; top: 50%; transform: translateY(-50%);', value: 'c' },
      { label: '以上都可以', value: 'd' },
    ],
    answer: 'd',
    explanation: {
      correct: '以上三种方式都可以实现垂直居中。',
      thinking: '垂直居中方案：1) Flexbox（最推荐）；2) Grid（最简洁）；3) position + transform（兼容性好）；4) line-height 等于 height（单行文本）；5) table-cell + vertical-align（老方案）。',
      pitfalls: 'Flexbox 和 Grid 需要父元素设置，position 方案需要元素脱离文档流。',
    },
  },
  {
    id: 132,
    category: 'performance',
    difficulty: 'hard',
    type: 'single',
    question: '什么是 CSS 的 contain 属性？',
    options: [
      { label: '限制元素内容溢出', value: 'a' },
      { label: '告诉浏览器元素的边界，优化渲染性能', value: 'b' },
      { label: '设置元素的最大宽度', value: 'c' },
      { label: '控制元素的层叠顺序', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'contain 属性告诉浏览器元素的渲染边界，可以优化渲染性能。',
      thinking: 'contain 的值：1) layout（布局隔离）；2) style（样式隔离）；3) paint（绘制隔离，内容不超出边界）；4) size（尺寸隔离，子元素不影响尺寸）；5) strict（以上全部）；6) content（layout + style + paint）。',
      pitfalls: 'contain: strict 要求元素的尺寸不依赖子元素，否则可能导致内容被裁剪。',
    },
  },
  {
    id: 133,
    category: 'performance',
    difficulty: 'easy',
    type: 'single',
    question: '以下哪个不是 HTML5 的语义化标签？',
    options: [
      { label: 'header', value: 'a' },
      { label: 'footer', value: 'b' },
      { label: 'div', value: 'c' },
      { label: 'article', value: 'd' },
    ],
    answer: 'c',
    explanation: {
      correct: 'div 不是语义化标签，它是无意义的容器。语义化标签有 header、footer、article、section、nav、main、aside 等。',
      thinking: '语义化标签的价值：1) 代码可读性（开发者理解）；2) SEO（搜索引擎理解）；3) 无障碍（屏幕阅读器理解）。',
      pitfalls: 'div 仍然有用（作为样式容器），但在有语义标签可选时应优先使用语义标签。',
    },
  },
  {
    id: 134,
    category: 'performance',
    difficulty: 'medium',
    type: 'single',
    question: '什么是 Web Components？',
    options: [
      { label: '一种 CSS 框架', value: 'a' },
      { label: '浏览器原生的组件化方案', value: 'b' },
      { label: '一种 JavaScript 库', value: 'c' },
      { label: '一种 HTML 标签', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'Web Components 是浏览器原生的组件化方案，包括 Custom Elements、Shadow DOM、HTML Templates。',
      thinking: 'Web Components 三大技术：1) Custom Elements（自定义元素）；2) Shadow DOM（影子 DOM，样式隔离）；3) HTML Templates（模板）。优势：框架无关、原生支持、样式隔离。',
      pitfalls: 'Web Components 的 API 比较底层，实际开发中通常使用框架（React/Vue）的组件系统。',
    },
  },
  {
    id: 135,
    category: 'performance',
    difficulty: 'hard',
    type: 'single',
    question: '什么是浏览器的合成层（Composite Layer）？',
    options: [
      { label: 'CSS 的继承层级', value: 'a' },
      { label: 'GPU 加速的独立图层，可以独立于主线程更新', value: 'b' },
      { label: 'HTML 的嵌套层级', value: 'c' },
      { label: 'JavaScript 的作用域层级', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: '合成层是 GPU 加速的独立图层，transform/opacity 动画由 GPU 处理，不阻塞主线程。',
      thinking: '提升到合成层的方法：1) will-change: transform/opacity；2) transform: translateZ(0)；3) backface-visibility: hidden；4) video/canvas/iframe 等元素。合成层的优势：独立重绘、GPU 加速、不影响其他层。',
      pitfalls: '每个合成层都需要额外的内存。不要滥用 will-change，只在需要动画的元素上使用。',
    },
  },

  // ==================== 设计模式 & 编程范式 ====================
  {
    id: 136,
    category: 'javascript',
    difficulty: 'medium',
    type: 'single',
    question: '以下代码体现了什么设计模式？',
    code: `class EventBus {
  constructor() {
    this.events = {};
  }
  on(event, callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  }
  emit(event, ...args) {
    if (this.events[event]) {
      this.events[event].forEach(cb => cb(...args));
    }
  }
}`,
    options: [
      { label: '单例模式', value: 'a' },
      { label: '观察者模式（发布-订阅模式）', value: 'b' },
      { label: '工厂模式', value: 'c' },
      { label: '策略模式', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: '这是发布-订阅模式（Event Bus），通过 on 订阅事件，通过 emit 触发事件。',
      thinking: '常见设计模式：1) 单例（一个实例）；2) 工厂（创建对象）；3) 观察者/发布-订阅（事件通知）；4) 策略（算法族）；5) 装饰器（增强功能）；6) 代理（控制访问）。',
      pitfalls: '发布-订阅和观察者略有不同：发布-订阅有事件中心（EventBus），观察者直接通知。',
    },
  },
  {
    id: 137,
    category: 'javascript',
    difficulty: 'medium',
    type: 'single',
    question: '什么是函数式编程？以下哪个是函数式编程的特性？',
    options: [
      { label: '可变状态', value: 'a' },
      { label: '纯函数（无副作用）', value: 'b' },
      { label: '面向对象继承', value: 'c' },
      { label: '全局变量', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: '纯函数（相同输入总是相同输出，无副作用）是函数式编程的核心特性。',
      thinking: '函数式编程特性：1) 纯函数；2) 不可变数据；3) 函数组合；4) 高阶函数；5) 声明式（描述"做什么"而非"怎么做"）。React Hooks 就是函数式编程的体现。',
      pitfalls: '函数式编程不是"用函数写代码"那么简单，核心是数据不可变和纯函数。',
    },
  },
  {
    id: 138,
    category: 'javascript',
    difficulty: 'hard',
    type: 'single',
    question: '以下代码实现了什么模式？',
    code: `function memoize(fn) {
  const cache = new Map();
  return function(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}`,
    options: [
      { label: '防抖（debounce）', value: 'a' },
      { label: '节流（throttle）', value: 'b' },
      { label: '记忆化（memoization）', value: 'c' },
      { label: '柯里化（currying）', value: 'd' },
    ],
    answer: 'c',
    explanation: {
      correct: '这是记忆化模式，缓存函数的计算结果，相同参数直接返回缓存值。',
      thinking: '记忆化 vs 缓存：记忆化是函数级别的优化，自动缓存相同输入的输出。React 的 useMemo 就是记忆化的应用。适合纯函数和计算密集型函数。',
      pitfalls: '记忆化会增加内存消耗。如果参数是对象，JSON.stringify 可能不准确（属性顺序、循环引用）。',
    },
  },
  {
    id: 139,
    category: 'javascript',
    difficulty: 'easy',
    type: 'single',
    question: '什么是闭包（Closure）？',
    options: [
      { label: '一种循环结构', value: 'a' },
      { label: '函数能够访问其定义时的作用域变量', value: 'b' },
      { label: '一种对象创建方式', value: 'c' },
      { label: '一种错误处理机制', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: '闭包是函数能够"记住"并访问其定义时所在的词法作用域，即使函数在该作用域之外执行。',
      thinking: '闭包的用途：1) 数据私有（模块模式）；2) 函数工厂；3) 柯里化；4) 事件回调中保持状态。经典例子：for 循环中的闭包问题。',
      pitfalls: '闭包会导致变量不被垃圾回收（内存泄漏），不需要时应及时解除引用。',
    },
  },
  {
    id: 140,
    category: 'javascript',
    difficulty: 'medium',
    type: 'single',
    question: '什么是柯里化（Currying）？',
    options: [
      { label: '一种数组遍历方法', value: 'a' },
      { label: '将多参数函数转换为一系列单参数函数', value: 'b' },
      { label: '一种对象克隆方式', value: 'c' },
      { label: '一种异步处理模式', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: '柯里化将 f(a, b, c) 转换为 f(a)(b)(c) 的形式。',
      thinking: '柯里化的用途：1) 参数复用；2) 延迟执行；3) 函数组合。例如：const add = a => b => a + b; const add5 = add(5); add5(3) === 8。',
      pitfalls: '柯里化和偏函数（Partial Application）不同：柯里化每次只接受一个参数，偏函数可以一次接受多个。',
    },
  },
  {
    id: 141,
    category: 'javascript',
    difficulty: 'hard',
    type: 'single',
    question: '以下代码实现了什么？',
    code: `class Singleton {
  static instance = null;
  static getInstance() {
    if (!Singleton.instance) {
      Singleton.instance = new Singleton();
    }
    return Singleton.instance;
  }
}`,
    options: [
      { label: '工厂模式', value: 'a' },
      { label: '单例模式', value: 'b' },
      { label: '观察者模式', value: 'c' },
      { label: '策略模式', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: '这是单例模式，确保一个类只有一个实例。',
      thinking: '单例模式的用途：1) 全局状态管理（Redux Store）；2) 数据库连接；3) 配置对象；4) 日志记录器。JavaScript 中更简单的单例：直接导出一个对象实例。',
      pitfalls: '单例模式可能导致全局状态耦合，不利于测试。现代开发中依赖注入（DI）更受欢迎。',
    },
  },
  {
    id: 142,
    category: 'javascript',
    difficulty: 'medium',
    type: 'single',
    question: '什么是 Proxy？以下代码的作用是什么？',
    code: `const handler = {
  get(target, prop) {
    console.log('读取:', prop);
    return target[prop];
  },
  set(target, prop, value) {
    console.log('设置:', prop, value);
    target[prop] = value;
    return true;
  }
};
const obj = new Proxy({}, handler);`,
    options: [
      { label: '创建一个只读对象', value: 'a' },
      { label: '拦截对象的读取和设置操作', value: 'b' },
      { label: '创建一个冻结对象', value: 'c' },
      { label: '创建一个密封对象', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'Proxy 可以拦截对象的基本操作（读取、设置、删除等），实现自定义行为。',
      thinking: 'Proxy 的用途：1) 响应式系统（Vue 3）；2) 数据验证；3) 访问控制；4) 日志记录；5) 缓存。Proxy 比 Object.defineProperty 更强大，可以拦截更多操作。',
      pitfalls: 'Proxy 的性能开销比直接访问属性略大。某些操作（如 === 比较）可能失效。',
    },
  },

  // ==================== 实际场景题 ====================
  {
    id: 143,
    category: 'react',
    difficulty: 'medium',
    type: 'single',
    question: '以下哪种方式最适合在 React 中处理表单？',
    options: [
      { label: '每个输入框单独管理状态（useState）', value: 'a' },
      { label: '使用一个对象管理所有表单状态', value: 'b' },
      { label: '使用 useRef 直接操作 DOM', value: 'c' },
      { label: '使用全局状态管理表单', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: '使用一个对象管理表单状态是常见做法，也可以用 useReducer 管理复杂表单。',
      thinking: '表单处理方案：1) useState + 对象（简单表单）；2) useReducer（复杂表单、多字段联动）；3) react-hook-form / formik（第三方库，性能好）；4) 受控 vs 非受控组件。',
      pitfalls: '每个字段单独 useState 会导致大量状态变量，维护困难。复杂表单推荐 useReducer 或第三方库。',
    },
  },
  {
    id: 144,
    category: 'react',
    difficulty: 'hard',
    type: 'single',
    question: '以下代码中，如何优化大列表的渲染性能？',
    code: `function List({ items }) {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}`,
    options: [
      { label: '使用 React.memo 包裹列表项组件', value: 'a' },
      { label: '使用虚拟列表（react-window）', value: 'b' },
      { label: '使用 useDeferredValue 延迟渲染', value: 'c' },
      { label: 'B 是最佳方案', value: 'd' },
    ],
    answer: 'd',
    explanation: {
      correct: '虚拟列表是大列表（1000+ 项）的最佳方案，只渲染可见区域的元素。',
      thinking: '大列表优化：1) 虚拟列表（只渲染可见区域，推荐 react-window / react-virtualized）；2) React.memo 包裹列表项（避免不必要 re-render）；3) 分页/无限滚动（减少单次渲染量）。',
      pitfalls: 'React.memo 只能减少 re-render，不能减少首次渲染的 DOM 数量。虚拟列表才是根本解决方案。',
    },
  },
  {
    id: 145,
    category: 'vue',
    difficulty: 'medium',
    type: 'single',
    question: 'Vue 中如何实现组件的按需加载？',
    options: [
      { label: '使用 defineAsyncComponent', value: 'a' },
      { label: '使用 import() 动态导入', value: 'b' },
      { label: '使用 Suspense 组件', value: 'c' },
      { label: 'A 和 B 都是', value: 'd' },
    ],
    answer: 'd',
    explanation: {
      correct: 'defineAsyncComponent 和 import() 都可以实现组件的按需加载。',
      thinking: 'Vue 异步组件：1) defineAsyncComponent 动态导入；2) 路由懒加载 component: () => import()；3) 配合 Suspense 显示加载状态。',
      pitfalls: '异步组件需要 Suspense 或手动处理加载/错误状态。',
    },
  },
  {
    id: 146,
    category: 'vue',
    difficulty: 'hard',
    type: 'single',
    question: 'Vue 中如何处理组件通信？',
    options: [
      { label: 'props / emit（父子）', value: 'a' },
      { label: 'provide / inject（跨层级）', value: 'b' },
      { label: 'Pinia（全局状态）', value: 'c' },
      { label: '以上都是', value: 'd' },
    ],
    answer: 'd',
    explanation: {
      correct: 'Vue 有多种组件通信方式，根据场景选择。',
      thinking: 'Vue 通信方式：1) props/emit（父子）；2) provide/inject（跨层级）；3) Pinia/Vuex（全局状态）；4) mitt/EventBus（事件总线，不推荐）；5) ref/模板引用（父访问子）；6) attrs/listeners（透传）。',
      pitfalls: '不要滥用全局状态管理。简单的父子通信用 props/emit，跨层级用 provide/inject。',
    },
  },
  {
    id: 147,
    category: 'performance',
    difficulty: 'medium',
    type: 'single',
    question: '如何优化移动端的页面性能？',
    options: [
      { label: '减少 JavaScript 体积', value: 'a' },
      { label: '使用响应式图片', value: 'b' },
      { label: '避免 300ms 点击延迟', value: 'c' },
      { label: '以上都是', value: 'd' },
    ],
    answer: 'd',
    explanation: {
      correct: '移动端优化需要从多个维度入手。',
      thinking: '移动端特有优化：1) 响应式图片（适配不同屏幕）；2) 避免 300ms 点击延迟（使用 touch 事件或 FastClick）；3) 减少重排（移动端 CPU 弱）；4) 使用 will-change 提示浏览器；5) 避免使用 100vh（移动端地址栏问题）。',
      pitfalls: '移动端网络环境差，更需要关注资源大小和加载策略。',
    },
  },
  {
    id: 148,
    category: 'performance',
    difficulty: 'hard',
    type: 'single',
    question: '什么是骨架屏（Skeleton Screen）？',
    options: [
      { label: '一种 CSS 动画效果', value: 'a' },
      { label: '页面加载时显示的占位 UI，减少感知等待时间', value: 'b' },
      { label: '一种错误页面设计', value: 'c' },
      { label: '一种响应式布局方案', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: '骨架屏在页面加载时显示内容的灰色占位图，让用户感知到"内容即将出现"。',
      thinking: '骨架屏 vs Loading：1) Loading 只显示加载状态，用户不知道内容结构；2) 骨架屏展示内容布局，减少感知等待时间；3) 骨架屏对 SEO 更友好（有内容结构）。',
      pitfalls: '骨架屏不应该太复杂，简单的内容占位即可。React 可用 react-loading-skeleton 库。',
    },
  },
  {
    id: 149,
    category: 'engineering',
    difficulty: 'medium',
    type: 'single',
    question: '什么是微前端（Micro Frontends）？',
    options: [
      { label: '一种前端框架', value: 'a' },
      { label: '将前端应用拆分为多个独立子应用的架构', value: 'b' },
      { label: '一种 CSS 方法论', value: 'c' },
      { label: '一种测试策略', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: '微前端将大型前端应用拆分为多个独立开发、独立部署的子应用。',
      thinking: '微前端方案：1) qiankun（基于 single-spa）；2) Module Federation（Webpack 5）；3) Web Components；4) iframe。适用场景：大型团队、多技术栈、独立部署。',
      pitfalls: '微前端增加了架构复杂度，小团队/小项目不需要。子应用之间的通信和状态共享是难点。',
    },
  },
  {
    id: 150,
    category: 'engineering',
    difficulty: 'hard',
    type: 'single',
    question: '什么是 Webpack 的 Module Federation？',
    options: [
      { label: '一种代码压缩算法', value: 'a' },
      { label: '允许不同应用共享模块的 Webpack 5 特性', value: 'b' },
      { label: '一种 CSS 预处理器', value: 'c' },
      { label: '一种测试框架', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'Module Federation 允许不同构建的应用在运行时共享模块，是微前端的重要方案。',
      thinking: 'Module Federation 的用途：1) 多个应用共享公共依赖（如 React）；2) 微前端架构（独立部署的子应用）；3) 运行时动态加载远程模块。',
      pitfalls: 'Module Federation 需要 Webpack 5+，各应用需要协调共享依赖的版本。',
    },
  },

  // ==================== JavaScript 深入 ====================
  {
    id: 151,
    category: 'javascript',
    difficulty: 'medium',
    type: 'single',
    question: '以下代码输出什么？',
    code: `const arr = [1, 2, 3];
arr[Symbol.iterator] = function* () {
  yield* [10, 20, 30];
};
console.log([...arr]);`,
    options: [
      { label: '[1, 2, 3]', value: 'a' },
      { label: '[10, 20, 30]', value: 'b' },
      { label: '[1, 2, 3, 10, 20, 30]', value: 'c' },
      { label: '报错', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: '输出 [10, 20, 30]。自定义 Symbol.iterator 覆盖了默认的数组迭代行为。',
      thinking: 'Symbol.iterator 是可迭代协议的核心。数组默认的迭代器是遍历自身元素，但可以被覆盖。展开运算符 [...arr] 会调用 arr[Symbol.iterator]()。',
      pitfalls: '自定义迭代器可以实现任意遍历逻辑，如倒序、过滤、无限序列等。',
    },
  },
  {
    id: 152,
    category: 'javascript',
    difficulty: 'hard',
    type: 'single',
    question: '以下代码输出什么？',
    code: `function Foo() {
  Foo.a = function() { console.log(1); };
  this.a = function() { console.log(2); };
}
Foo.prototype.a = function() { console.log(3); };
Foo.a = function() { console.log(4); };

Foo.a();
const obj = new Foo();
obj.a();
Foo.a();`,
    options: [
      { label: '4 2 1', value: 'a' },
      { label: '4 3 1', value: 'b' },
      { label: '4 2 4', value: 'c' },
      { label: '1 2 3', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: '输出 4 2 1。',
      thinking: '1) Foo.a() → 输出 4（静态方法）；2) new Foo() 执行：Foo.a 被重写为输出 1，this.a 被设置为输出 2；3) obj.a() → 输出 2（实例方法优先于原型方法）；4) Foo.a() → 输出 1（已被构造函数重写）。',
      pitfalls: '构造函数内部 this.a 设置的是实例属性，Foo.a 设置的是静态属性。实例属性优先于原型属性。',
    },
  },
  {
    id: 153,
    category: 'javascript',
    difficulty: 'easy',
    type: 'single',
    question: '以下哪个方法可以将 JSON 字符串解析为对象？',
    options: [
      { label: 'JSON.stringify()', value: 'a' },
      { label: 'JSON.parse()', value: 'b' },
      { label: 'eval()', value: 'c' },
      { label: 'Object.fromEntries()', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'JSON.parse() 将 JSON 字符串解析为 JavaScript 对象。',
      thinking: 'JSON 方法：JSON.parse() 字符串 → 对象，JSON.stringify() 对象 → 字符串。eval() 也能解析但有安全风险（会执行任意代码）。',
      pitfalls: 'JSON.parse() 只能解析合法的 JSON 格式。单引号、尾逗号、注释等都会导致解析失败。',
    },
  },
  {
    id: 154,
    category: 'javascript',
    difficulty: 'medium',
    type: 'single',
    question: '以下代码输出什么？',
    code: `const p = new Promise((resolve) => {
  resolve(Promise.resolve(1));
});
p.then(console.log);`,
    options: [
      { label: 'Promise', value: 'a' },
      { label: '1', value: 'b' },
      { label: 'undefined', value: 'c' },
      { label: '报错', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: '输出 1。resolve 一个 Promise 时，会等待该 Promise 解析后再传递值。',
      thinking: 'Promise 的 resolve 如果传入另一个 Promise，会"展开"它：等待内部 Promise 解析后，用其值作为外层 Promise 的值。这叫做 Promise Resolution Procedure。',
      pitfalls: '如果想让 Promise 的值就是另一个 Promise（不展开），需要 reject 或用 Promise.resolve().then(() => innerPromise)。',
    },
  },
  {
    id: 155,
    category: 'javascript',
    difficulty: 'medium',
    type: 'single',
    question: '以下代码输出什么？',
    code: `let a = { n: 1 };
let b = a;
a.x = a = { n: 2 };
console.log(a);
console.log(b);
console.log(a.x);`,
    options: [
      { label: '{n:2} {n:1,x:{n:2}} undefined', value: 'a' },
      { label: '{n:2} {n:1} {n:2}', value: 'b' },
      { label: '{n:2,x:{n:2}} {n:2,x:{n:2}} {n:2}', value: 'c' },
      { label: '报错', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: 'a 是 {n:2}，b 是 {n:1, x:{n:2}}，a.x 是 undefined。',
      thinking: '关键：`a.x = a = {n:2}` 的执行顺序。JS 从左到右计算属性访问：1) 先计算 a.x（此时 a 指向 {n:1}）；2) 然后计算赋值右侧 a = {n:2}（a 指向新对象）；3) 最后将新对象赋给原 a 的 x 属性。所以 b.x = {n:2}。',
      pitfalls: '连续赋值的执行顺序是从右到左，但属性访问的计算是从左到右。',
    },
  },
  {
    id: 156,
    category: 'javascript',
    difficulty: 'hard',
    type: 'single',
    question: '以下代码输出什么？',
    code: `async function* range(start, end) {
  for (let i = start; i <= end; i++) {
    yield Promise.resolve(i);
  }
}
(async () => {
  for await (const num of range(1, 3)) {
    console.log(num);
  }
})();`,
    options: [
      { label: '1 2 3', value: 'a' },
      { label: 'Promise Promise Promise', value: 'b' },
      { label: '报错', value: 'c' },
      { label: 'undefined undefined undefined', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: '输出 1 2 3。for await...of 会自动 await 每个 yield 的值。',
      thinking: '异步生成器（async function*）结合 for await...of 可以异步迭代。yield Promise.resolve(i) 会被自动 await，所以 num 是数字而不是 Promise。',
      pitfalls: 'for await...of 只能用于异步可迭代对象（实现了 Symbol.asyncIterator 的对象）。',
    },
  },
  {
    id: 157,
    category: 'javascript',
    difficulty: 'easy',
    type: 'single',
    question: '以下哪个不是 JavaScript 的错误类型？',
    options: [
      { label: 'TypeError', value: 'a' },
      { label: 'ReferenceError', value: 'b' },
      { label: 'SyntaxError', value: 'c' },
      { label: 'CompileError', value: 'd' },
    ],
    answer: 'd',
    explanation: {
      correct: 'CompileError 不是 JavaScript 的标准错误类型。',
      thinking: 'JavaScript 的错误类型：1) Error（基类）；2) TypeError（类型错误）；3) ReferenceError（引用错误）；4) SyntaxError（语法错误）；5) RangeError（范围错误）；6) URIError（URI 错误）；7) EvalError（eval 错误）。',
      pitfalls: 'SyntaxError 在解析阶段就报错（代码根本不会执行），其他错误在运行时才报。',
    },
  },
  {
    id: 158,
    category: 'javascript',
    difficulty: 'medium',
    type: 'single',
    question: '以下代码输出什么？',
    code: `class Counter {
  #count = 0;
  increment() {
    this.#count++;
  }
  getCount() {
    return this.#count;
  }
}
const c = new Counter();
c.increment();
c.increment();
console.log(c.getCount());
console.log(c.#count);`,
    options: [
      { label: '2 2', value: 'a' },
      { label: '2 undefined', value: 'b' },
      { label: '2 报错', value: 'c' },
      { label: '报错', value: 'd' },
    ],
    answer: 'c',
    explanation: {
      correct: '第一个输出 2，第二个报错（私有字段不可外部访问）。',
      thinking: '#count 是 ES2022 的私有类字段（Private Class Fields）。以 # 开头的属性只能在类内部访问，外部访问会抛出 SyntaxError。',
      pitfalls: '私有字段不同于 _ 前缀的"约定私有"：# 私有是语言级别的强制限制，_ 只是约定。',
    },
  },
  {
    id: 159,
    category: 'javascript',
    difficulty: 'hard',
    type: 'single',
    question: '以下代码输出什么？',
    code: `const handler = {
  get(target, key) {
    console.log('get:', key);
    return Reflect.get(target, key);
  },
  set(target, key, value) {
    console.log('set:', key, value);
    return Reflect.set(target, key, value);
  }
};
const proxy = new Proxy({ a: 1 }, handler);
proxy.a;
proxy.b = 2;`,
    options: [
      { label: 'get: a → set: b 2', value: 'a' },
      { label: 'get: a → get: b → set: b 2', value: 'b' },
      { label: 'set: a undefined → set: b 2', value: 'c' },
      { label: '什么都不输出', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: '输出 get: a 和 set: b 2。',
      thinking: 'Proxy 的 get trap 在读取属性时触发，set trap 在设置属性时触发。Reflect.get/set 是对应操作的默认行为，推荐在 trap 中使用它们保持正确的行为。',
      pitfalls: 'Reflect API 和 Proxy trap 是一一对应的，推荐用 Reflect 来执行默认操作。',
    },
  },
  {
    id: 160,
    category: 'javascript',
    difficulty: 'easy',
    type: 'judge',
    question: 'JavaScript 中，函数声明（function foo() {}）和函数表达式（const foo = function() {}）都会被提升。',
    options: [
      { label: '正确', value: 'true' },
      { label: '错误', value: 'false' },
    ],
    answer: 'false',
    explanation: {
      correct: '错误。函数声明会被完整提升（函数体也会提升），函数表达式只有变量名会被提升（函数体不会）。',
      thinking: '函数声明提升：整个函数（名称+函数体）都会被提升到作用域顶部。函数表达式提升：只有变量声明被提升（类似 var），函数体不会被提升。',
      pitfalls: 'const/let 的函数表达式不会被提升（有 TDZ），var 的函数表达式变量名会被提升但值是 undefined。',
    },
  },

  // ==================== React 进阶 ====================
  {
    id: 161,
    category: 'react',
    difficulty: 'medium',
    type: 'single',
    question: '以下代码有什么问题？',
    code: `function App() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCount(count + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return <div>{count}</div>;
}`,
    options: [
      { label: 'count 永远是 1', value: 'a' },
      { label: '定时器不会被清除', value: 'b' },
      { label: '代码正常工作', value: 'c' },
      { label: '报错', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: 'count 永远是 1。因为 useEffect 的依赖数组是空数组，闭包捕获的 count 始终是 0。',
      thinking: '修复方法：使用函数式更新 setCount(prev => prev + 1)，这样不需要依赖 count 变量。',
      pitfalls: 'useEffect 闭包陷阱：依赖数组中遗漏的变量会导致闭包捕获旧值。',
    },
  },
  {
    id: 162,
    category: 'react',
    difficulty: 'hard',
    type: 'single',
    question: '以下代码中，哪个组件会在 count 变化时重新渲染？',
    code: `function App() {
  const [count, setCount] = useState(0);
  const value = useMemo(() => ({ count }), [count]);

  return (
    <div>
      <ChildA count={count} />
      <ChildB obj={value} />
      <ChildC />
    </div>
  );
}
const ChildA = React.memo(({ count }) => <div>{count}</div>);
const ChildB = React.memo(({ obj }) => <div>{obj.count}</div>);
const ChildC = React.memo(() => <div>Static</div>);`,
    options: [
      { label: '只有 ChildA 和 ChildB', value: 'a' },
      { label: '只有 ChildA', value: 'b' },
      { label: '三个都会', value: 'c' },
      { label: '只有 ChildC', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: 'ChildA 和 ChildB 会重新渲染，ChildC 不会。',
      thinking: 'ChildA 的 count prop 变了 → 重新渲染。ChildB 的 obj prop 是 useMemo 创建的新对象（引用变了但内容一样），但 React.memo 是浅比较，引用不同就重新渲染。ChildC 没有 prop 变化，不重新渲染。',
      pitfalls: 'useMemo 创建的对象引用在依赖变化时会变，配合 React.memo 使用时要注意。',
    },
  },
  {
    id: 163,
    category: 'react',
    difficulty: 'easy',
    type: 'single',
    question: 'React 中，以下哪个不是合法的 JSX？',
    options: [
      { label: '<div className="box">Hello</div>', value: 'a' },
      { label: '<img src="photo.jpg" />', value: 'b' },
      { label: '<div class="box">Hello</div>', value: 'c' },
      { label: '<Fragment>Hello</Fragment>', value: 'd' },
    ],
    answer: 'c',
    explanation: {
      correct: 'class 是 JavaScript 的保留字，JSX 中要用 className 代替。',
      thinking: 'JSX 的属性名是 camelCase：class → className，for → htmlFor，onclick → onClick。自定义组件用大写字母开头。',
      pitfalls: '虽然某些浏览器可能接受 class，但 React 会警告。始终使用 className。',
    },
  },
  {
    id: 164,
    category: 'react',
    difficulty: 'medium',
    type: 'single',
    question: '以下代码中，useCallback 的作用是什么？',
    code: `function Parent() {
  const [count, setCount] = useState(0);

  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);

  return <Child onClick={handleClick} />;
}

const Child = React.memo(({ onClick }) => {
  console.log('Child render');
  return <button onClick={onClick}>Click</button>;
});`,
    options: [
      { label: 'Child 只在挂载时渲染一次', value: 'a' },
      { label: 'Parent 每次渲染 Child 都会渲染', value: 'b' },
      { label: 'handleClick 会缓存计算结果', value: 'c' },
      { label: 'useCallback 没有实际作用', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: 'useCallback 稳定了 handleClick 的引用，配合 React.memo 使 Child 只渲染一次。',
      thinking: 'useCallback(fn, deps) 返回一个记忆化的函数引用。当 deps 不变时，返回同一个函数。这配合 React.memo 可以避免子组件因为函数 prop 引用变化而重新渲染。',
      pitfalls: '如果 useCallback 的依赖数组为空 []，函数内部使用的外部变量都是闭包捕获的旧值。',
    },
  },
  {
    id: 165,
    category: 'react',
    difficulty: 'hard',
    type: 'single',
    question: '以下代码输出什么？',
    code: `function App() {
  const [count, setCount] = useState(0);

  console.log('render', count);

  useEffect(() => {
    console.log('effect', count);
    return () => console.log('cleanup', count);
  }, [count]);

  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}`,
    options: [
      { label: 'render 0 → effect 0 → 点击 → cleanup 0 → render 1 → effect 1', value: 'a' },
      { label: 'render 0 → effect 0 → 点击 → render 1 → cleanup 0 → effect 1', value: 'b' },
      { label: 'render 0 → effect 0 → 点击 → render 1 → effect 1 → cleanup 0', value: 'c' },
      { label: 'render 0 → effect 0 → 点击 → cleanup 1 → render 1 → effect 1', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'render 0 → effect 0 → 点击 → render 1 → cleanup 0 → effect 1。',
      thinking: 'React 的执行顺序：1) render 阶段（纯函数）；2) commit 阶段（DOM 更新）；3) 清理上一次的 effect；4) 执行新的 effect。清理函数中 count 是旧值（0），因为清理函数捕获的是上一次渲染的闭包。',
      pitfalls: '清理函数中的 count 是"上一次渲染"的值，不是"当前"的值。',
    },
  },

  // ==================== Vue 进阶 ====================
  {
    id: 166,
    category: 'vue',
    difficulty: 'medium',
    type: 'single',
    question: '以下代码中，shallowRef 和 ref 的区别是什么？',
    code: `const shallow = shallowRef({ count: 0 });
const deep = ref({ count: 0 });

// 修改
shallow.value.count = 1;  // 不触发更新
deep.value.count = 1;     // 触发更新

shallow.value = { count: 2 };  // 触发更新
deep.value = { count: 2 };     // 触发更新`,
    options: [
      { label: 'shallowRef 只监听 .value 的引用变化，不监听内部属性变化', value: 'a' },
      { label: 'shallowRef 不能存储对象', value: 'b' },
      { label: 'shallowRef 和 ref 完全相同', value: 'c' },
      { label: 'shallowRef 性能更差', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: 'shallowRef 只监听 .value 的引用变化，不深度监听对象内部属性。',
      thinking: 'shallowRef 适合：1) 大型对象不需要深度响应；2) 第三方库管理的对象；3) 性能优化。修改 .value 的引用（shallow.value = newObj）会触发更新，但修改内部属性（shallow.value.count = 1）不会。',
      pitfalls: 'shallowRef 配合 triggerRef() 可以手动触发更新。',
    },
  },
  {
    id: 167,
    category: 'vue',
    difficulty: 'medium',
    type: 'single',
    question: 'Vue 3 中，defineProps 和 defineEmits 的作用是什么？',
    options: [
      { label: '定义组件的 props 和事件', value: 'a' },
      { label: '定义组件的状态', value: 'b' },
      { label: '定义组件的生命周期', value: 'c' },
      { label: '定义组件的模板', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: 'defineProps 定义组件接收的 props，defineEmits 定义组件可以触发的事件。',
      thinking: '<script setup> 中的编译器宏：1) defineProps 声明 props（不需要导入）；2) defineEmits 声明事件；3) defineExpose 暴露组件方法；4) defineModel 双向绑定（Vue 3.4+）。',
      pitfalls: '这些是编译器宏，不是普通的 JavaScript 函数，不需要 import。',
    },
  },
  {
    id: 168,
    category: 'vue',
    difficulty: 'hard',
    type: 'single',
    question: '以下代码中，watch 的 flush 选项有什么作用？',
    code: `watch(
  source,
  (newVal, oldVal) => {
    // 访问更新后的 DOM
    console.log(document.querySelector('#el').textContent);
  },
  { flush: 'post' }
);`,
    options: [
      { label: '在 DOM 更新前执行回调', value: 'a' },
      { label: '在 DOM 更新后执行回调', value: 'b' },
      { label: '同步执行回调', value: 'c' },
      { label: '延迟执行回调', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'flush: "post" 让回调在 DOM 更新后执行，可以访问更新后的 DOM。',
      thinking: 'watch 的 flush 选项：1) "pre"（默认）在 DOM 更新前执行；2) "post" 在 DOM 更新后执行；3) "sync" 同步执行（性能差）。watchEffect 也有 flush 选项。',
      pitfalls: '需要在 watch 回调中访问更新后的 DOM 时，使用 flush: "post"。',
    },
  },
  {
    id: 169,
    category: 'vue',
    difficulty: 'easy',
    type: 'single',
    question: 'Vue 中，v-model 的本质是什么？',
    options: [
      { label: '一个特殊的指令，不能拆解', value: 'a' },
      { label: ':value + @input 的语法糖', value: 'b' },
      { label: '一个双向绑定的魔法', value: 'c' },
      { label: '一个 computed 属性', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'v-model 是 :modelValue + @update:modelValue 的语法糖（Vue 3）。',
      thinking: 'Vue 3 的 v-model 拆解：v-model="val" → :modelValue="val" @update:modelValue="val = $event"。可以自定义 prop 名：v-model:title="val" → :title="val" @update:title="val = $event"。',
      pitfalls: 'Vue 2 和 Vue 3 的 v-model 有区别：Vue 2 用 value + input，Vue 3 用 modelValue + update:modelValue。',
    },
  },
  {
    id: 170,
    category: 'vue',
    difficulty: 'medium',
    type: 'single',
    question: '以下代码中，useSlots 和 useAttrs 的作用是什么？',
    code: `const slots = useSlots();
const attrs = useAttrs();`,
    options: [
      { label: '获取组件的插槽和透传属性', value: 'a' },
      { label: '获取组件的状态和方法', value: 'b' },
      { label: '获取路由信息', value: 'c' },
      { label: '获取全局状态', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: 'useSlots() 获取组件的插槽，useAttrs() 获取透传的属性。',
      thinking: '在 <script setup> 中：1) useSlots() 返回 slots 对象，可以检查是否有某个插槽；2) useAttrs() 返回非 props 的透传属性（如 class、style、事件等）。',
      pitfalls: 'attrs 包含所有未被 props 声明接收的属性，包括 class、style、事件等。',
    },
  },

  // ==================== 网络 & 安全 ====================
  {
    id: 171,
    category: 'engineering',
    difficulty: 'medium',
    type: 'single',
    question: '什么是 XSS 攻击？如何防御？',
    options: [
      { label: '跨站脚本攻击，通过注入恶意脚本', value: 'a' },
      { label: '跨站请求伪造，通过伪造用户请求', value: 'b' },
      { label: 'SQL 注入攻击', value: 'c' },
      { label: 'DDoS 攻击', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: 'XSS（跨站脚本攻击）通过在页面注入恶意脚本，窃取用户数据或执行操作。',
      thinking: 'XSS 类型：1) 存储型（恶意脚本存入数据库）；2) 反射型（脚本在 URL 中）；3) DOM 型（前端直接操作 DOM）。防御：1) 转义输出；2) CSP（内容安全策略）；3) HttpOnly Cookie。',
      pitfalls: 'innerHTML 和 v-html 有 XSS 风险，要确保内容可信。',
    },
  },
  {
    id: 172,
    category: 'engineering',
    difficulty: 'medium',
    type: 'single',
    question: '什么是 CSRF 攻击？如何防御？',
    options: [
      { label: '跨站脚本攻击', value: 'a' },
      { label: '跨站请求伪造，利用用户的登录状态发送恶意请求', value: 'b' },
      { label: '中间人攻击', value: 'c' },
      { label: '暴力破解攻击', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'CSRF（跨站请求伪造）利用用户已登录的状态，诱导用户发送恶意请求。',
      thinking: 'CSRF 的原理：用户已登录 A 站，访问恶意 B 站，B 站自动向 A 站发送请求（携带 Cookie）。防御：1) CSRF Token；2) SameSite Cookie；3) 检查 Origin/Referer 头部。',
      pitfalls: 'SameSite: Strict 可以完全防御 CSRF，但会影响正常链接跳转。',
    },
  },
  {
    id: 173,
    category: 'engineering',
    difficulty: 'hard',
    type: 'single',
    question: '什么是 Content Security Policy（CSP）？',
    options: [
      { label: '一种 CSS 框架', value: 'a' },
      { label: '一种安全策略，限制页面可以加载和执行的资源来源', value: 'b' },
      { label: '一种缓存策略', value: 'c' },
      { label: '一种压缩算法', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'CSP 是一种安全策略，通过 HTTP 头部或 meta 标签限制页面可以加载的资源来源。',
      thinking: 'CSP 的作用：1) 防止 XSS（限制内联脚本和外部脚本来源）；2) 防止数据注入；3) 报告违规。常见指令：default-src、script-src、style-src、img-src 等。',
      pitfalls: 'CSP 可能影响第三方脚本（如 Google Analytics），需要配置白名单。',
    },
  },
  {
    id: 174,
    category: 'engineering',
    difficulty: 'easy',
    type: 'single',
    question: 'HTTPS 相比 HTTP 的优势是什么？',
    options: [
      { label: '速度更快', value: 'a' },
      { label: '数据加密，防止窃听和篡改', value: 'b' },
      { label: '不需要服务器', value: 'c' },
      { label: '支持更多 HTTP 方法', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'HTTPS 通过 TLS 加密数据，防止窃听、篡改和冒充。',
      thinking: 'HTTPS = HTTP + TLS。优势：1) 加密（防窃听）；2) 完整性（防篡改）；3) 身份认证（防冒充）。劣势：1) 握手增加延迟；2) 证书成本；3) 计算开销。',
      pitfalls: '现代 TLS 1.3 的性能开销已经很小，应该全站使用 HTTPS。',
    },
  },
  {
    id: 175,
    category: 'engineering',
    difficulty: 'medium',
    type: 'single',
    question: '什么是 Token 和 JWT？',
    options: [
      { label: '同一种东西', value: 'a' },
      { label: 'Token 是认证凭证的统称，JWT 是一种特定格式的 Token', value: 'b' },
      { label: 'JWT 是数据库', value: 'c' },
      { label: 'Token 只能用于 OAuth', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'Token 是认证凭证的统称，JWT（JSON Web Token）是一种包含用户信息的自包含 Token。',
      thinking: 'JWT 的结构：Header.Payload.Signature。Payload 包含用户信息（不需要查询数据库验证）。优势：无状态、自包含。劣势：不能撤销（需要黑名单）、Payload 可见（不要放敏感信息）。',
      pitfalls: 'JWT 的 Payload 只是 Base64 编码，不是加密。不要在 JWT 中存放密码等敏感信息。',
    },
  },

  // ==================== 性能优化进阶 ====================
  {
    id: 176,
    category: 'performance',
    difficulty: 'medium',
    type: 'single',
    question: '什么是资源提示（Resource Hints）？以下哪个不是资源提示？',
    options: [
      { label: 'preload', value: 'a' },
      { label: 'prefetch', value: 'b' },
      { label: 'preconnect', value: 'c' },
      { label: 'preload 和 prefetch 都是', value: 'd' },
    ],
    answer: 'd',
    explanation: {
      correct: 'preload、prefetch、preconnect 都是资源提示，用于优化资源加载。',
      thinking: '资源提示：1) preload 当前页面关键资源；2) prefetch 下一页面可能需要的资源；3) preconnect 提前建立连接（DNS+TCP+TLS）；4) dns-prefetch 只预解析 DNS。',
      pitfalls: 'preload 的资源必须有 as 属性（as="script"/"style"/"image" 等）。',
    },
  },
  {
    id: 177,
    category: 'performance',
    difficulty: 'hard',
    type: 'single',
    question: '什么是代码分割（Code Splitting）的策略？',
    options: [
      { label: '按路由分割', value: 'a' },
      { label: '按组件分割', value: 'b' },
      { label: '按第三方库分割', value: 'c' },
      { label: '以上都是', value: 'd' },
    ],
    answer: 'd',
    explanation: {
      correct: '代码分割可以按路由、组件、第三方库等多个维度进行。',
      thinking: '代码分割策略：1) 路由级分割（最常见，React.lazy / import()）；2) 组件级分割（重型组件懒加载）；3) 第三方库分割（vendor chunk）；4) 公共代码提取（splitChunks）。',
      pitfalls: '过度分割会增加请求数量，需要找到平衡点。',
    },
  },
  {
    id: 178,
    category: 'performance',
    difficulty: 'easy',
    type: 'single',
    question: '什么是 Gzip 压缩？',
    options: [
      { label: '一种图片压缩格式', value: 'a' },
      { label: '一种文本压缩算法，可以减少传输大小 60-80%', value: 'b' },
      { label: '一种 JavaScript 压缩工具', value: 'c' },
      { label: '一种 CSS 预处理器', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'Gzip 是一种广泛使用的文本压缩算法，可以将 HTML/CSS/JS 等文本文件压缩 60-80%。',
      thinking: '压缩方式：1) Gzip 兼容性最好，压缩率 60-70%；2) Brotli 压缩率更高 70-80%，但需要浏览器支持；3) 通常在 Nginx/Apache 配置开启。',
      pitfalls: '图片/视频等已经是压缩格式的文件，再 Gzip 效果很小甚至更大。',
    },
  },
  {
    id: 179,
    category: 'performance',
    difficulty: 'medium',
    type: 'single',
    question: '什么是 Tree Shaking？它需要什么条件？',
    options: [
      { label: '删除注释', value: 'a' },
      { label: '删除未使用的代码，需要 ES Module 静态结构', value: 'b' },
      { label: '压缩代码', value: 'c' },
      { label: '混淆变量名', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'Tree Shaking 删除未使用的导出代码，依赖 ES Module 的静态 import/export 结构。',
      thinking: 'Tree Shaking 的条件：1) 使用 ES Module（import/export）；2) 构建工具支持（Webpack/Rollup/Vite）；3) 没有副作用的模块（或标记 sideEffects: false）。',
      pitfalls: 'CommonJS（require/module.exports）不能被 Tree Shaking，因为是动态的。',
    },
  },
  {
    id: 180,
    category: 'performance',
    difficulty: 'hard',
    type: 'single',
    question: '什么是 SSR 和 SSG？它们的区别是什么？',
    options: [
      { label: 'SSR 在服务器渲染，SSG 在构建时渲染', value: 'a' },
      { label: '两者完全相同', value: 'b' },
      { label: 'SSR 是静态的，SSG 是动态的', value: 'c' },
      { label: 'SSR 只支持 React', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: 'SSR（服务端渲染）在每次请求时在服务器渲染；SSG（静态站点生成）在构建时预渲染为静态 HTML。',
      thinking: 'SSR vs SSG：1) SSR 每次请求都渲染（动态内容、首屏快、服务器压力大）；2) SSG 构建时渲染（静态内容、速度最快、不需要服务器）；3) ISR 增量静态再生成（结合两者优势）。',
      pitfalls: 'Next.js 支持 SSR、SSG、ISR 三种渲染方式，根据页面特性选择。',
    },
  },

  // ==================== TypeScript 进阶 ====================
  {
    id: 181,
    category: 'typescript',
    difficulty: 'medium',
    type: 'single',
    question: '以下代码中，as const 的作用是什么？',
    code: `const arr = [1, 2, 3] as const;
const obj = { a: 1, b: 'hello' } as const;`,
    options: [
      { label: '让变量变成只读的字面量类型', value: 'a' },
      { label: '让变量变成 any 类型', value: 'b' },
      { label: '没有实际作用', value: 'c' },
      { label: '让变量可以被修改', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: 'as const 将变量推断为只读的字面量类型，而不是宽泛的类型。',
      thinking: 'as const 的效果：1) 数组变成 readonly 元组；2) 对象的属性变成只读字面量；3) 字面量变成 const 类型。arr 的类型是 readonly [1, 2, 3]，obj.a 的类型是 1（不是 number）。',
      pitfalls: 'as const 是浅层的，嵌套对象的属性不会自动变为只读。',
    },
  },
  {
    id: 182,
    category: 'typescript',
    difficulty: 'hard',
    type: 'single',
    question: '以下代码中 Result 的类型是什么？',
    code: `type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object
    ? DeepReadonly<T[K]>
    : T[K];
};
type Obj = { a: { b: { c: number } } };
type Result = DeepReadonly<Obj>;`,
    options: [
      { label: '{ a: { b: { c: number } } }', value: 'a' },
      { label: '{ readonly a: { readonly b: { readonly c: number } } }', value: 'b' },
      { label: '{ readonly a: { b: { c: number } } }', value: 'c' },
      { label: '报错', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'DeepReadonly 递归地将所有属性标记为 readonly。',
      thinking: '递归条件类型：T extends object ? DeepReadonly<T[K]> : T[K]。当属性值是对象时递归处理，否则直接返回。这是实现深层工具类型的常见模式。',
      pitfalls: '递归类型可能在深层嵌套时导致类型检查性能问题。',
    },
  },
  {
    id: 183,
    category: 'typescript',
    difficulty: 'easy',
    type: 'single',
    question: 'TypeScript 中的 ? 可以用在哪些地方？',
    options: [
      { label: '可选属性：interface { name?: string }', value: 'a' },
      { label: '可选链：obj?.prop', value: 'b' },
      { label: '空值合并：value ?? default', value: 'c' },
      { label: 'A 和 B 都是', value: 'd' },
    ],
    answer: 'd',
    explanation: {
      correct: '? 可以用于可选属性和可选链。?? 是空值合并运算符，不是 ? 的用法。',
      thinking: '? 的用法：1) 可选属性 { key?: Type }；2) 可选链 obj?.prop；3) 条件类型 T extends U ? X : Y；4) 可选参数 (a?: number)。',
      pitfalls: '可选链 ?. 和空值合并 ?? 是不同的运算符。',
    },
  },
  {
    id: 184,
    category: 'typescript',
    difficulty: 'medium',
    type: 'single',
    question: '以下代码中，哪个是正确的类型守卫？',
    options: [
      { label: 'function isString(x: unknown): x is string { return typeof x === "string"; }', value: 'a' },
      { label: 'function isString(x: any): boolean { return typeof x === "string"; }', value: 'b' },
      { label: 'function isString(x: unknown): boolean { return typeof x === "string"; }', value: 'c' },
      { label: 'A 和 C 都是', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: '类型守卫使用 "x is string" 返回类型，告诉 TypeScript 在 true 分支中 x 是 string。',
      thinking: '类型守卫（Type Guard）使用类型谓词（Type Predicate）：parameter is Type。在 if (isString(x)) 后，TypeScript 知道 x 是 string 类型。',
      pitfalls: '普通 boolean 返回值不能做类型收窄，必须用类型谓词。',
    },
  },
  {
    id: 185,
    category: 'typescript',
    difficulty: 'hard',
    type: 'single',
    question: '以下代码中 Result 的类型是什么？',
    code: `type TupleToUnion<T extends any[]> = T[number];
type Result = TupleToUnion<[1, 'hello', true]>;`,
    options: [
      { label: '[1, "hello", true]', value: 'a' },
      { label: '1 | "hello" | true', value: 'b' },
      { label: 'number | string | boolean', value: 'c' },
      { label: '报错', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'Result 是 1 | "hello" | true。T[number] 将元组转为联合类型。',
      thinking: 'T[number] 是索引访问类型：当 T 是元组 [1, "hello", true] 时，T[number] 表示"元组中任意索引的值的类型"，即 1 | "hello" | true。',
      pitfalls: 'T[number] 对数组返回元素类型，对元组返回联合类型。',
    },
  },

  // ==================== 综合场景 ====================
  {
    id: 186,
    category: 'javascript',
    difficulty: 'medium',
    type: 'single',
    question: '以下代码实现了什么功能？',
    code: `function pipe(...fns) {
  return (x) => fns.reduce((acc, fn) => fn(acc), x);
}
const add1 = x => x + 1;
const double = x => x * 2;
const square = x => x * x;
const transform = pipe(add1, double, square);
console.log(transform(3));`,
    options: [
      { label: '64', value: 'a' },
      { label: '49', value: 'b' },
      { label: '36', value: 'c' },
      { label: '100', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: 'transform(3) = square(double(add1(3))) = square(double(4)) = square(8) = 64。',
      thinking: 'pipe 函数将多个函数组合成一个：从左到右依次执行。这是函数式编程中的"管道"模式。compose 是从右到左执行。',
      pitfalls: 'pipe 和 compose 的区别：pipe 从左到右，compose 从右到左。',
    },
  },
  {
    id: 187,
    category: 'javascript',
    difficulty: 'hard',
    type: 'single',
    question: '以下代码输出什么？',
    code: `const obj = {
  a: 1,
  b: 2,
  [Symbol.iterator]() {
    const keys = Object.keys(this);
    let index = 0;
    return {
      next: () => ({
        value: this[keys[index]],
        done: index++ >= keys.length,
      }),
    };
  },
};
console.log([...obj]);`,
    options: [
      { label: '[1, 2]', value: 'a' },
      { label: '["a", "b"]', value: 'b' },
      { label: '[{value: 1}, {value: 2}]', value: 'c' },
      { label: '报错', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: '输出 [1, 2]。自定义 Symbol.iterator 让对象可迭代，遍历返回属性值。',
      thinking: 'Symbol.iterator 让对象可以被 for...of、展开运算符、解构赋值等使用。自定义迭代器需要返回一个有 next() 方法的对象，next() 返回 { value, done }。',
      pitfalls: '这个迭代器的 this 指向需要注意，箭头函数的 this 继承自外层。',
    },
  },
  {
    id: 188,
    category: 'react',
    difficulty: 'medium',
    type: 'single',
    question: 'React 中，以下哪个不是状态管理方案？',
    options: [
      { label: 'useState', value: 'a' },
      { label: 'useReducer', value: 'b' },
      { label: 'useMemo', value: 'c' },
      { label: 'Context', value: 'd' },
    ],
    answer: 'c',
    explanation: {
      correct: 'useMemo 不是状态管理方案，它是缓存计算结果的 Hook。',
      thinking: 'React 状态管理方案：1) useState（简单状态）；2) useReducer（复杂状态逻辑）；3) Context（跨组件共享）；4) Redux/Zustand/Jotai（全局状态库）。',
      pitfalls: 'useMemo 缓存"值"，useCallback 缓存"函数"，都不是状态管理。',
    },
  },
  {
    id: 189,
    category: 'vue',
    difficulty: 'medium',
    type: 'single',
    question: 'Vue 3 中，以下哪个不是组合式 API 的优势？',
    options: [
      { label: '逻辑复用更灵活', value: 'a' },
      { label: '类型推断更好', value: 'b' },
      { label: '运行速度更快', value: 'c' },
      { label: '代码组织更清晰', value: 'd' },
    ],
    answer: 'c',
    explanation: {
      correct: '组合式 API 不会直接影响运行速度，它的优势在开发体验层面。',
      thinking: '组合式 API 的优势：1) 逻辑复用（Composables）；2) TypeScript 支持更好；3) 相关逻辑聚合在一起；4) 更灵活的代码组织。性能上与选项式 API 没有显著差异。',
      pitfalls: 'Vue 3 的性能提升主要来自编译优化（静态提升、Patch Flags），而不是组合式 API。',
    },
  },
  {
    id: 190,
    category: 'performance',
    difficulty: 'medium',
    type: 'single',
    question: '什么是首屏渲染时间（FCP）和最大内容绘制（LCP）的区别？',
    options: [
      { label: 'FCP 是首次内容出现，LCP 是最大内容完成渲染', value: 'a' },
      { label: '两者完全相同', value: 'b' },
      { label: 'FCP 比 LCP 晚', value: 'c' },
      { label: 'LCP 只衡量图片', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: 'FCP 衡量第一个内容出现的时间，LCP 衡量最大内容元素完成渲染的时间。',
      thinking: 'FCP vs LCP：1) FCP 通常是第一个文本或图片出现（< 1.8s）；2) LCP 通常是首屏大图或标题完成渲染（< 2.5s）；3) LCP 更能代表用户感知的加载完成时间。',
      pitfalls: 'LCP 不一定是最大的元素，而是视口内最大的文本块或图片。',
    },
  },
  {
    id: 191,
    category: 'engineering',
    difficulty: 'medium',
    type: 'single',
    question: '什么是 Nginx？它在前端部署中的作用是什么？',
    options: [
      { label: '一种 JavaScript 运行时', value: 'a' },
      { label: 'Web 服务器，用于静态资源托管和反向代理', value: 'b' },
      { label: '一种包管理器', value: 'c' },
      { label: '一种数据库', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'Nginx 是高性能的 Web 服务器，常用于静态资源托管、反向代理、负载均衡。',
      thinking: 'Nginx 在前端的作用：1) 托管静态文件（HTML/CSS/JS）；2) 反向代理 API 请求到后端；3) 开启 Gzip/Brotli 压缩；4) 配置缓存策略；5) HTTPS 证书配置；6) SPA 路由回退。',
      pitfalls: 'SPA 需要配置 try_files $uri $uri/ /index.html 来处理前端路由。',
    },
  },
  {
    id: 192,
    category: 'engineering',
    difficulty: 'hard',
    type: 'single',
    question: '什么是前端监控的三大支柱？',
    options: [
      { label: '日志、指标、链路追踪', value: 'a' },
      { label: 'HTML、CSS、JavaScript', value: 'b' },
      { label: 'React、Vue、Angular', value: 'c' },
      { label: 'Chrome、Firefox、Safari', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: '前端监控的三大支柱：日志（Logging）、指标（Metrics）、链路追踪（Tracing）。',
      thinking: '1) 日志：记录事件和错误（console.log、Sentry）；2) 指标：量化性能数据（Web Vitals、自定义指标）；3) 链路追踪：追踪请求的完整路径（从用户操作到 API 调用）。',
      pitfalls: '这三大支柱来自 Google 的 SRE 理念，适用于所有可观测性系统。',
    },
  },
  {
    id: 193,
    category: 'javascript',
    difficulty: 'medium',
    type: 'single',
    question: '以下代码输出什么？',
    code: `const nums = [1, 2, 3, 4, 5];
const result = nums.filter(n => n % 2 === 0).map(n => n * 2);
console.log(result);`,
    options: [
      { label: '[2, 4, 6, 8, 10]', value: 'a' },
      { label: '[4, 8]', value: 'b' },
      { label: '[1, 3, 5]', value: 'c' },
      { label: '[2, 4]', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'filter 留下偶数 [2, 4]，map 乘以 2 得到 [4, 8]。',
      thinking: '链式调用：filter 返回新数组，map 对 filter 的结果再处理。先过滤再转换是常见的数据处理模式。',
      pitfalls: '如果数组很大，可以用 reduce 一次完成，避免创建中间数组。',
    },
  },
  {
    id: 194,
    category: 'typescript',
    difficulty: 'medium',
    type: 'single',
    question: '以下代码中，哪个是正确的泛型默认值？',
    options: [
      { label: 'function identity<T = string>(value: T): T', value: 'a' },
      { label: 'function identity<T>(value: T = "hello"): T', value: 'b' },
      { label: 'function identity<T>(value: T): T = string', value: 'c' },
      { label: 'function identity<T extends string>(value: T): T', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: '<T = string> 是泛型默认值语法，当不提供泛型参数时默认使用 string。',
      thinking: '泛型默认值：function fn<T = DefaultType>(...)。与泛型约束 <T extends Constraint> 不同：默认值是"不提供时的默认类型"，约束是"必须满足的条件"。',
      pitfalls: '泛型默认值和泛型约束可以同时使用：<T extends Base = Default>。',
    },
  },
  {
    id: 195,
    category: 'react',
    difficulty: 'hard',
    type: 'single',
    question: '以下代码中，useDeferredValue 的作用是什么？',
    code: `function SearchResults({ query }) {
  const deferredQuery = useDeferredValue(query);
  const isStale = query !== deferredQuery;

  return (
    <div style={{ opacity: isStale ? 0.7 : 1 }}>
      {renderResults(deferredQuery)}
    </div>
  );
}`,
    options: [
      { label: '延迟更新非紧急的 UI 部分，保持输入框响应', value: 'a' },
      { label: '缓存查询结果', value: 'b' },
      { label: '防抖处理', value: 'c' },
      { label: '节流处理', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: 'useDeferredValue 延迟更新非紧急的值，让输入框等高优先级更新先执行。',
      thinking: 'useDeferredValue vs useTransition：1) useDeferredValue 延迟"值"的更新；2) useTransition 延迟"状态更新"的执行。两者都是 React 18 的并发特性。',
      pitfalls: 'useDeferredValue 不是防抖：它在高优先级更新完成后立即执行，不是固定延迟。',
    },
  },
  {
    id: 196,
    category: 'vue',
    difficulty: 'hard',
    type: 'single',
    question: 'Vue 3 中，Teleport 组件的作用是什么？',
    options: [
      { label: '组件间通信', value: 'a' },
      { label: '将子组件渲染到 DOM 的其他位置', value: 'b' },
      { label: '延迟渲染组件', value: 'c' },
      { label: '缓存组件状态', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'Teleport 将子组件的 DOM 渲染到指定的目标位置（如 document.body）。',
      thinking: 'Teleport 的用途：1) Modal/Dialog 渲染到 body；2) Toast/Notification 渲染到顶层；3) 避免父组件的 overflow: hidden 或 z-index 问题。',
      pitfalls: 'Teleport 只移动 DOM 位置，组件的逻辑关系（父子关系、provide/inject）不变。',
    },
  },
  {
    id: 197,
    category: 'performance',
    difficulty: 'hard',
    type: 'single',
    question: '什么是图片的懒加载（Lazy Loading）？',
    options: [
      { label: '延迟加载视口外的图片，进入视口时才加载', value: 'a' },
      { label: '压缩图片大小', value: 'b' },
      { label: '转换图片格式', value: 'c' },
      { label: '预加载所有图片', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: '懒加载延迟加载视口外的图片，减少首屏加载的资源量。',
      thinking: '懒加载实现：1) loading="lazy" 原生属性（推荐）；2) Intersection Observer API；3) 第三方库（react-lazyload）。配合占位图和骨架屏效果更好。',
      pitfalls: '首屏图片不应该懒加载（会影响 LCP），只对视口外的图片使用。',
    },
  },
  {
    id: 198,
    category: 'engineering',
    difficulty: 'medium',
    type: 'single',
    question: '什么是前端的构建（Build）和编译（Compile）？',
    options: [
      { label: '同一概念', value: 'a' },
      { label: '编译是将一种语言转为另一种，构建是整个打包优化流程', value: 'b' },
      { label: '构建只做压缩', value: 'c' },
      { label: '编译只做转译', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: '编译是构建的一部分。编译（如 TypeScript → JavaScript）是语言转换，构建包括编译、打包、压缩、优化等整个流程。',
      thinking: '构建流程：1) 编译（TS→JS、JSX→JS、SASS→CSS）；2) 打包（合并模块）；3) 压缩（代码压缩、图片压缩）；4) 优化（Tree Shaking、Code Splitting）；5) 资源处理（哈希、拷贝）。',
      pitfalls: 'Webpack/Vite/Rollup 是构建工具，Babel/SWC/TSC 是编译工具。',
    },
  },
  {
    id: 199,
    category: 'javascript',
    difficulty: 'hard',
    type: 'single',
    question: '以下代码输出什么？',
    code: `function createCounter() {
  let count = 0;
  return {
    increment: () => ++count,
    decrement: () => --count,
    getCount: () => count,
  };
}
const counter = createCounter();
counter.increment();
counter.increment();
counter.decrement();
console.log(counter.getCount());
console.log(counter.count);`,
    options: [
      { label: '1 undefined', value: 'a' },
      { label: '1 1', value: 'b' },
      { label: '2 undefined', value: 'c' },
      { label: '报错', value: 'd' },
    ],
    answer: 'a',
    explanation: {
      correct: 'getCount() 返回 1，counter.count 是 undefined。',
      thinking: '这是模块模式（Module Pattern）：通过闭包实现私有变量。count 是私有的，只能通过返回的方法访问。counter.count 是 undefined，因为 count 不是返回对象的属性。',
      pitfalls: '闭包实现的私有变量是真正的私有（外部无法访问），比 _ 前缀的约定私有更安全。',
    },
  },
  {
    id: 200,
    category: 'engineering',
    difficulty: 'medium',
    type: 'single',
    question: '什么是前端的 A/B 测试？',
    options: [
      { label: '一种代码测试方法', value: 'a' },
      { label: '将用户随机分组，展示不同版本的页面，比较效果', value: 'b' },
      { label: '一种性能测试工具', value: 'c' },
      { label: '一种 CSS 测试方法', value: 'd' },
    ],
    answer: 'b',
    explanation: {
      correct: 'A/B 测试将用户随机分为两组，分别展示不同版本（A 版和 B 版），通过数据比较哪个版本效果更好。',
      thinking: 'A/B 测试的步骤：1) 确定测试目标（转化率、点击率等）；2) 创建变体（A 原版、B 新版）；3) 随机分组；4) 收集数据；5) 统计分析。常用工具：Google Optimize、LaunchDarkly。',
      pitfalls: 'A/B 测试需要足够的样本量和时间才能得出统计显著的结论。',
    },
  },
];

// 按分类统计题目数量
categories.forEach(cat => {
  cat.count = quizQuestions.filter(q => q.category === cat.key).length;
});
