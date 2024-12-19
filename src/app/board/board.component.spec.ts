import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardComponent } from './board.component';
import { Queen } from '../pieces/queen';
import { King } from '../pieces/king';
import { Tour } from '../pieces/tour';
import { Fou } from '../pieces/fou';

describe('BoardComponent', () => {
  let component: BoardComponent;
  let fixture: ComponentFixture<BoardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should detect checkmate with Black King in bottom-right corner', () => {
    const checkmateCorner = [
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, new King(5, 6, 'White'), null],
      [null, null, null, null, null, null, new Queen(6, 6, 'White'), null],
      [null, null, null, null, null, null, null, new King(7, 7, 'Black')],
    ];

    component.matrix = checkmateCorner;
    component.Move(6, 6);
    component.CurrentPlayer = 'Black';
    const result = component.isCheckMate('Black');
    expect(result).toBeTrue();
  });

  it('should detect checkmate with Black King in the middle of the board', () => {
    const checkmateMiddle = [
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, new King(2, 2, 'White'), null, null, null, null, null],
      [
        null,
        null,
        null,
        new King(3, 3, 'Black'),
        null,
        new Queen(3, 5, 'White'),
        null,
        null,
      ],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
    ];

    component.matrix = checkmateMiddle;
    const result = component.isCheckMate('Black');
    expect(result).toBeTrue();
  });

  it('should detect checkmate with Black King trapped by Rooks', () => {
    const checkmateRooks = [
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, new Tour(6, 4, 'White'), null, null, null],
      [
        null,
        null,
        null,
        null,
        new King(7, 4, 'Black'),
        null,
        null,
        new Tour(7, 7, 'White'),
      ],
    ];

    component.matrix = checkmateRooks;
    const result = component.isCheckMate('Black');
    expect(result).toBeTrue();
  });

  it('should detect checkmate with Black King trapped by Bishop', () => {
    const checkmateBishop = [
      [null, null, null, null, null, null, null, new King(0, 7, 'Black')],
      [null, null, null, null, null, null, new King(1, 6, 'White'), null],
      [null, null, null, null, null, new Fou(2, 5, 'White'), null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
    ];

    component.matrix = checkmateBishop;
    const result = component.isCheckMate('Black');
    expect(result).toBeTrue();
  });

  it('should detect ladder checkmate with Rooks', () => {
    const ladderCheckmate = [
      [
        new King(0, 0, 'Black'),
        null,
        null,
        new Tour(0, 3, 'White'),
        null,
        null,
        null,
        null,
      ],
      [null, new King(1, 1, 'White'), null, null, null, null, null, null],
      [new Tour(2, 0, 'White'), null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
    ];

    component.matrix = ladderCheckmate;
    const result = component.isCheckMate('Black');
    expect(result).toBeTrue();
  });
});
