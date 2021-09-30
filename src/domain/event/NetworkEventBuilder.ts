import { NetworkRequest } from "@/domain/network/NetworkManager";

export interface NetworkEvent {
  type: "network";
  networkRequest: NetworkRequest;
}

export class NetworkRequestEventBuilder {
  private fromNodeId?: string;
  private toNodeId?: string;
  private payload?: unknown;

  static aNetworkRequestEvent(): NetworkRequestEventBuilder {
    return new NetworkRequestEventBuilder();
  }

  withFromNodeId(nodeId: string): this {
    this.fromNodeId = nodeId;
    return this;
  }

  withToNodeId(nodeId: string): this {
    this.toNodeId = nodeId;
    return this;
  }

  withPayload(payload: unknown): this {
    this.payload = payload;
    return this;
  }

  build(): NetworkEvent {
    if (!this.fromNodeId) {
      throw new Error("Cannot build a network event without fromNodeId");
    }
    if (!this.toNodeId) {
      throw new Error("Cannot build a network event without toNodeId");
    }
    if (!this.payload) {
      throw new Error("Cannot build a network event without payload");
    }
    return {
      type: "network",
      networkRequest: {
        fromNodeId: this.fromNodeId,
        toNodeId: this.toNodeId,
        payload: this.payload,
      },
    };
  }
}
