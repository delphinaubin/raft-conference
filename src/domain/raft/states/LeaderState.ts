import { NodeAlgorithmState } from "@/domain/raft/states/NodeAlgorithmState";
import { BroadcastRequest } from "@/domain/network/NetworkRequest";
import { LogRequestBuilder } from "@/domain/network/LogRequestBuilder";

export class LeaderState extends NodeAlgorithmState {
  name = "leader" as const;

  onEnterInState(): void {
    super.onEnterInState();

    this.startTimer(3_000, "replicateLog").then(() => {
      this.replicateLogs();
    });
  }

  onBroadcastRequest(request: BroadcastRequest): void {
    this.addLog(request.log);

    // TODO à enlever quand on le verra en graphique
    this.printLogs();
  }

  replicateLogs(): void {
    this.allNodesIds
      .filter((id) => id != this.nodeId)
      .forEach((follower) =>
        this.sendNetworkRequest(
          LogRequestBuilder.aLogRequest()
            .withSenderNodeId(this.nodeId)
            .withReceiverNodeId(follower)
            .withLogEntries(this.getLogEntries())
            .build()
        )
      );
    this.startTimer(3_000, "replicateLog").then(() => {
      this.replicateLogs();
    });
  }
}
