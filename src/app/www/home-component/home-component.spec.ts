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

  it('should initialize an 8x8 board with 10 mines', () => {
    component.resetGame();

    expect(component.board.length).toBe(8);
    expect(component.board.every((row) => row.length === 8)).toBe(true);
    expect(component.board.flat().filter((cell) => cell.isMine).length).toBe(10);
  });

  it('should toggle a flag on a hidden cell', () => {
    component.resetGame();
    const event = { preventDefault: () => undefined } as MouseEvent;

    component.toggleFlag(event, 0, 0);
    expect(component.board[0][0].isFlagged).toBe(true);

    component.toggleFlag(event, 0, 0);
    expect(component.board[0][0].isFlagged).toBe(false);
  });
});
