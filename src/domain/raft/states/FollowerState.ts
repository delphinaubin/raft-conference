import { NodeAlgorithmState } from "@/domain/raft/states/NodeAlgorithmState";
import { BroadcastRequest, LogRequest } from "@/domain/network/NetworkRequest";
import { BroadcastRequestBuilder } from "@/domain/network/BroadcastRequestBuilder";
import { LogEntry } from "@/domain/log/LogEntry";
import { LogResponseBuilder } from "@/domain/network/LogResponseBuilder";

export class FollowerState extends NodeAlgorithmState {
  name = "follower" as const;

  onEnterInState(): void {
    super.onEnterInState();
    this.startTimer(
      2_000 + ~~(Math.random() * 2000),
      "No leader ack timeout"
    ).then(() => {
      this.changeState("candidate");
    });
  }

  onBroadcastRequest(request: BroadcastRequest): void {
    if (this.nodeMemoryState.leader != undefined) {
      this.sendNetworkRequest(
        BroadcastRequestBuilder.aBroadcastRequest()
          .withReceiverNodeId(this.nodeMemoryState.leader)
          .withLog(request.log)
          .build()
      );
    }
  }

  protected onLogRequest(request: LogRequest): void {
    super.onLogRequest(request);
    if (request.term >= this.nodeMemoryState.term) {
      this.nodeMemoryState.leader = request.leaderId;
      // TODO cancel election timer
      // TODO check if this timer is started properly
    }
    const logOk =
      this.nodeMemoryState.log.length >= request.logLength &&
      (request.logLength == 0 ||
        request.logTerm ==
          this.nodeMemoryState.log[this.nodeMemoryState.log.length - 1].term);

    if (request.term == this.nodeMemoryState.term && logOk) {
      this.appendEntries(
        request.logLength,
        request.leaderCommit,
        request.entries
      );
      const ack = request.logLength + request.entries.length;
      this.sendNetworkRequest(
        LogResponseBuilder.aLogResponse()
          .withSenderNodeId(this.nodeId)
          .withReceiverNodeId(request.senderNodeId)
          .withFollower(this.nodeId)
          .withTerm(this.nodeMemoryState.term)
          .withAck(ack)
          .withSuccess(true)
          .build()
      );
    } else {
      this.sendNetworkRequest(
        LogResponseBuilder.aLogResponse()
          .withSenderNodeId(this.nodeId)
          .withReceiverNodeId(request.senderNodeId)
          .withFollower(this.nodeId)
          .withTerm(this.nodeMemoryState.term)
          .withAck(0)
          .withSuccess(false)
          .build()
      );
    }
  }

  private appendEntries(
    logLength: number,
    leaderCommit: number,
    entries: LogEntry[]
  ) {
    if (entries.length > 0 && this.nodeMemoryState.log.length > logLength) {
      if (this.nodeMemoryState.log[logLength].term != entries[0].term) {
        this.nodeMemoryState.log = this.nodeMemoryState.log.slice(
          0,
          logLength - 1
        );
      }
    }
    if (logLength + entries.length > this.nodeMemoryState.log.length) {
      for (
        let i = this.nodeMemoryState.log.length - logLength;
        i < entries.length;
        i++
      ) {
        this.nodeMemoryState.log.push(entries[i]);
      }
    }
    if (leaderCommit > this.nodeMemoryState.commitLength) {
      // In a real app, once the log is accepted, it can be handled
      // whatever this means (persistent storage, broadcast to other systems...)
      // here we don't really care: it's enough that the event is added to the log
      this.nodeMemoryState.commitLength = leaderCommit;
    }
  }
}
