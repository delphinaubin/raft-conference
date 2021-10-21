import { NodeAlgorithmState } from "@/domain/raft/states/NodeAlgorithmState";
import { VoteRequestBuilder } from "@/domain/network/VoteRequestBuilder";
import {
  VoteRequest,
  VoteResponse,
} from "@/domain/network/NetworkRequest";
import { VoteResponseBuilder } from "@/domain/network/VoteResponseBuilder";

export class CandidateState extends NodeAlgorithmState {
  name = "candidate" as const;

  onEnterInState(): void {
    super.onEnterInState();

    this.startElectionProcess();
  }

  startElectionProcess(): void {
    this.cancelTimers();
    this.nodeMemoryState.term++;
    this.nodeMemoryState.votesReceived = [this.nodeId];
    this.nodeMemoryState.votedFor = this.nodeId;

    this.allNodesIds
      .filter((nodeId) => this.nodeId != nodeId)
      .forEach((nodeId) => {
        this.sendNetworkRequest(
          VoteRequestBuilder.aVoteRequest()
            .withTerm(this.nodeMemoryState.term)
            .withSenderNodeId(this.nodeId)
            .withReceiverNodeId(nodeId)
            .withLogLength(this.getLogEntries().length)
            .build()
        );
      });

    this.startElectionTimeoutTimer();
  }

  onVoteResponse(response: VoteResponse): void {
    if (response.granted) {
      if (!this.nodeMemoryState.votesReceived.includes(response.senderNodeId)) {
        this.nodeMemoryState.votesReceived.push(response.senderNodeId);
        if (this.quorumReached(this.allNodesIds.length)) {
          this.changeState("leader");
        }
      }
    }
  }

  onVoteRequest(request: VoteRequest): void {
    let termWasUpdated = false;
    const logOk = request.logLength! >= this.getLogEntries().length;
    if (request.term! > this.nodeMemoryState.term) {
      this.nodeMemoryState.term = request.term!;
      this.changeState("follower");
      console.log(
        `Changed state to follower on node ${this.nodeId} after receiving a vote request with greater term`
      );
      termWasUpdated = true;
    }
    if (termWasUpdated && logOk) {
      console.log(
        `Node ${this.nodeId} (previously candidate) has updated it's term and sends a granted voteResponse`
      );
      this.nodeMemoryState.votedFor = request.senderNodeId;
      this.sendNetworkRequest(
        VoteResponseBuilder.aVoteResponse()
          .withSenderNodeId(this.nodeId)
          .withReceiverNodeId(request.senderNodeId)
          .withGranted(true)
          .build()
      );
    }
  }

  startElectionTimeoutTimer(): void {
    this.startTimerWithRandomDuration(10_000, "election timeout").then(() => {
      this.startElectionProcess();
    });
  }
}
