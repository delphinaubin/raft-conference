import { LogRequest } from "@/domain/framework/network/NetworkRequest";
import { NodeToNodeNetworkRequestBuilder } from "@/domain/framework/network/NodeToNodeNetworkRequestBuilder";
import { LogEntry } from "@/domain/framework/log/LogEntry";

export class LogRequestBuilder extends NodeToNodeNetworkRequestBuilder {
  private leaderId?: string;
  private logLength?: number;
  private logTerm?: number;
  private leaderCommit?: number;
  private logEntries: LogEntry[] = [];

  static aLogRequest(): LogRequestBuilder {
    return new LogRequestBuilder();
  }

  withLeaderId(leaderId: string): this {
    this.leaderId = leaderId;
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

  withLeaderCommit(leaderCommit: number): this {
    this.leaderCommit = leaderCommit;
    return this;
  }

  withLogEntries(logEntries: LogEntry[]): this {
    this.logEntries = logEntries;
    return this;
  }

  build(): LogRequest {
    if (!this.leaderId) {
      this.leaderId = "-1";
    }
    if (this.logLength === undefined) {
      this.logLength = 0;
    }
    if (this.logTerm === undefined) {
      this.logTerm = 0;
    }
    if (this.leaderCommit === undefined) {
      this.leaderCommit = 0;
    }

    return {
      ...super.build(),
      type: "log-request",
      leaderId: this.leaderId,
      logLength: this.logLength,
      logTerm: this.logTerm,
      leaderCommit: this.leaderCommit,
      logEntries: this.logEntries,
    };
  }
}
