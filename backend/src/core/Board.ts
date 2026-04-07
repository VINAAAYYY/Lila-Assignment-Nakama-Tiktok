import { PlayerMark } from "../types";
import { MATCH_BOARD_SIZE, WIN_LINES, EMPTY_CELL } from "../constants";


export class Board {
  private readonly cells: PlayerMark[];

  constructor(cells?: PlayerMark[]) {
    this.cells = cells
      ? [...cells]
      : Array<PlayerMark>(MATCH_BOARD_SIZE).fill(EMPTY_CELL as PlayerMark);
  }



  getCell(index: number): PlayerMark {
    return this.cells[index];
  }

  isCellEmpty(index: number): boolean {
    return this.cells[index] === (EMPTY_CELL as PlayerMark);
  }

  isValidPosition(index: number): boolean {
    return index >= 0 && index < MATCH_BOARD_SIZE;
  }

  isFull(): boolean {
    return this.cells.every(cell => cell !== (EMPTY_CELL as PlayerMark));
  }


  getWinnerMark(): PlayerMark | null {
    for (const [a, b, c] of WIN_LINES) {
      const mark = this.cells[a];
      if (mark !== (EMPTY_CELL as PlayerMark) &&
          mark === this.cells[b] &&
          mark === this.cells[c]) {
        return mark;
      }
    }
    return null;
  }

  isDraw(): boolean {
    return this.isFull() && this.getWinnerMark() === null;
  }


  snapshot(): PlayerMark[] {
    return [...this.cells];
  }




  applyMove(index: number, mark: PlayerMark): Board {
    if (!this.isValidPosition(index)) {
      throw new Error(`Invalid position: ${index}`);
    }
    if (!this.isCellEmpty(index)) {
      throw new Error(`Cell ${index} is already occupied`);
    }
    const next = [...this.cells];
    next[index] = mark;
    return new Board(next);
  }



  static empty(): Board {
    return new Board();
  }

  static from(cells: PlayerMark[]): Board {
    if (cells.length !== MATCH_BOARD_SIZE) {
      throw new Error(`Board must have exactly ${MATCH_BOARD_SIZE} cells`);
    }
    return new Board(cells);
  }
}
