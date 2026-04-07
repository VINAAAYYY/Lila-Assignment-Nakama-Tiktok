import { OutboundMessage, MakeMovePayload } from "../types";


export class MessageSerializer {

  static decodeInbound<T>(data: Uint8Array, nk: nkruntime.Nakama): T | null {
    try {
      return JSON.parse(nk.binaryToString(data)) as T;
    } catch {
      return null;
    }
  }

  static encode(message: OutboundMessage): string {
    return JSON.stringify(message);
  }

  static encodeLabel<T extends object>(label: T): string {
    return JSON.stringify(label);
  }

  static isMakeMovePayload(data: unknown): data is MakeMovePayload {
    return (
      typeof data === "object" &&
      data !== null &&
      "position" in data &&
      typeof (data as MakeMovePayload).position === "number"
    );
  }
}
