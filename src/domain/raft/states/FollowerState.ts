import { NodeAlgorithmState } from "@/domain/raft/states/NodeAlgorithmState";
import { BroadcastRequest, LogRequest } from "@/domain/network/NetworkRequest";
import { BroadcastRequestBuilder } from "@/domain/network/BroadcastRequestBuilder";

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

  onBroadcastRequest(request: BroadcastRequest): void {
    this.sendNetworkRequest(
      BroadcastRequestBuilder.aBroadcastRequest()
        .withReceiverNodeId("1")
        .withLog(request.log)
        .build()
    );
  }
}
