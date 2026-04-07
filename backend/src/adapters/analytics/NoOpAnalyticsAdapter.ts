import { IAnalyticsAdapter }        from "../../types";
import { GameMode, GameOverReason }  from "../../types";


export class NoOpAnalyticsAdapter implements IAnalyticsAdapter {
  trackMatchEnd(
    _matchId:  string,
    _winnerId: string | null,
    _reason:   GameOverReason,
    _mode:     GameMode,
  ): void {

  }
}
