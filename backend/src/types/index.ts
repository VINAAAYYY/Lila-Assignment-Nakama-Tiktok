

export enum GameMode {
  Classic = "classic",
  Timed   = "timed",
}

export enum PlayerMark {
  X = "X",
  O = "O",
}

export enum GameOverReason {
  Win          = "win",
  Draw         = "draw",
  Timeout      = "timeout",
  OpponentLeft = "opponent_left",
}

export enum MessageOpCode {
  GameStart   = 1,
  MakeMove    = 2,
  BoardUpdate = 3,
  GameOver    = 5,
  Error       = 9,
}



export interface MatchState {
  board:        PlayerMark[];
  marks:        Record<string, PlayerMark>;
  turn:         string;
  players:      Record<string, nkruntime.Presence>;
  winner:       string | null;
  draw:         boolean;
  gameOver:     boolean;
  mode:         GameMode;
  turnDeadline: number;
}



export interface MakeMovePayload {
  position: number;
}



export interface GameStartMessage {
  type:         "game_start";
  board:        PlayerMark[];
  marks:        Record<string, PlayerMark>;
  turn:         string;
  mode:         GameMode;
  turnDeadline: number;
}

export interface BoardUpdateMessage {
  type:         "board_update";
  board:        PlayerMark[];
  turn:         string;
  turnDeadline: number;
}

export interface GameOverMessage {
  type:   "game_over";
  board:  PlayerMark[];
  winner: string | null;
  reason: GameOverReason;
}

export interface ErrorMessage {
  type:    "error";
  message: string;
}

export type OutboundMessage =
  | GameStartMessage
  | BoardUpdateMessage
  | GameOverMessage
  | ErrorMessage;



export interface MatchCreateParams {
  mode: GameMode;
}



export interface LeaderboardEntry {
  userId:   string;
  username: string;
  wins:     number;
  rank:     number;
}

export interface PlayerStats {
  wins: number;
  rank: number | null;
}



export interface MatchLabel {
  mode: GameMode;
  open: boolean;
}



export interface IStorageAdapter {
  saveMatchResult(
    nk:       nkruntime.Nakama,
    winnerId: string,
    loserId:  string,
    board:    PlayerMark[],
    mode:     GameMode
  ): void;
}

export interface IAnalyticsAdapter {
  trackMatchEnd(
    matchId:  string,
    winnerId: string | null,
    reason:   GameOverReason,
    mode:     GameMode
  ): void;
}
