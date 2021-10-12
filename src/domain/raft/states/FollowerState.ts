import { NodeAlgorithmState } from "@/domain/raft/states/NodeAlgorithmState";

export class FollowerState extends NodeAlgorithmState {
  name = "follower" as const;

  onEnterInState(): void {
    super.onEnterInState();
  }
}
