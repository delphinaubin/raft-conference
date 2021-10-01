import { NodeAlgorithmState } from "@/domain/raft/states/NodeAlgorithmState";
import { VoteRequestBuilder } from "@/domain/network/VoteRequestBuilder";

export class CandidateState extends NodeAlgorithmState {
  name = "candidate" as const;

  async onEnterInState(): Promise<void> {
    await super.onEnterInState();
    // TODO DAU : voir comment afficher le memory dans l'IHM
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
  }
}
