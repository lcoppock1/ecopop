/**
 * Badge awarding must not drop freshly saved level progress (web AsyncStorage race regression).
 */
import { describe, it, expect } from 'vitest';
import { asyncStorageKV } from './test/asyncStorageMock.js';
import { saveLevelResult } from './storage.js';
import { checkAndAwardBadges } from './badges.js';

describe('badges.js', () => {
  it('checkAndAwardBadges(savedProgress) preserves completedLevels after saveLevelResult', async () => {
    const updated = await saveLevelResult(1, 150, 12);

    await checkAndAwardBadges(
      { materialCounts: { 1: 10, 2: 0, 3: 0, 4: 0 }, maxCombo: 2 },
      updated
    );

    const raw = asyncStorageKV.playerProgress;
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw);
    expect(parsed.completedLevels[1]).toBeTruthy();
    expect(parsed.completedLevels[1].highScore).toBe(150);
    expect(parsed.earnedBadges.recycling_rookie).toBeTruthy();
  });

  it('multiple completes keep stacking badge stats without losing levels', async () => {
    let snap = await saveLevelResult(1, 200, 10);
    await checkAndAwardBadges({ materialCounts: { 1: 5, 2: 0, 3: 0, 4: 0 }, maxCombo: 0 }, snap);

    snap = await saveLevelResult(2, 300, 15);
    await checkAndAwardBadges({ materialCounts: { 2: 8, 3: 0, 4: 0 }, maxCombo: 0 }, snap);

    const parsed = JSON.parse(asyncStorageKV.playerProgress);
    expect(parsed.completedLevels[1].highScore).toBe(200);
    expect(parsed.completedLevels[2].highScore).toBe(300);
    expect(parsed.materialStats[1]).toBeGreaterThanOrEqual(5);
    expect(parsed.materialStats[2]).toBeGreaterThanOrEqual(8);
  });
});
