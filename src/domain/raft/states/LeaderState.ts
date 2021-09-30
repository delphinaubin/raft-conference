import { NodeAlgorithmState } from "@/domain/raft/states/NodeAlgorithmState";

export class LeaderState extends NodeAlgorithmState {
  name = "leader" as const;

  async onEnterInState(): Promise<void> {
    await super.onEnterInState();
    this.startTimer(2000).then(async () => {
      console.log("after the timer", this.nodeId);
      await this.changeState("candidate");
    });
  }
}
