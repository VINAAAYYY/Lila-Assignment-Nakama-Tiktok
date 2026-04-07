import { GameMode } from "../types";


export class TurnTimer {
  protected deadline: number = 0;

  constructor(protected readonly timeoutSec: number) {}

  start(): void {
    this.deadline = this.nowSec() + this.timeoutSec;
  }

  stop(): void {
    this.deadline = 0;
  }

  isExpired(): boolean {
    return this.deadline > 0 && this.nowSec() >= this.deadline;
  }

  getDeadline(): number {
    return this.deadline;
  }

  remainingSec(): number {
    if (this.deadline === 0) return 0;
    return Math.max(0, this.deadline - this.nowSec());
  }


  restoreDeadline(epochSec: number): void {
    this.deadline = epochSec;
  }

  private nowSec(): number {
    return Math.floor(Date.now() / 1000);
  }



  static forMode(mode: GameMode, timeoutSec: number): TurnTimer {
    return mode === GameMode.Timed
      ? new TurnTimer(timeoutSec)
      : new NoOpTurnTimer(timeoutSec);
  }
}


class NoOpTurnTimer extends TurnTimer {
  override start(): void {  }
  override stop():  void {  }
  override isExpired():      boolean { return false; }
  override getDeadline():    number  { return 0; }
  override remainingSec():   number  { return 0; }
  override restoreDeadline(_epochSec: number): void {  }
}
