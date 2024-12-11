import { Piece } from './piece';

export class Fou extends Piece {
  public override Directions: {};
  public override icon: string;

  constructor(x: number, y: number, Color: string) {
    super(x, y, Color);

    this.Directions = [
      [1, 1],
      [-1, 1],
      [1, -1],
      [-1, -1],
    ];
    if (Color === 'White') {
      this.icon = 'assets/wB.svg';
    } else {
      this.icon = 'assets/bB.svg';
    }
  }
}
