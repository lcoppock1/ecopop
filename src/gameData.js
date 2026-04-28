import GameEngine from './logic/GameEngine';

export { LEVEL_CONFIG, LEVEL1_CONFIG } from './levelConfig.js';

// This is the data for my recycling tiles
// I'm using numbers 1-4 to represent different materials
// "Clean Future" brighter tile colors — pop against the dark navy board
// image: the actual PNG sprites with backgrounds removed via remove.bg
// icon: keeping the emoji as a fallback just in case
export const TILE_TYPES = {
  1: { name: 'Glass',   color: '#66DE93', icon: '🪟', image: require('../assets/glass-tile.png') },
  2: { name: 'Plastic', color: '#60A5FA', icon: '🧴', image: require('../assets/plastic-tile.png') },
  3: { name: 'Paper',   color: '#FDBA74', icon: '📄', image: require('../assets/paper-tile.png') },
  4: { name: 'Metal',   color: '#C084FC', icon: '🔩', image: require('../assets/metal-tile.png') },
};

// Real recycling / sustainability facts organized by material type
// When a player beats a level, we show them a fact based on what they matched the most
// (Sourced from EPA, National Geographic, and recycling industry data)
export const ECO_FACTS = {
  1: [ // Glass
    'Glass is 100% recyclable and can be recycled endlessly without losing quality.',
    'Recycling one glass bottle saves enough energy to power a lightbulb for 4 hours.',
    'It takes 1 million years for a glass bottle to decompose in a landfill.',
    'Making glass from recycled material cuts water pollution by 50%.',
  ],
  2: [ // Plastic
    'Only 9% of all plastic ever produced has been recycled.',
    'A single plastic bottle takes 450 years to decompose.',
    'Recycling one U.S. ton of plastic saves 7,200 kWh of energy.',
    'Millions of tons of plastic enter the ocean every single year.',
  ],
  3: [ // Paper
    'Recycling one U.S. ton of paper saves 17 trees and 7,000 gallons of water.',
    'Paper can be recycled 5-7 times before the fibers become too short.',
    'The average American uses about 680 pounds of paper per year.',
    'Recycling paper uses 70% less energy than making it from raw wood.',
  ],
  4: [ // Metal
    'Recycling aluminum saves 95% of the energy needed to make it from raw materials.',
    'A recycled aluminum can returns to the shelf as a new can in just 60 days.',
    'Steel is the most recycled material in the world.',
    'One recycled tin can saves enough energy to power a TV for 3 hours.',
  ],
};

/** Clamp to 1–4 so ECO_FACTS always resolves (NaN/undefined → glass). */
export function normalizeMaterialKey(materialKey) {
  const n = Number(materialKey);
  if (!Number.isFinite(n)) return 1;
  return Math.min(4, Math.max(1, Math.round(n)));
}

/** Random fact for a material id (1–4); safe if keys are missing (returns ''). */
export function pickRandomEcoFact(materialKey) {
  const k = normalizeMaterialKey(materialKey);
  const list = ECO_FACTS?.[k] ?? ECO_FACTS?.[1];
  if (!Array.isArray(list) || list.length === 0) return '';
  return list[Math.floor(Math.random() * list.length)];
}

// Each level has its own environment theme so every level LOOKS and FEELS different
// This is what my MVP describes — "the world becomes cleaner and greener"
// polluted/cleanColor = win modal transition, boardColor = game board bg,
// screenBg = screen tint, meterColor = progress bar — all change per level
// boardColor = the game board background for each level (so they all LOOK different)
// screenBg = the main screen background tint (subtle shift per environment)
// meterColor = the progress bar color — matches the environment vibe
export const ENVIRONMENT_THEMES = {
  1: { name: 'Neighborhood', pollutedColor: '#4A3728', cleanColor: '#2D5A27', icon: '🏘️', image: require('../assets/neighborhood-tile.png'), boardColor: '#1E2A1E', screenBg: '#0F1A12', meterColor: '#66DE93' },
  2: { name: 'City Park',    pollutedColor: '#3D3D3D', cleanColor: '#1B7A3D', icon: '🌳', image: require('../assets/park-tile.png'),         boardColor: '#1A2B1A', screenBg: '#0D1A0F', meterColor: '#4CAF50' },
  3: { name: 'River',        pollutedColor: '#3A4A3A', cleanColor: '#1565C0', icon: '🏞️', image: require('../assets/river-tile.png'),        boardColor: '#162030', screenBg: '#0C1524', meterColor: '#40C4FF' },
  4: { name: 'Ocean',        pollutedColor: '#2C3E50', cleanColor: '#0277BD', icon: '🌊', image: require('../assets/ocean-tile.png'),        boardColor: '#0F1E30', screenBg: '#0A1525', meterColor: '#29B6F6' },
  5: { name: 'Globe',        pollutedColor: '#37474F', cleanColor: '#1DB954', icon: '🌍', image: require('../assets/global-tile.png'),       boardColor: '#1A1A2E', screenBg: '#10101E', meterColor: '#00E676' },
};

export const LEVEL1_ENV = ENVIRONMENT_THEMES[1];

// This function creates the random 6x6 grid for gameplay
// UPGRADED: now it makes sure there are NO pre-made matches on the board
// and that the player has at least one valid move (so they don't get stuck)
export const generateRandomGrid = () => {
  let grid;
  let outerAttempts = 0;
  const MAX_OUTER = 4000;

  // Keep generating until we get a fair board (must use same match rules as GameEngine — old checkAny-only
  // logic could disagree and loop forever, freezing the app / white screen on web)
  do {
    outerAttempts++;
    grid = [];
    for (let r = 0; r < 6; r++) {
      const row = [];
      for (let c = 0; c < 6; c++) {
        let tile;
        let inner = 0;
        do {
          tile = Math.floor(Math.random() * 4) + 1;
          inner++;
          if (inner > 100) {
            tile = ((tile % 4) + 1);
            break;
          }
        } while (
          (c >= 2 && row[c - 1] === tile && row[c - 2] === tile) ||
          (r >= 2 && grid[r - 1][c] === tile && grid[r - 2][c] === tile) ||
          (r >= 1 &&
            c >= 1 &&
            grid[r - 1][c - 1] === tile &&
            grid[r - 1][c] === tile &&
            grid[r][c - 1] === tile)
        );
        row.push(tile);
      }
      grid.push(row);
    }
  } while (!hasValidMove(grid) && outerAttempts < MAX_OUTER);

  return grid;
};

// Same swap trials as GameEngine.findHint — must use GameEngine.checkForMatches (includes 2×2)
function hasValidMove(grid) {
  if (!Array.isArray(grid) || grid.length !== 6) return false;
  for (let i = 0; i < 6; i++) {
    if (!Array.isArray(grid[i]) || grid[i].length !== 6) return false;
  }
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      if (c < 5) {
        const copy = grid.map(row => [...row]);
        const t = copy[r][c];
        copy[r][c] = copy[r][c + 1];
        copy[r][c + 1] = t;
        if (GameEngine.checkForMatches(copy)) return true;
      }
      if (r < 5) {
        const copy = grid.map(row => [...row]);
        const t = copy[r][c];
        copy[r][c] = copy[r + 1][c];
        copy[r + 1][c] = t;
        if (GameEngine.checkForMatches(copy)) return true;
      }
    }
  }
  return false;
}
