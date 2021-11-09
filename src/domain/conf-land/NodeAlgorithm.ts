import { RaftNodeState } from "@/domain/framework/RaftNode";
import { AbstractNodeAlgorithm } from "@/domain/framework/raft/AbstractNodeAlgorithm";

export class NodeAlgorithm extends AbstractNodeAlgorithm {
  getInitialState(): RaftNodeState {
    if (this.id === "1") {
      return "leader";
    } else {
      return "follower";
    }
  }
}
