import { RaftNodeState } from "@/domain/RaftNode";
import { AbstractNodeAlgorithm } from "@/domain/raft/AbstractNodeAlgorithm";

export class NodeAlgorithm extends AbstractNodeAlgorithm {
  getInitialState(): RaftNodeState {
    return "leader";
  }
}
