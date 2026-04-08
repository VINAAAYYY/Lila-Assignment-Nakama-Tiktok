import { Client, Session } from "@heroiclabs/nakama-js";
import {
  NAKAMA_HOST,
  NAKAMA_PORT,
  NAKAMA_SERVER_KEY,
  NAKAMA_USE_SSL,
} from "../constants";

class NakamaService {
  private static instance: NakamaService;
  private client: Client;
  private _session: Session | null = null;

  private constructor() {
    this.client = new Client(
      NAKAMA_SERVER_KEY,
      NAKAMA_HOST,
      NAKAMA_PORT,
      NAKAMA_USE_SSL,
    );
  }

  static getInstance(): NakamaService {
    if (!NakamaService.instance) {
      NakamaService.instance = new NakamaService();
    }
    return NakamaService.instance;
  }

  get session(): Session {
    if (!this._session) throw new Error("Not authenticated");
    return this._session;
  }

  get rawClient(): Client {
    return this.client;
  }

  async authenticateWithDevice(deviceId: string, username: string): Promise<Session> {
    try {
      this._session = await this.client.authenticateDevice(
        deviceId,
        true,
        username,
      );
      console.log("AUTH SUCCESS", this._session);
      return this._session;
    } catch (e) {
      console.log("AUTH ERROR RAW:", e);
      throw e;
    }
  }

  isAuthenticated(): boolean {
    return this._session !== null && !this._session.isexpired(Date.now() / 1000);
  }
}

export default NakamaService.getInstance();