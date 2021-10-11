import { NodeAlgorithmState } from "@/domain/raft/states/NodeAlgorithmState";
import { VoteRequestBuilder } from "@/domain/network/VoteRequestBuilder";
import {
  BroadcastRequest,
  LogRequest,
  VoteResponse,
} from "@/domain/network/NetworkRequest";

export class CandidateState extends NodeAlgorithmState {
  name = "candidate" as const;

  onEnterInState(): void {
    super.onEnterInState();
    // TODO DAU : voir comment afficher le memory dans l'IHM
    this.onElectionTimeout();
  }

  private onElectionTimeout(): void {
    this.nodeMemoryState.term++;
    this.nodeMemoryState.votedFor = this.nodeId;
    this.nodeMemoryState.votesReceived = [this.nodeId];
    this.startTimer(2_000, "Election timeout").then(() => {
      this.onElectionTimeout();
    });
    this.allNodesIds
      .filter((nodeId) => nodeId !== this.nodeId)
      .forEach((otherNodeId) =>
        this.sendNetworkRequest(
          VoteRequestBuilder.aVoteRequest()
            .withSenderNodeId(this.nodeId)
            .withReceiverNodeId(otherNodeId)
            .withTerm(this.nodeMemoryState.term)
            .build()
        )
      );
  }

  protected onVoteResponse(response: VoteResponse): void {
    super.onVoteResponse(response);
    /* TODO check that super didn't change this node state to follower
       because the term in the response is greater than this node term
       If that's the case, this node shoudln't do anything else
       (I'm not sure how to implement such a check or if it's even
       possible)                                                       */
    if (this.nodeMemoryState.term == response.term && response.granted) {
      this.nodeMemoryState.votesReceived.push(response.voterId);
      if (this.quorumReached(this.nodeMemoryState.votesReceived.length)) {
        this.changeState("leader");
      }
    }
  }

  onBroadcastRequest(request: BroadcastRequest): void {
    // leader is unknown at this time, so do nothing
  }

  protected onLogRequest(request: LogRequest): void {
    super.onLogRequest(request);
    if (request.term >= this.nodeMemoryState.term) {
      this.nodeMemoryState.leader = request.leaderId;
      this.cancelTimers();
      this.startElectionTimer(false);
    }
  }
}
