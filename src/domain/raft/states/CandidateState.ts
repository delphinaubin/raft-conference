import { NodeAlgorithmState } from "@/domain/raft/states/NodeAlgorithmState";
import { VoteRequestBuilder } from "@/domain/network/VoteRequestBuilder";
import { VoteResponse } from "@/domain/network/NetworkRequest";

export class CandidateState extends NodeAlgorithmState {
  name = "candidate" as const;

  onEnterInState(): void {
    super.onEnterInState();

    this.cancelTimers();
    this.nodeMemoryState.votesReceived = [this.nodeId];
    this.nodeMemoryState.votedFor = this.nodeId;

    this.allNodesIds
      .filter((nodeId) => this.nodeId != nodeId)
      .forEach((nodeId) => {
        this.sendNetworkRequest(
          VoteRequestBuilder.aVoteRequest()
            .withSenderNodeId(this.nodeId)
            .withReceiverNodeId(nodeId)
            .build()
        );
      });

    this.startElectionTimeoutTimer();
  }

  protected onVoteResponse(response: VoteResponse): void {
    if (response.granted) {
      if (!this.nodeMemoryState.votesReceived.includes(response.senderNodeId)) {
        this.nodeMemoryState.votesReceived.push(response.senderNodeId);
        if (this.quorumReached(this.allNodesIds.length)) {
          this.changeState("leader");
        }
      }
    }
  }

  startElectionTimeoutTimer(): void {
    this.startTimerWithRandomDuration(10_000, "election timeout").then(() => {
      this.changeState("candidate");
    });
  }
}
