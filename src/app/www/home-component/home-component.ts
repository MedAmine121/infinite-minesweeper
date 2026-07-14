import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

interface Cell {
  isMine: boolean;
  isRevealed: boolean;
  adjacentMines: number;
  isFlagged: boolean;
}

@Component({
  selector: 'app-home-component',
  imports: [CommonModule],
  templateUrl: './home-component.html',
  styleUrl: './home-component.css',
})
export class HomeComponent implements OnInit {
  board: Cell[][] = [];
  rows = 8;
  cols = 8;
  mineCount = 10;
  gameOver = false;
  gameWon = false;
  pressedRow: number | null = null;
  pressedCol: number | null = null;

  ngOnInit(): void {
    this.resetGame();
  }

  resetGame(): void {
    this.board = this.createBoard();
    this.gameOver = false;
    this.gameWon = false;
  }

  revealCell(row: number, col: number): void {
    if (this.gameOver || this.gameWon) {
      return;
    }

    const cell = this.board[row]?.[col];
    if (!cell) {
      return;
    }

    if (cell.isRevealed && cell.adjacentMines > 0) {
      const adjacentFlags = this.countAdjacentFlags(row, col);
      if (adjacentFlags === cell.adjacentMines) {
        this.revealAdjacentHiddenCells(row, col);
      }
      return;
    }

    if (cell.isFlagged || cell.isRevealed) {
      return;
    }

    if (cell.isMine) {
    }

    this.revealArea(row, col);
    this.checkWin();
  }

  toggleFlag(event: MouseEvent, row: number, col: number): void {
    event.preventDefault();

    if (this.gameOver || this.gameWon) {
      return;
    }

    const cell = this.board[row]?.[col];
    if (!cell || cell.isRevealed) {
      return;
    }

    cell.isFlagged = !cell.isFlagged;
  }

  onMouseDown(row: number, col: number): void {
    this.pressedRow = row;
    this.pressedCol = col;
  }

  onMouseUp(row: number, col: number): void {
    if (this.pressedRow === row && this.pressedCol === col) {
      this.pressedRow = null;
      this.pressedCol = null;
    }
  }

  isPressed(row: number, col: number): boolean {
    return this.pressedRow === row && this.pressedCol === col;
  }

  private createBoard(): Cell[][] {
    const board = Array.from({ length: this.rows }, () =>
      Array.from({ length: this.cols }, () => ({
        isMine: false,
        isRevealed: false,
        adjacentMines: 0,
        isFlagged: false,
      }))
    );

    let placedMines = 0;
    while (placedMines < this.mineCount) {
      const row = Math.floor(Math.random() * this.rows);
      const col = Math.floor(Math.random() * this.cols);
      if (!board[row][col].isMine) {
        board[row][col].isMine = true;
        placedMines += 1;
      }
    }

    for (let row = 0; row < this.rows; row += 1) {
      for (let col = 0; col < this.cols; col += 1) {
        if (!board[row][col].isMine) {
          board[row][col].adjacentMines = this.countAdjacentMines(board, row, col);
        }
      }
    }

    return board;
  }

  private countAdjacentMines(board: Cell[][], row: number, col: number): number {
    let count = 0;
    for (let r = Math.max(0, row - 1); r <= Math.min(this.rows - 1, row + 1); r += 1) {
      for (let c = Math.max(0, col - 1); c <= Math.min(this.cols - 1, col + 1); c += 1) {
        if (board[r][c].isMine) {
          count += 1;
        }
      }
    }
    return count;
  }

  private revealArea(row: number, col: number): void {
    const stack = [[row, col]];

    while (stack.length) {
      const [currentRow, currentCol] = stack.pop()!;
      const cell = this.board[currentRow][currentCol];

      if (cell.isRevealed || cell.isMine || cell.isFlagged) {
        continue;
      }

      cell.isRevealed = true;

      if (cell.adjacentMines > 0) {
        continue;
      }

      for (let r = Math.max(0, currentRow - 1); r <= Math.min(this.rows - 1, currentRow + 1); r += 1) {
        for (let c = Math.max(0, currentCol - 1); c <= Math.min(this.cols - 1, currentCol + 1); c += 1) {
          if (!this.board[r][c].isRevealed && !this.board[r][c].isFlagged) {
            stack.push([r, c]);
          }
        }
      }
    }
  }

  private revealAdjacentHiddenCells(row: number, col: number): void {
    for (let r = Math.max(0, row - 1); r <= Math.min(this.rows - 1, row + 1); r += 1) {
      for (let c = Math.max(0, col - 1); c <= Math.min(this.cols - 1, col + 1); c += 1) {
        const cell = this.board[r][c];
        if (cell.isFlagged || cell.isRevealed) {
          continue;
        }

        if (cell.isMine) {
          this.revealAllMines();
          this.gameOver = true;
          return;
        }

        cell.isRevealed = true;
      }
    }

    this.checkWin();
  }

  private countAdjacentFlags(row: number, col: number): number {
    let count = 0;
    for (let r = Math.max(0, row - 1); r <= Math.min(this.rows - 1, row + 1); r += 1) {
      for (let c = Math.max(0, col - 1); c <= Math.min(this.cols - 1, col + 1); c += 1) {
        if (this.board[r][c].isFlagged) {
          count += 1;
        }
      }
    }
    return count;
  }

  private revealAllMines(): void {
    this.board.forEach((row) => {
      row.forEach((cell) => {
        if (cell.isMine) {
          cell.isRevealed = true;
        }
      });
    });
  }

  private checkWin(): void {
    const safeCells = this.board.flat().filter((cell) => !cell.isMine);
    const revealedSafeCells = safeCells.filter((cell) => cell.isRevealed);
    this.gameWon = revealedSafeCells.length === safeCells.length;
  }
}
