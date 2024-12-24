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
import { last, pipe, timeInterval } from 'rxjs';
import { ControlContainer } from '@angular/forms';
import { ThisReceiver } from '@angular/compiler';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';

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
  public PreviousPlayer: string | undefined;
  public SelectedSquare!: Piece | null;
  public SelecetedSquareDirections!: any[];
  public MovesHistory: any[] = [];
  public LastMoves: any[] = [];
  public CantMove: boolean = false;
  public CheckMate: boolean = false;
  public Check: boolean = false;
  public WinnerMsg: String | undefined;

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
  }

  isArrayInMatrix(array: number[], matrix: [][]): boolean {
    return this.GameService.isArrayInMatrix(array, matrix);
  }

  ColorLastMove() {
    if (!this.MovesHistory.length) return;
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

  getSafeSquares(x: number, y: number): number[][] {
    let piece: Piece | null = this.getPiece(x, y);
    let SafeSquares: number[][] = [];

    // variable to avoid checking multiple times for en passant or castle
    var alreadyEnPassant: boolean = false;
    var alreadyCastled: boolean = false;
    if (piece) {
      for (let [dx, dy] of piece.Directions) {
        var [newX, newY] = [x + dx, y + dy];

        if (!this.isPositionValid(newX, newY)) continue;
        var target: Piece | null = this.matrix[newX][newY];
        if (
          piece instanceof King ||
          piece instanceof Knight ||
          piece instanceof Pawn
        ) {
          if (piece instanceof Pawn) {
            /* var target: Piece | null = this.matrix[newX][newY]; */

            // limit pawn movement after first move
            if (piece.hasMoved && Math.abs(dx) == 2) continue;
            // handle case where pawn has not moved but an enemy piece is in front of it
            if (
              !piece.hasMoved &&
              ((dx === 2 && this.matrix[piece.X + 1][piece.Y]) ||
                (dx === -2 && this.matrix[piece.X - 1][piece.Y]))
            ) {
              continue;
            }
            // check for en passant by checking if there is a pawn to the left or right
            if (this.CanEnPassantCapture(piece, x, y) && !alreadyEnPassant) {
              alreadyEnPassant = true;
              SafeSquares.push([
                x + (piece.Color === 'White' ? -1 : 1),
                this.MovesHistory.slice(-1)[0].at(1),
              ]);
            }

            // check if target position is in the latteral attack directions of pawn and its an enemy color
            if (dy !== 0 && target && target.Color !== piece.Color) {
              SafeSquares.push([newX, newY]);
            }

            // check if the spot is empty and make sure its not in latteral i.e only front
            else if (!target && Math.abs(dy) !== 1) {
              SafeSquares.push([newX, newY]);
            }
          } else if (piece instanceof King) {
            if (this.CanCastle(piece, true) && !alreadyCastled) {
              alreadyCastled = true;
              SafeSquares.push([x, 6]);
            }
            if (this.CanCastle(piece, false) && !alreadyCastled) {
              alreadyCastled = true;
              SafeSquares.push([x, 2]);
            } else {
              if (
                this.isPositionValid(newX, newY) &&
                ((target && target.Color !== piece.Color) || !target)
              ) {
                SafeSquares.push([newX, newY]);
              }
            }
          } else if (piece instanceof Knight) {
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
        // Exclude all squares that would leave king in check
        for (let [X, Y] of SafeSquares) {
          if (!this.isSquareSafeAfterMove(piece, x, y, X, Y)) {
            SafeSquares = SafeSquares.filter(
              (square) => square[0] !== X || square[1] !== Y
            );
          }
        }
      }
    }

    return SafeSquares;
  }

  CanEnPassantCapture(pawn: Pawn, x: number, y: number): boolean {
    if (!this.MovesHistory.length) return false;
    const lastArray = this.MovesHistory.slice(-1);
    const b4LastArray = this.MovesHistory.slice(-2, -1);

    const [lastX, lastY] = lastArray[0];
    const [CurrX, CurrY] = b4LastArray[0];

    const LastPiece = this.getPiece(lastX, lastY);
    const b4LastPiece = this.getPiece(CurrX, CurrY);
    if (
      !(LastPiece instanceof Pawn) ||
      pawn.color !== this.CurrentPlayer ||
      Math.abs(lastX - CurrX) !== 2 ||
      lastX !== x ||
      Math.abs(y - CurrY) !== 1
    )
      return false;

    const PawnNewX = x + (this.CurrentPlayer === 'White' ? -1 : 1);
    const PawnNewY = lastY;

    return this.isSquareSafeAfterMove(pawn, x, y, PawnNewX, PawnNewY);
  }

  CanCastle(king: King, KingSideCastle: boolean): boolean {
    if (king.hasMoved) return false;

    const kingX = king.Color === 'White' ? 7 : 0;
    const kingY = 4;
    const rookX = kingX;
    const rookY = KingSideCastle ? 0 : 7;

    const rook: Piece | null = this.getPiece(rookX, rookY);

    if (
      !(rook instanceof Tour) ||
      rook.hasMoved ||
      this.isKingInCheck(this.CurrentPlayer)
    )
      return false;

    const firstNextY = kingY + (KingSideCastle ? 1 : -1);
    const secondNextY = kingY + (KingSideCastle ? 2 : -2);

    if (this.getPiece(kingX, firstNextY) || this.getPiece(kingX, secondNextY))
      return false;

    if (!KingSideCastle && this.getPiece(kingX, 1)) return false;

    return (
      this.isSquareSafeAfterMove(king, kingX, kingY, kingX, firstNextY) &&
      this.isSquareSafeAfterMove(king, kingX, kingY, kingX, secondNextY)
    );
  }

  HandleUnusualMoves(
    piece: Piece,
    prevX: number,
    prevY: number,
    newX: number,
    newY: number
  ) {
    if (!this.LastMoves.length) return;
    const lastPiece = this.getPiece(this.LastMoves[1][0], this.LastMoves[1][1]);
    const [b4lastPieceX, b4lastPieceY] = this.LastMoves[0];

    if (
      piece instanceof Pawn &&
      this.LastMoves &&
      lastPiece instanceof Pawn &&
      Math.abs(lastPiece.X - b4lastPieceX) === 2 &&
      prevX === lastPiece.X &&
      newY === lastPiece.Y
    ) {
      this.matrix[lastPiece.X][lastPiece.Y] = null;
    }
    // detect castling by checking if king moved two squares in direction of rook
    else if (piece instanceof King && Math.abs(newY - prevY) === 2) {
      const rookX = prevX;
      const rookY = newY > prevY ? 7 : 0;

      const rook = this.getPiece(rookX, rookY) as Tour;
      const rookNewY = newY > prevY ? 5 : 3;

      this.matrix[rookX][rookY] = null;
      rook.X = rook.X;
      rook.Y = rookNewY;
      this.matrix[rookX][rookNewY] = rook;
      rook.hasMoved = true;
    }
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
    if (this.CheckMate) return;
    this.MoveListener(x, y);

    if (this.SelectedSquare) {
      this.MoveMaker(this.SelectedSquare.X, this.SelectedSquare.Y, x, y);
    }
    this.CheckMate = this.isCheckMate(this.CurrentPlayer);
  }

  // the sole purpose of this function is to make a move
  MoveMaker(
    AttackerX: number,
    AttackerY: number,
    RecieverX: number,
    RecieverY: number
  ): void {
    if (!this.SelectedSquare) return;

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
      this.HandleUnusualMoves(
        attacker,
        AttackerX,
        AttackerY,
        RecieverX,
        RecieverY
      );

      attacker.X = RecieverX;
      attacker.Y = RecieverY;

      this.matrix[RecieverX][RecieverY] = attacker;
      this.matrix[AttackerX][AttackerY] = null;

      this.MovesHistory.push([AttackerX, AttackerY], [RecieverX, RecieverY]);
      this.LastMoves = [
        [AttackerX, AttackerY],
        [RecieverX, RecieverY],
      ];
      console.log('MovesHistory: ', this.MovesHistory);
      if (
        attacker instanceof Pawn ||
        attacker instanceof King ||
        attacker instanceof Tour
      ) {
        attacker.hasMoved = true;

        /* attacker.updateDirections(); */
      }

      Audio();
      console.log(this.matrix);
      /* this.DisplayBoard(); */
      /* this.CheckMate = this.isCheckMate(this.CurrentPlayer); */

      this.CurrentPlayer = this.CurrentPlayer == 'Black' ? 'White' : 'Black';
      this.SelectedSquare = null;
      this.SelecetedSquareDirections = [];

      this.ClearGreenDotsandRed();
    }
  }

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
    piece: Piece | null,
    x: number,
    y: number,
    prevX: number,
    prevY: number
  ): boolean {
    /* let piece: Piece | null = this.SelectedSquare; */

    /* let pieceSafeSquares = this.getSafeSquares(piece!); */

    // store Prev in temporary variable
    let temp: Piece | null = this.matrix[prevX][prevY];

    if (temp?.Color === piece?.Color) return false;
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
              /* this.Check = true; */
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
                /* this.Check = true; */
                return true;

              if (attackedPiece) break;
              newX += x;
              newY += y;
            }
          }
        }
      }
    }
    /* this.Check = false; */

    return false;
  }

  isCheckMate(color: string): boolean {
    // travres all current player piecies, get all the safe squares, if player has no safe squares then checkmate.
    for (let i = 0; i < this.dim; i++) {
      for (let j = 0; j < this.dim; j++) {
        let piece: Piece | null = this.matrix[i][j];
        // travese only allied pieces
        if (!piece || piece.Color !== color) continue;
        const pieceSafeSquares = this.getSafeSquares(i, j);
        if (pieceSafeSquares.length) return false;
      }
    }
    this.PreviousPlayer = this.CurrentPlayer === 'White' ? 'Black' : 'White';
    return true;
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
