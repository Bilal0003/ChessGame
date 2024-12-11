import { Piece } from './piece';

export class Knight extends Piece {
  public override Directions: {};
  public override icon: string;

  constructor(x: number, y: number, Color: string) {
    super(x, y, Color);

    this.Directions = [
      [1, -2],
      [2, -1],
      [2, 1],
      [1, 2],
      [-1, 2],
      [-2, 1],
      [-2, -1],
      [-1, -2],
    ];

    if (Color === 'White') {
      this.icon = 'assets/wN.svg';
    } else {
      this.icon = 'assets/bN.svg';
    }
  }
}
