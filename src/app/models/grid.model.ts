import { Board } from './board.model';
import { Cell } from './cell.model';

export class Grid {
  board: Cell[][] = [];
  gridRow = 0;
  gridCol = 0;
  rows = 8;
  cols = 8;
  unlocked = false;
  constructor(gridRow: number, gridCol: number, rows: number = 8, cols: number = 8, mines: number = 10) {
    this.gridRow = gridRow;
    this.gridCol = gridCol;
    this.rows = rows;
    this.cols = cols;
    this.board = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => new Cell())
    );
    this.initializeBoard();
    this.placeMines(mines);
  }

  /**
   * Initialize the board with empty cells that have row/col set
   */
  initializeBoard(): void {
    this.board = Array.from({ length: this.rows }, (_, row) =>
      Array.from({ length: this.cols }, (_, col) => {
        const cell = new Cell();
        cell.row = row;
        cell.col = col;
        return cell;
      })
    );
  }

  /**
   * Place mines on the board
   */
  placeMines(mineCount: number): void {
    let placedMines = 0;
    while (placedMines < mineCount) {
      const row = Math.floor(Math.random() * this.rows);
      const col = Math.floor(Math.random() * this.cols);
      if (!this.board[row][col].isMine) {
        this.board[row][col].isMine = true;
        placedMines += 1;
      }
    }
  }

  /**
   * Get the cell at the given row and col
   */
  getCell(row: number, col: number): Cell | null {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      return null;
    }
    return this.board[row][col];
  }

  /**
   * Count adjacent mines including mines from neighboring grids
   */
  countAdjacentMines(row: number, col: number, allGrids: Grid[][]): number {
    let count = 0;
    for (let r = Math.max(0, row - 1); r <= Math.min(this.rows - 1, row + 1); r += 1) {
      for (let c = Math.max(0, col - 1); c <= Math.min(this.cols - 1, col + 1); c += 1) {
        // Skip the current cell
        if (r === row && c === col) {
          continue;
        }

        // Check cells within this grid
        if (this.board[r][c].isMine) {
          count += 1;
        }
      }
    }

    // Check adjacent grids
    for (let dRow = -1; dRow <= 1; dRow += 1) {
      for (let dCol = -1; dCol <= 1; dCol += 1) {
        // Skip this grid
        if (dRow === 0 && dCol === 0) {
          continue;
        }

        const neighborGridRow = this.gridRow + dRow;
        const neighborGridCol = this.gridCol + dCol;

        // Check if neighbor grid exists
        if (
          neighborGridRow < 0 ||
          neighborGridRow >= allGrids.length ||
          neighborGridCol < 0 ||
          neighborGridCol >= allGrids[0].length
        ) {
          continue;
        }

        const neighborGrid = allGrids[neighborGridRow][neighborGridCol];

        // Check the appropriate cells in the neighbor grid
        for (let r = Math.max(0, row - 1); r <= Math.min(this.rows - 1, row + 1); r += 1) {
          for (let c = Math.max(0, col - 1); c <= Math.min(this.cols - 1, col + 1); c += 1) {
            // Map the neighbor grid's cells based on the direction
            const neighborRow = dRow === -1 ? this.rows - 1 : dRow === 1 ? 0 : r;
            const neighborCol = dCol === -1 ? this.cols - 1 : dCol === 1 ? 0 : c;

            if (
              neighborRow >= 0 &&
              neighborRow < neighborGrid.rows &&
              neighborCol >= 0 &&
              neighborCol < neighborGrid.cols
            ) {
              if (neighborGrid.board[neighborRow][neighborCol].isMine) {
                count += 1;
              }
            }
          }
        }
      }
    }

    return count;
  }

  /**
   * Calculate adjacent mines for all cells in the grid
   */
  calculateAdjacentMines(allGrids: Grid[][]): void {
    for (let row = 0; row < this.rows; row += 1) {
      for (let col = 0; col < this.cols; col += 1) {
        if (!this.board[row][col].isMine) {
          this.board[row][col].adjacentMines = this.countAdjacentMines(row, col, allGrids);
        }
      }
    }
  }

  /**
   * Reveal an area starting from the given cell (flood fill for empty cells)
   */
  revealArea(row: number, col: number, allGrids: Record<number, Record<number, Grid>>): number {
    const stack: Array<[number, number, Grid]> = [[row, col, this]];
    let revealedCount = 0;
    const visited = new Set<string>();

    while (stack.length) {
      const [currentRow, currentCol, currentGrid] = stack.pop()!;
      const visitKey = `${currentGrid.gridRow},${currentGrid.gridCol},${currentRow},${currentCol}`;

      if (visited.has(visitKey)) {
        continue;
      }
      visited.add(visitKey);

      const cell = currentGrid.getCell(currentRow, currentCol);
      if (!cell || cell.isRevealed || cell.isMine || cell.isFlagged) {
        continue;
      }

      cell.isRevealed = true;
      revealedCount += 1;

      if (cell.adjacentMines > 0) {
        continue;
      }

      // Add neighboring cells from the same grid
      for (let r = Math.max(0, currentRow - 1); r <= Math.min(currentGrid.rows - 1, currentRow + 1); r += 1) {
        for (let c = Math.max(0, currentCol - 1); c <= Math.min(currentGrid.cols - 1, currentCol + 1); c += 1) {
          const neighborCell = currentGrid.getCell(r, c);
          if (neighborCell && !neighborCell.isRevealed && !neighborCell.isFlagged) {
            stack.push([r, c, currentGrid]);
          }
        }
      }

      // Add neighboring cells from adjacent grids at edges
      if (currentRow === 0) {
        const neighborGrid = allGrids[currentGrid.gridRow - 1]?.[currentGrid.gridCol];
        if (neighborGrid) {
          for (let c = Math.max(0, currentCol - 1); c <= Math.min(neighborGrid.cols - 1, currentCol + 1); c += 1) {
            const neighborCell = neighborGrid.getCell(neighborGrid.rows - 1, c);
            if (neighborCell && !neighborCell.isRevealed && !neighborCell.isFlagged) {
              stack.push([neighborGrid.rows - 1, c, neighborGrid]);
            }
          }
        }
      }

      if (currentRow === currentGrid.rows - 1) {
        const neighborGrid = allGrids[currentGrid.gridRow + 1]?.[currentGrid.gridCol];
        if (neighborGrid) {
          for (let c = Math.max(0, currentCol - 1); c <= Math.min(neighborGrid.cols - 1, currentCol + 1); c += 1) {
            const neighborCell = neighborGrid.getCell(0, c);
            if (neighborCell && !neighborCell.isRevealed && !neighborCell.isFlagged) {
              stack.push([0, c, neighborGrid]);
            }
          }
        }
      }

      if (currentCol === 0) {
        const neighborGrid = allGrids[currentGrid.gridRow]?.[currentGrid.gridCol - 1];
        if (neighborGrid) {
          for (let r = Math.max(0, currentRow - 1); r <= Math.min(neighborGrid.rows - 1, currentRow + 1); r += 1) {
            const neighborCell = neighborGrid.getCell(r, neighborGrid.cols - 1);
            if (neighborCell && !neighborCell.isRevealed && !neighborCell.isFlagged) {
              stack.push([r, neighborGrid.cols - 1, neighborGrid]);
            }
          }
        }
      }

      if (currentCol === currentGrid.cols - 1) {
        const neighborGrid = allGrids[currentGrid.gridRow]?.[currentGrid.gridCol + 1];
        if (neighborGrid) {
          for (let r = Math.max(0, currentRow - 1); r <= Math.min(neighborGrid.rows - 1, currentRow + 1); r += 1) {
            const neighborCell = neighborGrid.getCell(r, 0);
            if (neighborCell && !neighborCell.isRevealed && !neighborCell.isFlagged) {
              stack.push([r, 0, neighborGrid]);
            }
          }
        }
      }
    }

    return revealedCount;
  }

  /**
   * Check if all non-mine cells are revealed
   */
  checkWin(allGrids: Grid[][]): boolean {
    for (const grid of allGrids.flat()) {
      const safeCells = grid.board.flat().filter((cell) => !cell.isMine);
      if (!safeCells.every((cell) => cell.isRevealed)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Reveal all mines on all grids
   */
  revealAllMines(board: Board): void {
    for (const grid of board.allGrids) {
      grid.board.forEach((row) => {
        row.forEach((cell) => {
          if (cell.isMine) {
            cell.isRevealed = true;
          }
        });
      });
    }
  }
}
