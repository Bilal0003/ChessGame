import { Piece } from './piece';

export class King extends Piece {
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
    if (Color === 'White') {
      this.icon = 'assets/wK.svg';
    } else {
      this.icon = 'assets/bK.svg';
    }
  }
}
