import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Board } from '../../models/board.model';
import { Grid } from '../../models/grid.model';
import { HomeComponent } from './home-component';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render grids with absolute world coordinates', () => {
    component.resetGame();

    const originGrid = component.renderedGrids.find((item) => item.grid.gridRow === 0 && item.grid.gridCol === 0);
    expect(originGrid).toBeDefined();
    expect(originGrid?.left).toBe(0);
    expect(originGrid?.top).toBe(0);

    const leftNeighbor = component.renderedGrids.find((item) => item.grid.gridRow === 0 && item.grid.gridCol === -1);
    expect(leftNeighbor).toBeDefined();
    expect(leftNeighbor?.left).toBe(-component.chunkWidthPx);
    expect(leftNeighbor?.top).toBe(0);
  });

  it('should toggle a flag on a hidden cell', () => {
    component.resetGame();
    const event = { preventDefault: () => undefined } as MouseEvent;

    component.toggleFlag(event, 0, 0, 0, 0);
    expect(Board.grids[0][0].board[0][0].isFlagged).toBe(true);

    component.toggleFlag(event, 0, 0, 0, 0);
    expect(Board.grids[0][0].board[0][0].isFlagged).toBe(false);
  });

  it('should reveal the matching cell in the adjacent grid during flood reveal', () => {
    const leftGrid = new Grid(0, 0, 3, 3, 0);
    const rightGrid = new Grid(0, 1, 3, 3, 0);
    const topRightGrid = new Grid(-1, 1, 3, 3, 0);
    const allGrids = {
      0: { 0: leftGrid, 1: rightGrid },
      '-1': { 1: topRightGrid },
    } as unknown as Record<number, Record<number, Grid>>;

    const revealedCount = leftGrid.revealArea(0, 2, allGrids);

    expect(revealedCount).toBeGreaterThan(0);
    expect(rightGrid.board[0][0].isRevealed).toBe(true);
    expect(topRightGrid.board[2][0].isRevealed).toBe(true);
  });
});
