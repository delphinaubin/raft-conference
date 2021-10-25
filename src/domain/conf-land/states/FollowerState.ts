import { NodeAlgorithmState } from "@/domain/conf-land/states/NodeAlgorithmState";

export class FollowerState extends NodeAlgorithmState {
  name = "follower" as const;
}
