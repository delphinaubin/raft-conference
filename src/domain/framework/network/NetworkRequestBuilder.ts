import { AbstractNetworkRequest } from "@/domain/framework/network/NetworkRequest";

export abstract class NetworkRequestBuilder {
  protected receiverNodeId?: string;

  withReceiverNodeId(receiverNodeId: string): this {
    this.receiverNodeId = receiverNodeId;
    return this;
  }

  build(): AbstractNetworkRequest {
    if (!this.receiverNodeId) {
      throw new Error("Cannot build a network request without receiverNodeId");
    }

    return {
      receiverNodeId: this.receiverNodeId,
    };
  }
}
