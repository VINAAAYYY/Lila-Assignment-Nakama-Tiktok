import { MatchmakerTicket } from "@heroiclabs/nakama-js";
import socketService from "./socketService";
import useAuthStore from "../store/authStore";
import { GameMode, MessageOpCode, MATCHMAKER_QUERY } from "../constants";

class MatchService {
  async joinMatchmaker(mode: GameMode): Promise<MatchmakerTicket> {
    const socket = socketService.getSocket();
    return await socket.addMatchmaker(
      MATCHMAKER_QUERY,
      2, 2,
      { mode },
    );
  }

  async cancelMatchmaker(ticket: string): Promise<void> {
    const socket = socketService.getSocket();
    await socket.removeMatchmaker(ticket);
  }

  async sendMove(matchId: string, position: number): Promise<void> {
    const socket = socketService.getSocket();
    await socket.sendMatchState(
      matchId,
      MessageOpCode.MakeMove,
      JSON.stringify({ position }),
    );
  }
}

export default new MatchService();