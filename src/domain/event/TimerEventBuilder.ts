export type TimerStatus = "started" | "ended" | "canceled";

export interface TimerEvent {
  type: "timer";
  timerId: number;
  status: TimerStatus;
  starterNodeId: string;
}

export class TimerEventBuilder {
  private timerId?: number;
  private status?: TimerStatus;
  private starterNodeId?: string;

  static aTimerEvent(): TimerEventBuilder {
    return new TimerEventBuilder();
  }

  withTimerId(timerId: number): this {
    this.timerId = timerId;
    return this;
  }

  withStatus(status: TimerStatus): this {
    this.status = status;
    return this;
  }

  startedByNodeId(starterNodeId: string): this {
    this.starterNodeId = starterNodeId;
    return this;
  }

  build(): TimerEvent {
    if (!this.timerId) {
      throw new Error("Cannot build a timer event without timerId");
    }

    if (!this.status) {
      throw new Error("Cannot build a timer event without status");
    }

    if (!this.starterNodeId) {
      throw new Error("Cannot build a timer event without startedNodeId");
    }

    return {
      type: "timer",
      timerId: this.timerId,
      status: this.status,
      starterNodeId: this.starterNodeId,
    };
  }
}
