import { ComponentFixture, TestBed } from '@angular/core/testing';

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

  it('should initialize a 3x3 grid of 8x8 grids with 10 mines each', () => {
    component.resetGame();

    expect(component.grids.length).toBe(3);
    expect(component.grids.every((row) => row.length === 3)).toBe(true);

    const totalMines = component.grids
      .flat()
      .reduce((sum, grid) => sum + grid.board.flat().filter((cell) => cell.isMine).length, 0);
    expect(totalMines).toBe(90); // 3x3 grids with 10 mines each
  });

  it('should toggle a flag on a hidden cell', () => {
    component.resetGame();
    const event = { preventDefault: () => undefined } as MouseEvent;

    component.toggleFlag(event, 0, 0, 0, 0);
    expect(component.grids[0][0].board[0][0].isFlagged).toBe(true);

    component.toggleFlag(event, 0, 0, 0, 0);
    expect(component.grids[0][0].board[0][0].isFlagged).toBe(false);
  });
});
