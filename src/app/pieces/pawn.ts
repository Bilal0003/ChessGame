import { Piece } from './piece';

export class Pawn extends Piece {
  public override Directions: any;
  public override icon: string;
  private _hasMoved: boolean;
  public AttackDirections: any[];

  constructor(x: number, y: number, Color: string) {
    super(x, y, Color);
    this._hasMoved = false;
    this.AttackDirections =
      Color === 'White'
        ? [
            [-1, -1],
            [-1, 1],
          ]
        : [
            [1, -1],
            [1, 1],
          ];
    if (Color === 'White') {
      this.Directions = !this._hasMoved
        ? [
            [-2, 0],
            [-1, 0],
            [-1, -1],
            [-1, 1],
          ]
        : [
            [-1, 0],
            [-1, -1],
            [-1, 1],
          ];

      this.icon = 'assets/wP.svg';
    } else {
      this.Directions = !this._hasMoved
        ? [
            [2, 0],
            [1, 0],
            [1, -1],
            [1, 1],
          ]
        : [
            [1, 0],
            [1, -1],
            [1, 1],
          ];
      this.icon = 'assets/bP.svg';
    }
  }

  get hasMoved(): boolean {
    return this._hasMoved;
  }

  public set hasMoved(value: boolean) {
    this._hasMoved = value;
  }

  public updateDirections() {
    if (this.Color === 'White') {
      this.Directions = [
        [-1, 0],
        [-1, -1],
        [-1, 1],
        /* [-2, 0], */
        /* [-1, -1],
        [-1, 1], */
      ];
      this.icon = 'assets/wP.svg';
    } else {
      this.Directions = [
        [1, 0],
        [1, -1],
        [1, 1],
        /* [2, 0], */
        /* [1, -1],
        [1, 1], */
      ];
      this.icon = 'assets/bP.svg';
    }
  }

  public UpdateDirectionsCanAttack() {
    if (this.Color === 'White') {
      this.Directions.add([-1, -1], [-1, 1]);
      this.icon = 'assets/wP.svg';
    } else {
      this.Directions.add([1, -1], [1, 1]);
      this.icon = 'assets/bP.svg';
    }
  }
}
