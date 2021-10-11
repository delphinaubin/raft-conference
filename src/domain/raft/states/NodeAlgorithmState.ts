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

  abstract onBroadcastRequest(request: BroadcastRequest): Promise<void>;

  async onEnterInState(): Promise<void> {
    this.eventBusSubscriberId = this.eventBus.subscribe((event) => {
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

  async onLeaveState(): Promise<void> {
    if (this.eventBusSubscriberId) {
      this.eventBus.unSubscribe(this.eventBusSubscriberId);
    }

    Array.from(this.runningTimers.keys()).forEach((timerId) =>
      this.timerManager.cancelTimer(timerId)
    );
    this.runningTimers.clear();
  }

  async onReceiveNetworkRequest(_request: NetworkRequest): Promise<void> {
    if (_request.type == "vote-request") {
      await this.onVoteRequest(_request);
    } else if (_request.type == "vote-response") {
      await this.onVoteResponse(_request);
    } else if (_request.type == "log-request") {
      await this.onLogRequest(_request);
    } else if (_request.type == "log-response") {
      await this.onLogResponse(_request);
    } else if (_request.type == "broadcast-request") {
      await this.onBroadcastRequest(_request);
    }
  }

  protected async changeState(newState: RaftNodeState): Promise<void> {
    await this.eventBus.emitEvent(
      ChangeStateEventBuilder.aChangeStateEvent()
        .forNodeId(this.nodeId)
        .toState(newState)
        .build()
    );
  }

  // TODO return the timerID
  // The timerID can be used by state algorithm to cancel running timer
  // (for instance if a node is elected leader, it cancels it's election timer
  protected async startTimer(duration: number): Promise<void> {
    const timerId = this.timerManager.startTimer(duration, this.nodeId);
    return new Promise<void>((resolve) => {
      this.runningTimers.set(timerId, resolve);
    });
  }

  protected sendNetworkRequest(request: NetworkRequest): Promise<void> {
    return this.eventBus.emitEvent(
      NetworkRequestEventBuilder.aNetworkRequestEvent()
        .withNetworkRequest(request)
        .build()
    );
  }

  async onVoteRequest(request: VoteRequest): Promise<void> {
    // message sent by this very node can safely be ignored
    if (request.senderNodeId != this.nodeId) {
      // TODO add logOk check
      // In raft algorithm, an additional check is made to make sure the log of the receiver is coherent
      // before voting for the sender
      const termOk =
        request.term > this.nodeMemoryState.term ||
        (request.term == this.nodeMemoryState.term &&
          (this.nodeMemoryState.votedFor == request.senderNodeId ||
            this.nodeMemoryState.votedFor == null));

      if (termOk) {
        this.nodeMemoryState.term = request.term;
        this.nodeMemoryState.votedFor = request.senderNodeId;
        // TODO DAU : check the voterId
        await this.sendNetworkRequest(
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
        await this.sendNetworkRequest(
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

  protected async onVoteResponse(response: VoteResponse): Promise<void> {
    await this.adjustTermIfNewer(response.term);
  }

  protected async onLogRequest(request: LogRequest): Promise<void> {
    await this.adjustTermIfNewer(request.term);
  }

  protected async onLogResponse(response: LogResponse): Promise<void> {
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

  private async adjustTermIfNewer(term: number): Promise<void> {
    if (term > this.nodeMemoryState.term) {
      this.nodeMemoryState.term = term;
      this.nodeMemoryState.votedFor = undefined;
      await this.changeState("follower");
    }
  }
}
