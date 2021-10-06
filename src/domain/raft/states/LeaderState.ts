import { NodeAlgorithmState } from "@/domain/raft/states/NodeAlgorithmState";

export class LeaderState extends NodeAlgorithmState {
  name = "leader" as const;

  async onEnterInState(): Promise<void> {
    await super.onEnterInState();
    // TODO DAU : voir comment afficher le memory dans l'IHM
    // TODO Cancel election timer
    // For this we would need at minimum to store the timer ID and purpose when we start a timer
    //this.timerManager.cancelTimer()

    this.nodeMemoryState.leader = this.nodeId;
    this.allNodesIds.forEach((follower) => {
      this.nodeMemoryState.sentLength[follower] =
        this.nodeMemoryState.log.length;
      this.nodeMemoryState.ackedLength[follower] = 0;

      this.startTimer(2_000).then(() => {
        this.onReplicateLogTimeout();
      });
    });
  }

  private onReplicateLogTimeout(): Promise<void> {
    // TODO implement
    return Promise.resolve(undefined);
  }
}
