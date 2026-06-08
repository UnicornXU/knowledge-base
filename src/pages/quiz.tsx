import React, { useState, useCallback } from 'react';
import Layout from '@theme/Layout';
import QuizCard from '@site/src/components/Quiz/QuizCard';
import QuizSummary from '@site/src/components/Quiz/QuizSummary';
import {
  categories,
  quizQuestions,
} from '@site/src/data/quiz-questions';
import type { QuizQuestion } from '@site/src/data/quiz-questions';
import styles from '@site/src/components/Quiz/styles.module.css';

type QuizState = 'select' | 'playing' | 'summary';

interface AnswerRecord {
  questionId: number;
  selected: string;
  isCorrect: boolean;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function Quiz(): React.ReactElement {
  const [state, setState] = useState<QuizState>('select');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);

  const startQuiz = useCallback((category: string) => {
    const filtered = quizQuestions.filter(q => q.category === category);
    const shuffled = shuffleArray(filtered).slice(0, 10); // 最多 10 题
    setQuestions(shuffled);
    setCurrentIndex(0);
    setAnswers([]);
    setSelectedCategory(category);
    setState('playing');
  }, []);

  const handleNext = useCallback(
    (questionId: number, selected: string, isCorrect: boolean) => {
      setAnswers(prev => [...prev, { questionId, selected, isCorrect }]);
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setState('summary');
      }
    },
    [currentIndex, questions.length]
  );

  const handleRetry = useCallback(() => {
    if (selectedCategory) {
      startQuiz(selectedCategory);
    }
  }, [selectedCategory, startQuiz]);

  const handleBack = useCallback(() => {
    setState('select');
    setSelectedCategory(null);
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers([]);
  }, []);

  // 选择分类页面
  if (state === 'select') {
    return (
      <Layout title="随堂测验" description="前端面试题随堂测验">
        <div className={styles.quizContainer}>
          <div className={styles.quizHero}>
            <h1 className={styles.quizHeroTitle}>📝 随堂测验</h1>
            <p className={styles.quizHeroSubtitle}>
              选择一个分类开始挑战，每轮随机抽取题目，答完即刻查看解析。
            </p>
          </div>

          <div className={styles.categoryGrid}>
            {categories.map(cat => (
              <div
                key={cat.key}
                className={styles.categoryCard}
                onClick={() => startQuiz(cat.key)}
              >
                <div className={styles.categoryIcon}>{cat.icon}</div>
                <div className={styles.categoryLabel}>{cat.label}</div>
                <div className={styles.categoryCount}>{cat.count} 道题</div>
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  // 答题页面
  if (state === 'playing' && questions.length > 0) {
    const currentQuestion = questions[currentIndex];

    // 包装 onNext 回调，传入选中值和是否正确
    const handleQuestionNext = () => {
      // 从 QuizCard 的状态中获取答案（通过 ref 或回调）
      // 这里需要重构：让 QuizCard 在选择时就通知父组件
    };

    return (
      <Layout title="随堂测验" description="前端面试题随堂测验">
        <div className={styles.quizContainer}>
          <QuizCardWithCallback
            question={currentQuestion}
            questionNumber={currentIndex + 1}
            totalQuestions={questions.length}
            onAnswer={(selected, isCorrect) => {
              handleNext(currentQuestion.id, selected, isCorrect);
            }}
          />
        </div>
      </Layout>
    );
  }

  // 结果页面
  if (state === 'summary') {
    const categoryLabel =
      categories.find(c => c.key === selectedCategory)?.label || '';

    return (
      <Layout title="测验结果" description={`${categoryLabel}测验结果`}>
        <QuizSummary
          questions={questions}
          answers={answers}
          onRetry={handleRetry}
          onBack={handleBack}
        />
      </Layout>
    );
  }

  return <Layout title="随堂测验"><div>加载中...</div></Layout>;
}

// 带回调的 QuizCard 包装组件
function QuizCardWithCallback({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
}: {
  question: QuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (selected: string, isCorrect: boolean) => void;
}): React.ReactElement {
  const [selected, setSelected] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const isCorrect =
    Array.isArray(question.answer)
      ? question.answer.includes(selected ?? '')
      : selected === question.answer;

  const handleSelect = (value: string) => {
    if (selected) return;
    setSelected(value);
    setShowExplanation(true);
  };

  const handleNext = () => {
    onAnswer(selected!, isCorrect);
  };

  const typeLabels: Record<string, string> = {
    single: '单选题',
    multiple: '多选题',
    judge: '判断题',
  };
  const difficultyLabels: Record<string, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难',
  };
  const letterMap = ['A', 'B', 'C', 'D'];

  return (
    <div>
      {/* 进度条 */}
      <div className={styles.progressText}>
        <span>第 {questionNumber} / {totalQuestions} 题</span>
        <span>{Math.round((questionNumber / totalQuestions) * 100)}%</span>
      </div>
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
        />
      </div>

      {/* 题目卡片 */}
      <div className={styles.questionCard}>
        <div className={styles.questionHeader}>
          <span
            className={`${styles.difficultyBadge} ${
              styles[
                `difficulty${question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}`
              ]
            }`}
          >
            {difficultyLabels[question.difficulty]}
          </span>
          <span className={styles.questionType}>
            {typeLabels[question.type]}
          </span>
        </div>

        <div className={styles.questionText}>{question.question}</div>

        {question.code && (
          <pre className={styles.codeBlock}>
            <code>{question.code}</code>
          </pre>
        )}

        <div className={styles.optionsList}>
          {question.options.map((option, index) => {
            let optionClass = styles.optionBtn;
            if (selected) {
              const isThisCorrect =
                Array.isArray(question.answer)
                  ? question.answer.includes(option.value)
                  : option.value === question.answer;
              const isThisSelected = option.value === selected;

              if (isThisCorrect) {
                optionClass += ` ${styles.optionCorrect}`;
              } else if (isThisSelected && !isThisCorrect) {
                optionClass += ` ${styles.optionWrong}`;
              }
            }

            return (
              <button
                key={option.value}
                className={optionClass}
                onClick={() => handleSelect(option.value)}
                disabled={!!selected}
              >
                <span className={styles.optionLetter}>{letterMap[index]}</span>
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>

        {/* 解析区域 */}
        {showExplanation && (
          <div
            className={`${styles.explanation} ${
              isCorrect ? styles.explanationCorrect : styles.explanationWrong
            }`}
          >
            <div className={styles.explanationHeader}>
              {isCorrect ? '✅ 回答正确！' : '❌ 回答错误'}
            </div>
            <div className={styles.explanationBody}>
              <div className={styles.explanationSection}>
                <div className={styles.explanationLabel}>📖 正确答案</div>
                <div className={styles.explanationText}>
                  {Array.isArray(question.answer)
                    ? question.answer
                        .map(v => question.options.find(o => o.value === v)?.label)
                        .join(', ')
                    : question.options.find(o => o.value === question.answer)?.label}
                </div>
              </div>
              <div className={styles.explanationSection}>
                <div className={styles.explanationLabel}>💡 知识点解析</div>
                <div className={styles.explanationText}>
                  {question.explanation.correct}
                </div>
              </div>
              <div className={styles.explanationSection}>
                <div className={styles.explanationLabel}>🧠 答题思路</div>
                <div className={styles.explanationText}>
                  {question.explanation.thinking}
                </div>
              </div>
              {question.explanation.pitfalls && (
                <div className={styles.explanationSection}>
                  <div className={styles.explanationLabel}>⚠️ 常见陷阱</div>
                  <div className={styles.explanationText}>
                    {question.explanation.pitfalls}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 下一题按钮 */}
        {showExplanation && (
          <button className={styles.nextBtn} onClick={handleNext}>
            {questionNumber < totalQuestions ? '下一题 →' : '查看结果 🎯'}
          </button>
        )}
      </div>
    </div>
  );
}
