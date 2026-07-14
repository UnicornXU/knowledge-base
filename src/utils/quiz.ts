export function shuffleArray<T>(array: readonly T[], random = Math.random): T[] {
  const shuffled = [...array];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

export function isAnswerCorrect(answer: string | string[], selected: string | string[]): boolean {
  const expected = Array.isArray(answer) ? [...answer].sort() : [answer];
  const actual = Array.isArray(selected) ? [...selected].sort() : [selected];
  return expected.length === actual.length && expected.every((value, index) => value === actual[index]);
}

export function calculateScore(correctCount: number, totalCount: number): number {
  return totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
}
