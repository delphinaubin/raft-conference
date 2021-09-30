import { NodeAlgorithmState } from "@/domain/raft/states/NodeAlgorithmState";

export class LeaderState extends NodeAlgorithmState {
  name = "leader" as const;

  async onEnterInState(): Promise<void> {
    setTimeout(() => {
      this.changeState("candidate");
    }, 3000);
  }
}
