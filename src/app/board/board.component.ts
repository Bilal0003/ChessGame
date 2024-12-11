import {
  Component,
  OnInit,
  AfterViewInit,
  Renderer2,
  ElementRef,
  ViewChildren,
  QueryList,
  Output,
  Input,
} from '@angular/core';
import { NgFor, NgClass, NgIf } from '@angular/common';
import { GameLogicService } from '../game-logic.service';
import { Piece } from '../pieces/piece';
import { Pawn } from '../pieces/pawn';
import { Tour } from '../pieces/tour';
import { Knight } from '../pieces/knight';
import { Fou } from '../pieces/fou';
import { King } from '../pieces/king';
import { Queen } from '../pieces/queen';
import { pipe, timeInterval } from 'rxjs';
import { ControlContainer } from '@angular/forms';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [NgFor, NgClass, NgIf],
  templateUrl: './board.component.html',
  styleUrl: './board.component.css',
})
export class BoardComponent implements AfterViewInit, OnInit {
  /* @ViewChildren('box') box!: ElementRef<HTMLDivElement>; */
  /* @ViewChildren('col') cols!: QueryList<ElementRef>; */
  public matrix!: (Piece | null)[][];
  private dim: number = 8;
  public CurrentPlayer: string = 'White';
  public SelectedSquare!: Piece | null;
  public SelecetedSquareDirections!: any[];
  public MovesHistory: any[] = [];
  public LastMoves: any[] = [];
  public CantMove: boolean = false;

  constructor(
    private renderer: Renderer2,
    private GameService: GameLogicService
  ) {
    this.matrix = Array.from({ length: this.dim }, () =>
      Array(this.dim).fill(null)
    );
  }

  getPiece(x: number, y: number): Piece | null {
    return this.matrix[x][y];
  }

  getCoordinates(element: any): { x: number; y: number } {
    return this.GameService.getCoordinates(element);
  }

  getBoxUsingCoords(x: number, y: number): HTMLElement | null {
    return this.GameService.getBoxUsingCoords(x, y);
  }

  ngOnInit(): void {
    this.InitializeBoard();
    /* this.matrix[5][5] = new Pawn(5, 5, 'Black'); */
    console.log(this.matrix);
  }

  isArrayInMatrix(array: number[], matrix: [][]): boolean {
    return this.GameService.isArrayInMatrix(array, matrix);
  }

  ColorLastMove() {
    if (this.MovesHistory.length === 0) return;
    let move1 = this.MovesHistory.at(-2);
    let move2 = this.MovesHistory.at(-1);
    let [x1, y1] = [move1[0], move1[1]];
    let [x2, y2] = [move2[0], move2[1]];

    let box1 = this.getBoxUsingCoords(x1, y1);
    let box2 = this.getBoxUsingCoords(x2, y2);

    this.renderer.addClass(box1, 'last-move');
    this.renderer.addClass(box2, 'last-move');
  }

  UnselectCurrent() {
    this.SelectedSquare = null;
    this.SelecetedSquareDirections = [];
    this.ClearGreenDotsandRed();
  }

  // find a way to check if position leaves king in check, and do not append it if thats the case
  getSafeSquares(x: number, y: number): any[] {
    let piece: Piece | null = this.getPiece(x, y);
    let SafeSquares = [];
    if (piece) {
      for (let [dx, dy] of piece.Directions) {
        var [newX, newY] = [x + dx, y + dy];

        if (!this.isPositionValid(newX, newY)) continue;

        if (
          piece instanceof King ||
          piece instanceof Knight ||
          piece instanceof Pawn
        ) {
          if (piece instanceof Pawn) {
            var target: Piece | null = this.matrix[newX][newY];

            // handle case where pawn has not moved but an enemy piece is in front of it
            if (
              !piece.hasMoved &&
              ((dx === 2 && this.matrix[piece.X + 1][piece.Y]) ||
                (dx === -2 && this.matrix[piece.X - 1][piece.Y]))
            ) {
              continue;
            }
            // check if target position is in the latteral attack directions of pawn and its an enemy color
            if (dy !== 0 && target && target.Color !== piece.Color) {
              SafeSquares.push([newX, newY]);
            }
            /* if ((dx === 2 || dx === 1) && target) continue; */
            // check if the spot is empty and make sure its not in latteral i.e only front
            else if (
              !target &&
              !this.isArrayInMatrix([dx, dy], piece.AttackDirections)
            ) {
              SafeSquares.push([newX, newY]);
            }
          } else {
            if (this.isPositionValid(newX, newY)) {
              SafeSquares.push([newX, newY]);
            }
          }
        } else if (
          piece instanceof Queen ||
          piece instanceof Fou ||
          piece instanceof Tour
        ) {
          if (this.isPositionValid(newX, newY)) {
            var target: Piece | null = this.matrix[newX][newY];

            while (target === null) {
              SafeSquares.push([newX, newY]);
              newX += dx;
              newY += dy;
              if (this.isPositionValid(newX, newY))
                target = this.matrix[newX][newY];
              else {
                break;
              }
            }
            if (this.isPositionValid(newX, newY))
              SafeSquares.push([newX, newY]);
          }
        }
      }
    }

    for (let [X, Y] of SafeSquares) {
      if (!this.isSquareSafeAfterMove(x, y, X, Y)) {
        SafeSquares = SafeSquares.filter(
          (square) => square[0] !== X || square[1] !== Y
        );
      }
    }

    console.log(SafeSquares);

    return SafeSquares;
  }

  MoveListener(x: number, y: number) {
    let SafeSquares = [];
    let piece = this.matrix[x][y];

    // return if we select oposite color while its our turn
    if (piece?.Color !== this.CurrentPlayer) return;
    // if we reclick selected piece, we unselect SelectedSqure and reset directions variables
    if (this.SelectedSquare && this.SelectedSquare === piece) {
      this.UnselectCurrent();
      return;
    }

    this.SelectedSquare = piece;
    this.SelecetedSquareDirections = this.getSafeSquares(
      this.SelectedSquare.X,
      this.SelectedSquare.Y
    );
    this.HighlightPossibleSquares(this.SelecetedSquareDirections);
  }

  Move(x: number, y: number): void {
    this.MoveListener(x, y);

    if (this.SelectedSquare) {
      this.MoveMaker(this.SelectedSquare.X, this.SelectedSquare.Y, x, y);
      console.log(
        'selected Square moves and directions:',
        this.SelectedSquare,
        this.SelecetedSquareDirections,
        'player:',
        this.CurrentPlayer,
        this.matrix
      );
    }
  }

  // the sole purpose of this function is to make a move
  MoveMaker(
    AttackerX: number,
    AttackerY: number,
    RecieverX: number,
    RecieverY: number
  ): void {
    if (!this.SelectedSquare) return;
    console.log(this.isKingInCheck(this.CurrentPlayer));

    let attacker = this.SelectedSquare;
    let reciever: Piece | null = this.matrix[RecieverX][RecieverY];
    let Audio = reciever === null ? this.PlayMove : this.PlayCapture;

    // check if SelectedPiece is attacking oposite color (or empty square) and
    // if attacked square is in allowed aka if recievier coords in SelectedSquareDirections
    if (
      (reciever?.Color !== this.CurrentPlayer || !reciever) &&
      this.isArrayInMatrix(
        [RecieverX, RecieverY],
        this.SelecetedSquareDirections
      )
    ) {
      let isSafeAfterMove = this.isSquareSafeAfterMove(
        AttackerX,
        AttackerY,
        RecieverX,
        RecieverY
      );
      if (!isSafeAfterMove) {
        // in here, the selected piece cant move because it exposes the king aka notsafesquareAfterMove func
        // implement it

        return;
      }
      this.MovesHistory.push([AttackerX, AttackerY], [RecieverX, RecieverY]);
      this.LastMoves = [
        [AttackerX, AttackerY],
        [RecieverX, RecieverY],
      ];

      attacker.X = RecieverX;
      attacker.Y = RecieverY;

      this.matrix[RecieverX][RecieverY] = attacker;
      this.matrix[AttackerX][AttackerY] = null;

      if (attacker instanceof Pawn) {
        attacker.hasMoved = true;
        attacker.updateDirections();
      }

      Audio();
      /* this.DisplayBoard(); */
      this.CurrentPlayer = this.CurrentPlayer == 'Black' ? 'White' : 'Black';
      this.SelectedSquare = null;
      this.SelecetedSquareDirections = [];

      this.ClearGreenDotsandRed();
    }
  }

  CantMoveFunc() {}

  PlayMove() {
    let move = new Audio('assets/Move.mp3');
    move.play();
  }

  PlayCapture() {
    let capture = new Audio('assets/Capture.mp3');
    capture.play();
  }

  HighlightPossibleSquares(SafeSquares: number[][]) {
    this.ClearGreenDotsandRed();
    for (let [x, y] of SafeSquares) {
      console.log('SafeSquares', x, y);
      let piece = this.matrix[x][y];
      if (piece) {
        if (piece.Color !== this.CurrentPlayer) {
          this.CanAttack(x, y);
        }
      }
      // apply green dot class to possible squares
      // get box based on x and y then apply green dot
      let box = this.getBoxUsingCoords(x, y);
      let greenDot = document.createElement('div');
      greenDot.classList.add('green-dot');
      greenDot.style.width = '30px';
      greenDot.style.height = '30px';
      greenDot.style.borderRadius = '50%';
      greenDot.style.backgroundColor = 'rgba(20, 85, 30, 0.3)';
      greenDot.style.opacity = '0.5';
      box?.appendChild(greenDot);
    }
  }

  CanAttack(x: number, y: number) {
    let box = this.getBoxUsingCoords(x, y);
    box!.classList.add('red');
  }

  MoveToBox(x: number, y: number, BoxX: number, BoxY: number) {
    if (!this.isPositionValid(BoxX, BoxY)) return;
    let BoxPiece = this.getPiece(BoxX, BoxY);
    let piece = this.getPiece(x, y);

    if (BoxPiece === null) {
      this.matrix[BoxX][BoxY] = piece;
      this.matrix[x][y] = null;
      /* this.DisplayBoard(); */
    }
  }

  ClearGreenDotsandRed() {
    document
      .querySelectorAll('[class=green-dot]')
      .forEach((element) => element.remove());

    document
      .querySelectorAll('[class="square black red"],[class="square white red"]')
      .forEach((element) => {
        element.classList.remove('red');
      });

    document
      .querySelectorAll(
        '[class="square black last-move red"],[class="square white last-move red"]'
      )
      .forEach((element) => {
        element.classList.remove('red');
      });
  }

  isSquareSafeAfterMove(
    x: number,
    y: number,
    prevX: number,
    prevY: number
  ): boolean {
    let piece: Piece | null = this.SelectedSquare;

    /* let pieceSafeSquares = this.getSafeSquares(piece!); */

    // store Prev in temporary variable
    let temp: Piece | null = this.matrix[prevX][prevY];
    // simulate move
    this.matrix[prevX][prevY] = piece;
    this.matrix[x][y] = null;

    const isSafeAfterMove = piece
      ? !this.isKingInCheck(this.CurrentPlayer)
      : false;

    this.matrix[x][y] = piece;
    this.matrix[prevX][prevY] = temp;

    return isSafeAfterMove;
  }

  isPositionValid(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.dim && y < this.dim;
  }

  isInstanceOfKing(x: number, y: number): boolean {
    let piece = this.getPiece(x, y);
    return piece instanceof King && piece.Color === this.CurrentPlayer;
  }

  isKingInCheck(color: string): boolean {
    for (let i = 0; i < this.dim; i++) {
      for (let j = 0; j < this.dim; j++) {
        const piece = this.matrix[i][j];
        // make sure to find enemy pieces only
        if (piece?.Color === color || !piece) continue;
        // check if a king is present in the attack directions of a piece
        for (let [x, y] of piece.Directions) {
          let newX = i + x;
          let newY = j + y;
          if (!this.isPositionValid(newX, newY)) continue;

          if (
            piece instanceof Pawn ||
            piece instanceof King ||
            piece instanceof Knight
          ) {
            const attackedPiece: Piece | null = this.matrix[newX][newY];
            if (piece instanceof Pawn && y === 0) continue;
            if (!attackedPiece || attackedPiece.Color !== color) continue;
            if (attackedPiece instanceof King && attackedPiece?.Color === color)
              return true;
          }
          if (
            piece instanceof Queen ||
            piece instanceof Fou ||
            piece instanceof Tour
          ) {
            while (this.isPositionValid(newX, newY)) {
              const attackedPiece: Piece | null = this.matrix[newX][newY];
              if (
                attackedPiece instanceof King &&
                attackedPiece?.Color === color
              )
                return true;

              if (attackedPiece) break;
              newX += x;
              newY += y;
            }
          }
        }
      }
    }
    return false;
  }

  ngAfterViewInit(): void {
    let BlackPieces = {
      Tour: 'assets/bR.svg',
      Cheval: 'assets/bN.svg',
      Fou: 'assets/bB.svg',
      King: 'assets/bK.svg',
      Queen: 'assets/bQ.svg',
      Peon: 'assets/bP.svg',
      Empty: '',
    };

    let WhitePieces = {
      Tour: 'assets/wR.svg',
      Cheval: 'assets/wN.svg',
      Fou: 'assets/wB.svg',
      King: 'assets/wK.svg',
      Queen: 'assets/wQ.svg',
      Peon: 'assets/wP.svg',
      Empty: '',
    };

    /* this.InitializeBlackPieces(BlackPieces);
    this.InitializeBlackPeons(BlackPieces);
    this.InitializeWhitePeons(WhitePieces);
    this.InitializeWhitePieces(WhitePieces); */
    /* this.InitializeBoard(); */
    /* this.DisplayBoard(); */
  }

  DisplayBoard() {
    for (let i = 0; i < this.dim; i++) {
      for (let j = 0; j < this.dim; j++) {
        if (this.matrix[i][j]) {
          this.DisplayPiece(this.matrix[i][j] as Piece);
        }
      }
    }
  }

  ClearBoardIMGS() {
    for (let i = 0; i < this.dim; i++) {
      for (let j = 0; j < this.dim; j++) {
        this.getBoxUsingCoords(i, j)?.firstChild?.remove();
      }
    }
  }

  DisplayPiece(piece: Piece) {
    let [x, y] = piece.position;
    // Select the box on which the piece currently stands
    let box = this.getBoxUsingCoords(x, y);
    /* let box = document.querySelector(
      `[id^='box'][id$='${x.toString() + y.toString()}']`
    ); */
    // Set the corresponding img
    if (!box?.hasChildNodes()) {
      let img = new Image();
      img.src = piece.icon;
      this.renderer.setAttribute(img, 'class', 'image');
      box?.appendChild(img);
      /* this.renderer.appendChild(box, img); */
    }
  }

  InitializeBoard() {
    for (let i = 0; i < this.dim; i++) {
      for (let j = 0; j < this.dim; j++) {
        // white pawns
        if (i == 6) {
          this.matrix[i][j] = new Pawn(i, j, 'White');
          // black pawns
        } else if (i == 1) {
          this.matrix[i][j] = new Pawn(i, j, 'Black');
        }
        this.InitializeBlackPieces(i, j, 'Black');
        this.InitializeWhitePieces(i, j, 'White');
      }
    }
  }

  InitializeBlackPieces(i: number, j: number, Color: string) {
    if (i == 0 && j == 0) {
      this.matrix[i][j] = new Tour(i, j, Color);
    } else if (i == 0 && j == 1) {
      this.matrix[i][j] = new Knight(i, j, Color);
    } else if (i == 0 && j == 2) {
      this.matrix[i][j] = new Fou(i, j, Color);
    } else if (i == 0 && j == 3) {
      this.matrix[i][j] = new Queen(i, j, Color);
    } else if (i == 0 && j == 4) {
      this.matrix[i][j] = new King(i, j, Color);
    } else if (i == 0 && j == 5) {
      this.matrix[i][j] = new Fou(i, j, Color);
    } else if (i == 0 && j == 6) {
      this.matrix[i][j] = new Knight(i, j, Color);
    } else if (i == 0 && j == 7) {
      this.matrix[i][j] = new Tour(i, j, Color);
    }
  }

  InitializeWhitePieces(i: number, j: number, Color: string) {
    if (i == 7 && j == 0) {
      this.matrix[i][j] = new Tour(i, j, Color);
    } else if (i == 7 && j == 1) {
      this.matrix[i][j] = new Knight(i, j, Color);
    } else if (i == 7 && j == 2) {
      this.matrix[i][j] = new Fou(i, j, Color);
    } else if (i == 7 && j == 3) {
      this.matrix[i][j] = new Queen(i, j, Color);
    } else if (i == 7 && j == 4) {
      this.matrix[i][j] = new King(i, j, Color);
    } else if (i == 7 && j == 5) {
      this.matrix[i][j] = new Fou(i, j, Color);
    } else if (i == 7 && j == 6) {
      this.matrix[i][j] = new Knight(i, j, Color);
    } else if (i == 7 && j == 7) {
      this.matrix[i][j] = new Tour(i, j, Color);
    }
  }
}
