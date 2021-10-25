import { NodeAlgorithmState } from "@/domain/conf-land/states/NodeAlgorithmState";

export class CandidateState extends NodeAlgorithmState {
  name = "candidate" as const;
}
