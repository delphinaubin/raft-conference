import { RaftNodeState } from "@/domain/framework/RaftNode";
import { EventBus } from "@/domain/framework/event/EventBus";
import { ChangeStateEventBuilder } from "@/domain/framework/event/ChangeStateEventBuilder";
import { TimerManager } from "@/domain/framework/timer/TimerManager";
import {
  BroadcastRequest,
  LogRequest,
  LogResponse,
  NetworkRequest,
  VoteRequest,
  VoteResponse,
} from "@/domain/framework/network/NetworkRequest";
import { NodeToNodeNetworkManager } from "@/domain/framework/network/NodeToNodeNetworkManager";
import { cloneDeep } from "lodash";
import { LogEntry } from "@/domain/framework/log/LogEntry";
import { LogResponseBuilder } from "@/domain/framework/network/LogResponseBuilder";
import { VoteResponseBuilder } from "@/domain/framework/network/VoteResponseBuilder";
import { LogRequestBuilder } from "@/domain/framework/network/LogRequestBuilder";
import { VoteRequestBuilder } from "@/domain/framework/network/VoteRequestBuilder";
import { RelayBroadcastRequestBuilder } from "@/domain/framework/network/RelayBroadcastRequestBuilder";
import { NodeMemoryState } from "@/domain/framework/memory-state/NodeMemoryStateManager";

type ConcreteNodeToNodeNetworkRequestBuilder =
  | LogResponseBuilder
  | VoteResponseBuilder
  | LogRequestBuilder
  | VoteRequestBuilder
  | RelayBroadcastRequestBuilder;

export abstract class AbstractNodeAlgorithmState {
  constructor(
    private readonly eventBus: EventBus,
    protected readonly timerManager: TimerManager,
    protected readonly nodeId: string,
    protected readonly nodeMemoryState: NodeMemoryState,
    protected readonly allNodesIds: string[],
    protected readonly networkManager: NodeToNodeNetworkManager
  ) {}

  protected readonly runningTimers: Map<number, () => void> = new Map();
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

  onReceiveNetworkRequest(request: NetworkRequest): void {
    if (request.type == "vote-request") {
      this.onVoteRequest(request);
    } else if (request.type == "vote-response") {
      this.onVoteResponse(request);
    } else if (request.type == "log-request") {
      this.onLogRequest(request);
    } else if (request.type == "log-response") {
      this.onLogResponse(request);
    } else if (request.type == "broadcast-request") {
      this.onBroadcastRequest(request);
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

  protected onBroadcastRequest(request: BroadcastRequest): void {
    // DO NOTHING
  }

  protected onVoteRequest(request: VoteRequest): void {
    // DO NOTHING
  }

  protected onVoteResponse(response: VoteResponse): void {
    // DO NOTHING
  }

  protected onLogRequest(request: LogRequest): void {
    // DO NOTHING
  }

  protected onLogResponse(response: LogResponse): void {
    // DO NOTHING
  }

  protected sendNetworkRequest(
    requestBuilder: ConcreteNodeToNodeNetworkRequestBuilder
  ): void {
    this.networkManager.sendRequest(
      requestBuilder.withSenderNodeId(this.nodeId).build()
    );
  }

  protected sendNetworkRequestToAllOtherNodes(
    networkRequestBuilder: ConcreteNodeToNodeNetworkRequestBuilder
  ): void {
    this.allNodesIds
      .filter((otherNodeId) => otherNodeId != this.nodeId)
      .forEach((otherNodeId) => {
        const message = cloneDeep(networkRequestBuilder).withReceiverNodeId(
          otherNodeId
        );
        this.sendNetworkRequest(message);
      });
  }

  protected startTimer(duration: number, label: string): Promise<void> {
    const timerId = this.timerManager.startTimer(duration, this.nodeId, label);
    return new Promise<void>((resolve) => {
      this.runningTimers.set(timerId, resolve);
    });
  }

  protected startTimerWithRandomDuration(
    label: string,
    minimumTime = 3_000
  ): Promise<void> {
    const randomDuration = minimumTime + parseInt(this.nodeId) * 4_000;
    return this.startTimer(randomDuration, label);
  }

  protected replaceMyLogWith(entries: LogEntry[]): void {
    this.nodeMemoryState.log = entries;
  }

  protected appendNewLog(log: number): void {
    this.nodeMemoryState.log = [
      ...this.nodeMemoryState.log,
      { value: log, term: 0 },
    ];
  }
}
