import nakamaService from "./nakamaService";
import { LeaderboardEntry } from "../types";

class LeaderboardService {
  async getTopPlayers(): Promise<LeaderboardEntry[]> {
    const result = await nakamaService.rawClient.rpc(
      nakamaService.session,
      "get_leaderboard",
      {},
    );
    return (result.payload as LeaderboardEntry[]) ?? [];
  }

  async getMyStats(): Promise<{ wins: number; rank: number | null }> {
    const result = await nakamaService.rawClient.rpc(
      nakamaService.session,
      "get_my_stats",
      {},
    );
    return (result.payload as any) ?? { wins: 0, rank: null };
  }
}

export default new LeaderboardService();