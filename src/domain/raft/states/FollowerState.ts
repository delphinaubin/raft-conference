import { NodeAlgorithmState } from "@/domain/raft/states/NodeAlgorithmState";
import {
  BroadcastRequest,
  LogRequest,
  VoteRequest,
} from "@/domain/network/NetworkRequest";
import { BroadcastRequestBuilder } from "@/domain/network/BroadcastRequestBuilder";
import { VoteResponseBuilder } from "@/domain/network/VoteResponseBuilder";

export class FollowerState extends NodeAlgorithmState {
  name = "follower" as const;

  onEnterInState(): void {
    super.onEnterInState();

    this.nodeMemoryState.votedFor = undefined;
    this.nodeMemoryState.votesReceived = [];
    this.startLeaderTimeoutTimer();
  }

  onLogRequest(request: LogRequest): void {
    super.onLogRequest(request);
    this.setLogs(request.entries);

    this.cancelTimers();
    this.startLeaderTimeoutTimer();

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

  startLeaderTimeoutTimer(): void {
    this.startTimerWithRandomDuration(10_000, "no leader ack timeout").then(
      () => {
        this.changeState("candidate");
      }
    );
  }

  onVoteRequest(request: VoteRequest): void {
    if (request.term! > this.nodeMemoryState.term) {
      this.nodeMemoryState.term = request.term!;
      this.nodeMemoryState.votedFor = undefined;
      this.nodeMemoryState.votesReceived = [];
    }
    if (
      this.nodeMemoryState.votedFor == null &&
      request.term == this.nodeMemoryState.term
    ) {
      this.nodeMemoryState.votedFor = request.senderNodeId;
      this.sendNetworkRequest(
        VoteResponseBuilder.aVoteResponse()
          .withSenderNodeId(this.nodeId)
          .withReceiverNodeId(request.senderNodeId)
          .withGranted(true)
          .build()
      );
    } else {
      this.sendNetworkRequest(
        VoteResponseBuilder.aVoteResponse()
          .withSenderNodeId(this.nodeId)
          .withReceiverNodeId(request.senderNodeId)
          .withGranted(false)
          .build()
      );
    }
  }
}
