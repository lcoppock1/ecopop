// This is the game engine for the game
//  & The math for matching and swapping inside GameScreen.js

/** Every row must exist and hold 6 tile ids — otherwise grid[r+1][c] throws (e.g. reading '4'). */
function isGrid6x6(grid) {
  if (!Array.isArray(grid) || grid.length !== 6) return false;
  for (let r = 0; r < 6; r++) {
    if (!Array.isArray(grid[r]) || grid[r].length !== 6) return false;
  }
  return true;
}

function makeRandomGrid6x6() {
  const g = [];
  for (let r = 0; r < 6; r++) {
    const row = [];
    for (let c = 0; c < 6; c++) row.push(Math.floor(Math.random() * 4) + 1);
    g.push(row);
  }
  return g;
}

class GameEngine {
    isAdjacent(firstTile, secondTile) {
      // If the user tapped the exact same tile twice, don't swap
      if (firstTile.row === secondTile.row && firstTile.col === secondTile.col) {
        return false;
      }

      const rowDiff = Math.abs(firstTile.row - secondTile.row);
      const colDiff = Math.abs(firstTile.col - secondTile.col);

      // MANHATTAN DISTANCE RULE:
      // To be "next to" each other (not diagonal),
      // one difference must be 1 and the other must be 0.
      // (1 + 0 = 1)
      return (rowDiff + colDiff === 1);
    }
  
    // Logic to swap two values in 2D Matrix
    swapTiles(grid, firstTile, secondTile) {
      if (!isGrid6x6(grid)) return makeRandomGrid6x6();
      // "Deep Copy" of the grid so the original state isn't messed up
      let newGrid = grid.map(row => [...row]);
  
      // Classic swap using a temp variable
      const temp = newGrid[firstTile.row][firstTile.col];
      newGrid[firstTile.row][firstTile.col] = newGrid[secondTile.row][secondTile.col];
      newGrid[secondTile.row][secondTile.col] = temp;
  
      return newGrid;
    }

    // 1. THE QUICK CHECK (Returns true/false)
    checkForMatches(grid) {
        const matches = this.findAllMatches(grid);
        return matches.length > 0;
    }

    // 2. Search for matches (Returns list of coordinates to clear)
    findAllMatches(grid) {
        if (!isGrid6x6(grid)) return [];

        let matchedCoords = [];

        // 1. Check cols & rows (Detects 3, 4, or 5 in a row)
        // loop through and find the same ID (matchLength) of 3, 4, or 5
        for (let r = 0; r < 6; r++) {
            for (let c = 0; c < 6; c++) {
                // Horizontal check for 3+
                if (c < 4 && grid[r][c] !== 0 && grid[r][c] === grid[r][c+1] && grid[r][c] === grid[r][c+2]) {
                    let matchLength = 3;
                    if (c < 3 && grid[r][c] === grid[r][c+3]) matchLength = 4;
                    if (c < 2 && grid[r][c] === grid[r][c+4]) matchLength = 5;

                    for (let i = 0; i < matchLength; i++) matchedCoords.push({ r, c: c + i });
                }

                // Vertical check for 3+
                if (r < 4 && grid[r][c] !== 0 && grid[r][c] === grid[r+1][c] && grid[r][c] === grid[r+2][c]) {
                    let matchLength = 3;
                    if (r < 3 && grid[r][c] === grid[r+3][c]) matchLength = 4;
                    if (r < 2 && grid[r][c] === grid[r+4][c]) matchLength = 5;

                    for (let i = 0; i < matchLength; i++) matchedCoords.push({ r: r + i, c });
                }

                // 2. The square/cube (2x2 matchup)
                if (r < 5 && c < 5 && grid[r][c] !== 0) {
                    if (
                        grid[r][c] === grid[r][c+1] &&
                        grid[r][c] === grid[r+1][c] &&
                        grid[r][c] === grid[r+1][c+1]
                    ) {
                        matchedCoords.push(
                            { r, c },
                            { r, c: c + 1 },
                            { r: r + 1, c },
                            { r: r + 1, c: c + 1 },
                        );
                    }
                }
            }
        }

        // Remove dups (in case a tile is part of multiple matches)
        return Array.from(new Set(matchedCoords.map(JSON.stringify)), JSON.parse);
    }

    // 3. Refill the grid with new tiles (GRAVITY)
    processMatches(grid) {
        if (!isGrid6x6(grid)) return makeRandomGrid6x6();
        let newGrid = grid.map(row => [...row]);
        const matches = this.findAllMatches(newGrid);

        //  1: Clear matches (Set to 0)
        matches.forEach(coord => {
            newGrid[coord.r][coord.c] = 0;
        });

        //  2: Gravity (Shift tiles down)
        for (let c = 0; c < 6; c++) {
            let emptySpot = 5; // Start from the bottom row
            for (let r = 5; r >= 0; r--) {
                if (newGrid[r][c] !== 0) {
                    // Move the tile down to the lowest empty spot
                    const tileValue = newGrid[r][c];
                    newGrid[r][c] = 0;
                    newGrid[emptySpot][c] = tileValue;
                    emptySpot--;
                }
            }

            // 3: Generate new tiles for the remaining 0s at the top
            for (let r = emptySpot; r >= 0; r--) {
                // Randomly pick a tile ID (1-4)
                newGrid[r][c] = Math.floor(Math.random() * 4) + 1;
            }
        }

        return newGrid;
    }

    // 4. HINT SYSTEM — scans the entire board to find ONE valid swap
    // Returns two tile positions [{row, col}, {row, col}] or null if no moves
    // This is what powers the "breathing glow" on suggested tiles
    findHint(grid) {
      if (!isGrid6x6(grid)) return null;
      for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 6; c++) {
          // Try swapping right
          if (c < 5) {
            const copy = grid.map(row => [...row]);
            const temp = copy[r][c];
            copy[r][c] = copy[r][c + 1];
            copy[r][c + 1] = temp;
            if (this.checkForMatches(copy)) {
              return [{ row: r, col: c }, { row: r, col: c + 1 }];
            }
          }
          // Try swapping down
          if (r < 5) {
            const copy = grid.map(row => [...row]);
            const temp = copy[r][c];
            copy[r][c] = copy[r + 1][c];
            copy[r + 1][c] = temp;
            if (this.checkForMatches(copy)) {
              return [{ row: r, col: c }, { row: r + 1, col: c }];
            }
          }
        }
      }
      return null; // no valid moves on the board (dead state)
    }
  }

  // Export a single instance of the engine to GameScreen.js
  export default new GameEngine();
