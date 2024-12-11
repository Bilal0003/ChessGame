import { Piece } from './piece';

export class Queen extends Piece {
  public override Directions: {};
  public override icon: string;

  constructor(x: number, y: number, Color: string) {
    super(x, y, Color);

    this.Directions = [
      [1, 1],
      [-1, 1],
      [1, -1],
      [-1, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ];

    this.icon = Color === 'White' ? 'assets/wQ.svg' : 'assets/bQ.svg';
  }
}
