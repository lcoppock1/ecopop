// This is the data for my recycling tiles
// I'm using numbers 1-4 to represent different materials/Icons
export const TILE_TYPES = {
    1: { name: 'Glass', color: '#81c784' },   // Green
    2: { name: 'Plastic', color: '#64b5f6' }, // Blue
    3: { name: 'Paper', color: '#ffb74d' },   // Orange
    4: { name: 'Metal', color: '#ba68c8' },   // Purple
  };
  
  // This function creates the random 6x6 grid for gameplay
  export const generateRandomGrid = () => {
    let initialGrid = [];
    for (let r = 0; r < 6; r++) {
      let row = [];
      for (let c = 0; c < 6; c++) {
        // Logic to pick a random material (1 through 4)
        const randomTile = Math.floor(Math.random() * 4) + 1;
        row.push(randomTile);
      }
      initialGrid.push(row);
    }
    return initialGrid;
  };
  