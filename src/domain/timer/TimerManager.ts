import { EventBus } from "@/domain/event/EventBus";
import { TimerEventBuilder } from "@/domain/event/TimerEventBuilder";

interface Timer {
  starterNodeId: string;
}

// TODO DAU : Check if the non await of subscribers can cause an issue
export class TimerManager {
  constructor(private readonly eventBus: EventBus) {}

  private readonly runningTimers: Map<number, Timer> = new Map();

  startTimer(duration: number, starterNodeId: string, label: string): number {
    const timerId = setTimeout(() => {
      this.runningTimers.delete(timerId);
      this.eventBus.emitEvent(
        TimerEventBuilder.aTimerEvent()
          .startedByNodeId(starterNodeId)
          .withTimerId(timerId)
          .withLabel(label)
          .withStatus("ended")
          .build()
      );
    }, duration);
    this.runningTimers.set(timerId, {
      starterNodeId: starterNodeId,
    });

    this.eventBus.emitEvent(
      TimerEventBuilder.aTimerEvent()
        .startedByNodeId(starterNodeId)
        .withTimerId(timerId)
        .withLabel(label)
        .withStatus("started")
        .build()
    );
    return timerId;
  }

  cancelTimer(timerId: number): void {
    clearTimeout(timerId);
    this.runningTimers.delete(timerId);
  }
}
