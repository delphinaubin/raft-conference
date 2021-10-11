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

  abstract onBroadcastRequest(request: BroadcastRequest): void;

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

  // TODO return the timerID
  // The timerID can be used by state algorithm to cancel running timer
  // (for instance if a node is elected leader, it cancels it's election timer
  protected startTimer(duration: number, label: string): Promise<void> {
    const timerId = this.timerManager.startTimer(duration, this.nodeId, label);
    return new Promise<void>((resolve) => {
      this.runningTimers.set(timerId, resolve);
    });
  }

  protected sendNetworkRequest(request: NetworkRequest): void {
    this.eventBus.emitEvent(
      NetworkRequestEventBuilder.aNetworkRequestEvent()
        .withNetworkRequest(request)
        .build()
    );
  }

  onVoteRequest(request: VoteRequest): void {
    // message sent by this very node can safely be ignored
    if (request.senderNodeId != this.nodeId) {
      // In raft algorithm, an additional check is made to make sure the log of the receiver is coherent
      // before voting for the sender
      const myLogTerm = this.lastLogTerm();
      const logOk =
        request.logTerm > myLogTerm ||
        (request.logTerm == myLogTerm &&
          request.logLength >= this.nodeMemoryState.log.length);

      const termOk =
        request.term > this.nodeMemoryState.term ||
        (request.term == this.nodeMemoryState.term &&
          (this.nodeMemoryState.votedFor == request.senderNodeId ||
            this.nodeMemoryState.votedFor == null));

      // TODO DAU : refactor
      if (termOk && logOk) {
        this.nodeMemoryState.term = request.term;
        this.nodeMemoryState.votedFor = request.senderNodeId;
        // TODO DAU : check the voterId
        this.sendNetworkRequest(
          VoteResponseBuilder.aVoteResponse()
            .withSenderNodeId(this.nodeId)
            .withVoterId(this.nodeId)
            .withGranted(true)
            .withReceiverNodeId(request.senderNodeId)
            .withTerm(this.nodeMemoryState.term)
            .build()
        );
      } else {
        // TODO DAU : check the voterId
        this.sendNetworkRequest(
          VoteResponseBuilder.aVoteResponse()
            .withSenderNodeId(this.nodeId)
            .withVoterId(this.nodeId)
            .withReceiverNodeId(request.senderNodeId)
            .withTerm(this.nodeMemoryState.term)
            .withGranted(false)
            .build()
        );
      }
    }
  }

  // TODO make sure all nodes handles requests and responses
  // i.e. even candidates nodes should send back log response
  // in case of the node is with an outdated term

  protected onVoteResponse(response: VoteResponse): void {
    this.adjustTermIfNewer(response.term);
  }

  protected onLogRequest(request: LogRequest): void {
    this.adjustTermIfNewer(request.term);
  }

  protected onLogResponse(response: LogResponse): void {
    // Do nothing by default, only leader is interrested by this network event
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
}
