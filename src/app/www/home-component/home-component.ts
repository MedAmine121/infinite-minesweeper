import { Component, OnInit } from '@angular/core';
import { Cell } from '../../models/cell.model';
import { Grid } from '../../models/grid.model';
import { Board } from '../../models/board.model';

@Component({
  selector: 'app-home-component',
  imports: [],
  templateUrl: './home-component.html',
  styleUrls: ['./home-component.css'],
})
export class HomeComponent implements OnInit {
  grids: Grid[][] = [];
  gridRows = 3;
  gridCols = 3;
  cellRows = 8;
  cellCols = 8;
  mineCount = 10;
  lives = 3;
  score = 0;
  gameOver = false;
  gameWon = false;
  pressedGridRow: number | null = null;
  pressedGridCol: number | null = null;
  pressedCellRow: number | null = null;
  pressedCellCol: number | null = null;
  board: Board = new Board();
  ngOnInit(): void {
  }

  resetGame(): void {
    // Create 3x3 grid of grids
    this.board = new Board();
  }

  revealCell(gridRow: number, gridCol: number, cellRow: number, cellCol: number): void {
    if (this.gameOver || this.gameWon) {
      return;
    }

    const grid = this.board.grids[gridRow]?.[gridCol];
    if (!grid) {
      return;
    }

    const cell = grid.getCell(cellRow, cellCol);
    if (!cell) {
      return;
    }

    if (cell.isRevealed && cell.adjacentMines > 0) {
      const adjacentFlags = this.countAdjacentFlags(gridRow, gridCol, cellRow, cellCol);
      if (adjacentFlags === cell.adjacentMines) {
        const result = this.revealAdjacentHiddenCells(gridRow, gridCol, cellRow, cellCol);
        if (result.exploded) {
          this.lives -= 1;
          if (this.lives <= 0) {
            this.board.grids[gridRow][gridCol].revealAllMines(this.board);
            this.gameOver = true;
          }
          return;
        }

        this.score += result.revealedCells * 10;
        this.gameWon = this.checkWin();
      }
      return;
    }

    if (cell.isFlagged || cell.isRevealed) {
      return;
    }

    if (cell.isMine) {
      cell.isRevealed = true;
      this.lives -= 1;
      if (this.lives <= 0) {
        this.board.grids[gridRow][gridCol].revealAllMines(this.board);
        this.gameOver = true;
      }
      return;
    }

    const revealedCells = grid.revealArea(cellRow, cellCol, this.board.grids);
    this.score += revealedCells * 10;
    this.gameWon = this.checkWin();
  }

  toggleFlag(event: MouseEvent, gridRow: number, gridCol: number, cellRow: number, cellCol: number): void {
    event.preventDefault();

    if (this.gameOver || this.gameWon) {
      return;
    }

    const grid = this.board.grids[gridRow]?.[gridCol];
    if (!grid) {
      return;
    }

    const cell = grid.getCell(cellRow, cellCol);
    if (!cell) {
      return;
    }

    cell.toggleFlag();
  }

  countAdjacentFlags(gridRow: number, gridCol: number, cellRow: number, cellCol: number): number {
    let count = 0;
    const grid = this.board.grids[gridRow][gridCol];

    for (let r = Math.max(0, cellRow - 1); r <= Math.min(grid.rows - 1, cellRow + 1); r += 1) {
      for (let c = Math.max(0, cellCol - 1); c <= Math.min(grid.cols - 1, cellCol + 1); c += 1) {
        if (grid.board[r][c].isFlagged) {
          count += 1;
        }
      }
    }

    // Check adjacent grids
    for (let dRow = -1; dRow <= 1; dRow += 1) {
      for (let dCol = -1; dCol <= 1; dCol += 1) {
        if (dRow === 0 && dCol === 0) {
          continue;
        }

        const neighborGridRow = gridRow + dRow;
        const neighborGridCol = gridCol + dCol;

        if (
          neighborGridRow < 0 ||
          neighborGridRow >= this.gridRows ||
          neighborGridCol < 0 ||
          neighborGridCol >= this.gridCols
        ) {
          continue;
        }

        const neighborGrid = this.board.grids[neighborGridRow][neighborGridCol];

        for (let r = Math.max(0, cellRow - 1); r <= Math.min(grid.rows - 1, cellRow + 1); r += 1) {
          for (let c = Math.max(0, cellCol - 1); c <= Math.min(grid.cols - 1, cellCol + 1); c += 1) {
            const neighborRow = dRow === -1 ? grid.rows - 1 : dRow === 1 ? 0 : r;
            const neighborCol = dCol === -1 ? grid.cols - 1 : dCol === 1 ? 0 : c;

            if (
              neighborRow >= 0 &&
              neighborRow < neighborGrid.rows &&
              neighborCol >= 0 &&
              neighborCol < neighborGrid.cols
            ) {
              if (neighborGrid.board[neighborRow][neighborCol].isFlagged) {
                count += 1;
              }
            }
          }
        }
      }
    }

    return count;
  }

  revealAdjacentHiddenCells(
    gridRow: number,
    gridCol: number,
    cellRow: number,
    cellCol: number
  ): { exploded: boolean; revealedCells: number } {
    let revealedCount = 0;
    const grid = this.board.grids[gridRow][gridCol];

    for (let r = Math.max(0, cellRow - 1); r <= Math.min(grid.rows - 1, cellRow + 1); r += 1) {
      for (let c = Math.max(0, cellCol - 1); c <= Math.min(grid.cols - 1, cellCol + 1); c += 1) {
        const cell = grid.board[r][c];
        if (cell.isFlagged || cell.isRevealed) {
          continue;
        }

        if (cell.isMine) {
          this.board.grids[gridRow][gridCol].revealAllMines(this.board);
          return { exploded: true, revealedCells: 0 };
        }

        cell.isRevealed = true;
        revealedCount += 1;
      }
    }

    // Check adjacent grids
    for (let dRow = -1; dRow <= 1; dRow += 1) {
      for (let dCol = -1; dCol <= 1; dCol += 1) {
        if (dRow === 0 && dCol === 0) {
          continue;
        }

        const neighborGridRow = gridRow + dRow;
        const neighborGridCol = gridCol + dCol;

        if (
          neighborGridRow < 0 ||
          neighborGridRow >= this.gridRows ||
          neighborGridCol < 0 ||
          neighborGridCol >= this.gridCols
        ) {
          continue;
        }

        const neighborGrid = this.board.grids[neighborGridRow][neighborGridCol];

        for (let r = Math.max(0, cellRow - 1); r <= Math.min(grid.rows - 1, cellRow + 1); r += 1) {
          for (let c = Math.max(0, cellCol - 1); c <= Math.min(grid.cols - 1, cellCol + 1); c += 1) {
            const neighborRow = dRow === -1 ? grid.rows - 1 : dRow === 1 ? 0 : r;
            const neighborCol = dCol === -1 ? grid.cols - 1 : dCol === 1 ? 0 : c;

            if (
              neighborRow >= 0 &&
              neighborRow < neighborGrid.rows &&
              neighborCol >= 0 &&
              neighborCol < neighborGrid.cols
            ) {
              const cell = neighborGrid.board[neighborRow][neighborCol];
              if (cell.isFlagged || cell.isRevealed) {
                continue;
              }

              if (cell.isMine) {
                this.board.grids[gridRow][gridCol].revealAllMines(this.board);
                return { exploded: true, revealedCells: 0 };
              }

              cell.isRevealed = true;
              revealedCount += 1;
            }
          }
        }
      }
    }

    return { exploded: false, revealedCells: revealedCount };
  }

  checkWin(): boolean {
    for (const grid of this.board.allGrids) {
      const safeCells = grid.board.flat().filter((cell) => !cell.isMine);
      if (!safeCells.every((cell) => cell.isRevealed)) {
        return false;
      }
    }
    return true;
  }

  onMouseDown(gridRow: number, gridCol: number, cellRow: number, cellCol: number): void {
    this.pressedGridRow = gridRow;
    this.pressedGridCol = gridCol;
    this.pressedCellRow = cellRow;
    this.pressedCellCol = cellCol;
  }

  onMouseUp(gridRow: number, gridCol: number, cellRow: number, cellCol: number): void {
    if (
      this.pressedGridRow === gridRow &&
      this.pressedGridCol === gridCol &&
      this.pressedCellRow === cellRow &&
      this.pressedCellCol === cellCol
    ) {
      this.pressedGridRow = null;
      this.pressedGridCol = null;
      this.pressedCellRow = null;
      this.pressedCellCol = null;
    }
  }

  isPressed(gridRow: number, gridCol: number, cellRow: number, cellCol: number): boolean {
    return (
      this.pressedGridRow === gridRow &&
      this.pressedGridCol === gridCol &&
      this.pressedCellRow === cellRow &&
      this.pressedCellCol === cellCol
    );
  }
}

