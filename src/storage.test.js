/**
 * Storage + progression logic tests (mirrors web AsyncStorage key/value semantics).
 */
import { describe, it, expect } from 'vitest';
import { asyncStorageKV } from './test/asyncStorageMock.js';
import {
  loadProgress,
  saveProgress,
  saveLevelResult,
  getStarRating,
  isLevelUnlocked,
} from './storage.js';

describe('storage.js', () => {
  it('loadProgress returns defaults when empty', async () => {
    const p = await loadProgress();
    expect(p.completedLevels).toEqual({});
    expect(p.totalEcoScore).toBe(0);
    expect(p.materialStats).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0 });
  });

  it('saveProgress round-trips through JSON', async () => {
    const blob = {
      completedLevels: {},
      totalEcoScore: 0,
      totalItemsCleaned: 0,
      earnedBadges: {},
      materialStats: { 1: 0, 2: 0, 3: 0, 4: 0 },
    };
    await saveProgress(blob);
    const again = await loadProgress();
    expect(again.totalEcoScore).toBe(0);
  });

  it('loadProgress clamps corrupted totals and star counts', async () => {
    asyncStorageKV.playerProgress = JSON.stringify({
      completedLevels: {
        1: { highScore: 100, stars: null, itemsCleaned: 5 },
      },
      totalEcoScore: 'oops',
      totalItemsCleaned: Infinity,
      earnedBadges: {},
      materialStats: { 1: 0, 2: 0, 3: 0, 4: 0 },
    });
    const p = await loadProgress();
    expect(p.completedLevels[1].stars).toBe(0);
    expect(Number.isFinite(p.totalEcoScore)).toBe(true);
    expect(Number.isFinite(p.totalItemsCleaned)).toBe(true);
  });

  it('saveLevelResult aggregates totals across multiple completes', async () => {
    await saveLevelResult(1, 120, 5);
    await saveLevelResult(2, 300, 8);
    const p = await loadProgress();
    expect(p.completedLevels[1].highScore).toBe(120);
    expect(p.completedLevels[2].highScore).toBe(300);
    expect(p.totalEcoScore).toBe(420);
    expect(p.totalItemsCleaned).toBe(13);
  });

  it('getStarRating returns expected tiers for level 1', () => {
    expect(getStarRating(1, 99)).toBe(0);
    expect(getStarRating(1, 100)).toBe(1);
    expect(getStarRating(1, 350)).toBe(3);
  });

  it('isLevelUnlocked follows star gate', () => {
    expect(isLevelUnlocked(1, {})).toBe(true);
    expect(isLevelUnlocked(2, {})).toBe(false);
    expect(isLevelUnlocked(2, { 1: { stars: 1, highScore: 100 } })).toBe(true);
  });
});
