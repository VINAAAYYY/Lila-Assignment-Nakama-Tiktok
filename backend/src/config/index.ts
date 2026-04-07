import { GameMode } from "../types";
import {
  MATCH_TICK_RATE,
  MATCH_TURN_TIMEOUT_SEC,
  LEADERBOARD_TOP_N,
} from "../constants";


export interface AppConfig {
  readonly match: MatchConfig;
  readonly leaderboard: LeaderboardConfig;
  readonly features: FeatureFlags;
}

export interface MatchConfig {
  readonly tickRate:          number;
  readonly turnTimeoutSec:    number;
  readonly defaultMode:       GameMode;
}

export interface LeaderboardConfig {
  readonly topN:       number;
  readonly resetCron:  string | null;
}

export interface FeatureFlags {
  readonly timedModeEnabled:     boolean;
  readonly leaderboardEnabled:   boolean;
  readonly matchHistoryEnabled:  boolean;
  readonly analyticsEnabled:     boolean;
}

export const DEFAULT_CONFIG: AppConfig = {
  match: {
    tickRate:       MATCH_TICK_RATE,
    turnTimeoutSec: MATCH_TURN_TIMEOUT_SEC,
    defaultMode:    GameMode.Classic,
  },
  leaderboard: {
    topN:       LEADERBOARD_TOP_N,
    resetCron:  null,
  },
  features: {
    timedModeEnabled:    true,
    leaderboardEnabled:  true,
    matchHistoryEnabled: true,
    analyticsEnabled:    false,
  },
};


export function buildConfig(env: Record<string, string> = {}): AppConfig {
  return {
    match: {
      tickRate:       parseIntOr(env["TICK_RATE"],        DEFAULT_CONFIG.match.tickRate),
      turnTimeoutSec: parseIntOr(env["TURN_TIMEOUT_SEC"], DEFAULT_CONFIG.match.turnTimeoutSec),
      defaultMode:    (env["DEFAULT_MODE"] as GameMode)  ?? DEFAULT_CONFIG.match.defaultMode,
    },
    leaderboard: {
      topN:      parseIntOr(env["LEADERBOARD_TOP_N"], DEFAULT_CONFIG.leaderboard.topN),
      resetCron: env["LEADERBOARD_RESET_CRON"]        ?? DEFAULT_CONFIG.leaderboard.resetCron,
    },
    features: {
      timedModeEnabled:    parseBoolOr(env["TIMED_MODE_ENABLED"],    DEFAULT_CONFIG.features.timedModeEnabled),
      leaderboardEnabled:  parseBoolOr(env["LEADERBOARD_ENABLED"],   DEFAULT_CONFIG.features.leaderboardEnabled),
      matchHistoryEnabled: parseBoolOr(env["MATCH_HISTORY_ENABLED"], DEFAULT_CONFIG.features.matchHistoryEnabled),
      analyticsEnabled:    parseBoolOr(env["ANALYTICS_ENABLED"],     DEFAULT_CONFIG.features.analyticsEnabled),
    },
  };
}



function parseIntOr(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? fallback : parsed;
}

function parseBoolOr(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value.toLowerCase() === "true";
}
