import { RaftNodeState } from "@/domain/RaftNode";
import { EventBus } from "@/domain/event/EventBus";
import { ChangeStateEventBuilder } from "@/domain/event/ChangeStateEventBuilder";
import { TimerManager } from "@/domain/timer/TimerManager";
import {
  BroadcastRequest,
  LogRequest,
  LogResponse,
  NetworkRequest,
  NodeToNodeRequest,
  VoteRequest,
  VoteResponse,
} from "@/domain/network/NetworkRequest";
import { NodeToNodeNetworkManager } from "@/domain/network/NodeToNodeNetworkManager";
import { cloneDeep } from "lodash";
import { LogEntry } from "@/domain/log/LogEntry";
import { LogResponseBuilder } from "@/domain/network/LogResponseBuilder";
import { VoteResponseBuilder } from "@/domain/network/VoteResponseBuilder";
import { LogRequestBuilder } from "@/domain/network/LogRequestBuilder";
import { VoteRequestBuilder } from "@/domain/network/VoteRequestBuilder";
import { RelayBroadcastRequestBuilder } from "@/domain/network/RelayBroadcastRequestBuilder";
import { NodeMemoryState } from "@/domain/memory-state/NodeMemoryStateManager";

type NetworkBuilder =
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

  protected sendNetworkRequest(request: NodeToNodeRequest): void {
    this.networkManager.sendRequest(request);
  }

  protected sendNetworkRequestToAllOtherNodes(
    networkRequestBuilder: NetworkBuilder
  ): void {
    this.allNodesIds
      .filter((otherNodeId) => otherNodeId != this.nodeId)
      .forEach((otherNodeId) => {
        const message = cloneDeep(networkRequestBuilder)
          .withSenderNodeId(this.nodeId)
          .withReceiverNodeId(otherNodeId)
          .build();
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
    duration: number,
    label: string
  ): Promise<void> {
    const randomDuration = parseInt(this.nodeId) * 10_000;
    return this.startTimer(randomDuration, label);
  }

  protected replaceMyLogsWith(entries: LogEntry[]): void {
    this.nodeMemoryState.log = entries;
  }

  protected appendNewLog(log: number): void {
    this.nodeMemoryState.log.push({ value: log, term: 0 });
  }
}
