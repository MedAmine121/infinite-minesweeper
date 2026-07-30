import { Grid } from "./grid.model";

export class Board {
    static grids: Record<number, Record<number, Grid>> = {};
    static cellRows = 8;
    static cellCols = 8;
    static mineCount = 10;
    static minCol = 0;
    static maxCol = 0;

    static init() {
        Board.grids = {};
        Board.minCol = 0;
        Board.maxCol = 0;

        const grid = new Grid(0, 0, Board.cellRows, Board.cellCols, Board.mineCount);
        Board.grids[0] = {};
        Board.grids[0][0] = grid;
        Board.unlockGrid(grid);
        Object.defineProperty(Board.grids, Symbol.iterator, {
            enumerable: false, // Keeps the iterator hidden from Object.keys()
            value: function* (this: Record<number, Record<number, Grid>>) {
                for (const key of Object.keys(this)) {
                    const numKey = Number(key);
                    yield [numKey, this[numKey]] as [number, Record<number, Grid>];
                }
            }
        });
    }
    /**
   * 1. Iterates over rows.
   * Yields a tuple: [rowIndex, columnRecord]
   */
    static get rows(): Iterable<[row: number, cols: Record<number, Grid>]> {
        const self = this;
        return {
            *[Symbol.iterator]() {
                const rows = Object.keys(Board.grids)
                    .map(Number)
                    .sort((a, b) => a - b);

                for (const row of rows) {
                    yield [row, Board.grids[row]];
                }
            }
        };
    }

    /**
     * 2. Iterates over columns for a specific row.
     * This is a helper method since columns inherently belong to a row.
     */
    static getColumnsFor(colsRecord: Record<number, Grid>): Iterable<[col: number, grid: Grid]> {
        return {
            *[Symbol.iterator]() {
                const cols = Object.keys(colsRecord)
                    .map(Number)
                    .sort((a, b) => a - b);
                for (const cStr of cols) {
                    if (Object.prototype.hasOwnProperty.call(colsRecord, cStr)) {
                        yield [Number(cStr), colsRecord[cStr]];
                    }
                }
            }
        };
    }

    /**
     * 3. Flattened iterator for every single Grid instance.
     * Useful when you don't care about the layout context.
     */
    static get allGrids(): Iterable<Grid> {
        return {
            *[Symbol.iterator]() {
                for (const rStr in Board.grids) {
                    const colsRecord = Board.grids[rStr];
                    for (const cStr in colsRecord) {
                        yield colsRecord[cStr];
                    }
                }
            }
        };
    }
    static updateColumnBounds(col: number): void {
        if (col < Board.minCol) {
            Board.minCol = col;
        }
        if (col > Board.maxCol) {
            Board.maxCol = col;
        }
    }

    static getColumnRange(minCol: number, maxCol: number): number[] {
        return Array.from({ length: maxCol - minCol + 1 }, (_, index) => minCol + index);
    }

    static unlockGrid(grid: Grid): void {
        grid.unlocked = true;
        this.createAdjacentGrids(grid);
        grid.calculateAdjacentMines(this.grids);
    }
    static createAdjacentGrids(grid: Grid): void {
        for (let dRow = -1; dRow <= 1; dRow++) {
            for (let dCol = -1; dCol <= 1; dCol++) {
                if (dRow === 0 && dCol === 0) continue;
                const newRow = grid.gridRow + dRow;
                const newCol = grid.gridCol + dCol;
                if (!Board.grids[newRow]) Board.grids[newRow] = {};
                if (!Board.grids[newRow][newCol]) {
                    const newGrid = new Grid(newRow, newCol, Board.cellRows, Board.cellCols, Board.mineCount);
                    Board.grids[newRow][newCol] = newGrid;
                    Board.updateColumnBounds(newCol);
                }
            }
        }
    }
}