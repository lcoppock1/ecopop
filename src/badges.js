// This is my badge / achievement system for EcoPop !!
// I modeled it after Xbox achievements — once you earn one, it stays forever in AsyncStorage
// Each badge has an ID, display name, description, and icon (using emojis for now, swap for images later)
// The badges show up in the end-of-level popup AND the Level Select screen at the bottom
import { loadProgress, saveProgress } from './storage';

export const BADGE_DEFINITIONS = {
  recycling_rookie: {
    id: 'recycling_rookie',
    name: 'Recycling Rookie',
    description: 'Complete Level 1',
    icon: '♻️',
  },
  paper_pro: {
    id: 'paper_pro',
    name: 'Paper Pro',
    description: 'Match 50+ paper items',
    icon: '📄',
  },
  glass_guardian: {
    id: 'glass_guardian',
    name: 'Glass Guardian',
    description: 'Match 50+ glass items',
    icon: '🥃',
  },
  plastic_patrol: {
    id: 'plastic_patrol',
    name: 'Plastic Patrol',
    description: 'Match 50+ plastic items',
    icon: '🧴',
  },
  metal_master: {
    id: 'metal_master',
    name: 'Metal Master',
    description: 'Match 50+ metal items',
    icon: '🔧',
  },
  earth_warrior: {
    id: 'earth_warrior',
    name: 'Earth Warrior',
    description: 'Reach 10,000 cumulative Eco-Score',
    icon: '🌍',
  },
  combo_king: {
    id: 'combo_king',
    name: 'Combo King',
    description: 'Get a 5+ combo chain',
    icon: '🔥',
  },
  five_star_general: {
    id: 'five_star_general',
    name: 'Five Star General',
    description: 'Get 3 stars on all 5 levels',
    icon: '⭐',
  },
};

// This function runs after every level completion — checks ALL badge conditions
// and awards any that the player just earned for the first time
// It returns an array of newly earned badges so I can show them in the win popup
const DEFAULT_MATERIAL = { 1: 0, 2: 0, 3: 0, 4: 0 };

function normalizeMaterialStats(raw) {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...DEFAULT_MATERIAL };
  }
  return { ...DEFAULT_MATERIAL, ...raw };
}

/**
 * After a level win, pass `savedProgress` from `saveLevelResult` so badge updates merge
 * into the same snapshot (avoids a second load/save cycle that can race on web/localStorage).
 */
export async function checkAndAwardBadges(gameStats, savedProgress = null) {
  const progress =
    savedProgress != null && typeof savedProgress === 'object' && !Array.isArray(savedProgress)
      ? savedProgress
      : await loadProgress();
  if (progress == null || typeof progress !== 'object') {
    return [];
  }
  const rawEarned = progress.earnedBadges;
  const badges =
    rawEarned != null && typeof rawEarned === 'object' && !Array.isArray(rawEarned) ? { ...rawEarned } : {};
  const materialStats = normalizeMaterialStats(progress.materialStats);
  const newBadges = [];

  // Add this game's material counts to the lifetime totals (so badges accumulate over time)
  if (gameStats?.materialCounts) {
    for (const [type, count] of Object.entries(gameStats.materialCounts)) {
      materialStats[type] = (materialStats[type] || 0) + count;
    }
  }

  const m1 = Number(materialStats[1]) || 0;
  const m2 = Number(materialStats[2]) || 0;
  const m3 = Number(materialStats[3]) || 0;
  const m4 = Number(materialStats[4]) || 0;

  // --- Check each badge condition ---

  // "Recycling Rookie" — just beat Level 1 at least once
  if (!badges.recycling_rookie && progress.completedLevels?.[1]) {
    badges.recycling_rookie = { earnedAt: Date.now() };
    newBadges.push(BADGE_DEFINITIONS.recycling_rookie);
  }

  // Material-specific badges — 50+ of a single type lifetime
  // (1=Glass, 2=Plastic, 3=Paper, 4=Metal — from gameData.js)
  if (!badges.glass_guardian && m1 >= 50) {
    badges.glass_guardian = { earnedAt: Date.now() };
    newBadges.push(BADGE_DEFINITIONS.glass_guardian);
  }
  if (!badges.plastic_patrol && m2 >= 50) {
    badges.plastic_patrol = { earnedAt: Date.now() };
    newBadges.push(BADGE_DEFINITIONS.plastic_patrol);
  }
  if (!badges.paper_pro && m3 >= 50) {
    badges.paper_pro = { earnedAt: Date.now() };
    newBadges.push(BADGE_DEFINITIONS.paper_pro);
  }
  if (!badges.metal_master && m4 >= 50) {
    badges.metal_master = { earnedAt: Date.now() };
    newBadges.push(BADGE_DEFINITIONS.metal_master);
  }

  // "Earth Warrior" — lifetime eco score hits 10,000
  if (!badges.earth_warrior && (Number(progress.totalEcoScore) || 0) >= 10000) {
    badges.earth_warrior = { earnedAt: Date.now() };
    newBadges.push(BADGE_DEFINITIONS.earth_warrior);
  }

  // "Combo King" — got a 5+ chain in a single turn
  if (!badges.combo_king && (gameStats?.maxCombo ?? 0) >= 5) {
    badges.combo_king = { earnedAt: Date.now() };
    newBadges.push(BADGE_DEFINITIONS.combo_king);
  }

  // "Five Star General" — all 5 levels with perfect 3-star rating
  const allPerfect = [1, 2, 3, 4, 5].every(
    id => progress.completedLevels?.[id]?.stars === 3
  );
  if (!badges.five_star_general && allPerfect) {
    badges.five_star_general = { earnedAt: Date.now() };
    newBadges.push(BADGE_DEFINITIONS.five_star_general);
  }

  // Save everything back to AsyncStorage so it persists when they close the app
  progress.earnedBadges = badges;
  progress.materialStats = materialStats;
  await saveProgress(progress);

  return newBadges; // I pass these back so GameScreen can show them in the win popup !!
}

// Pulls the list of all badges the player has earned so far
// I use this in LevelSelect to display the achievements section at the bottom
export async function getEarnedBadges() {
  const progress = await loadProgress();
  return progress.earnedBadges || {};
}
