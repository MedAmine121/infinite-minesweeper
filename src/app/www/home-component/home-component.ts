import { Component, HostListener, OnInit } from '@angular/core';
import { Grid } from '../../models/grid.model';
import { Board } from '../../models/board.model';

@Component({
  selector: 'app-home-component',
  imports: [],
  templateUrl: './home-component.html',
  styleUrls: ['./home-component.css'],
})
export class HomeComponent implements OnInit {
  cellRows = 8;
  cellCols = 8;
  mineCount = 10;
  static lives = 3;
  score = 0;
  static gameOver = false;
  static gameWon = false;
  pressedGridRow: number | null = null;
  pressedGridCol: number | null = null;
  pressedCellRow: number | null = null;
  pressedCellCol: number | null = null;
  board = Board;
  renderedGrids: Array<{ key: string; grid: Grid; left: number; top: number }> = [];

  readonly cellSizePx = 32;
  readonly cellGapPx = 2;
  readonly chunkPaddingPx = 4;
  readonly containerBorderPx = 2;
  readonly minZoom = 0.75;
  readonly maxZoom = 2;

  cameraX = 0;
  cameraY = 0;
  zoom = 1;
  private isPanning = false;
  private panStartClientX = 0;
  private panStartClientY = 0;
  private panStartCameraX = 0;
  private panStartCameraY = 0;
  homeComponent = HomeComponent;
  get chunkWidthPx(): number {
    return (
      this.cellSizePx * this.cellCols +
      this.cellGapPx * (this.cellCols - 1) +
      this.chunkPaddingPx * 2 +
      this.containerBorderPx * 2
    );
  }

  get chunkHeightPx(): number {
    return (
      this.cellSizePx * this.cellRows +
      this.cellGapPx * (this.cellRows - 1) +
      this.chunkPaddingPx * 2 +
      this.containerBorderPx * 2
    );
  }

  get worldTransform(): string {
    return `translate(-50%, -50%) translate(${this.cameraX}px, ${this.cameraY}px) scale(${this.zoom})`;
  }

  ngOnInit(): void {
    this.resetGame();
  }

  resetGame(): void {
    Board.init();
    this.syncRenderedGrids();
    HomeComponent.lives = 3;
    this.score = 0;
    HomeComponent.gameOver = false;
    HomeComponent.gameWon = false;
  }

  private syncRenderedGrids(): void {
    this.renderedGrids = Array.from(Board.allGrids).map((grid) => ({
      key: `${grid.gridRow}:${grid.gridCol}`,
      grid,
      left: grid.gridCol * this.chunkWidthPx,
      top: grid.gridRow * this.chunkHeightPx,
    }));
  }

  zoomIn(): void {
    this.zoom = Math.min(this.maxZoom, +(this.zoom + 0.1).toFixed(2));
  }

  zoomOut(): void {
    this.zoom = Math.max(this.minZoom, +(this.zoom - 0.1).toFixed(2));
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    if (event.deltaY > 0) {
      this.zoomOut();
    } else {
      this.zoomIn();
    }
  }

  startPan(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (target?.closest('button.cell') && !target?.closest('button.cell.locked')) {
      return;
    }

    this.isPanning = true;
    this.panStartClientX = event.clientX;
    this.panStartClientY = event.clientY;
    this.panStartCameraX = this.cameraX;
    this.panStartCameraY = this.cameraY;
  }

  @HostListener('window:mousemove', ['$event'])
  onWindowMouseMove(event: MouseEvent): void {
    if (!this.isPanning) {
      return;
    }

    this.cameraX = this.panStartCameraX + (event.clientX - this.panStartClientX);
    this.cameraY = this.panStartCameraY + (event.clientY - this.panStartClientY);
  }

  @HostListener('window:mouseup')
  onWindowMouseUp(): void {
    this.isPanning = false;
  }

  revealCell(gridRow: number, gridCol: number, cellRow: number, cellCol: number): void {
    if (HomeComponent.gameOver || HomeComponent.gameWon) {
      return;
    }

    const grid = Board.grids[gridRow]?.[gridCol];
    if (!grid) {
      return;
    }

    const result = grid.revealCell(cellRow, cellCol, Board.grids);
    if (result.exploded) {
      HomeComponent.lives -= 1;
      if (HomeComponent.lives <= 0) {
        grid.revealAllMines();
        HomeComponent.gameOver = true;
      }
    } else if (result.revealedCells > 0) {
      this.score += result.revealedCells * 10;
    }

    this.syncRenderedGrids();
    HomeComponent.gameWon = this.checkWin();
  }

  toggleFlag(event: MouseEvent, gridRow: number, gridCol: number, cellRow: number, cellCol: number): void {
    event.preventDefault();

    if (HomeComponent.gameOver || HomeComponent.gameWon) {
      return;
    }

    const grid = Board.grids[gridRow]?.[gridCol];
    if (!grid) {
      return;
    }

    const cell = grid.getCell(cellRow, cellCol);
    if (!cell) {
      return;
    }

    cell.toggleFlag();
    this.syncRenderedGrids();
  }

  countAdjacentFlags(gridRow: number, gridCol: number, cellRow: number, cellCol: number): number {
    const grid = Board.grids[gridRow]?.[gridCol];
    if (!grid) {
      return 0;
    }

    return grid.countAdjacentFlagsAndExplodedMines(cellRow, cellCol, Board.grids);
  }

  checkWin(): boolean {
    for (const grid of Board.allGrids) {
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

