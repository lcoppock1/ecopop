// This is the "save file" for the whole game
// Using AsyncStorage to save player progress locally (like a mini database on the phone)
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Pulls the player's saved progress from the phone's local storage
// If nothing is saved yet, just returns the defaults so the app doesn't crash
export async function loadProgress() {
  try {
    const raw = await AsyncStorage.getItem(PROGRESS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Merge with defaults so new fields (like badges) don't break old saves
      return {
        ...DEFAULT_PROGRESS,
        ...parsed,
        materialStats: { ...DEFAULT_PROGRESS.materialStats, ...parsed.materialStats },
      };
    }
  } catch (_) {
    // If something goes wrong reading, just use defaults (first launch probably)
  }
  return { ...DEFAULT_PROGRESS, materialStats: { ...DEFAULT_PROGRESS.materialStats } };
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
    totalEco += progress.completedLevels[key].highScore;
    totalItems += progress.completedLevels[key].itemsCleaned;
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
  const { LEVEL_CONFIG } = require('./gameData');
  const config = LEVEL_CONFIG[levelId];
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
  const prev = completedLevels[levelId - 1];
  return prev && prev.stars >= 1;
}
