import { create }    from "zustand";
import { PlayerMark } from "../types";
import {
  GameStartMessage,
  BoardUpdateMessage,
  GameOverMessage,
} from "../types";
import { GameMode, GameOverReason } from "../constants";

interface GameState {
  board:        PlayerMark[];
  marks:        Record<string, PlayerMark>;
  myMark:       PlayerMark | null;
  turn:         string;
  winner:       string | null;
  reason:       GameOverReason | null;
  isOver:       boolean;
  mode:         GameMode;
  turnDeadline: number;

  startGame:   (msg: GameStartMessage) => void;
  updateBoard: (msg: BoardUpdateMessage) => void;
  endGame:     (msg: GameOverMessage) => void;
  reset:       () => void;
}

const INITIAL_BOARD: PlayerMark[] = Array(9).fill("") as PlayerMark[];

const useGameStore = create<GameState>((set, get) => ({
  board:        INITIAL_BOARD,
  marks:        {},
  myMark:       null,
  turn:         "",
  winner:       null,
  reason:       null,
  isOver:       false,
  mode:         GameMode.Classic,
  turnDeadline: 0,

  startGame: (msg) => {
    console.log("STORE: STARTING GAME", msg.marks);
    // Determine our own mark from the auth store
    // imported lazily to avoid circular dependency
    const userId = require("./authStore").default.getState().userId ?? "";
    set({
      board:        msg.board,
      marks:        msg.marks,
      myMark:       msg.marks[userId] ?? null,
      turn:         msg.turn,
      mode:         msg.mode,
      turnDeadline: msg.turnDeadline,
      isOver:       false,
      winner:       null,
      reason:       null,
    });
  },

  updateBoard: (msg) => {
    console.log("STORE: BOARD UPDATED, TURN =", msg.turn);
    set({
      board:        msg.board,
      turn:         msg.turn,
      turnDeadline: msg.turnDeadline,
    });
  },

  endGame: (msg) => {
    console.log("STORE: GAME OVER, WINNER =", msg.winner);
    set({
      board:  msg.board,
      winner: msg.winner,
      reason: msg.reason,
      isOver: true,
    });
  },

  reset: () => set({
    board:        INITIAL_BOARD,
    marks:        {},
    myMark:       null,
    turn:         "",
    winner:       null,
    reason:       null,
    isOver:       false,
    turnDeadline: 0,
  }),
}));

export default useGameStore;