import { HomeComponent } from '../www/home-component/home-component';
import { Board } from './board.model';
import { Cell } from './cell.model';
import type { NeighborGridCells } from './neighboring-grid-cell.model';

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
  countAdjacentMines(row: number, col: number, allGrids: Record<number, Record<number, Grid>>): number {
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
    count += this.countAdjacentMinesInNeighboringGrids(row, col, allGrids);
    return count;
  }

  countAdjacentFlagsAndExplodedMines(row: number, col: number, allGrids: Record<number, Record<number, Grid>>): number {
    let count = 0;

    for (let r = Math.max(0, row - 1); r <= Math.min(this.rows - 1, row + 1); r += 1) {
      for (let c = Math.max(0, col - 1); c <= Math.min(this.cols - 1, col + 1); c += 1) {
        if (this.board[r][c].isFlagged) {
          count += 1;
        }
        if (this.board[r][c].isMine && this.board[r][c].isRevealed) {
          count += 1;
        }
      }
    }

    for (const { gridRow, gridCol, cells } of this.getNeighboringGridCells(row, col, allGrids)) {
      for (const { cellRow, cellCol } of cells) {
        if (allGrids[gridRow]?.[gridCol]?.getCell(cellRow, cellCol)?.isFlagged) {
          count += 1;
        }
      }
    }

    return count;
  }
  private addNeighborCell(
    result: NeighborGridCells[],
    grid: Grid | undefined,
    cellRow: number,
    cellCol: number,
  ) {
    if (!grid || !grid.getCell(cellRow, cellCol)) {
      return;
    }

    let entry = result.find(e => e.gridRow === grid?.gridRow && e.gridCol === grid?.gridCol);

    if (!entry) {
      entry = {
        gridRow: grid?.gridRow,
        gridCol: grid?.gridCol,
        cells: [],
      };
      result.push(entry);
    }
    entry.cells.push({ cellRow, cellCol });
  }
  getNeighboringGridCells(
    row: number,
    col: number,
    allGrids: Record<number, Record<number, Grid>>,
  ): NeighborGridCells[] {
    const result: NeighborGridCells[] = [];

    // Top
    if (row === 0) {
      const grid = allGrids[this.gridRow - 1]?.[this.gridCol];
      if (grid) {
        for (let c = Math.max(0, col - 1); c <= Math.min(grid.cols - 1, col + 1); c++) {
          this.addNeighborCell(result, grid, grid.rows - 1, c);
        }
      }
    }

    // Bottom
    if (row === this.rows - 1) {
      const grid = allGrids[this.gridRow + 1]?.[this.gridCol];
      if (grid) {
        for (let c = Math.max(0, col - 1); c <= Math.min(grid.cols - 1, col + 1); c++) {
          this.addNeighborCell(result, grid, 0, c);
        }
      }
    }

    // Left
    if (col === 0) {
      const grid = allGrids[this.gridRow]?.[this.gridCol - 1];
      if (grid) {
        for (let r = Math.max(0, row - 1); r <= Math.min(grid.rows - 1, row + 1); r++) {
          this.addNeighborCell(result, grid, r, grid.cols - 1);
        }
      }
    }

    // Right
    if (col === this.cols - 1) {
      const grid = allGrids[this.gridRow]?.[this.gridCol + 1];
      if (grid) {
        for (let r = Math.max(0, row - 1); r <= Math.min(grid.rows - 1, row + 1); r++) {
          this.addNeighborCell(result, grid, r, 0);
        }
      }
    }

    // Top-left
    if (row === 0 && col === 0) {
      const grid = allGrids[this.gridRow - 1]?.[this.gridCol - 1];
      if (grid) {
        this.addNeighborCell(result, grid, grid.rows - 1, grid.cols - 1);
      }
    }

    // Top-right
    if (row === 0 && col === this.cols - 1) {
      const grid = allGrids[this.gridRow - 1]?.[this.gridCol + 1];
      if (grid) {
        this.addNeighborCell(result, grid, grid.rows - 1, 0);
      }
    }

    // Bottom-left
    if (row === this.rows - 1 && col === 0) {
      const grid = allGrids[this.gridRow + 1]?.[this.gridCol - 1];
      if (grid) {
        this.addNeighborCell(result, grid, 0, grid.cols - 1);
      }
    }

    // Bottom-right
    if (row === this.rows - 1 && col === this.cols - 1) {
      const grid = allGrids[this.gridRow + 1]?.[this.gridCol + 1];
      if (grid) {
        this.addNeighborCell(result, grid, 0, 0);
      }
    }

    return result;
  }
  countAdjacentMinesInNeighboringGrids(
    row: number,
    col: number,
    allGrids: Record<number, Record<number, Grid>>,
  ): number {
    let count = 0;

    for (const { gridRow, gridCol, cells } of this.getNeighboringGridCells(row, col, allGrids)) {
      for (const { cellRow, cellCol } of cells) {
        if (allGrids[gridRow]?.[gridCol]?.getCell(cellRow, cellCol)?.isMine) {
          count++;
        }
      }
    }
    return count;
  }

  /**
   * Calculate adjacent mines for all cells in the grid
   */
  calculateAdjacentMines(allGrids: Record<number, Record<number, Grid>>): void {
    for (let row = 0; row < this.rows; row += 1) {
      for (let col = 0; col < this.cols; col += 1) {
        if (!this.board[row][col].isMine) {
          this.board[row][col].adjacentMines = this.countAdjacentMines(row, col, allGrids);
        }
      }
    }
  }

  revealCell(
    row: number,
    col: number,
    allGrids: Record<number, Record<number, Grid>>,
  ): { action: 'none' | 'mine' | 'flood' | 'chord'; exploded: boolean; revealedCells: number } {
    const cell = this.getCell(row, col);

    if (!cell || cell.isFlagged) {
      return { action: 'none', exploded: false, revealedCells: 0 };
    }

    if (cell.isRevealed) {
      if (cell.adjacentMines > 0 && this.countAdjacentFlagsAndExplodedMines(row, col, allGrids) === cell.adjacentMines) {
        return {
          action: 'chord',
          exploded: false,
          revealedCells: this.revealAdjacentHiddenCells(row, col, allGrids).revealedCells,
        };
      }

      return { action: 'none', exploded: false, revealedCells: 0 };
    }

    if (cell.isMine) {
      cell.isRevealed = true;
      return { action: 'mine', exploded: true, revealedCells: 0 };
    }

    return {
      action: 'flood',
      exploded: false,
      revealedCells: this.revealArea(row, col, allGrids),
    };
  }

  revealAdjacentHiddenCells(
    row: number,
    col: number,
    allGrids: Record<number, Record<number, Grid>>,
  ): { exploded: boolean; revealedCells: number } {
    const cell = this.getCell(row, col);
    if (!cell || !cell.isRevealed || cell.adjacentMines <= 0) {
      return { exploded: false, revealedCells: 0 };
    }

    let revealedCount = 0;

    const revealTargetCell = (grid: Grid | undefined, targetRow: number, targetCol: number): boolean => {
      if (!grid) {
        return false;
      }

      const targetCell = grid.getCell(targetRow, targetCol);
      if (!targetCell || targetCell.isFlagged || targetCell.isRevealed) {
        return false;
      }

      if (targetCell.isMine) {
        targetCell.isRevealed = true;
        HomeComponent.lives -= 1;
        if (HomeComponent.lives <= 0) {
          grid.revealAllMines();
          HomeComponent.gameOver = true;
        }
        return true;
      }

      targetCell.isRevealed = true;
      revealedCount += 1;
      return false;
    };

    for (let r = Math.max(0, row - 1); r <= Math.min(this.rows - 1, row + 1); r += 1) {
      for (let c = Math.max(0, col - 1); c <= Math.min(this.cols - 1, col + 1); c += 1) {
        if (r === row && c === col) {
          continue;
        }

        if (revealTargetCell(this, r, c)) {
          return { exploded: true, revealedCells: revealedCount };
        }
      }
    }

    for (const { gridRow, gridCol, cells } of this.getNeighboringGridCells(row, col, allGrids)) {
      for (const { cellRow, cellCol } of cells) {
        if (revealTargetCell(allGrids[gridRow]?.[gridCol], cellRow, cellCol)) {
          return { exploded: true, revealedCells: revealedCount };
        }
      }
    }

    return { exploded: false, revealedCells: revealedCount };
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
      if(!currentGrid.unlocked){
        Board.unlockGrid(currentGrid);
      }
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

      for (const { gridRow, gridCol, cells } of this.getNeighboringGridCells(
        currentRow,
        currentCol,
        allGrids,
      )) {
        for (const { cellRow, cellCol } of cells) {
          const neighborCell = allGrids[gridRow]?.[gridCol]?.getCell(cellRow, cellCol);

          if (neighborCell && !neighborCell.isRevealed && !neighborCell.isFlagged) {
            stack.push([cellRow, cellCol, allGrids[gridRow][gridCol]]);
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
  revealAllMines(): void {
    for (const grid of Board.allGrids) {
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
