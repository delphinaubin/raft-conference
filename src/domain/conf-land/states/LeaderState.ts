import { NodeAlgorithmState } from "@/domain/conf-land/states/NodeAlgorithmState";
import {
  BroadcastRequest,
  LogRequest,
  LogResponse,
  VoteRequest,
} from "@/domain/framework/network/NetworkRequest";
import { LogRequestBuilder } from "@/domain/framework/network/LogRequestBuilder";
import { VoteRequestBuilder } from "@/domain/framework/network/VoteRequestBuilder";
import { VoteResponseBuilder } from "@/domain/framework/network/VoteResponseBuilder";

export class LeaderState extends NodeAlgorithmState {
  name = "leader" as const;

  onEnterInState() {
    super.onEnterInState();
    this.replicateMyLogs();
  }

  protected onVoteRequest(request: VoteRequest): void {
    super.onVoteRequest(request);
    if (request.term > this.nodeMemoryState.term) {
      this.nodeMemoryState.term = request.term;
      this.nodeMemoryState.votedFor = request.senderNodeId;
      this.sendNetworkRequest(
        VoteResponseBuilder.aVoteResponse()
          .withReceiverNodeId(request.senderNodeId)
          .withGranted(true)
      );
      this.changeState("follower");
    }
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
      this.nodeMemoryState.ackedLength[response.senderNodeId] =
        response.ackLength;

      const nodesWhichAreUpToDate = Object.values(
        this.nodeMemoryState.ackedLength
      ).filter((ack) => ack === this.nodeMemoryState.log.length);

      const numberOfNodesUpToDate = nodesWhichAreUpToDate.length;
      if (numberOfNodesUpToDate > this.allNodesIds.length / 2) {
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
    this.startTimer(3_000, "replicate logs").then(() => this.replicateMyLogs());
  }
}
