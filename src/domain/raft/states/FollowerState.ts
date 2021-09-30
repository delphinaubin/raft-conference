import { NodeAlgorithmState } from "@/domain/raft/states/NodeAlgorithmState";

export class FollowerState extends NodeAlgorithmState {
  name = "follower" as const;

  async onEnterInState(): Promise<void> {
    await this.changeState("leader");
  }
}
