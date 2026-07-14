import React, {useState} from 'react';
import type {QuizQuestion} from '@site/src/data/quiz-questions';
import styles from './styles.module.css';

interface QuizCardProps {
  question: QuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  onNext: () => void;
}

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

export default function QuizCard({
  question,
  questionNumber,
  totalQuestions,
  onNext,
}: QuizCardProps): React.ReactElement {
  const [selected, setSelected] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const isCorrect = Array.isArray(question.answer)
    ? question.answer.includes(selected ?? '')
    : selected === question.answer;

  const handleSelect = (value: string) => {
    if (selected) return; // 已选择，不可再选
    setSelected(value);
    setShowExplanation(true);
  };

  const letterMap = ['A', 'B', 'C', 'D'];

  return (
    <div>
      {/* 进度条 */}
      <div className={styles.progressText}>
        <span>
          第 {questionNumber} / {totalQuestions} 题
        </span>
        <span>{Math.round((questionNumber / totalQuestions) * 100)}%</span>
      </div>
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{width: `${(questionNumber / totalQuestions) * 100}%`}} />
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
          <span className={styles.questionType}>{typeLabels[question.type]}</span>
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
              const isThisCorrect = Array.isArray(question.answer)
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
            <div className={styles.explanationHeader}>{isCorrect ? '✅ 回答正确！' : '❌ 回答错误'}</div>
            <div className={styles.explanationBody}>
              <div className={styles.explanationSection}>
                <div className={styles.explanationLabel}>📖 正确答案</div>
                <div className={styles.explanationText}>
                  {Array.isArray(question.answer)
                    ? question.answer.join(', ')
                    : question.options.find((o) => o.value === question.answer)?.label}
                </div>
              </div>
              <div className={styles.explanationSection}>
                <div className={styles.explanationLabel}>💡 知识点解析</div>
                <div className={styles.explanationText}>{question.explanation.correct}</div>
              </div>
              <div className={styles.explanationSection}>
                <div className={styles.explanationLabel}>🧠 答题思路</div>
                <div className={styles.explanationText}>{question.explanation.thinking}</div>
              </div>
              {question.explanation.pitfalls && (
                <div className={styles.explanationSection}>
                  <div className={styles.explanationLabel}>⚠️ 常见陷阱</div>
                  <div className={styles.explanationText}>{question.explanation.pitfalls}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 下一题按钮 */}
        {showExplanation && (
          <button className={styles.nextBtn} onClick={onNext}>
            {questionNumber < totalQuestions ? '下一题 →' : '查看结果 🎯'}
          </button>
        )}
      </div>
    </div>
  );
}
