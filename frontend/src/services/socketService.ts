import { Socket } from "@heroiclabs/nakama-js";
import nakamaService from "./nakamaService";
import { MessageOpCode } from "../constants";
import { ServerMessage } from "../types";
import useGameStore   from "../store/gameStore";
import useMatchStore  from "../store/matchStore";

type MessageHandler = (message: ServerMessage) => void;

class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  private messageHandlers: Map<MessageOpCode, MessageHandler> = new Map();

  private constructor() {}

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  async connect(): Promise<void> {
    if (this.socket) return;

    // Enabled verbose logging to help see the protocol-level messages
    this.socket = nakamaService.rawClient.createSocket(false, true);
    
    this.socket.ondisconnect = (evt) => {
      console.log("SOCKET DISCONNECTED", evt);
      this.socket = null;
    };
    this.socket.onerror = (err) => {
      console.log("SOCKET ERROR:", err);
    };

    console.log("SOCKET ATTEMPTING CONNECT...");
    await this.socket.connect(nakamaService.session, true);
    console.log("SOCKET CONNECTED SUCCESS");
    this.registerCoreListeners();
  }

  async disconnect(): Promise<void> {
    await this.socket?.disconnect(true);
    this.socket = null;
  }

  getSocket(): Socket {
    if (!this.socket) throw new Error("Socket not connected");
    return this.socket;
  }

  // ── Core listeners ──────────────────────────────────────────────────────

  private registerCoreListeners(): void {
    const socket = this.getSocket();

    // Matchmaker paired — join the created match
    socket.onmatchmakermatched = async (matched) => {
      console.log("MATCHMAKER MATCHED, JOINING WITH TOKEN...");
      
      // Extract opponent info
      const userId = require("../store/authStore").default.getState().userId;
      const opponent = matched.users.find(u => u.presence.user_id !== userId);
      if (opponent) {
        console.log("OPPONENT FOUND:", opponent.presence.username);
        useMatchStore.getState().setOpponent(opponent.presence.user_id, opponent.presence.username);
      }

      const match = await socket.joinMatch(undefined, matched.token);
      console.log("JOINED MATCH:", match.match_id);
      useMatchStore.getState().setMatchId(match.match_id);
    };

    // Route match data to the right handler by opcode
    socket.onmatchdata = (data) => {
      const opCode = data.op_code as MessageOpCode;
      
      try {
        // Safe decoding for React Native/Hermes (alternatives to TextDecoder)
        const jsonString = String.fromCharCode.apply(null, Array.from(data.data));
        const message = JSON.parse(jsonString) as ServerMessage;

        console.log(`MATCH DATA [Op ${opCode}]:`, JSON.stringify(message, null, 2));

        const handler = this.messageHandlers.get(opCode);
        if (handler) {
          handler(message);
        } else {
          console.warn(`No handler registered for OpCode: ${opCode}`);
        }
      } catch (err) {
        console.error("FAILED TO DECODE OR PARSE MATCH DATA:", err);
      }
    };

    // Register game message handlers
    this.messageHandlers.set(MessageOpCode.GameStart,   this.handleGameStart);
    this.messageHandlers.set(MessageOpCode.BoardUpdate, this.handleBoardUpdate);
    this.messageHandlers.set(MessageOpCode.GameOver,    this.handleGameOver);
  }

  private handleGameStart: MessageHandler = (msg) => {
    if (msg.type !== "game_start") return;
    console.log("CLIENT: PROCESSING GAME START...");
    useGameStore.getState().startGame(msg);
  };

  private handleBoardUpdate: MessageHandler = (msg) => {
    if (msg.type !== "board_update") return;
    useGameStore.getState().updateBoard(msg);
  };

  private handleGameOver: MessageHandler = (msg) => {
    if (msg.type !== "game_over") return;
    useGameStore.getState().endGame(msg);
  };
}

export default SocketService.getInstance();