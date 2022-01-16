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

  protected onVoteRequest(request: VoteRequest): void {
    super.onVoteRequest(request);

    const neverVotedBefore = this.nodeMemoryState.votedFor === undefined;
    this.sendNetworkRequest(
      VoteResponseBuilder.aVoteResponse()
        .withGranted(neverVotedBefore)
        .withReceiverNodeId(request.senderNodeId)
    );
  }

  private checkIfIShouldBecomeCandidate() {
    this.startTimerWithRandomDuration("no leader timeout", 4_000).then(() => {
      this.changeState("candidate");
    });
  }

  protected onBroadcastRequest(request: BroadcastRequest): void {
    super.onBroadcastRequest(request);
    if (this.nodeMemoryState.leader) {
      this.sendNetworkRequest(
        RelayBroadcastRequestBuilder.aRelayBroadcastRequest()
          .withLog(request.log)
          .withReceiverNodeId(this.nodeMemoryState.leader)
      );
    }
  }

  protected onLogRequest(request: LogRequest): void {
    super.onLogRequest(request);

    if (
      request.term >= this.nodeMemoryState.term &&
      request.leaderCommit >= this.nodeMemoryState.commitLength
    ) {
      this.replaceMyLogWith(request.logEntries);
      this.cancelTimers();
      this.checkIfIShouldBecomeCandidate();
      this.nodeMemoryState.leader = request.senderNodeId;
      this.nodeMemoryState.term = request.term;
      this.nodeMemoryState.commitLength = request.leaderCommit;
      this.sendNetworkRequest(
        LogResponseBuilder.aLogResponse()
          .withSuccess(true)
          .withReceiverNodeId(request.senderNodeId)
          .withAckLength(this.nodeMemoryState.log.length)
      );
    } else {
      this.sendNetworkRequest(
        LogResponseBuilder.aLogResponse()
          .withSuccess(false)
          .withReceiverNodeId(request.senderNodeId)
          .withAckLength(this.nodeMemoryState.log.length)
      );
    }
  }
}
