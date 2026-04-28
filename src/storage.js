// This is the "save file" for the whole game
// Using AsyncStorage to save player progress locally (like a mini database on the phone)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LEVEL_CONFIG } from './levelConfig.js';

// This is the key I'm using in AsyncStorage to find the player's save data
const PROGRESS_KEY = 'playerProgress';

// If there's no save data yet (brand new player), start with these defaults
const DEFAULT_PROGRESS = {
  completedLevels: {},   // will hold each level's high score, stars, etc.
  totalEcoScore: 0,      // running total across ALL levels
  totalItemsCleaned: 0,  // how many tiles they've cleared lifetime
  earnedBadges: {},      // badge achievements (keyed by badge ID)
  materialStats: { 1: 0, 2: 0, 3: 0, 4: 0 }, // lifetime counts per material type
};

/** Keeps saves from bricking UI (NaN stars → String.repeat crash; bad totals → NaN EcoMeter). */
function sanitizeCompletedLevels(raw) {
  const out = {};
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const key of Object.keys(raw)) {
    const levelId = Number(key);
    if (!Number.isFinite(levelId)) continue;
    const e = raw[key];
    if (e == null || typeof e !== 'object' || Array.isArray(e)) continue;
    const highScore = Number(e.highScore);
    const stars = Number(e.stars);
    const itemsCleaned = Number(e.itemsCleaned);
    out[levelId] = {
      highScore: Number.isFinite(highScore) ? highScore : 0,
      stars: Number.isFinite(stars) ? Math.min(3, Math.max(0, Math.round(stars))) : 0,
      itemsCleaned: Number.isFinite(itemsCleaned) ? Math.max(0, itemsCleaned) : 0,
    };
  }
  return out;
}

function sanitizeProgressShape(progress) {
  if (!progress || typeof progress !== 'object') {
    return { ...DEFAULT_PROGRESS, materialStats: { ...DEFAULT_PROGRESS.materialStats } };
  }
  const te = Number(progress.totalEcoScore);
  const ti = Number(progress.totalItemsCleaned);
  progress.totalEcoScore = Number.isFinite(te) ? Math.max(0, te) : 0;
  progress.totalItemsCleaned = Number.isFinite(ti) ? Math.max(0, ti) : 0;
  progress.completedLevels = sanitizeCompletedLevels(progress.completedLevels);
  const ms = progress.materialStats;
  progress.materialStats = {
    ...DEFAULT_PROGRESS.materialStats,
    ...(ms != null && typeof ms === 'object' && !Array.isArray(ms) ? ms : {}),
  };
  for (const k of [1, 2, 3, 4]) {
    const v = Number(progress.materialStats[k]);
    progress.materialStats[k] = Number.isFinite(v) ? Math.max(0, v) : 0;
  }
  return progress;
}

// Pulls the player's saved progress from the phone's local storage
// If nothing is saved yet, just returns the defaults so the app doesn't crash
export async function loadProgress() {
  try {
    const raw = await AsyncStorage.getItem(PROGRESS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Saved JSON can be literal `null` or a non-object — never read properties off it
      if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return sanitizeProgressShape({
          ...DEFAULT_PROGRESS,
          materialStats: { ...DEFAULT_PROGRESS.materialStats },
        });
      }
      const safeCompleted =
        parsed.completedLevels != null &&
        typeof parsed.completedLevels === 'object' &&
        !Array.isArray(parsed.completedLevels)
          ? parsed.completedLevels
          : {};
      // Merge with defaults so new fields (like badges) don't break old saves
      const merged = {
        ...DEFAULT_PROGRESS,
        ...parsed,
        completedLevels: { ...DEFAULT_PROGRESS.completedLevels, ...safeCompleted },
        materialStats: { ...DEFAULT_PROGRESS.materialStats, ...(parsed.materialStats ?? {}) },
      };
      return sanitizeProgressShape(merged);
    }
  } catch (_) {
    // If something goes wrong reading, just use defaults (first launch probably)
  }
  return sanitizeProgressShape({
    ...DEFAULT_PROGRESS,
    materialStats: { ...DEFAULT_PROGRESS.materialStats },
  });
}

// Writes the full progress object back to local storage
export async function saveProgress(progress) {
  try {
    await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch (_) {
    // If save fails... not much we can do, just don't crash
  }
}

// This is what gets called when a player finishes a level
// It checks if their new score beats the old one, then updates everything
export async function saveLevelResult(levelId, score, itemsCleaned) {
  const progress = await loadProgress();
  if (!progress.completedLevels || typeof progress.completedLevels !== 'object') {
    progress.completedLevels = {};
  }

  // Check if they already have a saved result for this level
  const prev = progress.completedLevels[levelId];
  const stars = getStarRating(levelId, score);

  // Only overwrite the high score if the new score is actually better
  const shouldUpdate = !prev || score > prev.highScore;

  progress.completedLevels[levelId] = {
    highScore: shouldUpdate ? score : prev.highScore,
    // Always keep the BEST star rating they've ever gotten (don't downgrade them)
    stars: Math.max(stars, prev?.stars ?? 0),
    itemsCleaned: shouldUpdate ? itemsCleaned : Math.max(itemsCleaned, prev.itemsCleaned),
  };

  // Recalculate the lifetime totals by looping through all completed levels
  let totalEco = 0;
  let totalItems = 0;
  for (const key in progress.completedLevels) {
    const entry = progress.completedLevels[key];
    if (entry && typeof entry === 'object') {
      totalEco += entry.highScore ?? 0;
      totalItems += entry.itemsCleaned ?? 0;
    }
  }
  progress.totalEcoScore = totalEco;
  progress.totalItemsCleaned = totalItems;

  // Save it all back to the phone
  await saveProgress(progress);
  return progress;
}

// Figures out how many stars (1-3) based on the score thresholds from gameData.js
// This is like Candy Crush / Angry Birds style star ratings
export function getStarRating(levelId, score) {
  const config = LEVEL_CONFIG?.[levelId];
  if (!config) return 0;

  if (score >= config.threeStarScore) return 3;  // crushed it
  if (score >= config.twoStarScore) return 2;    // solid
  if (score >= config.targetScore) return 1;     // just passed
  return 0;                                      // didn't make it
}

// Sequential unlock logic — Level 1 is always open, 
// but you need at least 1 star on the previous level to unlock the next one
export function isLevelUnlocked(levelId, completedLevels) {
  if (levelId === 1) return true; // Level 1 is always available obviously
  const prev = completedLevels?.[levelId - 1];
  return Number(prev?.stars) >= 1;
}
