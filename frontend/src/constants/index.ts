export const NAKAMA_HOST       = "192.168.1.3"; // e.g. "192.168.1.5" locally
export const NAKAMA_PORT       = "7350";
export const NAKAMA_SERVER_KEY = "defaultkey";
export const NAKAMA_USE_SSL    = false;

export enum MessageOpCode {
  GameStart   = 1,
  MakeMove    = 2,
  BoardUpdate = 3,
  GameOver    = 5,
  Error       = 9,
}

export enum GameMode {
  Classic = "classic",
  Timed   = "timed",
}

export enum GameOverReason {
  Win          = "win",
  Draw         = "draw",
  Timeout      = "timeout",
  OpponentLeft = "opponent_left",
}

export const BOARD_SIZE        = 9;
export const TURN_TIMEOUT_SEC  = 30;
export const MATCHMAKER_QUERY  = "*";