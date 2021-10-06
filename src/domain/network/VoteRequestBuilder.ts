import { VoteRequest } from "@/domain/network/NetworkRequest";
import { NetworkRequestBuilder } from "@/domain/network/NetworkRequestBuilder";

export class VoteRequestBuilder extends NetworkRequestBuilder {
  private term?: number;

  static aVoteRequest(): VoteRequestBuilder {
    return new VoteRequestBuilder();
  }
  withTerm(term: number): this {
    this.term = term;
    return this;
  }

  build(): VoteRequest {
    if (!this.term) {
      throw new Error("Cannot build a vote request without term");
    }
    return {
      ...super.build(),
      type: "vote-request",
      term: this.term,
    };
  }
}
