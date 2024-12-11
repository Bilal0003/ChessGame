export class Piece {
  public x: number;
  public y: number;
  public Color: string;
  public icon!: string;
  public Directions!: any;
  constructor(x: number, y: number, Color: string) {
    this.x = x;
    this.y = y;
    this.Color = Color;
  }

  get position(): [x: number, y: number] {
    return [this.x, this.y];
  }

  get color(): String {
    return this.Color;
  }

  get X(): number {
    return this.x;
  }

  get Y(): number {
    return this.y;
  }

  set X(value: number) {
    this.x = value;
  }

  set Y(value: number) {
    this.y = value;
  }
}
