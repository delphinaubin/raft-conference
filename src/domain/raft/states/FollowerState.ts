import { NodeAlgorithmState } from "@/domain/raft/NodeAlgorithmState";

export class FollowerState extends NodeAlgorithmState {
  name = "follower" as const;
}
