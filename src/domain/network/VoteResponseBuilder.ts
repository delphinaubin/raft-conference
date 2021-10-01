import { VoteRequest, VoteResponse } from "@/domain/network/NetworkRequest";
import { NetworkRequestBuilder } from "@/domain/network/NetworkRequestBuilder";

export class VoteResponseBuilder extends NetworkRequestBuilder {
  private term?: number;
  private granted?: boolean;
  private voterId?: string;

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
    if (!this.voterId) {
      throw new Error("Cannot build a vote request without voterId");
    }
    if (!this.term) {
      throw new Error("Cannot build a vote request without term");
    }

    if (!this.granted) {
      throw new Error("Cannot build a vote request without granted");
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
