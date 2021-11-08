import { VoteRequest } from "@/domain/framework/network/NetworkRequest";
import { NodeToNodeNetworkRequestBuilder } from "@/domain/framework/network/NodeToNodeNetworkRequestBuilder";

export class VoteRequestBuilder extends NodeToNodeNetworkRequestBuilder {
  private logLength?: number = 0;
  private logTerm?: number = 0;

  static aVoteRequest(): VoteRequestBuilder {
    return new VoteRequestBuilder();
  }
  withLogLength(logLength: number): this {
    this.logLength = logLength;
    return this;
  }
  withLogTerm(logTerm: number): this {
    this.logTerm = logTerm;
    return this;
  }

  build(): VoteRequest {
    if (this.logLength == undefined) {
      throw new Error("Cannot build a vote request without logLength");
    }
    if (this.logTerm == undefined) {
      throw new Error("Cannot build a vote request without logTerm");
    }
    return {
      ...super.build(),
      type: "vote-request",
      logLength: this.logLength,
      logTerm: this.logTerm,
    };
  }
}
