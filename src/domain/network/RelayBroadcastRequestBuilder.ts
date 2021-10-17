import {
  BroadcastRequest,
  RelayBroadcastRequest,
} from "@/domain/network/NetworkRequest";
import { NetworkRequestBuilder } from "@/domain/network/NetworkRequestBuilder";
import { NodeToNodeNetworkRequestBuilder } from "@/domain/network/NodeToNodeNetworkRequestBuilder";

export class RelayBroadcastRequestBuilder extends NodeToNodeNetworkRequestBuilder {
  private log?: number;
  static aRelayBroadcastRequest(): RelayBroadcastRequestBuilder {
    return new RelayBroadcastRequestBuilder();
  }

  withLog(log: number): this {
    this.log = log;
    return this;
  }

  build(): RelayBroadcastRequest {
    if (this.log === undefined) {
      throw new Error("Cannot build a relay broadcast request without log");
    }
    return {
      ...super.build(),
      type: "broadcast-request",
      log: this.log,
    };
  }
}
