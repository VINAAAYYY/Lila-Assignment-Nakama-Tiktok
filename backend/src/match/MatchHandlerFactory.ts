import { MatchHandler }                      from "./MatchHandler";
import { AppConfig }                         from "../config";
import { MatchState, IStorageAdapter, IAnalyticsAdapter } from "../types";


export class MatchHandlerFactory {
  constructor(
    private readonly cfg:       AppConfig,
    private readonly storage:   IStorageAdapter,
    private readonly analytics: IAnalyticsAdapter,
  ) {}

  build(): nkruntime.MatchHandler<MatchState> {
    const { cfg, storage, analytics } = this;

    return {
      matchInit: (ctx, logger, nk, params) =>
        MatchHandler.init(ctx, logger, nk, params as Record<string, string>, cfg),

      matchJoinAttempt: (ctx, logger, nk, dispatcher, tick, state, presence, metadata) =>
        MatchHandler.joinAttempt(ctx, logger, nk, dispatcher, tick, state, presence, metadata as Record<string, string>),

      matchJoin: (ctx, logger, nk, dispatcher, tick, state, presences) =>
        MatchHandler.join(ctx, logger, nk, dispatcher, tick, state, presences, cfg),

      matchLeave: (ctx, logger, nk, dispatcher, tick, state, presences) =>
        MatchHandler.leave(ctx, logger, nk, dispatcher, tick, state, presences, cfg, storage, analytics),

      matchLoop: (ctx, logger, nk, dispatcher, tick, state, messages) =>
        MatchHandler.loop(ctx, logger, nk, dispatcher, tick, state, messages, cfg, storage, analytics) ?? { state },

      matchTerminate: (ctx, logger, nk, dispatcher, tick, state, graceSeconds) =>
        MatchHandler.terminate(ctx, logger, nk, dispatcher, tick, state, graceSeconds),

      matchSignal: (ctx, logger, nk, dispatcher, tick, state, data) =>
        MatchHandler.signal(ctx, logger, nk, dispatcher, tick, state, data),
    };
  }
}
