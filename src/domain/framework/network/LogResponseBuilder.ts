import { LogResponse } from "@/domain/framework/network/NetworkRequest";
import { NodeToNodeNetworkRequestBuilder } from "@/domain/framework/network/NodeToNodeNetworkRequestBuilder";

export class LogResponseBuilder extends NodeToNodeNetworkRequestBuilder {
  private ack = 0;
  private success?: boolean;

  static aLogResponse(): LogResponseBuilder {
    return new LogResponseBuilder();
  }

  withAck(ack: number): this {
    this.ack = ack;
    return this;
  }

  withSuccess(success: boolean): this {
    this.success = success;
    return this;
  }

  build(): LogResponse {
    if (this.success === undefined) {
      throw new Error("Cannot build a log response without success");
    }

    return {
      ...super.build(),
      type: "log-response",
      ack: this.ack,
      success: this.success,
    };
  }
}
