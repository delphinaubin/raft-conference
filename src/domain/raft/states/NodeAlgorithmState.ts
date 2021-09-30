import { RaftNodeState } from "@/domain/RaftNode";
import { EventBus } from "@/domain/event/EventBus";
import { ChangeStateEventBuilder } from "@/domain/event/ChangeStateEventBuilder";

export abstract class NodeAlgorithmState {
  constructor(
    private readonly eventBus: EventBus,
    protected readonly nodeId: string
  ) {}

  abstract name: RaftNodeState;

  onEnterInState(): Promise<void> {
    return Promise.resolve(undefined);
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
}
