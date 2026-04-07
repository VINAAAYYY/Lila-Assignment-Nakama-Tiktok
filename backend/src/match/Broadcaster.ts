import { MessageOpCode, OutboundMessage } from "../types";
import { MessageSerializer }              from "../utils/MessageSerializer";


export class Broadcaster {
  constructor(private readonly dispatcher: nkruntime.MatchDispatcher) {}


  toAll(opCode: MessageOpCode, message: OutboundMessage): void {
    this.dispatcher.broadcastMessage(
      opCode,
      MessageSerializer.encode(message),
      null,
      null,
      true,
    );
  }


  toOne(
    opCode:   MessageOpCode,
    message:  OutboundMessage,
    presence: nkruntime.Presence,
  ): void {
    this.dispatcher.broadcastMessage(
      opCode,
      MessageSerializer.encode(message),
      [presence],
      null,
      true,
    );
  }


  updateLabel(label: object): void {
    this.dispatcher.matchLabelUpdate(MessageSerializer.encodeLabel(label));
  }
}
