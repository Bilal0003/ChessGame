import { Injectable, Input, Output } from '@angular/core';
import { Piece } from './pieces/piece';
import { BoardComponent } from './board/board.component';

@Injectable({
  providedIn: 'root',
})
export class GameLogicService {
  BlackPieces!: {};
  WhitePieces!: {};
  constructor() {}

  ListenToMove(element: any) {
    // this function should highlight the selected squre with green
    this.Highlight(element);
    // it should then call a function that display the possible moves for the piece
  }

  Highlight(element: any) {
    if (element.srcElement.src.endsWith('svg')) {
      let box = element.srcElement.parentNode;
      if (box.classList.contains('green')) {
        box.classList.remove('green');
      } else if (
        box.classList.contains('white') ||
        box.classList.contains('black')
      ) {
        box.classList.add('green');
      }
    }
  }

  isArrayInMatrix(array: number[], matrix: [][]): boolean {
    return matrix.some(
      (subArray) =>
        subArray.length === array.length &&
        subArray.every((value, index) => value === array[index])
    );
  }

  DisplayPossibleMoves(element: any, matrix: Piece[][]) {}

  getCoordinates(element: any): { x: number; y: number } {
    // We make sure the box is selected, based on wether the box has a piece or not
    let box = element.srcElement.classList.contains('image')
      ? element.srcElement.parentNode
      : element.srcElement;

    let id = Number(box.id.slice(-2));
    let [x, y] = [Math.floor(id / 10), id % 10];
    console.log(x, y);

    return { x, y };
  }

  getBoxUsingCoords(x: number, y: number): HTMLElement | null {
    return document.querySelector(`[id$='${x.toString() + y.toString()}']`);
  }

  getPiece(element: any): HTMLElement {
    return element.srcElement;
  }
}
