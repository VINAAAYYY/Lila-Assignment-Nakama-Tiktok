import nakamaService from "./nakamaService";
import { LeaderboardEntry } from "../types";

class LeaderboardService {
  async getTopPlayers(): Promise<LeaderboardEntry[]> {
    const result = await nakamaService.rawClient.rpc(
      nakamaService.session,
      "get_leaderboard",
      {},
    );
    const payload = typeof result.payload === 'string' ? result.payload : JSON.stringify(result.payload);
    return JSON.parse(payload ?? "[]") as LeaderboardEntry[];
  }

  async getMyStats(): Promise<{ wins: number; rank: number | null }> {
    const result = await nakamaService.rawClient.rpc(
      nakamaService.session,
      "get_my_stats",
      {},
    );
    const payload = typeof result.payload === 'string' ? result.payload : JSON.stringify(result.payload);
    return JSON.parse(payload ?? '{"wins":0,"rank":null}');
  }
}

export default new LeaderboardService();