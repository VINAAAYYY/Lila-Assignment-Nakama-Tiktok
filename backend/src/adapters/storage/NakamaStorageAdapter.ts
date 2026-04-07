import { IStorageAdapter }  from "../../types";
import { GameMode, PlayerMark } from "../../types";
import { STORAGE_COLLECTION_MATCHES } from "../../constants";

interface MatchResultRecord {
  winnerId: string;
  loserId:  string;
  board:    PlayerMark[];
  mode:     GameMode;
  playedAt: string;
}


export class NakamaStorageAdapter implements IStorageAdapter {
  saveMatchResult(
    nk:       nkruntime.Nakama,
    winnerId: string,
    loserId:  string,
    board:    PlayerMark[],
    mode:     GameMode,
  ): void {
    const record: MatchResultRecord = {
      winnerId,
      loserId,
      board,
      mode,
      playedAt: new Date().toISOString(),
    };

    try {
      nk.storageWrite([{
        collection:      STORAGE_COLLECTION_MATCHES,
        key:             `${winnerId}_${loserId}_${Date.now()}`,
        userId:          winnerId,
        value:           record as unknown as { [key: string]: unknown },
        permissionRead:  2,
        permissionWrite: 0,
      }]);
    } catch {

    }
  }
}
