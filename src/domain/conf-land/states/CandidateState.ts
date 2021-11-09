import { NodeAlgorithmState } from "@/domain/conf-land/states/NodeAlgorithmState";
import { VoteRequestBuilder } from "@/domain/framework/network/VoteRequestBuilder";
import {
  LogRequest,
  VoteRequest,
  VoteResponse,
} from "@/domain/framework/network/NetworkRequest";

export class CandidateState extends NodeAlgorithmState {
  name = "candidate" as const;

  onEnterInState(): void {
    super.onEnterInState();
    this.startElectoralProcess();
  }

  private startElectoralProcess() {
    this.nodeMemoryState.term++;
    this.nodeMemoryState.votedFor = this.nodeId;
    this.nodeMemoryState.nodesWhichVotedForMe.clear();
    this.nodeMemoryState.nodesWhichVotedForMe.add(this.nodeId);
    this.sendNetworkRequestToAllOtherNodes(
      VoteRequestBuilder.aVoteRequest().withTerm(this.nodeMemoryState.term)
    );
    this.startTimerWithRandomDuration("election timeout", 500).then(() => {
      this.startElectoralProcess();
    });
  }

  protected onVoteRequest(request: VoteRequest): void {
    super.onVoteRequest(request);
    if (request.term > this.nodeMemoryState.term) {
      this.nodeMemoryState.term = request.term;
      this.nodeMemoryState.votedFor = undefined;
      this.nodeMemoryState.nodesWhichVotedForMe.clear();
      this.changeState("follower");
    }
  }

  protected onVoteResponse(response: VoteResponse): void {
    super.onVoteResponse(response);
    if (response.granted) {
      this.nodeMemoryState.nodesWhichVotedForMe.add(response.senderNodeId);
      const iHaveTheMajority =
        this.nodeMemoryState.nodesWhichVotedForMe.size >
        this.allNodesIds.length / 2;
      if (iHaveTheMajority) {
        this.changeState("leader");
      }
    }
  }

  protected onLogRequest(request: LogRequest): void {
    super.onLogRequest(request);
    this.changeState("follower");
  }
}
