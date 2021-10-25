import { LogResponse } from "@/domain/framework/network/NetworkRequest";
import { NodeToNodeNetworkRequestBuilder } from "@/domain/framework/network/NodeToNodeNetworkRequestBuilder";

export class LogResponseBuilder extends NodeToNodeNetworkRequestBuilder {
  private term?: number;
  private ack?: number;
  private success?: boolean;
  // TODO follower = senderID, remove it
  private follower?: string;

  static aLogResponse(): LogResponseBuilder {
    return new LogResponseBuilder();
  }
  withTerm(term: number): this {
    this.term = term;
    return this;
  }

  withAck(ack: number): this {
    this.ack = ack;
    return this;
  }

  withSuccess(success: boolean): this {
    this.success = success;
    return this;
  }

  withFollower(follower: string): this {
    this.follower = follower;
    return this;
  }

  build(): LogResponse {
    if (!this.follower) {
      throw new Error("Cannot build a log response without follower");
    }
    if (!this.term) {
      throw new Error("Cannot build a log response without term");
    }

    if (this.ack === undefined) {
      throw new Error("Cannot build a log response without ack");
    }

    if (this.success === undefined) {
      throw new Error("Cannot build a log response without success");
    }

    return {
      ...super.build(),
      type: "log-response",
      follower: this.follower,
      term: this.term,
      ack: this.ack,
      success: this.success,
    };
  }
}
