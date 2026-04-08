import { create } from "zustand";

interface MatchState {
  matchId:          string | null;
  matchmakerTicket: string | null;
  opponentName:     string | null;
  opponentId:       string | null;
  setMatchId:       (id: string) => void;
  setTicket:        (ticket: string) => void;
  setOpponent:      (id: string, name: string) => void;
  reset:            () => void;
}

const useMatchStore = create<MatchState>((set) => ({
  matchId:          null,
  matchmakerTicket: null,
  opponentName:     null,
  opponentId:       null,

  setMatchId: (matchId) => set({ matchId }),
  setTicket:  (matchmakerTicket) => set({ matchmakerTicket }),
  setOpponent: (opponentId, opponentName) => set({ opponentId, opponentName }),
  reset:      () => set({ 
    matchId: null, 
    matchmakerTicket: null, 
    opponentName: null, 
    opponentId: null 
  }),
}));

export default useMatchStore;