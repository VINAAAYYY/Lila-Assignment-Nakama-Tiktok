import { create } from "zustand";

interface AuthState {
  userId:   string | null;
  username: string | null;
  deviceId: string | null;
  setAuth:  (userId: string, username: string, deviceId: string) => void;
  reset:    () => void;
}

const useAuthStore = create<AuthState>((set) => ({
  userId:   null,
  username: null,
  deviceId: null,

  setAuth: (userId, username, deviceId) =>
    set({ userId, username, deviceId }),

  reset: () => set({ userId: null, username: null, deviceId: null }),
}));

export default useAuthStore;