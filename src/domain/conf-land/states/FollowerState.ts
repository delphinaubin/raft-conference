import { NodeAlgorithmState } from "@/domain/conf-land/states/NodeAlgorithmState";
import {
  BroadcastRequest,
  LogRequest,
  VoteRequest,
} from "@/domain/framework/network/NetworkRequest";
import { RelayBroadcastRequestBuilder } from "@/domain/framework/network/RelayBroadcastRequestBuilder";
import { VoteResponseBuilder } from "@/domain/framework/network/VoteResponseBuilder";
import { LogResponseBuilder } from "@/domain/framework/network/LogResponseBuilder";

export class FollowerState extends NodeAlgorithmState {
  name = "follower" as const;

  onEnterInState(): void {
    super.onEnterInState();
    this.shouldIBecomeCandidate();
  }

  private shouldIBecomeCandidate() {
    this.startTimerWithRandomDuration("No Leader  timeout ?", 4_000).then(
      () => {
        this.changeState("candidate");
      }
    );
  }

  protected onBroadcastRequest(request: BroadcastRequest): void {
    super.onBroadcastRequest(request);
    if (this.nodeMemoryState.leader !== undefined) {
      this.sendNetworkRequest(
        RelayBroadcastRequestBuilder.aRelayBroadcastRequest()
          .withReceiverNodeId(this.nodeMemoryState.leader)
          .withLog(request.log)
      );
    }
  }

  protected onLogRequest(request: LogRequest): void {
    super.onLogRequest(request);
    if (
      request.term >= this.nodeMemoryState.term &&
      request.leaderCommit >= this.nodeMemoryState.commitLength
    ) {
      this.nodeMemoryState.leader = request.senderNodeId;
      this.nodeMemoryState.term = request.term;
      this.replaceMyLogWith(request.logEntries);
      this.nodeMemoryState.commitLength = request.leaderCommit;
      this.cancelTimers();
      this.shouldIBecomeCandidate();
      this.sendNetworkRequest(
        LogResponseBuilder.aLogResponse()
          .withReceiverNodeId(request.senderNodeId)
          .withSuccess(true)
          .withAckLength(this.nodeMemoryState.log.length)
      );
    } else {
      this.sendNetworkRequest(
        LogResponseBuilder.aLogResponse()
          .withReceiverNodeId(request.senderNodeId)
          .withSuccess(false)
          .withAckLength(this.nodeMemoryState.log.length)
      );
    }
  }

  protected onVoteRequest(request: VoteRequest): void {
    super.onVoteRequest(request);
    if (this.nodeMemoryState.votedFor === undefined) {
      this.nodeMemoryState.votedFor = request.senderNodeId;
      this.sendNetworkRequest(
        VoteResponseBuilder.aVoteResponse()
          .withReceiverNodeId(request.senderNodeId)
          .withGranted(true)
      );
    } else {
      this.sendNetworkRequest(
        VoteResponseBuilder.aVoteResponse()
          .withReceiverNodeId(request.senderNodeId)
          .withGranted(false)
      );
    }
  }
}
