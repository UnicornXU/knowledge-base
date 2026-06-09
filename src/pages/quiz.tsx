import React, { useState, useCallback, useEffect, useRef } from 'react';
import Layout from '@theme/Layout';
import {
  categories,
  quizQuestions,
} from '@site/src/data/quiz-questions';
import type { QuizQuestion } from '@site/src/data/quiz-questions';
import styles from '@site/src/components/Quiz/styles.module.css';

type QuizState = 'select' | 'config' | 'playing' | 'summary' | 'history' | 'wrongbook';

interface AnswerRecord {
  questionId: number;
  selected: string;
  isCorrect: boolean;
}

interface QuizSession {
  id: string;
  category: string;
  categoryLabel: string;
  score: number;
  correctCount: number;
  totalCount: number;
  date: string;
  duration: number; // seconds
}

interface WrongBookEntry {
  questionId: number;
  category: string;
  wrongCount: number;
  lastWrongDate: string;
  mastered: boolean;
}

// ===== localStorage 工具 =====
const STORAGE_KEYS = {
  HISTORY: 'quiz_history',
  WRONG_BOOK: 'quiz_wrong_book',
} as const;

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // storage full or disabled
  }
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}分${s}秒` : `${s}秒`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hour = d.getHours().toString().padStart(2, '0');
  const min = d.getMinutes().toString().padStart(2, '0');
  return `${month}月${day}日 ${hour}:${min}`;
}

// ===== 题数选项 =====
const COUNT_OPTIONS = [
  { value: 5, label: '5 题', desc: '快速练习' },
  { value: 10, label: '10 题', desc: '标准模式' },
  { value: 20, label: '20 题', desc: '深度练习' },
  { value: 0, label: '全部', desc: '挑战全量' },
];

// ===== 计时器 Hook =====
function useTimer(isRunning: boolean) {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const reset = useCallback(() => setSeconds(0), []);

  return { seconds, reset };
}

// ===== 主组件 =====
export default function Quiz(): React.ReactElement {
  const [state, setState] = useState<QuizState>('select');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [timerRunning, setTimerRunning] = useState(false);
  const { seconds: elapsed, reset: resetTimer } = useTimer(timerRunning);

  // 持久化数据
  const [history, setHistory] = useState<QuizSession[]>([]);
  const [wrongBook, setWrongBook] = useState<WrongBookEntry[]>([]);

  // 加载持久化数据
  useEffect(() => {
    setHistory(loadFromStorage<QuizSession[]>(STORAGE_KEYS.HISTORY, []));
    setWrongBook(loadFromStorage<WrongBookEntry[]>(STORAGE_KEYS.WRONG_BOOK, []));
  }, []);

  const categoryLabel = categories.find(c => c.key === selectedCategory)?.label || '';

  // 开始测验
  const startQuiz = useCallback((category: string, count: number) => {
    const filtered = quizQuestions.filter(q => q.category === category);
    const actualCount = count === 0 ? filtered.length : Math.min(count, filtered.length);
    const shuffled = shuffleArray(filtered).slice(0, actualCount);
    setQuestions(shuffled);
    setCurrentIndex(0);
    setAnswers([]);
    setSelectedCategory(category);
    resetTimer();
    setTimerRunning(true);
    setState('playing');
  }, [resetTimer]);

  // 答题回调
  const handleNext = useCallback(
    (questionId: number, selected: string, isCorrect: boolean) => {
      const newAnswers = [...answers, { questionId, selected, isCorrect }];
      setAnswers(newAnswers);

      // 更新错题本
      if (!isCorrect) {
        const currentWrongBook = loadFromStorage<WrongBookEntry[]>(STORAGE_KEYS.WRONG_BOOK, []);
        const existing = currentWrongBook.find(e => e.questionId === questionId);
        if (existing) {
          existing.wrongCount += 1;
          existing.lastWrongDate = new Date().toISOString();
          existing.mastered = false;
        } else {
          currentWrongBook.push({
            questionId,
            category: selectedCategory || '',
            wrongCount: 1,
            lastWrongDate: new Date().toISOString(),
            mastered: false,
          });
        }
        saveToStorage(STORAGE_KEYS.WRONG_BOOK, currentWrongBook);
        setWrongBook(currentWrongBook);
      } else {
        // 答对了，标记为已掌握
        const currentWrongBook = loadFromStorage<WrongBookEntry[]>(STORAGE_KEYS.WRONG_BOOK, []);
        const existing = currentWrongBook.find(e => e.questionId === questionId);
        if (existing) {
          existing.mastered = true;
        }
        saveToStorage(STORAGE_KEYS.WRONG_BOOK, currentWrongBook);
        setWrongBook(currentWrongBook);
      }

      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setTimerRunning(false);
        // 保存历史记录
        const correctCount = newAnswers.filter(a => a.isCorrect).length;
        const score = Math.round((correctCount / questions.length) * 100);
        const session: QuizSession = {
          id: Date.now().toString(),
          category: selectedCategory || '',
          categoryLabel,
          score,
          correctCount,
          totalCount: questions.length,
          date: new Date().toISOString(),
          duration: elapsed,
        };
        const currentHistory = loadFromStorage<QuizSession[]>(STORAGE_KEYS.HISTORY, []);
        currentHistory.unshift(session);
        // 只保留最近 50 条
        if (currentHistory.length > 50) currentHistory.length = 50;
        saveToStorage(STORAGE_KEYS.HISTORY, currentHistory);
        setHistory(currentHistory);
        setState('summary');
      }
    },
    [answers, currentIndex, questions.length, selectedCategory, categoryLabel, elapsed]
  );

  const handleRetry = useCallback(() => {
    if (selectedCategory) {
      startQuiz(selectedCategory, questionCount);
    }
  }, [selectedCategory, startQuiz, questionCount]);

  const handleBack = useCallback(() => {
    setState('select');
    setSelectedCategory(null);
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers([]);
    setTimerRunning(false);
    resetTimer();
  }, [resetTimer]);

  // 清除历史
  const clearHistory = useCallback(() => {
    saveToStorage(STORAGE_KEYS.HISTORY, []);
    setHistory([]);
  }, []);

  // 清除错题本
  const clearWrongBook = useCallback(() => {
    saveToStorage(STORAGE_KEYS.WRONG_BOOK, []);
    setWrongBook([]);
  }, []);

  // 移除单个错题
  const removeWrongEntry = useCallback((questionId: number) => {
    const updated = wrongBook.filter(e => e.questionId !== questionId);
    saveToStorage(STORAGE_KEYS.WRONG_BOOK, updated);
    setWrongBook(updated);
  }, [wrongBook]);

  // ===== 分类选择页面 =====
  if (state === 'select') {
    const activeWrongCount = wrongBook.filter(e => !e.mastered).length;

    return (
      <Layout title="随堂测验" description="前端面试题随堂测验">
        <div className={styles.quizContainer}>
          <div className={styles.quizHero}>
            <h1 className={styles.quizHeroTitle}>📝 随堂测验</h1>
            <p className={styles.quizHeroSubtitle}>
              选择一个分类开始挑战，支持自定义题数、计时模式，答完即刻查看解析。
            </p>
          </div>

          <div className={styles.categoryGrid}>
            {categories.map(cat => (
              <div
                key={cat.key}
                className={styles.categoryCard}
                onClick={() => {
                  setSelectedCategory(cat.key);
                  setState('config');
                }}
              >
                <div className={styles.categoryIcon}>{cat.icon}</div>
                <div className={styles.categoryLabel}>{cat.label}</div>
                <div className={styles.categoryCount}>{cat.count} 道题</div>
              </div>
            ))}
          </div>

          {/* 功能入口 */}
          <div className={styles.featureRow}>
            <div
              className={styles.featureCard}
              onClick={() => setState('wrongbook')}
            >
              <span className={styles.featureIcon}>📕</span>
              <span className={styles.featureLabel}>错题本</span>
              {activeWrongCount > 0 && (
                <span className={styles.featureBadge}>{activeWrongCount}</span>
              )}
            </div>
            <div
              className={styles.featureCard}
              onClick={() => setState('history')}
            >
              <span className={styles.featureIcon}>📊</span>
              <span className={styles.featureLabel}>答题历史</span>
              {history.length > 0 && (
                <span className={styles.featureBadge}>{history.length}</span>
              )}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // ===== 题数配置页面 =====
  if (state === 'config' && selectedCategory) {
    const cat = categories.find(c => c.key === selectedCategory);
    const maxCount = cat?.count || 10;

    return (
      <Layout title="测验配置" description="选择题数和模式">
        <div className={styles.quizContainer}>
          <div className={styles.quizHero}>
            <h1 className={styles.quizHeroTitle}>
              {cat?.icon} {cat?.label}
            </h1>
            <p className={styles.quizHeroSubtitle}>
              选择题数，开始挑战
            </p>
          </div>

          <div className={styles.countGrid}>
            {COUNT_OPTIONS.map(opt => {
              const actualCount = opt.value === 0 ? maxCount : Math.min(opt.value, maxCount);
              return (
                <div
                  key={opt.value}
                  className={`${styles.countCard} ${questionCount === opt.value ? styles.countCardActive : ''}`}
                  onClick={() => setQuestionCount(opt.value)}
                >
                  <div className={styles.countNumber}>{opt.label}</div>
                  <div className={styles.countDesc}>{opt.desc}</div>
                  <div className={styles.countActual}>实际 {actualCount} 题</div>
                </div>
              );
            })}
          </div>

          <div className={styles.configActions}>
            <button
              className={styles.startBtn}
              onClick={() => startQuiz(selectedCategory, questionCount)}
            >
              🚀 开始答题
            </button>
            <button className={styles.backBtn} onClick={handleBack}>
              ← 返回选择
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // ===== 答题页面 =====
  if (state === 'playing' && questions.length > 0) {
    const currentQuestion = questions[currentIndex];

    return (
      <Layout title="随堂测验" description="前端面试题随堂测验">
        <div className={styles.quizContainer}>
          {/* 计时器 */}
          <div className={styles.timerBar}>
            <span className={styles.timerIcon}>⏱️</span>
            <span className={styles.timerText}>{formatDuration(elapsed)}</span>
          </div>

          <QuizCardInline
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

  // ===== 结果页面 =====
  if (state === 'summary') {
    return (
      <Layout title="测验结果" description={`${categoryLabel}测验结果`}>
        <div className={styles.quizContainer}>
          <QuizSummaryInline
            questions={questions}
            answers={answers}
            duration={elapsed}
            onRetry={handleRetry}
            onBack={handleBack}
          />
        </div>
      </Layout>
    );
  }

  // ===== 答题历史页面 =====
  if (state === 'history') {
    return (
      <Layout title="答题历史" description="查看答题历史记录">
        <div className={styles.quizContainer}>
          <div className={styles.quizHero}>
            <h1 className={styles.quizHeroTitle}>📊 答题历史</h1>
            <p className={styles.quizHeroSubtitle}>
              共 {history.length} 次测验记录
            </p>
          </div>

          {history.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>📭</span>
              <p>还没有答题记录，快去挑战吧！</p>
            </div>
          ) : (
            <>
              {/* 统计概览 */}
              <div className={styles.historyStats}>
                <div className={styles.historyStatItem}>
                  <div className={styles.historyStatValue}>{history.length}</div>
                  <div className={styles.historyStatLabel}>总次数</div>
                </div>
                <div className={styles.historyStatItem}>
                  <div className={styles.historyStatValue}>
                    {Math.round(history.reduce((s, h) => s + h.score, 0) / history.length)}分
                  </div>
                  <div className={styles.historyStatLabel}>平均分</div>
                </div>
                <div className={styles.historyStatItem}>
                  <div className={styles.historyStatValue}>
                    {Math.max(...history.map(h => h.score))}分
                  </div>
                  <div className={styles.historyStatLabel}>最高分</div>
                </div>
              </div>

              <div className={styles.historyList}>
                {history.map(session => (
                  <div key={session.id} className={styles.historyItem}>
                    <div className={styles.historyItemLeft}>
                      <div className={styles.historyCategory}>{session.categoryLabel}</div>
                      <div className={styles.historyDate}>{formatDate(session.date)}</div>
                    </div>
                    <div className={styles.historyItemRight}>
                      <div className={`${styles.historyScore} ${
                        session.score >= 90 ? styles.scoreExcellent :
                        session.score >= 70 ? styles.scoreGood :
                        session.score >= 60 ? styles.scoreFair : styles.scorePoor
                      }`}>
                        {session.score}分
                      </div>
                      <div className={styles.historyDetail}>
                        {session.correctCount}/{session.totalCount} · {formatDuration(session.duration)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.configActions}>
                <button className={styles.dangerBtn} onClick={clearHistory}>
                  🗑️ 清除记录
                </button>
                <button className={styles.backBtn} onClick={handleBack}>
                  ← 返回选择
                </button>
              </div>
            </>
          )}
        </div>
      </Layout>
    );
  }

  // ===== 错题本页面 =====
  if (state === 'wrongbook') {
    const activeEntries = wrongBook.filter(e => !e.mastered);
    const masteredEntries = wrongBook.filter(e => e.mastered);

    return (
      <Layout title="错题本" description="查看和复习错题">
        <div className={styles.quizContainer}>
          <div className={styles.quizHero}>
            <h1 className={styles.quizHeroTitle}>📕 错题本</h1>
            <p className={styles.quizHeroSubtitle}>
              {activeEntries.length} 道待复习 · {masteredEntries.length} 道已掌握
            </p>
          </div>

          {wrongBook.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>🎉</span>
              <p>错题本是空的，继续保持！</p>
            </div>
          ) : (
            <>
              {activeEntries.length > 0 && (
                <div className={styles.reviewSection}>
                  <h3 className={styles.reviewTitle}>
                    ❌ 待复习（{activeEntries.length} 题）
                  </h3>
                  {activeEntries.map(entry => {
                    const question = quizQuestions.find(q => q.id === entry.questionId);
                    if (!question) return null;
                    const correctLabel = Array.isArray(question.answer)
                      ? question.answer.map(v => question.options.find(o => o.value === v)?.label).join(', ')
                      : question.options.find(o => o.value === question.answer)?.label;
                    return (
                      <div key={entry.questionId} className={styles.wrongBookItem}>
                        <div className={styles.wrongBookQuestion}>
                          <span className={styles.wrongBookCategory}>
                            {categories.find(c => c.key === entry.category)?.icon}
                          </span>
                          {question.question}
                        </div>
                        <div className={styles.wrongBookMeta}>
                          <span>错误次数：{entry.wrongCount}</span>
                          <span>正确答案：{correctLabel}</span>
                        </div>
                        <div className={styles.wrongBookActions}>
                          <button
                            className={styles.wrongBookBtn}
                            onClick={() => removeWrongEntry(entry.questionId)}
                          >
                            ✅ 标记掌握
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {masteredEntries.length > 0 && (
                <div className={styles.reviewSection}>
                  <h3 className={styles.reviewTitle}>
                    ✅ 已掌握（{masteredEntries.length} 题）
                  </h3>
                  {masteredEntries.map(entry => {
                    const question = quizQuestions.find(q => q.id === entry.questionId);
                    if (!question) return null;
                    return (
                      <div key={entry.questionId} className={`${styles.wrongBookItem} ${styles.wrongBookMastered}`}>
                        <div className={styles.wrongBookQuestion}>
                          {question.question}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className={styles.configActions}>
                <button className={styles.dangerBtn} onClick={clearWrongBook}>
                  🗑️ 清空错题本
                </button>
                <button className={styles.backBtn} onClick={handleBack}>
                  ← 返回选择
                </button>
              </div>
            </>
          )}
        </div>
      </Layout>
    );
  }

  return <Layout title="随堂测验"><div>加载中...</div></Layout>;
}

// ===== 内联 QuizCard 组件 =====
function QuizCardInline({
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

  useEffect(() => {
    setSelected(null);
    setShowExplanation(false);
  }, [question.id]);

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

      <div className={styles.questionCard}>
        <div className={styles.questionHeader}>
          <span
            className={`${styles.difficultyBadge} ${
              styles[`difficulty${question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}`]
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

        {showExplanation && (
          <button className={styles.nextBtn} onClick={handleNext}>
            {questionNumber < totalQuestions ? '下一题 →' : '查看结果 🎯'}
          </button>
        )}
      </div>
    </div>
  );
}

// ===== 内联 QuizSummary 组件 =====
function QuizSummaryInline({
  questions,
  answers,
  duration,
  onRetry,
  onBack,
}: {
  questions: QuizQuestion[];
  answers: AnswerRecord[];
  duration: number;
  onRetry: () => void;
  onBack: () => void;
}): React.ReactElement {
  const correctCount = answers.filter(a => a.isCorrect).length;
  const totalCount = questions.length;
  const score = Math.round((correctCount / totalCount) * 100);

  const getScoreClass = () => {
    if (score >= 90) return styles.scoreExcellent;
    if (score >= 70) return styles.scoreGood;
    if (score >= 60) return styles.scoreFair;
    return styles.scorePoor;
  };

  const getTitle = () => {
    if (score >= 90) return '🎉 太棒了！';
    if (score >= 70) return '👍 不错！';
    if (score >= 60) return '💪 继续加油！';
    return '📚 还需努力！';
  };

  const getSubtitle = () => {
    if (score >= 90) return '你对这些知识点掌握得非常好！';
    if (score >= 70) return '大部分知识点都掌握了，再巩固一下错题吧。';
    if (score >= 60) return '基本及格，但还有提升空间，看看错题解析吧。';
    return '别灰心，认真看一下错题解析，下次一定能做得更好！';
  };

  const wrongAnswers = answers.filter(a => !a.isCorrect);
  const rightAnswers = answers.filter(a => a.isCorrect);

  return (
    <>
      <div className={styles.summaryCard}>
        <div className={`${styles.scoreCircle} ${getScoreClass()}`}>
          {score}
          <span className={styles.scorePercent}>分</span>
        </div>
        <h2 className={styles.summaryTitle}>{getTitle()}</h2>
        <p className={styles.summarySubtitle}>{getSubtitle()}</p>

        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <div className={styles.statValue} style={{ color: '#10b981' }}>
              {correctCount}
            </div>
            <div className={styles.statLabel}>答对</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue} style={{ color: '#ef4444' }}>
              {totalCount - correctCount}
            </div>
            <div className={styles.statLabel}>答错</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue} style={{ color: 'var(--ifm-color-primary)' }}>
              {totalCount}
            </div>
            <div className={styles.statLabel}>总题数</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue} style={{ color: '#f59e0b' }}>
              ⏱️ {formatDuration(duration)}
            </div>
            <div className={styles.statLabel}>用时</div>
          </div>
        </div>

        <div className={styles.actionButtons}>
          <button className={styles.retryBtn} onClick={onRetry}>
            🔄 再来一次
          </button>
          <button className={styles.backBtn} onClick={onBack}>
            ← 返回选择
          </button>
        </div>
      </div>

      {wrongAnswers.length > 0 && (
        <div className={styles.reviewSection}>
          <h3 className={styles.reviewTitle}>
            ❌ 错题回顾（{wrongAnswers.length} 题）
          </h3>
          {wrongAnswers.map(record => {
            const question = questions.find(q => q.id === record.questionId)!;
            const correctLabel = Array.isArray(question.answer)
              ? question.answer
                  .map(v => question.options.find(o => o.value === v)?.label)
                  .join(', ')
              : question.options.find(o => o.value === question.answer)?.label;
            const selectedLabel = question.options.find(
              o => o.value === record.selected
            )?.label;

            return (
              <div key={record.questionId} className={styles.reviewItem}>
                <div className={styles.reviewQuestionText}>
                  {question.question}
                </div>
                <div className={styles.reviewAnswer}>
                  <strong>你的答案：</strong>{selectedLabel}
                  <br />
                  <strong>正确答案：</strong>{correctLabel}
                  <br />
                  <strong>解析：</strong>{question.explanation.correct}
                  {question.explanation.pitfalls && (
                    <>
                      <br />
                      <strong>常见陷阱：</strong>{question.explanation.pitfalls}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {rightAnswers.length > 0 && (
        <div className={styles.reviewSection}>
          <h3 className={styles.reviewTitle}>
            ✅ 答对题目（{rightAnswers.length} 题）
          </h3>
          {rightAnswers.map(record => {
            const question = questions.find(q => q.id === record.questionId)!;
            return (
              <div
                key={record.questionId}
                className={`${styles.reviewItem} ${styles.reviewItemCorrect}`}
              >
                <div className={styles.reviewQuestionText}>
                  {question.question}
                </div>
                <div className={styles.reviewAnswer}>
                  <strong>知识点：</strong>{question.explanation.correct}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
