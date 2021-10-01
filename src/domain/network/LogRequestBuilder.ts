import { LogRequest, VoteRequest } from "@/domain/network/NetworkRequest";
import { NetworkRequestBuilder } from "@/domain/network/NetworkRequestBuilder";
import { LogEntry } from "@/domain/log/LogEntry";

export class LogRequestBuilder extends NetworkRequestBuilder {
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
    if (!this.leaderId) {
      throw new Error("Cannot build a vote request without leaderId");
    }

    if (!this.term) {
      throw new Error("Cannot build a vote request without term");
    }
    if (!this.logLength) {
      throw new Error("Cannot build a vote request without logLength ");
    }
    if (!this.logTerm) {
      throw new Error("Cannot build a vote request without logTerm");
    }
    if (!this.leaderCommit) {
      throw new Error("Cannot build a vote request without leaderCommit");
    }

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
