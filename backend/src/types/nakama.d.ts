declare namespace nkruntime {
  interface Logger {
    info(msg: string, ...args: any[]): void;
    warn(msg: string, ...args: any[]): void;
    error(msg: string, ...args: any[]): void;
    debug(msg: string, ...args: any[]): void;
  }

  interface Context {
    userId?: string;
    matchId?: string;
    username?: string;
    env: Record<string, string>;
  }

  interface Presence {
    userId: string;
    sessionId: string;
    username: string;
  }

  interface Match {
    matchId: string;
    size: number;
    properties?: Record<string, string>;
  }

  interface MatchmakerEntry {
    presence: Presence;
    properties: Record<string, string>;
  }

  interface MatchMessage {
    opCode: number;
    data: ArrayBuffer;
    sender: Presence;
  }

  interface MatchDispatcher {
    broadcastMessage(opCode: number, data: Uint8Array | null, presences?: Presence[] | null, reliable?: boolean, sender?: Presence | null): void;
    matchLabelUpdate(label: string): void;
  }

  interface Nakama {
    binaryToString(data: Uint8Array): string;
    stringToBinary(str: string): Uint8Array;

    matchCreate(module: string, params: object): string;
    matchList(limit: number, authoritative: boolean, label: string | null, minSize: number | null, maxSize: number | null): Match[];

    storageWrite(objects: {
      collection: string;
      key: string;
      userId: string;
      value: unknown;
      permissionRead: number;
      permissionWrite: number;
    }[]): void;

    leaderboardCreate(id: string, authoritative: boolean, sortOrder: string, operator: string, resetSchedule: string, metadata: boolean): void;

    leaderboardRecordWrite(id: string, ownerId: string, username: string, score: number, subscore: number, metadata: object): void;

    leaderboardRecordsList(id: string, owners: string[], limit: number, cursor?: string | null, expiry?: number): {
      records: {
        ownerId: string;
        username?: string;
        score: number;
        rank: number;
      }[];
      ownerRecords?: {
        ownerId: string;
        username?: string;
        score: number;
        rank: number;
      }[];
    };
  }

  type RpcFunction = (
    ctx: Context,
    logger: Logger,
    nk: Nakama,
    payload: string
  ) => string;

  type MatchmakerMatchedFunction = (
    ctx: Context,
    logger: Logger,
    nk: Nakama,
    matches: MatchmakerEntry[]
  ) => string | void;

  interface Initializer {
    registerMatch(name: string, handler: MatchHandler<any>): void;
    registerRpc(id: string, fn: RpcFunction): void;
    registerMatchmakerMatched(fn: MatchmakerMatchedFunction): void;
  }

  interface MatchHandler<T> {
    matchInit(ctx: Context, logger: Logger, nk: Nakama, params: unknown): { state: T; tickRate: number; label: string };

    matchJoinAttempt(ctx: Context, logger: Logger, nk: Nakama, dispatcher: MatchDispatcher, tick: number, state: T, presence: Presence, metadata: unknown): { state: T; accept: boolean };

    matchJoin(ctx: Context, logger: Logger, nk: Nakama, dispatcher: MatchDispatcher, tick: number, state: T, presences: Presence[]): { state: T };

    matchLeave(ctx: Context, logger: Logger, nk: Nakama, dispatcher: MatchDispatcher, tick: number, state: T, presences: Presence[]): { state: T };

    matchLoop(ctx: Context, logger: Logger, nk: Nakama, dispatcher: MatchDispatcher, tick: number, state: T, messages: MatchMessage[]): { state: T } | null;

    matchTerminate(ctx: Context, logger: Logger, nk: Nakama, dispatcher: MatchDispatcher, tick: number, state: T, graceSeconds: number): { state: T };

    matchSignal(ctx: Context, logger: Logger, nk: Nakama, dispatcher: MatchDispatcher, tick: number, state: T, data: string): { state: T };
  }
}