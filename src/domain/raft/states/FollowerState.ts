import { NodeAlgorithmState } from "@/domain/raft/states/NodeAlgorithmState";
import {
  BroadcastRequest,
  LogRequest,
  VoteRequest,
} from "@/domain/network/NetworkRequest";
import { VoteResponseBuilder } from "@/domain/network/VoteResponseBuilder";
import { RelayBroadcastRequestBuilder } from "@/domain/network/RelayBroadcastRequestBuilder";

export class FollowerState extends NodeAlgorithmState {
  name = "follower" as const;

  onEnterInState(): void {
    super.onEnterInState();

    this.nodeMemoryState.votedFor = undefined;
    this.nodeMemoryState.votesReceived = [];
    this.startLeaderTimeoutTimer();
  }

  onLogRequest(request: LogRequest): void {
    if (request.term == this.nodeMemoryState.term) {
      console.log(
        `node ${this.nodeId} received logRequest from ${request.senderNodeId} (destination: ${request.receiverNodeId})`
      );
      super.onLogRequest(request);
      this.setLogs(request.entries);

      this.cancelTimers();
      this.startLeaderTimeoutTimer();

      // TODO enlever quand on aura l'affichage
      this.printLogs();
    } else {
      console.log(
        `node ${this.nodeId} received but ignored logRequest from ${request.senderNodeId} (destination: ${request.receiverNodeId}), because the term was inferior`
      );
    }
  }

  onBroadcastRequest(request: BroadcastRequest): void {
    if (this.nodeMemoryState.votedFor != undefined) {
      this.sendNetworkRequest(
        RelayBroadcastRequestBuilder.aRelayBroadcastRequest()
          .withSenderNodeId(this.nodeId)
          .withReceiverNodeId(this.nodeMemoryState.votedFor)
          .withLog(request.log)
          .build()
      );
    }
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
