import { create } from "zustand";
import { LeaderboardEntry } from "../types";

interface LeaderboardState {
  entries:   LeaderboardEntry[];
  myWins:    number;
  myRank:    number | null;
  loading:   boolean;
  setData:   (entries: LeaderboardEntry[], myWins: number, myRank: number | null) => void;
  setLoading:(v: boolean) => void;
}

const useLeaderboardStore = create<LeaderboardState>((set) => ({
  entries:    [],
  myWins:     0,
  myRank:     null,
  loading:    false,

  setData:    (entries, myWins, myRank) => set({ entries, myWins, myRank }),
  setLoading: (loading) => set({ loading }),
}));

export default useLeaderboardStore;