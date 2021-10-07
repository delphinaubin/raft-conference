import { LogEntry } from "@/domain/log/LogEntry";

// TODO Broadcast requests are usually sent from the outside worl
// The senderNodeId is therefore not mandatory in theory
// Maybe it's not a big deal in practice
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

export interface BroadcastRequest extends AbstractNetworkRequest {
  type: "broadcast-request";
  log: number;
}

export type NetworkRequest =
  | VoteRequest
  | VoteResponse
  | LogRequest
  | LogResponse
  | BroadcastRequest;
