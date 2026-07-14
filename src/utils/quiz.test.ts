import {describe, expect, it} from 'vitest';
import {calculateScore, isAnswerCorrect, shuffleArray} from './quiz';

describe('quiz utilities', () => {
  it('compares single and multiple answers', () => {
    expect(isAnswerCorrect('a', 'a')).toBe(true);
    expect(isAnswerCorrect(['a', 'c'], ['c', 'a'])).toBe(true);
    expect(isAnswerCorrect(['a', 'c'], ['a'])).toBe(false);
  });
  it('calculates scores safely', () => {
    expect(calculateScore(2, 3)).toBe(67);
    expect(calculateScore(0, 0)).toBe(0);
  });
  it('shuffles without mutating its input', () => {
    const input = [1, 2, 3];
    expect(shuffleArray(input, () => 0)).toEqual([2, 3, 1]);
    expect(input).toEqual([1, 2, 3]);
  });
});
