import { RaftNodeState } from "@/domain/RaftNode";
import { EventBus } from "@/domain/event/EventBus";
import { ChangeStateEventBuilder } from "@/domain/event/ChangeStateEventBuilder";
import { TimerManager } from "@/domain/timer/TimerManager";
import { NodeMemoryState } from "@/domain/raft/AbstractNodeAlgorithm";
import {
  BroadcastRequest,
  LogRequest,
  LogResponse,
  NetworkRequest,
  VoteRequest,
  VoteResponse,
} from "@/domain/network/NetworkRequest";
import { NetworkRequestEventBuilder } from "@/domain/event/NetworkEventBuilder";
import { VoteResponseBuilder } from "@/domain/network/VoteResponseBuilder";
import { LogEntry } from "@/domain/log/LogEntry";

export abstract class NodeAlgorithmState {
  constructor(
    private readonly eventBus: EventBus,
    protected readonly timerManager: TimerManager,
    protected readonly nodeId: string,
    protected readonly nodeMemoryState: NodeMemoryState,
    protected readonly allNodesIds: string[]
  ) {}

  private readonly runningTimers: Map<number, () => void> = new Map();
  private eventBusSubscriberId?: number;

  abstract name: RaftNodeState;

  onEnterInState(): void {
    this.eventBusSubscriberId = this.eventBus.subscribe(({ event }) => {
      if (
        event.type === "timer" &&
        event.status === "ended" &&
        event.starterNodeId === this.nodeId
      ) {
        const resolveTimerPromiseCallback = this.runningTimers.get(
          event.timerId
        );
        if (resolveTimerPromiseCallback) {
          resolveTimerPromiseCallback();
        }
      }
    });
  }

  onLeaveState(): void {
    if (this.eventBusSubscriberId) {
      this.eventBus.unSubscribe(this.eventBusSubscriberId);
    }

    this.cancelTimers();

    this.runningTimers.clear();
  }

  protected cancelTimers(): void {
    Array.from(this.runningTimers.keys()).forEach((timerId) =>
      this.timerManager.cancelTimer(timerId)
    );
  }

  onReceiveNetworkRequest(_request: NetworkRequest): void {
    if (_request.type == "vote-request") {
      this.onVoteRequest(_request);
    } else if (_request.type == "vote-response") {
      this.onVoteResponse(_request);
    } else if (_request.type == "log-request") {
      this.onLogRequest(_request);
    } else if (_request.type == "log-response") {
      this.onLogResponse(_request);
    } else if (_request.type == "broadcast-request") {
      this.onBroadcastRequest(_request);
    }
  }

  protected changeState(newState: RaftNodeState): void {
    this.eventBus.emitEvent(
      ChangeStateEventBuilder.aChangeStateEvent()
        .forNodeId(this.nodeId)
        .toState(newState)
        .build()
    );
  }

  protected startTimer(duration: number, label: string): Promise<void> {
    const timerId = this.timerManager.startTimer(duration, this.nodeId, label);
    return new Promise<void>((resolve) => {
      this.runningTimers.set(timerId, resolve);
    });
  }

  // TODO do not cheat
  protected startTimerWithRandomDuration(
    duration: number,
    label: string
  ): Promise<void> {
    // const randomDuration = duration + ~~(Math.random() * randomizer);
    const test = parseInt(this.nodeId) * 10_000;
    return this.startTimer(test, label);
  }

  protected sendNetworkRequest(request: NetworkRequest): void {
    this.eventBus.emitEvent(
      NetworkRequestEventBuilder.aNetworkRequestEvent()
        .withNetworkRequest(request)
        .build()
    );
  }

  protected onBroadcastRequest(request: BroadcastRequest): void {
    // DO NOTHING
  }

  protected onVoteRequest(request: VoteRequest): void {
    // do nothing
  }

  protected onVoteResponse(response: VoteResponse): void {
    // do nothing
  }

  protected onLogRequest(request: LogRequest): void {
    // do nothing
  }

  protected onLogResponse(response: LogResponse): void {
    // do nothing
  }

  protected quorumReached(numberOfAcks: number): boolean {
    return numberOfAcks >= Math.ceil(this.allNodesIds.length + 1) / 2;
  }

  protected appendRecordToLog(request: BroadcastRequest): void {
    this.nodeMemoryState.log.push({
      term: this.nodeMemoryState.term,
      value: request.log,
    });
    this.nodeMemoryState.ackedLength[this.nodeId] =
      this.nodeMemoryState.log.length;
  }

  private adjustTermIfNewer(term: number): void {
    if (term > this.nodeMemoryState.term) {
      this.nodeMemoryState.term = term;
      this.nodeMemoryState.votedFor = undefined;
      this.changeState("follower");
    }
  }

  electionTimerDuration = 10_000;
  protected startElectionTimer(withRandomModifier: boolean): void {
    const modifier = withRandomModifier ? ~~(Math.random() * 50_000) : 0;
    this.startTimer(
      this.electionTimerDuration + modifier,
      "No leader ack timeout"
    ).then(() => {
      this.changeState("candidate");
    });
  }

  protected lastLogTerm(): number {
    if (this.nodeMemoryState.log.length > 0) {
      return this.nodeMemoryState.log[this.nodeMemoryState.log.length - 1].term;
    } else {
      return 0;
    }
  }

  protected addLog(log: number): void {
    this.nodeMemoryState.log.push({
      term: 0,
      value: log,
    });
  }

  protected setLogs(entries: LogEntry[]): void {
    this.nodeMemoryState.log = entries;
  }

  protected getLogEntries(): LogEntry[] {
    return this.nodeMemoryState.log;
  }

  protected printLogs(): void {
    console.log(`node ${this.nodeId} logs:`);
    this.nodeMemoryState.log.forEach((l) => console.log(l.value));
  }
}
