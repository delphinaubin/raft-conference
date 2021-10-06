import { NodeAlgorithmState } from "@/domain/raft/states/NodeAlgorithmState";

export class OffState extends NodeAlgorithmState {
  name = "off" as const;
}
