import { Grid } from "./grid.model";

export class Board {
    grids: Record<number, Record<number, Grid>> = {};
    cellRows = 8;
    cellCols = 8;
    mineCount = 10;
    constructor() {
        const grid = new Grid(0, 0, this.cellRows, this.cellCols, this.mineCount);
        this.grids[0] = {};
        this.grids[0][0] = grid;
        this.unlockGrid(grid);
        Object.defineProperty(this.grids, Symbol.iterator, {
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
    get rows(): Iterable<[row: number, cols: Record<number, Grid>]> {
        const self = this;
        return {
            *[Symbol.iterator]() {
                for (const rStr in self.grids) {
                    if (Object.prototype.hasOwnProperty.call(self.grids, rStr)) {
                        yield [Number(rStr), self.grids[rStr]];
                    }
                }
            }
        };
    }

    /**
     * 2. Iterates over columns for a specific row.
     * This is a helper method since columns inherently belong to a row.
     */
    getColumnsFor(colsRecord: Record<number, Grid>): Iterable<[col: number, grid: Grid]> {
        return {
            *[Symbol.iterator]() {
                for (const cStr in colsRecord) {
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
    get allGrids(): Iterable<Grid> {
        const self = this;
        return {
            *[Symbol.iterator]() {
                for (const rStr in self.grids) {
                    const colsRecord = self.grids[rStr];
                    for (const cStr in colsRecord) {
                        yield colsRecord[cStr];
                    }
                }
            }
        };
    }
    unlockGrid(grid: Grid): void {
        grid.unlocked = true;
        this.createAdjacentGrids(grid);
    }
    createAdjacentGrids(grid: Grid): void {
        for (let dRow = -1; dRow <= 1; dRow++) {
            for (let dCol = -1; dCol <= 1; dCol++) {
                if (dRow === 0 && dCol === 0) continue;
                const newRow = grid.gridRow + dRow;
                const newCol = grid.gridCol + dCol;
                if (!this.grids[newRow]) this.grids[newRow] = {};
                if (!this.grids[newRow][newCol]) {
                    const newGrid = new Grid(newRow, newCol, this.cellRows, this.cellCols, this.mineCount);
                    this.grids[newRow][newCol] = newGrid;
                }
            }
        }
    }

}