// Numeric mission thresholds / labels — kept separate from asset-heavy gameData so Node/Vitest can import without Metro png requires.

export const LEVEL_CONFIG = {
  1: {
    targetScore: 100,
    twoStarScore: 200,
    threeStarScore: 350,
    maxMoves: 25,
    label: 'Neighborhood Cleanup',
    mission: 'Sort 100 lb of neighborhood waste to plant a Community Garden.',
    reward: 'Community Garden Planted!',
  },
  2: {
    targetScore: 250,
    twoStarScore: 400,
    threeStarScore: 600,
    maxMoves: 22,
    label: 'City Park Rescue',
    mission: 'Recycle 250 lb of park litter to restore the City Playground.',
    reward: 'City Playground Restored!',
  },
  3: {
    targetScore: 400,
    twoStarScore: 650,
    threeStarScore: 900,
    maxMoves: 20,
    label: 'River Revival',
    mission: 'Clean 400 lb of river pollution to revive the Fish Habitat.',
    reward: 'Fish Habitat Revived!',
  },
  4: {
    targetScore: 600,
    twoStarScore: 900,
    threeStarScore: 1250,
    maxMoves: 18,
    label: 'Ocean Sweep',
    mission: 'Remove 600 lb of ocean debris to protect the Coral Reef.',
    reward: 'Coral Reef Protected!',
  },
  5: {
    targetScore: 850,
    twoStarScore: 1200,
    threeStarScore: 1600,
    maxMoves: 16,
    label: 'Global Reset',
    mission: 'Process 850 lb of global waste to power a Solar Farm.',
    reward: 'Solar Farm Online!',
  },
};

export const LEVEL1_CONFIG = LEVEL_CONFIG[1];
