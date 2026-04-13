// This is the data for my recycling tiles
// I'm using numbers 1-4 to represent different materials/Icons
// "Clean Future" brighter tile colors — pop against the dark navy board
// icon: emoji placeholder until Adobe Illustrator sprites are exported
// When sprites are ready, add an `image` field with require('../assets/glass.png') etc.
export const TILE_TYPES = {
  1: { name: 'Glass',   color: '#66DE93', icon: '🪟' },
  2: { name: 'Plastic', color: '#60A5FA', icon: '🧴' },
  3: { name: 'Paper',   color: '#FDBA74', icon: '📄' },
  4: { name: 'Metal',   color: '#C084FC', icon: '🔩' },
};

// I changed the level design to be goal-oriented instead of just "reach X score"
// Now each mission is framed as a real eco-project (like building a solar farm!!)
// This is the educational integration part of Phase 4
// mission = what the player sees on the level intro loading screen before they play
// reward = what they "built" when they win — shows on the victory modal
export const LEVEL_CONFIG = {
  1: {
    targetScore: 100, twoStarScore: 200, threeStarScore: 350, maxMoves: 25,
    label: 'Neighborhood Cleanup',
    mission: 'Sort 100 kg of neighborhood waste to plant a Community Garden.',
    reward: 'Community Garden Planted!',
  },
  2: {
    targetScore: 250, twoStarScore: 400, threeStarScore: 600, maxMoves: 22,
    label: 'City Park Rescue',
    mission: 'Recycle 250 kg of park litter to restore the City Playground.',
    reward: 'City Playground Restored!',
  },
  3: {
    targetScore: 400, twoStarScore: 650, threeStarScore: 900, maxMoves: 20,
    label: 'River Revival',
    mission: 'Clean 400 kg of river pollution to revive the Fish Habitat.',
    reward: 'Fish Habitat Revived!',
  },
  4: {
    targetScore: 600, twoStarScore: 900, threeStarScore: 1250, maxMoves: 18,
    label: 'Ocean Sweep',
    mission: 'Remove 600 kg of ocean debris to protect the Coral Reef.',
    reward: 'Coral Reef Protected!',
  },
  5: {
    targetScore: 850, twoStarScore: 1200, threeStarScore: 1600, maxMoves: 16,
    label: 'Global Reset',
    mission: 'Process 850 kg of global waste to power a Solar Farm.',
    reward: 'Solar Farm Online!',
  },
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
    'Recycling one ton of plastic saves 7,200 kWh of energy.',
    '8 million tons of plastic enter the ocean every single year.',
  ],
  3: [ // Paper
    'Recycling one ton of paper saves 17 trees and 7,000 gallons of water.',
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

// Each level has an environment theme — when the player wins,
// the success screen transitions from a "polluted" look to a "clean" look
// (the background color shifts to show the impact of their cleanup)
// Each level has an environment theme — when the player wins,
// the success screen transitions from a "polluted" look to a "clean" look
// (the background color shifts to show the impact of their cleanup)
// I also added icons for each environment so they show up on the level intro & level select cards
export const ENVIRONMENT_THEMES = {
  1: { name: 'Neighborhood', pollutedColor: '#4A3728', cleanColor: '#2D5A27', icon: '🏘️' },
  2: { name: 'City Park',    pollutedColor: '#3D3D3D', cleanColor: '#1B7A3D', icon: '🌳' },
  3: { name: 'River',        pollutedColor: '#3A4A3A', cleanColor: '#1565C0', icon: '🏞️' },
  4: { name: 'Ocean',        pollutedColor: '#2C3E50', cleanColor: '#0277BD', icon: '🌊' },
  5: { name: 'Globe',        pollutedColor: '#37474F', cleanColor: '#1DB954', icon: '🌍' },
};

// This function creates the random 6x6 grid for gameplay
// UPGRADED: now it makes sure there are NO pre-made matches on the board
// and that the player has at least one valid move (so they don't get stuck)
export const generateRandomGrid = () => {
  let grid;
  // Keep generating until we get a fair board
  do {
    grid = [];
    for (let r = 0; r < 6; r++) {
      const row = [];
      for (let c = 0; c < 6; c++) {
        let tile;
        do {
          // Logic to pick a random material (1 through 4)
          tile = Math.floor(Math.random() * 4) + 1;
        } while (
          // Don't let 3 of the same appear in a row horizontally (that would auto-clear)
          (c >= 2 && row[c - 1] === tile && row[c - 2] === tile) ||
          // Same thing but vertically
          (r >= 2 && grid[r - 1][c] === tile && grid[r - 2][c] === tile)
        );
        row.push(tile);
      }
      grid.push(row);
    }
  } while (!hasValidMove(grid)); // if no moves exist, redo the whole thing
  return grid;
};

// Checks every possible swap on the board to see if at least one creates a match
// If none do, the board is a dead end and we need to regenerate
function hasValidMove(grid) {
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 6; c++) {
      // Try swapping right
      if (c < 5 && wouldMatch(grid, r, c, r, c + 1)) return true;
      // Try swapping down
      if (r < 5 && wouldMatch(grid, r, c, r + 1, c)) return true;
    }
  }
  return false;
}

// Helper: does swapping these two tiles create any match?
// Makes a copy so we don't mess up the real grid
function wouldMatch(grid, r1, c1, r2, c2) {
  const copy = grid.map(row => [...row]);
  // Classic swap using a temp variable
  const temp = copy[r1][c1];
  copy[r1][c1] = copy[r2][c2];
  copy[r2][c2] = temp;
  return checkAny(copy);
}

// Quick scan: just checks if there's any 3-in-a-row anywhere (horizontal or vertical)
function checkAny(grid) {
  // Horizontal scan
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] !== 0 && grid[r][c] === grid[r][c + 1] && grid[r][c] === grid[r][c + 2]) return true;
    }
  }
  // Vertical scan
  for (let c = 0; c < 6; c++) {
    for (let r = 0; r < 4; r++) {
      if (grid[r][c] !== 0 && grid[r][c] === grid[r + 1][c] && grid[r][c] === grid[r + 2][c]) return true;
    }
  }
  return false;
}
