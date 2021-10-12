import { NodeAlgorithmState } from "@/domain/raft/states/NodeAlgorithmState";
import { LogRequest } from "@/domain/network/NetworkRequest";

export class FollowerState extends NodeAlgorithmState {
  name = "follower" as const;

  onEnterInState(): void {
    super.onEnterInState();
  }

  onLogRequest(request: LogRequest): void {
    super.onLogRequest(request);
    this.setLogs(request.entries);

    // TODO enlever quand on aura l'affichage
    this.printLogs();
  }
}
