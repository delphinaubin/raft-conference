import { NetworkRequestBuilder } from "@/domain/network/NetworkRequestBuilder";
import { BroadcastRequest } from "@/domain/network/NetworkRequest";

export class BroadcastRequestBuilder extends NetworkRequestBuilder {
  private log?: number;
  static aBroadcastRequest(): BroadcastRequestBuilder {
    return new BroadcastRequestBuilder();
  }

  withLog(log: number): this {
    this.log = log;
    return this;
  }

  build(): BroadcastRequest {
    if (this.log === undefined) {
      throw new Error("Cannot build a broadcast request without log");
    }
    return {
      ...super.build(),
      type: "broadcast-request",
      log: this.log,
    };
  }
}
