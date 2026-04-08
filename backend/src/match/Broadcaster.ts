import { MessageOpCode, OutboundMessage } from "../types";
import { MessageSerializer }              from "../utils/MessageSerializer";


export class Broadcaster {
  constructor(
    private readonly nk: nkruntime.Nakama,
    private readonly dispatcher: nkruntime.MatchDispatcher
  ) {}


  toAll(opCode: MessageOpCode, message: OutboundMessage): void {
    this.nk.stringToBinary(JSON.stringify(message));
    this.dispatcher.broadcastMessage(
      opCode,
      this.nk.stringToBinary(MessageSerializer.encode(message)),
      null,
      true,
      null,
    );
  }


  toOne(
    opCode:   MessageOpCode,
    message:  OutboundMessage,
    presence: nkruntime.Presence,
  ): void {
    this.dispatcher.broadcastMessage(
      opCode,
      this.nk.stringToBinary(MessageSerializer.encode(message)),
      [presence],
      true,
      null,
    );
  }


  updateLabel(label: object): void {
    this.dispatcher.matchLabelUpdate(MessageSerializer.encodeLabel(label));
  }
}
