import { Piece } from './piece';

export class King extends Piece {
  public override Directions: {};
  public override icon: string;
  private _hasMoved: boolean;

  constructor(x: number, y: number, Color: string) {
    super(x, y, Color);
    this._hasMoved = false;

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

  get hasMoved(): boolean {
    return this._hasMoved;
  }
  public set hasMoved(value: boolean) {
    this._hasMoved = value;
  }
}
