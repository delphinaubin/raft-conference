import { VoteRequest } from "@/domain/framework/network/NetworkRequest";
import { NodeToNodeNetworkRequestBuilder } from "@/domain/framework/network/NodeToNodeNetworkRequestBuilder";

export class VoteRequestBuilder extends NodeToNodeNetworkRequestBuilder {
  private term?: number;
  private logLength?: number;
  private logTerm?: number;

  static aVoteRequest(): VoteRequestBuilder {
    return new VoteRequestBuilder();
  }
  withTerm(term: number): this {
    this.term = term;
    return this;
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
    if (!this.term) {
      throw new Error("Cannot build a vote request without term");
    }
    if (this.logLength == undefined) {
      throw new Error("Cannot build a vote request without logLength");
    }
    if (this.logTerm == undefined) {
      throw new Error("Cannot build a vote request without logTerm");
    }
    return {
      ...super.build(),
      type: "vote-request",
      term: this.term,
      logLength: this.logLength,
      logTerm: this.logTerm,
    };
  }
}
