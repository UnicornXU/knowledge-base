const fs = require('node:fs');
const path = require('node:path');
const {loadQuizData} = require('./quiz-data-loader.cjs');
const root = process.cwd();
const {categories, quizQuestions} = loadQuizData(root);
const errors = [];
const categoryKeys = new Set(categories.map((category) => category.key));
const ids = new Set();
for (const question of quizQuestions) {
  if (ids.has(question.id)) errors.push(`duplicate question id: ${question.id}`);
  ids.add(question.id);
  if (!categoryKeys.has(question.category))
    errors.push(`question ${question.id}: unknown category ${question.category}`);
  if (!question.question?.trim()) errors.push(`question ${question.id}: empty question`);
  if (!question.explanation?.correct?.trim() || !question.explanation?.thinking?.trim())
    errors.push(`question ${question.id}: incomplete explanation`);
  const values = question.options.map((option) => option.value);
  if (new Set(values).size !== values.length) errors.push(`question ${question.id}: duplicate option values`);
  const answers = Array.isArray(question.answer) ? question.answer : [question.answer];
  if (answers.length === 0 || answers.some((answer) => !values.includes(answer)))
    errors.push(`question ${question.id}: invalid answer`);
  if (question.type === 'multiple' && !Array.isArray(question.answer))
    errors.push(`question ${question.id}: multiple question must use an answer array`);
  if (question.type !== 'multiple' && Array.isArray(question.answer))
    errors.push(`question ${question.id}: non-multiple question must use one answer`);
}
for (const category of categories) {
  const actual = quizQuestions.filter((question) => question.category === category.key).length;
  if (actual === 0) errors.push(`category ${category.key}: no questions`);
  if (category.count !== actual)
    errors.push(`category ${category.key}: count ${category.count}, expected ${actual}`);
}
function countDocs(directory) {
  return fs.readdirSync(directory, {withFileTypes: true}).reduce((count, entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return count + countDocs(target);
    return count + (/\.mdx?$/.test(entry.name) ? 1 : 0);
  }, 0);
}
const stats = {
  documents: countDocs(path.join(root, 'docs')),
  questions: quizQuestions.length,
  categories: fs
    .readdirSync(path.join(root, 'docs'), {withFileTypes: true})
    .filter((entry) => entry.isDirectory()).length,
};
fs.writeFileSync(path.join(root, 'src/data/site-stats.json'), JSON.stringify(stats, null, 2) + '\n');
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(
  `Validated ${stats.questions} questions, ${stats.documents} documents, and ${stats.categories} categories.`,
);
