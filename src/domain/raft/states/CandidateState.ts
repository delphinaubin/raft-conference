import { NodeAlgorithmState } from "@/domain/raft/states/NodeAlgorithmState";
import { VoteRequestBuilder } from "@/domain/network/VoteRequestBuilder";
import { VoteResponse } from "@/domain/network/NetworkRequest";

export class CandidateState extends NodeAlgorithmState {
  name = "candidate" as const;

  async onEnterInState(): Promise<void> {
    await super.onEnterInState();
    // TODO DAU : voir comment afficher le memory dans l'IHM
    await this.onElectionTimeout();
  }

  private async onElectionTimeout(): Promise<void> {
    this.nodeMemoryState.term++;
    this.nodeMemoryState.votedFor = this.nodeId;
    this.nodeMemoryState.votesReceived = [this.nodeId];
    const promises = this.allNodesIds
      .filter((nodeId) => nodeId !== this.nodeId)
      .map((otherNodeId) =>
        this.sendNetworkRequest(
          VoteRequestBuilder.aVoteRequest()
            .withSenderNodeId(this.nodeId)
            .withReceiverNodeId(otherNodeId)
            .withTerm(this.nodeMemoryState.term)
            .build()
        )
      );
    await Promise.all(promises);

    this.startTimer(2_000).then(() => {
      this.onElectionTimeout();
    });
  }

  protected async onVoteResponse(response: VoteResponse): Promise<void> {
    await super.onVoteResponse(response);
    /* TODO check that super didn't change this node state to follower   
       because the term in the response is greater than this node term   
       If that's the case, this node shoudln't do anything else          
       (I'm not sure how to implement such a check or if it's even       
       possible)                                                       */
    if (this.nodeMemoryState.term == response.term && response.granted) {
      this.nodeMemoryState.votesReceived.push(response.voterId);
      if (this.quorumReached(this.nodeMemoryState.votesReceived.length)) {
        await this.changeState("leader");
      }
    }
  }
}
