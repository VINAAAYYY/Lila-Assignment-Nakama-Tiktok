import { GameMode, GameOverReason } from "../constants";

export type PlayerMark = "X" | "O" | "";

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

export type ServerMessage =
  | GameStartMessage
  | BoardUpdateMessage
  | GameOverMessage
  | ErrorMessage;

export interface LeaderboardEntry {
  userId:   string;
  username: string;
  wins:     number;
  rank:     number;
}