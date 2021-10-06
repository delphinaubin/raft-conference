import { RaftNodeState } from "@/domain/RaftNode";
import { EventBus } from "@/domain/event/EventBus";
import { ChangeStateEventBuilder } from "@/domain/event/ChangeStateEventBuilder";
import { TimerManager } from "@/domain/timer/TimerManager";
import { NodeMemoryState } from "@/domain/raft/AbstractNodeAlgorithm";
import {
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
  }

  async onReceiveNetworkRequest(_request: NetworkRequest): Promise<void> {
    if (_request.type == "vote-request") {
      await this.onVoteRequest(_request);
    } else if (_request.type == "vote-response") {
      await this.onVoteResponse(_request);
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
        const promise = this.sendNetworkRequest(
          VoteResponseBuilder.aVoteResponse()
            .withSenderNodeId(this.nodeId)
            .withReceiverNodeId(request.senderNodeId)
            .withTerm(this.nodeMemoryState.term)
            .withGranted(true)
            .build()
        );

        await promise;
        if (this.name != "candidate") {
          await this.changeState("candidate");
        }
      } else {
        const promise = this.sendNetworkRequest(
          VoteResponseBuilder.aVoteResponse()
            .withSenderNodeId(this.nodeId)
            .withReceiverNodeId(request.senderNodeId)
            .withTerm(this.nodeMemoryState.term)
            .withGranted(false)
            .build()
        );
        await promise;
      }
    }
  }

  protected async onVoteResponse(response: VoteResponse): Promise<void> {
    if (response.term > this.nodeMemoryState.term) {
      this.nodeMemoryState.term = response.term;
      this.nodeMemoryState.votedFor = undefined;
      await this.changeState("candidate");
    }
  }

  protected quorumReached(numberOfAcks: number): boolean {
    return numberOfAcks >= Math.ceil(this.allNodesIds.length + 1) / 2;
  }
}
