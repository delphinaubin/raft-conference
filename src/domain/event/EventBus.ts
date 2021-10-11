import { NetworkEvent } from "@/domain/event/NetworkEventBuilder";
import { ChangeStateEvent } from "@/domain/event/ChangeStateEventBuilder";
import { TimerEvent } from "@/domain/event/TimerEventBuilder";

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
  // private lastEmitPromise: Promise<void> = Promise.resolve();

  private eventEmissionNumber = 0;

  emitEvent(event: RaftEvent): void {
    const idToEmit = this.eventEmissionNumber++;
    Array.from(this.subscribers.values()).forEach((subscriber) =>
      setTimeout(() => subscriber({ eventId: idToEmit, event }), 0)
    );

    // const currentPromise = Array.from(this.subscribers.values()).reduce(
    //   async (lastPromise, currentSubscriber) => {
    //     await lastPromise;
    //     await currentSubscriber(event);
    //   },
    //   this.lastEmitPromise
    // );
    // this.lastEmitPromise = currentPromise;
  }

  subscribe(subscriber: Subscriber): number {
    const subscriberId = this.idGenerator.next().value;
    this.subscribers.set(subscriberId, subscriber);
    return subscriberId;
  }

  unSubscribe(subscriberId: number): void {
    this.subscribers.delete(subscriberId);
  }
}
