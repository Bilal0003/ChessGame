import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Piece } from '../pieces/piece';
import { Fou } from '../pieces/fou';
import { Tour } from '../pieces/tour';
import { Queen } from '../pieces/queen';
import { Knight } from '../pieces/knight';
import { NgFor } from '@angular/common';
import { GameLogicService } from '../game-logic.service';

@Component({
  selector: 'app-promotion',
  standalone: true,
  imports: [NgFor],
  templateUrl: './promotion.component.html',
  styleUrl: './promotion.component.css',
})
export class PromotionComponent {
  @Input() CurrentPlayer!: string;
  @Input() PromotedPawn!: Piece | null;
  @Output() promoted = new EventEmitter<string>();
  @Input() matrix!: (Piece | null)[][];
  public pawnReplacemenets: Piece[] = [];

  constructor(private GameLogicService: GameLogicService) {}

  ngOnInit() {
    this.populateReplacement(
      this.PromotedPawn!.X,
      this.PromotedPawn!.Y,
      this.CurrentPlayer,
    );
  }

  populateReplacement(x: number, y: number, color: string) {
    this.pawnReplacemenets = [
      new Queen(x, y, color),
      new Fou(x, y, color),
      new Tour(x, y, color),
      new Knight(x, y, color),
    ];
  }
  setTarget(target: string) {
    this.GameLogicService.setPawnTo(target, this.PromotedPawn, this.matrix);
    this.promoted.emit(target);
  }
}
