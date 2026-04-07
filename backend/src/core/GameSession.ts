import { Board }     from "./Board";
import { TurnTimer } from "./TurnTimer";
import {
  GameMode,
  GameOverReason,
  MatchState,
  PlayerMark,
} from "../types";
import { PLAYER_MARKS, MATCH_MAX_PLAYERS } from "../constants";
import { AppConfig } from "../config";

export interface MoveResult {
  ok:     true;
  board:  Board;
  reason: GameOverReason | null;
  winner: string | null;
}

export interface MoveError {
  ok:      false;
  message: string;
}

export type MoveOutcome = MoveResult | MoveError;


export class GameSession {
  private board:   Board;
  private timer:   TurnTimer;
  private _turn:   string        = "";
  private _winner: string | null = null;
  private _draw:   boolean       = false;
  private _over:   boolean       = false;

  readonly players: Map<string, nkruntime.Presence> = new Map();
  readonly marks:   Map<string, PlayerMark>          = new Map();
  readonly mode:    GameMode;

  private constructor(mode: GameMode, timer: TurnTimer, board: Board) {
    this.mode  = mode;
    this.board = board;
    this.timer = timer;
  }




  static create(mode: GameMode, cfg: AppConfig): GameSession {
    return new GameSession(
      mode,
      TurnTimer.forMode(mode, cfg.match.turnTimeoutSec),
      Board.empty(),
    );
  }


  static fromSnapshot(raw: MatchState, cfg: AppConfig): GameSession {
    const timer = TurnTimer.forMode(raw.mode, cfg.match.turnTimeoutSec);
    if (raw.turnDeadline > 0) {
      timer.restoreDeadline(raw.turnDeadline);
    }

    const session = new GameSession(raw.mode, timer, Board.from(raw.board));

    for (const [userId, presence] of Object.entries(raw.players)) {
      session.players.set(userId, presence);
    }
    for (const [userId, mark] of Object.entries(raw.marks)) {
      session.marks.set(userId, mark as PlayerMark);
    }

    session._turn   = raw.turn;
    session._winner = raw.winner;
    session._draw   = raw.draw;
    session._over   = raw.gameOver;

    return session;
  }



  isFull(): boolean {
    return this.players.size >= MATCH_MAX_PLAYERS;
  }

  addPlayer(presence: nkruntime.Presence): void {
    if (this.isFull()) throw new Error("Match is already full");
    this.players.set(presence.userId, presence);
  }

  removePlayer(userId: string): void {
    this.players.delete(userId);
    this.marks.delete(userId);
  }


  start(): string {
    if (this.players.size !== MATCH_MAX_PLAYERS) {
      throw new Error("Cannot start with fewer than 2 players");
    }
    const [first, second] = [...this.players.keys()];
    this.marks.set(first,  PLAYER_MARKS[0]);
    this.marks.set(second, PLAYER_MARKS[1]);
    this._turn = first;
    this.timer.start();
    return first;
  }



  applyMove(userId: string, position: number): MoveOutcome {
    if (this._over) {
      return { ok: false, message: "Game is already over" };
    }
    if (this._turn !== userId) {
      return { ok: false, message: "It is not your turn" };
    }
    const mark = this.marks.get(userId);
    if (!mark) return { ok: false, message: "Player not found in session" };

    if (!this.board.isValidPosition(position)) {
      return { ok: false, message: `Position ${position} is out of range` };
    }
    if (!this.board.isCellEmpty(position)) {
      return { ok: false, message: `Position ${position} is already taken` };
    }

    this.board = this.board.applyMove(position, mark);
    this.timer.stop();

    const winnerMark = this.board.getWinnerMark();
    if (winnerMark) {
      const winnerId = this.userIdForMark(winnerMark);
      if (!winnerId) return { ok: false, message: "Internal: winner mark has no owner" };
      this._winner = winnerId;
      this._over   = true;
      return { ok: true, board: this.board, reason: GameOverReason.Win, winner: winnerId };
    }

    if (this.board.isDraw()) {
      this._draw = true;
      this._over = true;
      return { ok: true, board: this.board, reason: GameOverReason.Draw, winner: null };
    }

    this._turn = this.opponentOf(userId) ?? "";
    this.timer.start();
    return { ok: true, board: this.board, reason: null, winner: null };
  }


  checkTimeout(): MoveOutcome | null {
    if (this._over || !this.timer.isExpired()) return null;

    const forfeitId = this._turn;
    const winnerId  = this.opponentOf(forfeitId) ?? null;
    this._winner = winnerId;
    this._over   = true;
    this.timer.stop();

    return { ok: true, board: this.board, reason: GameOverReason.Timeout, winner: winnerId };
  }


  forfeit(userId: string): string | null {
    this._over   = true;
    this._winner = this.opponentOf(userId) ?? null;
    this.timer.stop();
    return this._winner;
  }



  get turn():          string        { return this._turn;   }
  get winner():        string | null { return this._winner; }
  get isOver():        boolean       { return this._over;   }
  get deadline():      number        { return this.timer.getDeadline(); }
  get boardSnapshot(): PlayerMark[]  { return this.board.snapshot(); }

  marksRecord(): Record<string, PlayerMark> {
    return Object.fromEntries(this.marks);
  }

  toMatchState(): MatchState {
    return {
      board:        this.board.snapshot(),
      marks:        this.marksRecord(),
      turn:         this._turn,
      players:      Object.fromEntries(this.players),
      winner:       this._winner,
      draw:         this._draw,
      gameOver:     this._over,
      mode:         this.mode,
      turnDeadline: this.timer.getDeadline(),
    };
  }



  private opponentOf(userId: string): string | undefined {
    return [...this.players.keys()].find(id => id !== userId);
  }

  private userIdForMark(mark: PlayerMark): string | undefined {
    for (const [id, m] of this.marks) {
      if (m === mark) return id;
    }
    return undefined;
  }
}
