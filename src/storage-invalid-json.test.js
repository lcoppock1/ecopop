/**
 * Invalid stored JSON — isolated file because Vitest may run tests within a file concurrently.
 */
import { describe, it, expect } from 'vitest';
import { asyncStorageKV } from './test/asyncStorageMock.js';
import { loadProgress } from './storage.js';

describe('storage.js invalid persisted JSON', () => {
  it('falls back to defaults for JSON null / non-object snapshots', async () => {
    Object.keys(asyncStorageKV).forEach((k) => delete asyncStorageKV[k]);
    asyncStorageKV.playerProgress = 'null';
    let p = await loadProgress();
    expect(p.completedLevels).toEqual({});

    Object.keys(asyncStorageKV).forEach((k) => delete asyncStorageKV[k]);
    asyncStorageKV.playerProgress = '[1,2,3]';
    p = await loadProgress();
    expect(p.completedLevels).toEqual({});
  });
});
