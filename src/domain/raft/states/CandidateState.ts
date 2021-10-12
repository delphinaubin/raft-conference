import { NodeAlgorithmState } from "@/domain/raft/states/NodeAlgorithmState";

export class CandidateState extends NodeAlgorithmState {
  name = "candidate" as const;

  onEnterInState(): void {
    super.onEnterInState();
  }
}
