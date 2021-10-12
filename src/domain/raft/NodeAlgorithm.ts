import { RaftNodeState } from "@/domain/RaftNode";
import { AbstractNodeAlgorithm } from "@/domain/raft/AbstractNodeAlgorithm";

export class NodeAlgorithm extends AbstractNodeAlgorithm {
  getInitialState(): RaftNodeState {
    if (this.id === "1") {
      return "leader";
    } else {
      return "follower";
    }
  }
}
