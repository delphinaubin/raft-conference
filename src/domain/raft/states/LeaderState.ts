import { NodeAlgorithmState } from "@/domain/raft/states/NodeAlgorithmState";
import { BroadcastRequest, LogResponse } from "@/domain/network/NetworkRequest";
import { LogRequestBuilder } from "@/domain/network/LogRequestBuilder";

export class LeaderState extends NodeAlgorithmState {
  name = "leader" as const;

  private readonly replicateLogTimeout = 1_000;

  async onEnterInState(): Promise<void> {
    await super.onEnterInState();
    // TODO DAU : voir comment afficher le memory dans l'IHM
    // TODO Cancel election timer
    // For this we would need at minimum to store the timer ID and purpose when we start a timer
    //this.timerManager.cancelTimer()

    this.nodeMemoryState.leader = this.nodeId;
    this.allNodesIds.forEach((follower) => {
      this.nodeMemoryState.sentLength[follower] =
        this.nodeMemoryState.log.length;
      this.nodeMemoryState.ackedLength[follower] = 0;
    });
    await this.startTimer(this.replicateLogTimeout);
    await this.onReplicateLogTimeout();
  }

  private async onReplicateLogTimeout(): Promise<void> {
    await Promise.all(
      this.allNodesIds
        .filter((node) => node != this.nodeId)
        .map((follower) => this.replicateLog(follower))
    );

    this.startTimer(this.replicateLogTimeout).then(() => {
      this.onReplicateLogTimeout();
    });
  }

  private async replicateLog(follower: string): Promise<void> {
    const i = this.nodeMemoryState.sentLength[follower];
    const entries = this.nodeMemoryState.log.slice(i);
    let prevLogTerm = 0;
    if (i > 0) {
      prevLogTerm = this.nodeMemoryState.log[i - 1].term;
    }
    await this.sendNetworkRequest(
      LogRequestBuilder.aLogRequest()
        .withSenderNodeId(this.nodeId)
        .withReceiverNodeId(follower)
        .withLeaderId(this.nodeId)
        .withTerm(this.nodeMemoryState.term)
        .withLogLength(i)
        .withLogTerm(prevLogTerm)
        .withLeaderCommit(this.nodeMemoryState.commitLength)
        .withLogEntries(entries)
        .build()
    );
  }

  protected async onLogResponse(response: LogResponse): Promise<void> {
    if (response.term == this.nodeMemoryState.term) {
      if (
        response.success &&
        response.ack >= this.nodeMemoryState.ackedLength[response.follower]
      ) {
        this.nodeMemoryState.sentLength[response.follower] = response.ack;
        this.nodeMemoryState.ackedLength[response.follower] = response.ack;
        this.commitLogEntries();
      } else if (this.nodeMemoryState.sentLength[response.follower] > 0) {
        this.nodeMemoryState.sentLength[response.follower] =
          this.nodeMemoryState.sentLength[response.follower] - 1;
      }
    } else if (response.term > this.nodeMemoryState.term) {
      this.nodeMemoryState.term = response.term;
      this.nodeMemoryState.votedFor = undefined;
      await this.changeState("follower");
    }
  }

  async onBroadcastRequest(request: BroadcastRequest): Promise<void> {
    this.appendRecordToLog(request);
  }

  private commitLogEntries() {
    const acks = (length: number) =>
      this.allNodesIds.filter(
        (node) => this.nodeMemoryState.ackedLength[node] >= length
      ).length;
    const minAcks = Math.ceil((this.allNodesIds.length + 1) / 2);
    const ready = [...Array(this.nodeMemoryState.log.length)]
      .map((i) => i + 1)
      .filter((i) => acks(i) > minAcks);
    if (
      ready.length != 0 &&
      Math.max(...ready) > this.nodeMemoryState.commitLength &&
      this.nodeMemoryState.log[Math.max(...ready) - 1].term ==
        this.nodeMemoryState.term
    ) {
      // Deliver log to the application
      this.nodeMemoryState.commitLength = Math.max(...ready);
    }
  }
}
