const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function loadQuizData(rootDir = process.cwd()) {
  const filename = path.join(rootDir, 'src/data/quiz-questions.ts');
  const source = fs.readFileSync(filename, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022},
  }).outputText;
  const module = {exports: {}};
  vm.runInNewContext(compiled, {module, exports: module.exports, require}, {filename});
  return module.exports;
}
module.exports = {loadQuizData};
