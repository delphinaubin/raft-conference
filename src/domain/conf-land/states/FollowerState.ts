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
    this.checkIfIShouldBecomeLeader();
  }

  protected onLogRequest(request: LogRequest): void {
    super.onLogRequest(request);

    if (request.term >= this.nodeMemoryState.term && request.leaderCommit >= this.nodeMemoryState.commitLength) {
      this.nodeMemoryState.term = request.term;
      this.nodeMemoryState.leader = request.senderNodeId;
      this.nodeMemoryState.commitLength = request.leaderCommit;
      this.replaceMyLogWith(request.logEntries);
      this.cancelTimers();
      this.checkIfIShouldBecomeLeader();

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

  protected onBroadcastRequest(request: BroadcastRequest) {
    super.onBroadcastRequest(request);
    if (this.nodeMemoryState.leader !== undefined) {
      this.sendNetworkRequest(
        RelayBroadcastRequestBuilder.aRelayBroadcastRequest()
          .withReceiverNodeId(this.nodeMemoryState.leader)
          .withLog(request.log)
      );
    }
  }

  private checkIfIShouldBecomeLeader() {
    this.startTimerWithRandomDuration("no leader ack timeout", 4000).then(
      () => {
        this.changeState("candidate");
      }
    );
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
