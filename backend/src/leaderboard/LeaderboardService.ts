import { Logger } from "../utils/Logger";
import { LeaderboardEntry, PlayerStats } from "../types";
import { AppConfig } from "../config";
import { LEADERBOARD_ID } from "../constants";

const SORT_ORDER = "desc" as const;
const OPERATOR = "incr" as const;


export class LeaderboardService {
  constructor(private readonly cfg: AppConfig) { }


  ensureLeaderboard(nk: nkruntime.Nakama, logger: nkruntime.Logger): void {
    const log = new Logger(logger, "LeaderboardService");
    try {
      nk.leaderboardCreate(LEADERBOARD_ID, false, SORT_ORDER, OPERATOR, "", false);
      log.info("Leaderboard ensured id=%s", LEADERBOARD_ID);
    } catch {

    }
  }


  getLeaderboard: nkruntime.RpcFunction = (
    _ctx: nkruntime.Context,
    logger: nkruntime.Logger,
    nk: nkruntime.Nakama,
    _payload: string,
  ): string => {
    const log = new Logger(logger, "LeaderboardService.getLeaderboard");

    if (!this.cfg.features.leaderboardEnabled) {
      throw new Error("Leaderboard feature is disabled");
    }

    try {
      const result = nk.leaderboardRecordsList(
        LEADERBOARD_ID, [], this.cfg.leaderboard.topN, null, 1,
      );

      const entries: LeaderboardEntry[] = (result.records ?? []).map(r => ({
        userId: r.ownerId,
        username: r.username ?? r.ownerId,
        wins: r.score,
        rank: r.rank,
      }));

      return JSON.stringify(entries);
    } catch (e) {
      log.error("getLeaderboard failed: %s", e);
      throw e;
    }
  };


  getMyStats: nkruntime.RpcFunction = (
    ctx: nkruntime.Context,
    logger: nkruntime.Logger,
    nk: nkruntime.Nakama,
    _payload: string,
  ): string => {
    const log = new Logger(logger, "LeaderboardService.getMyStats");

    if (!ctx.userId) throw new Error("Not authenticated");

    try {
      const result = nk.leaderboardRecordsList(LEADERBOARD_ID, [ctx.userId], 1, null, 1);
      const mine = result.ownerRecords?.[0];
      const stats: PlayerStats = {
        wins: mine?.score ?? 0,
        rank: mine?.rank ?? null,
      };
      return JSON.stringify(stats);
    } catch (e) {
      log.error("getMyStats failed: %s", e);
      throw e;
    }
  };
}
