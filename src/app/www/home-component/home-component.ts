import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Cell } from '../../models/cell.model';

@Component({
  selector: 'app-home-component',
  imports: [CommonModule],
  templateUrl: './home-component.html',
  styleUrls: ['./home-component.css'],
})
export class HomeComponent implements OnInit {
  board: Cell[][] = [];
  rows = 8;
  cols = 8;
  mineCount = 10;
  lives = 3;
  score = 0;
  gameOver = false;
  gameWon = false;
  pressedRow: number | null = null;
  pressedCol: number | null = null;

  ngOnInit(): void {
    this.resetGame();
  }

  resetGame(): void {
    this.board = Cell.createBoard(this.rows, this.cols, this.mineCount);
    this.lives = 3;
    this.score = 0;
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
      const adjacentFlags = Cell.countAdjacentFlags(this.board, row, col);
      if (adjacentFlags === cell.adjacentMines) {
        const result = Cell.revealAdjacentHiddenCells(this.board, row, col);
        if (result.exploded) {
          this.lives -= 1;
          if (this.lives <= 0) {
            Cell.revealAllMines(this.board);
            this.gameOver = true;
          }
          return;
        }

        this.score += result.revealedCells * 10;
        this.gameWon = Cell.checkWin(this.board);
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
        Cell.revealAllMines(this.board);
        this.gameOver = true;
      }
      return;
    }

    const revealedCells = Cell.revealArea(this.board, row, col);
    this.score += revealedCells * 10;
    this.gameWon = Cell.checkWin(this.board);
  }

  toggleFlag(event: MouseEvent, row: number, col: number): void {
    event.preventDefault();

    if (this.gameOver || this.gameWon) {
      return;
    }

    const cell = this.board[row]?.[col];
    if (!cell) {
      return;
    }

    cell.toggleFlag();
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
}
