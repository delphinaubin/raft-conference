import { NodeAlgorithmState } from "@/domain/raft/NodeAlgorithmState";

export class LeaderState extends NodeAlgorithmState {
  name = "leader" as const;
}
