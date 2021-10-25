import { NodeAlgorithmState } from "@/domain/conf-land/states/NodeAlgorithmState";

export class LeaderState extends NodeAlgorithmState {
  name = "leader" as const;
}
