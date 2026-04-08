import { GameSession }       from "../core/GameSession";
import { Broadcaster }       from "./Broadcaster";
import { MessageSerializer } from "../utils/MessageSerializer";
import { Logger }            from "../utils/Logger";
import { AppConfig }         from "../config";
import {
  GameMode,
  GameOverReason,
  IAnalyticsAdapter,
  IStorageAdapter,
  MatchLabel,
  MatchState,
  MakeMovePayload,
  MessageOpCode,
  PlayerMark,
} from "../types";
import { LEADERBOARD_ID } from "../constants";


export class MatchHandler {



  static init(
    _ctx:    nkruntime.Context,
    logger:  nkruntime.Logger,
    _nk:     nkruntime.Nakama,
    params:  Record<string, string>,
    cfg:     AppConfig,
  ): { state: MatchState; tickRate: number; label: string } {
    const log  = new Logger(logger, "MatchHandler.init");
    const mode = (params["mode"] as GameMode) ?? cfg.match.defaultMode;
    log.info("Initialising match mode=%s", mode);

    const session = GameSession.create(mode, cfg);
    const label: MatchLabel = { mode, open: true };

    return {
      state:    session.toMatchState(),
      tickRate: cfg.match.tickRate,
      label:    MessageSerializer.encodeLabel(label),
    };
  }



  static joinAttempt(
    _ctx:       nkruntime.Context,
    _logger:    nkruntime.Logger,
    _nk:        nkruntime.Nakama,
    _disp:      nkruntime.MatchDispatcher,
    _tick:      number,
    rawState:   MatchState,
    _presence:  nkruntime.Presence,
    _metadata:  Record<string, string>,
  ): { state: MatchState; accept: boolean; rejectMessage?: string } {
    const full = Object.keys(rawState.players).length >= 2;
    return full
      ? { state: rawState, accept: false, rejectMessage: "Match is full" }
      : { state: rawState, accept: true };
  }



  static join(
    _ctx:      nkruntime.Context,
    logger:    nkruntime.Logger,
    _nk:       nkruntime.Nakama,
    disp:      nkruntime.MatchDispatcher,
    _tick:     number,
    rawState:  MatchState,
    presences: nkruntime.Presence[],
    cfg:       AppConfig,
  ): { state: MatchState } {
    const log         = new Logger(logger, "MatchHandler.join");
    const broadcaster = new Broadcaster(_nk, disp);
    const session     = GameSession.fromSnapshot(rawState, cfg);

    for (const presence of presences) {
      session.addPlayer(presence);
      log.info("Player joined userId=%s", presence.userId);
    }

    if (session.isFull()) {
      const firstId = session.start();
      log.info("Match started firstTurn=%s", firstId);
      broadcaster.updateLabel({ mode: session.mode, open: false } satisfies MatchLabel);
      
      const startMsg = {
        type:         "game_start" as const,
        board:        session.boardSnapshot,
        marks:        session.marksRecord(),
        turn:         session.turn,
        mode:         session.mode,
        turnDeadline: session.deadline,
      };

      // Broadcast to all (includes existing players)
      broadcaster.toAll(MessageOpCode.GameStart, startMsg);
      
      // Explicitly send to newcomers because they might not be part of the broadcast list yet
      for (const p of presences) {
        broadcaster.toOne(MessageOpCode.GameStart, startMsg, p);
      }
    }

    return { state: session.toMatchState() };
  }



  static leave(
    ctx:       nkruntime.Context,
    logger:    nkruntime.Logger,
    nk:        nkruntime.Nakama,
    disp:      nkruntime.MatchDispatcher,
    _tick:     number,
    rawState:  MatchState,
    presences: nkruntime.Presence[],
    cfg:       AppConfig,
    storage:   IStorageAdapter,
    analytics: IAnalyticsAdapter,
  ): { state: MatchState } {
    const log         = new Logger(logger, "MatchHandler.leave");
    const broadcaster = new Broadcaster(nk, disp);
    const session     = GameSession.fromSnapshot(rawState, cfg);

    for (const presence of presences) {
      log.info("Player left userId=%s", presence.userId);

      if (!session.isOver && session.players.size > 1) {
        const winnerId = session.forfeit(presence.userId);
        broadcaster.toAll(MessageOpCode.GameOver, {
          type:   "game_over",
          board:  session.boardSnapshot,
          winner: winnerId,
          reason: GameOverReason.OpponentLeft,
        });
        if (winnerId) {
          MatchHandler.postGame(
            nk, log, cfg, storage, analytics,
            ctx.matchId!, winnerId, presence.userId,
            session.boardSnapshot, session.mode, GameOverReason.OpponentLeft,
          );
        }
      }
      session.removePlayer(presence.userId);
    }

    return { state: session.toMatchState() };
  }



  static loop(
    ctx:       nkruntime.Context,
    logger:    nkruntime.Logger,
    nk:        nkruntime.Nakama,
    disp:      nkruntime.MatchDispatcher,
    _tick:     number,
    rawState:  MatchState,
    messages:  nkruntime.MatchMessage[],
    cfg:       AppConfig,
    storage:   IStorageAdapter,
    analytics: IAnalyticsAdapter,
  ): { state: MatchState } | null {
    if (rawState.gameOver) return null;

    const log         = new Logger(logger, "MatchHandler.loop");
    const broadcaster = new Broadcaster(nk, disp);
    const session     = GameSession.fromSnapshot(rawState, cfg);


    const timeout = session.checkTimeout();
    if (timeout && timeout.ok && timeout.reason === GameOverReason.Timeout) {
      broadcaster.toAll(MessageOpCode.GameOver, {
        type:   "game_over",
        board:  timeout.board.snapshot(),
        winner: timeout.winner,
        reason: GameOverReason.Timeout,
      });
      if (timeout.winner) {
        const loserId = [...session.players.keys()].find(id => id !== timeout.winner) ?? "";
        MatchHandler.postGame(
          nk, log, cfg, storage, analytics,
          ctx.matchId!, timeout.winner, loserId,
          timeout.board.snapshot(), session.mode, GameOverReason.Timeout,
        );
      }
      return null;
    }


    for (const msg of messages) {
      if (session.isOver) break;
      if (msg.opCode !== MessageOpCode.MakeMove) continue;

      const payload = MessageSerializer.decodeInbound<MakeMovePayload>(new Uint8Array(msg.data), nk);

      if (!MessageSerializer.isMakeMovePayload(payload)) {
        broadcaster.toOne(MessageOpCode.Error, {
          type: "error", message: "Malformed move payload",
        }, msg.sender);
        continue;
      }

      const outcome = session.applyMove(msg.sender.userId, payload.position);

      if (!outcome.ok) {
        broadcaster.toOne(MessageOpCode.Error, {
          type: "error", message: outcome.message,
        }, msg.sender);
        continue;
      }

      if (outcome.reason !== null) {
        broadcaster.toAll(MessageOpCode.GameOver, {
          type:   "game_over",
          board:  outcome.board.snapshot(),
          winner: outcome.winner,
          reason: outcome.reason,
        });

        if (outcome.winner) {
          const loserId = [...session.players.keys()].find(id => id !== outcome.winner) ?? "";
          MatchHandler.postGame(
            nk, log, cfg, storage, analytics,
            ctx.matchId!, outcome.winner, loserId,
            outcome.board.snapshot(), session.mode, outcome.reason,
          );
        }


        return null;
      }

      broadcaster.toAll(MessageOpCode.BoardUpdate, {
        type:         "board_update",
        board:        outcome.board.snapshot(),
        turn:         session.turn,
        turnDeadline: session.deadline,
      });
    }

    return { state: session.toMatchState() };
  }



  static terminate(
    _ctx:     nkruntime.Context,
    logger:   nkruntime.Logger,
    _nk:      nkruntime.Nakama,
    _disp:    nkruntime.MatchDispatcher,
    _tick:    number,
    rawState: MatchState,
    _grace:   number,
  ): { state: MatchState } {
    new Logger(logger, "MatchHandler.terminate").info("Match terminated");
    return { state: rawState };
  }



  static signal(
    _ctx:     nkruntime.Context,
    _logger:  nkruntime.Logger,
    _nk:      nkruntime.Nakama,
    _disp:    nkruntime.MatchDispatcher,
    _tick:    number,
    rawState: MatchState,
    _data:    string,
  ): { state: MatchState; data: string } {
    return { state: rawState, data: "" };
  }



  private static postGame(
    nk:        nkruntime.Nakama,
    log:       Logger,
    cfg:       AppConfig,
    storage:   IStorageAdapter,
    analytics: IAnalyticsAdapter,
    matchId:   string,
    winnerId:  string,
    loserId:   string,
    board:     PlayerMark[],
    mode:      GameMode,
    reason:    GameOverReason,
  ): void {
    if (cfg.features.leaderboardEnabled) {
      try {
        nk.leaderboardRecordWrite(LEADERBOARD_ID, winnerId, "", 1, 0, {});
      } catch (e) {
        log.error("Leaderboard write failed: %s", e);
      }
    }
    if (cfg.features.matchHistoryEnabled) {
      storage.saveMatchResult(nk, winnerId, loserId, board, mode);
    }
    if (cfg.features.analyticsEnabled) {
      analytics.trackMatchEnd(matchId, winnerId, reason, mode);
    }
  }
}
