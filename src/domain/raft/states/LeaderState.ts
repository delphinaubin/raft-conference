import { NodeAlgorithmState } from "@/domain/raft/states/NodeAlgorithmState";
import { BroadcastRequest } from "@/domain/network/NetworkRequest";

export class LeaderState extends NodeAlgorithmState {
  name = "leader" as const;

  onEnterInState(): void {
    super.onEnterInState();
  }

  onBroadcastRequest(request: BroadcastRequest): void {
    this.addLog(request.log);

    // TODO à enlever quand on le verra en graphique
    console.log(`node ${this.nodeId} logs:`);
    this.nodeMemoryState.log.forEach((l) => console.log(l.value));
  }
}
