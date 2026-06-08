import React from 'react';
import type { QuizQuestion } from '@site/src/data/quiz-questions';
import styles from './styles.module.css';

interface AnswerRecord {
  questionId: number;
  selected: string;
  isCorrect: boolean;
}

interface QuizSummaryProps {
  questions: QuizQuestion[];
  answers: AnswerRecord[];
  onRetry: () => void;
  onBack: () => void;
}

export default function QuizSummary({
  questions,
  answers,
  onRetry,
  onBack,
}: QuizSummaryProps): React.ReactElement {
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
    <div className={styles.quizContainer}>
      {/* 得分卡片 */}
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

      {/* 错题回顾 */}
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

      {/* 答对的题也展示 */}
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
    </div>
  );
}
