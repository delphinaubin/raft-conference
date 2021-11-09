import { NodeAlgorithmState } from "@/domain/conf-land/states/NodeAlgorithmState";
import {
  BroadcastRequest,
  LogRequest,
  LogResponse,
} from "@/domain/framework/network/NetworkRequest";
import { LogRequestBuilder } from "@/domain/framework/network/LogRequestBuilder";

export class LeaderState extends NodeAlgorithmState {
  name = "leader" as const;

  onEnterInState(): void {
    super.onEnterInState();
    this.replicateMyLogs();
  }

  protected onBroadcastRequest(request: BroadcastRequest): void {
    super.onBroadcastRequest(request);
    this.appendNewLog(request.log);
    this.nodeMemoryState.ackedLength[this.nodeId] =
      this.nodeMemoryState.log.length;
  }

  protected onLogRequest(request: LogRequest): void {
    super.onLogRequest(request);
    if (request.term > this.nodeMemoryState.term) {
      this.nodeMemoryState.term = request.term;
      this.changeState("follower");
    }
  }

  protected onLogResponse(response: LogResponse): void {
    super.onLogResponse(response);
    if (response.success) {
      this.nodeMemoryState.ackedLength[response.senderNodeId] = response.ackLength;
      const numberOfNodesWhichAreUpToDate = Object.values(
        this.nodeMemoryState.ackedLength
      ).filter(
        (ackLength) => ackLength === this.nodeMemoryState.log.length
      ).length;
      if (numberOfNodesWhichAreUpToDate > this.allNodesIds.length / 2) {
        this.nodeMemoryState.commitLength = this.nodeMemoryState.log.length;
      }
    }
  }

  private replicateMyLogs() {
    this.sendNetworkRequestToAllOtherNodes(
      LogRequestBuilder.aLogRequest()
        .withLogEntries(this.nodeMemoryState.log)
        .withTerm(this.nodeMemoryState.term)
        .withLeaderCommit(this.nodeMemoryState.commitLength)
    );
    this.startTimer(3_000, "replicate my logs").then(() => {
      this.replicateMyLogs();
    });
  }
}
