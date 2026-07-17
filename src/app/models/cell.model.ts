export class Cell {
  isMine = false;
  isRevealed = false;
  adjacentMines = 0;
  isFlagged = false;

  constructor(init?: Partial<Cell>) {
    Object.assign(this, init);
  }

  toggleFlag(): void {
    if (!this.isRevealed) {
      this.isFlagged = !this.isFlagged;
    }
  }

  static createBoard(rows: number, cols: number, mineCount: number): Cell[][] {
    const board = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => new Cell())
    );

    let placedMines = 0;
    while (placedMines < mineCount) {
      const row = Math.floor(Math.random() * rows);
      const col = Math.floor(Math.random() * cols);
      if (!board[row][col].isMine) {
        board[row][col].isMine = true;
        placedMines += 1;
      }
    }

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        if (!board[row][col].isMine) {
          board[row][col].adjacentMines = Cell.countAdjacentMines(board, row, col);
        }
      }
    }

    return board;
  }

  static countAdjacentMines(board: Cell[][], row: number, col: number): number {
    let count = 0;
    for (let r = Math.max(0, row - 1); r <= Math.min(board.length - 1, row + 1); r += 1) {
      for (let c = Math.max(0, col - 1); c <= Math.min(board[0].length - 1, col + 1); c += 1) {
        if (board[r][c].isMine) {
          count += 1;
        }
      }
    }
    return count;
  }

  static revealArea(board: Cell[][], row: number, col: number): number {
    const stack = [[row, col]];
    let revealedCount = 0;

    while (stack.length) {
      const [currentRow, currentCol] = stack.pop()!;
      const cell = board[currentRow][currentCol];

      if (cell.isRevealed || cell.isMine || cell.isFlagged) {
        continue;
      }

      cell.isRevealed = true;
      revealedCount += 1;

      if (cell.adjacentMines > 0) {
        continue;
      }

      for (let r = Math.max(0, currentRow - 1); r <= Math.min(board.length - 1, currentRow + 1); r += 1) {
        for (let c = Math.max(0, currentCol - 1); c <= Math.min(board[0].length - 1, currentCol + 1); c += 1) {
          if (!board[r][c].isRevealed && !board[r][c].isFlagged) {
            stack.push([r, c]);
          }
        }
      }
    }

    return revealedCount;
  }

  static revealAdjacentHiddenCells(board: Cell[][], row: number, col: number): { exploded: boolean; revealedCells: number } {
    let revealedCount = 0;
    for (let r = Math.max(0, row - 1); r <= Math.min(board.length - 1, row + 1); r += 1) {
      for (let c = Math.max(0, col - 1); c <= Math.min(board[0].length - 1, col + 1); c += 1) {
        const cell = board[r][c];
        if (cell.isFlagged || cell.isRevealed) {
          continue;
        }

        if (cell.isMine) {
          Cell.revealAllMines(board);
          return { exploded: true, revealedCells: 0 };
        }

        cell.isRevealed = true;
        revealedCount += 1;
      }
    }

    return { exploded: false, revealedCells: revealedCount };
  }

  static countAdjacentFlags(board: Cell[][], row: number, col: number): number {
    let count = 0;
    for (let r = Math.max(0, row - 1); r <= Math.min(board.length - 1, row + 1); r += 1) {
      for (let c = Math.max(0, col - 1); c <= Math.min(board[0].length - 1, col + 1); c += 1) {
        if (board[r][c].isFlagged) {
          count += 1;
        }
      }
    }
    return count;
  }

  static revealAllMines(board: Cell[][]): void {
    board.forEach((row) => {
      row.forEach((cell) => {
        if (cell.isMine) {
          cell.isRevealed = true;
        }
      });
    });
  }

  static checkWin(board: Cell[][]): boolean {
    const safeCells = board.flat().filter((cell) => !cell.isMine);
    return safeCells.every((cell) => cell.isRevealed);
  }
}
