

import { buildConfig } from "./config";
import { MatchHandlerFactory } from "./match/MatchHandlerFactory";
import { MatchmakerService } from "./matchmaker/MatchmakerService";
import { LeaderboardService } from "./leaderboard/LeaderboardService";
import { NakamaStorageAdapter } from "./adapters/storage/NakamaStorageAdapter";
import { NoOpAnalyticsAdapter } from "./adapters/analytics/NoOpAnalyticsAdapter";
import { Logger } from "./utils/Logger";
import {
  MATCH_MODULE_NAME,
  RPC_GET_LEADERBOARD,
  RPC_GET_MY_STATS,
} from "./constants";

function InitModule(
  ctx: nkruntime.Context,
  rawLogger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  initializer: nkruntime.Initializer,
): void {
  const log = new Logger(rawLogger, "InitModule");
  log.info("Bootstrapping tictactoe module...");


  const cfg = buildConfig(ctx.env);
  log.info("Config: mode=%s timed=%s leaderboard=%s history=%s",
    cfg.match.defaultMode,
    cfg.features.timedModeEnabled,
    cfg.features.leaderboardEnabled,
    cfg.features.matchHistoryEnabled,
  );


  const storage = new NakamaStorageAdapter();
  const analytics = new NoOpAnalyticsAdapter();


  const leaderboard = new LeaderboardService(cfg);
  const matchmaker = new MatchmakerService(cfg);


  const handlers = new MatchHandlerFactory(cfg, storage, analytics).build();


  initializer.registerMatch(MATCH_MODULE_NAME, handlers);
  log.info("Registered match handler name=%s", MATCH_MODULE_NAME);

  initializer.registerMatchmakerMatched(matchmaker.onMatched);
  log.info("Registered matchmaker hook");

  if (cfg.features.leaderboardEnabled) {
    initializer.registerRpc(RPC_GET_LEADERBOARD, leaderboard.getLeaderboard);
    initializer.registerRpc(RPC_GET_MY_STATS, leaderboard.getMyStats);
    leaderboard.ensureLeaderboard(nk, rawLogger);
    log.info("Registered leaderboard RPCs");
  }

  log.info("Module bootstrap complete");
}

!InitModule && InitModule.toString();
export { InitModule };
