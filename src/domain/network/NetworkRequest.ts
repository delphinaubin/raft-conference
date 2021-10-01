import { LogEntry } from "@/domain/log/LogEntry";

export interface AbstractNetworkRequest {
  senderNodeId: string;
  receiverNodeId: string;
}

export interface VoteRequest extends AbstractNetworkRequest {
  type: "vote-request";
  term: number;
}

export interface VoteResponse extends AbstractNetworkRequest {
  type: "vote-response";
  term: number;
  voterId: string;
  granted: boolean;
}

export interface LogRequest extends AbstractNetworkRequest {
  type: "log-request";
  leaderId: string;
  term: number;
  logLength: number;
  logTerm: number;
  leaderCommit: number;
  entries: LogEntry[];
}

export interface LogResponse extends AbstractNetworkRequest {
  type: "log-response";
  follower: string;
  term: number;
  ack: number;
  success: boolean;
}

// TODO DAU : add | OtherRequest when adding it
export type NetworkRequest = VoteRequest | VoteResponse | LogRequest;
