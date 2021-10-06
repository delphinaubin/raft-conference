import { AbstractNetworkRequest } from "@/domain/network/NetworkRequest";

export abstract class NetworkRequestBuilder {
  protected senderNodeId?: string;
  protected receiverNodeId?: string;

  withSenderNodeId(senderNodeId: string): this {
    this.senderNodeId = senderNodeId;
    return this;
  }

  withReceiverNodeId(receiverNodeId: string): this {
    this.receiverNodeId = receiverNodeId;
    return this;
  }

  build(): AbstractNetworkRequest {
    if (!this.senderNodeId) {
      throw new Error("Cannot build a vote request without senderNodeId");
    }
    if (!this.receiverNodeId) {
      throw new Error("Cannot build a vote request without receiverNodeId");
    }

    return {
      senderNodeId: this.senderNodeId,
      receiverNodeId: this.receiverNodeId,
    };
  }
}
