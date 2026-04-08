import { MessageOpCode, OutboundMessage } from "../types";
import { MessageSerializer }              from "../utils/MessageSerializer";


export class Broadcaster {
  constructor(
    private readonly nk: nkruntime.Nakama,
    private readonly dispatcher: nkruntime.MatchDispatcher
  ) {}


  toAll(opCode: MessageOpCode, message: OutboundMessage): void {
    const data = this.nk.stringToBinary(MessageSerializer.encode(message));
    this.dispatcher.broadcastMessage(opCode, data, null, true, null);
  }


  toOne(
    opCode:   MessageOpCode,
    message:  OutboundMessage,
    presence: nkruntime.Presence,
  ): void {
    const data = this.nk.stringToBinary(MessageSerializer.encode(message));
    this.dispatcher.broadcastMessage(opCode, data, [presence], true, null);
  }


  updateLabel(label: object): void {
    this.dispatcher.matchLabelUpdate(MessageSerializer.encodeLabel(label));
  }
}
