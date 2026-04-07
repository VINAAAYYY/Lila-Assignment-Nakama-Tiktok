import { Logger }            from "../utils/Logger";
import { GameMode }          from "../types";
import { AppConfig }         from "../config";
import { MATCH_MODULE_NAME } from "../constants";


export class MatchmakerService {
  constructor(private readonly cfg: AppConfig) {}

  onMatched: nkruntime.MatchmakerMatchedFunction = (
    _ctx:    nkruntime.Context,
    logger:  nkruntime.Logger,
    nk:      nkruntime.Nakama,
    matches: nkruntime.MatchmakerEntry[],
  ): string | void => {
    const log = new Logger(logger, "MatchmakerService");

    try {
      const rawMode = matches[0]?.properties?.["mode"] as string | undefined;
      const mode    = this.resolveMode(rawMode);
      const matchId = nk.matchCreate(MATCH_MODULE_NAME, { mode });
      log.info("Match created matchId=%s mode=%s", matchId, mode);
      return matchId;
    } catch (e) {
      log.error("Failed to create match: %s", e);
    }
  };

  private resolveMode(raw: string | undefined): GameMode {
    if (raw === GameMode.Timed && this.cfg.features.timedModeEnabled) {
      return GameMode.Timed;
    }
    return this.cfg.match.defaultMode;
  }
}
