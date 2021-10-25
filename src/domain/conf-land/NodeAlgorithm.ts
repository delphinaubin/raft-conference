import { RaftNodeState } from "@/domain/framework/RaftNode";
import { AbstractNodeAlgorithm } from "@/domain/framework/raft/AbstractNodeAlgorithm";

export class NodeAlgorithm extends AbstractNodeAlgorithm {
  getInitialState(): RaftNodeState {
    return "off";
  }
}
