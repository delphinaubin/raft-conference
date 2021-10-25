import { NetworkRequest } from "@/domain/framework/network/NetworkRequest";

export interface NetworkEvent {
  type: "network";
  networkRequest: NetworkRequest;
  isAsyncEvent: true;
}

export class NetworkRequestEventBuilder {
  private networkRequest?: NetworkRequest;

  static aNetworkRequestEvent(): NetworkRequestEventBuilder {
    return new NetworkRequestEventBuilder();
  }

  withNetworkRequest(networkRequest: NetworkRequest): this {
    this.networkRequest = networkRequest;
    return this;
  }

  build(): NetworkEvent {
    if (!this.networkRequest) {
      throw new Error("Cannot build a network event without networkRequest");
    }

    return {
      type: "network",
      networkRequest: this.networkRequest,
      isAsyncEvent: true,
    };
  }
}
