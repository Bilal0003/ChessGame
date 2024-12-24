import { Piece } from './piece';

export class Tour extends Piece {
  public override Directions: {};
  public override icon: string;
  private _hasMoved: boolean;

  constructor(x: number, y: number, Color: string) {
    super(x, y, Color);
    this._hasMoved = false;
    this.Directions = [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ];
    this.icon = Color === 'White' ? 'assets/wR.svg' : 'assets/bR.svg';
  }
  get hasMoved(): boolean {
    return this._hasMoved;
  }
  public set hasMoved(value: boolean) {
    this._hasMoved = value;
  }
}
