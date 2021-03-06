import { NetworkEvent } from "@/domain/framework/event/NetworkEventBuilder";
import { ChangeStateEvent } from "@/domain/framework/event/ChangeStateEventBuilder";
import { TimerEvent } from "@/domain/framework/event/TimerEventBuilder";

export type RaftEvent = NetworkEvent | ChangeStateEvent | TimerEvent; // TODO DAU : add the | all new event types
type Subscriber = (payload: {
  eventId: number;
  event: RaftEvent;
}) => Promise<void> | void;

function* subscriberIdGenerator(): Generator<number> {
  let i = 0;
  while (true) {
    yield i++;
  }
}

export class EventBus {
  private readonly idGenerator = subscriberIdGenerator();
  private readonly subscribers: Map<number, Subscriber> = new Map();
  private eventEmissionNumber = 0;
  private isRunning = true;

  emitEvent(event: RaftEvent): void {
    if (!this.isRunning) {
      return;
    }
    if (
      (window as unknown as { isDebugModeActivated: boolean })
        .isDebugModeActivated
    ) {
      // eslint-disable-next-line no-debugger
      debugger;
    }
    const idToEmit = this.eventEmissionNumber++;
    Array.from(this.subscribers.values()).forEach((subscriber) => {
      if (event.isAsyncEvent) {
        setTimeout(() => subscriber({ eventId: idToEmit, event }), 0);
      } else {
        subscriber({ eventId: idToEmit, event });
      }
    });
  }

  subscribe(subscriber: Subscriber): number {
    const subscriberId = this.idGenerator.next().value;
    this.subscribers.set(subscriberId, subscriber);
    return subscriberId;
  }

  unSubscribe(subscriberId: number): void {
    this.subscribers.delete(subscriberId);
  }

  stop(): void {
    this.isRunning = false;
  }
}
