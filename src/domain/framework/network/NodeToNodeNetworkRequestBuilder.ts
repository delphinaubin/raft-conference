import { AbstractNodeToNodeNetworkRequest } from "@/domain/framework/network/NetworkRequest";
import { NetworkRequestBuilder } from "@/domain/framework/network/NetworkRequestBuilder";

export abstract class NodeToNodeNetworkRequestBuilder extends NetworkRequestBuilder {
  protected senderNodeId?: string;
  protected term = 0;

  withSenderNodeId(senderNodeId: string): this {
    this.senderNodeId = senderNodeId;
    return this;
  }

  withTerm(term: number): this {
    this.term = term;
    return this;
  }

  build(): AbstractNodeToNodeNetworkRequest {
    if (!this.senderNodeId) {
      throw new Error(
        "Cannot build a node to node network request without senderNodeId"
      );
    }

    return {
      ...super.build(),
      term: this.term,
      senderNodeId: this.senderNodeId,
    };
  }
}
