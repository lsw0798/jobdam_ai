import { describe, expect, it } from 'vitest';
import { markFeatureCompleted, readProgress } from './progressService';

function createStorage() {
  const values = new Map();

  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

describe('progressService', () => {
  it('records a completed feature without marking untouched features complete', () => {
    const storage = createStorage();

    markFeatureCompleted('demo-user', 'experience', storage);

    expect(readProgress('demo-user', storage)).toMatchObject({
      experience: { completed: true },
      resume: { completed: false },
    });
  });
});
