import { PlayerMark } from "../types";



export const MATCH_MODULE_NAME      = "tictactoe" as const;
export const MATCH_TICK_RATE        = 1           as const;
export const MATCH_BOARD_SIZE       = 9           as const;
export const MATCH_MAX_PLAYERS      = 2           as const;
export const MATCH_TURN_TIMEOUT_SEC = 30          as const;



export const EMPTY_CELL = "" as const;

export const WIN_LINES: ReadonlyArray<readonly [number, number, number]> = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
] as const;

export const PLAYER_MARKS: readonly PlayerMark[] = [
  PlayerMark.X,
  PlayerMark.O,
] as const;



export const LEADERBOARD_ID    = "wins_leaderboard" as const;
export const LEADERBOARD_TOP_N = 10                 as const;



export const RPC_GET_LEADERBOARD = "get_leaderboard" as const;
export const RPC_GET_MY_STATS    = "get_my_stats"    as const;



export const STORAGE_COLLECTION_MATCHES = "match_history" as const;



export const MATCHMAKER_QUERY     = "*" as const;
export const MATCHMAKER_MIN_COUNT = 2   as const;
export const MATCHMAKER_MAX_COUNT = 2   as const;
