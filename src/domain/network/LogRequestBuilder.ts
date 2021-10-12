import { LogRequest } from "@/domain/network/NetworkRequest";
import { NodeToNodeNetworkRequestBuilder } from "@/domain/network/NodeToNodeNetworkRequestBuilder";
import { LogEntry } from "@/domain/log/LogEntry";

// TODO leaderId = senderId so it's not necessary and should be removed
export class LogRequestBuilder extends NodeToNodeNetworkRequestBuilder {
  private term?: number;
  private leaderId?: string;
  private logLength?: number;
  private logTerm?: number;
  private leaderCommit?: number;
  private entries: LogEntry[] = [];

  static aLogRequest(): LogRequestBuilder {
    return new LogRequestBuilder();
  }

  withLeaderId(leaderId: string): this {
    this.leaderId = leaderId;
    return this;
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

  withLeaderCommit(leaderCommit: number): this {
    this.leaderCommit = leaderCommit;
    return this;
  }

  withLogEntries(logEntries: LogEntry[]): this {
    this.entries = logEntries;
    return this;
  }

  build(): LogRequest {
    return {
      ...super.build(),
      type: "log-request",
      leaderId: this.leaderId,
      term: this.term,
      logLength: this.logLength,
      logTerm: this.logTerm,
      leaderCommit: this.leaderCommit,
      entries: this.entries,
    };
  }
}
