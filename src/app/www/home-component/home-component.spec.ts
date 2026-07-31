import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Board } from '../../models/board.model';
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
});
