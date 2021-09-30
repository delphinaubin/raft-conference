import { RaftNodeState } from "@/domain/RaftNode";
import { EventBus } from "@/domain/event/EventBus";
import { ChangeStateEventBuilder } from "@/domain/event/ChangeStateEventBuilder";
import { TimerManager } from "@/domain/timer/TimerManager";

export abstract class NodeAlgorithmState {
  constructor(
    private readonly eventBus: EventBus,
    protected readonly timerManager: TimerManager,
    protected readonly nodeId: string
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

  onReceiveNetworkRequest(_payload: unknown): Promise<void> {
    return Promise.resolve(undefined);
  }

  protected async changeState(newState: RaftNodeState): Promise<void> {
    await this.eventBus.emitEvent(
      ChangeStateEventBuilder.aChangeStateEvent()
        .forNodeId(this.nodeId)
        .toState(newState)
        .build()
    );
  }

  protected async startTimer(duration: number): Promise<void> {
    const timerId = this.timerManager.startTimer(duration, this.nodeId);
    return new Promise<void>((resolve) => {
      this.runningTimers.set(timerId, resolve);
    });
  }
}
