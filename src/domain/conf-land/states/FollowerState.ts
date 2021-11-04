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
    this.checkIfIShouldBecomeCandidate();
  }

  private checkIfIShouldBecomeCandidate() {
    this.startTimerWithRandomDuration("no leader ack timeout", 4_000).then(
      () => {
        this.changeState("candidate");
      }
    );
  }

  protected onLogRequest(request: LogRequest): void {
    super.onLogRequest(request);
    if (
      request.term < this.nodeMemoryState.term ||
      request.leaderCommit < this.nodeMemoryState.commitLength
    ) {
      this.sendNetworkRequest(
        LogResponseBuilder.aLogResponse()
          .withReceiverNodeId(request.senderNodeId)
          .withSuccess(false)
      );
      return;
    }
    this.nodeMemoryState.commitLength = request.leaderCommit;
    this.nodeMemoryState.term = request.term;
    this.replaceMyLogWith(request.entries);
    this.nodeMemoryState.leader = request.senderNodeId;
    this.cancelTimers();
    this.checkIfIShouldBecomeCandidate();
    this.sendNetworkRequest(
      LogResponseBuilder.aLogResponse()
        .withReceiverNodeId(request.senderNodeId)
        .withSuccess(true)
    );
  }

  protected onBroadcastRequest(request: BroadcastRequest): void {
    super.onBroadcastRequest(request);
    if (this.nodeMemoryState.leader) {
      this.sendNetworkRequest(
        RelayBroadcastRequestBuilder.aRelayBroadcastRequest()
          .withReceiverNodeId(this.nodeMemoryState.leader)
          .withLog(request.log)
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
