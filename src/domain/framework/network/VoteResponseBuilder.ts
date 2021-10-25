import { VoteResponse } from "@/domain/framework/network/NetworkRequest";
import { NodeToNodeNetworkRequestBuilder } from "@/domain/framework/network/NodeToNodeNetworkRequestBuilder";

export class VoteResponseBuilder extends NodeToNodeNetworkRequestBuilder {
  private term?: number = 0;
  private granted?: boolean;
  private voterId?: string = "";

  static aVoteResponse(): VoteResponseBuilder {
    return new VoteResponseBuilder();
  }
  withTerm(term: number): this {
    this.term = term;
    return this;
  }

  withGranted(granted: boolean): this {
    this.granted = granted;
    return this;
  }

  withVoterId(voterId: string): this {
    this.voterId = voterId;
    return this;
  }

  build(): VoteResponse {
    if (this.voterId === undefined) {
      throw new Error("Cannot build a vote response without voterId");
    }
    if (this.term === undefined) {
      throw new Error("Cannot build a vote response without term");
    }

    if (this.granted === undefined) {
      throw new Error("Cannot build a vote response without granted");
    }
    return {
      ...super.build(),
      type: "vote-response",
      voterId: this.voterId,
      granted: this.granted,
      term: this.term,
    };
  }
}
