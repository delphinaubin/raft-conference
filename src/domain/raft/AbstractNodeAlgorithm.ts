import { RaftNodeState } from "@/domain/RaftNode";
import { NodeAlgorithmState } from "@/domain/raft/states/NodeAlgorithmState";
import { EventBus } from "@/domain/event/EventBus";

type NodeAlgorithmStates = Record<RaftNodeState, NodeAlgorithmState>;

export abstract class AbstractNodeAlgorithm {
  protected currentState!: NodeAlgorithmState;
  constructor(
    protected readonly allStates: NodeAlgorithmStates,
    private readonly eventBus: EventBus,
    public readonly id: string
  ) {
    eventBus.subscribe(async (event) => {
      switch (event.type) {
        case "change-state": {
          if (event.nodeId === this.id) {
            await this.goToState(event.toState);
          }
          break;
        }
        case "network": {
          if (event.networkRequest.toNodeId === this.id) {
            await this.currentState.onReceiveNetworkRequest(
              event.networkRequest.payload
            );
          }
          break;
        }
      }
    });
  }

  abstract getInitialState(): RaftNodeState;

  async goToState(newState: RaftNodeState): Promise<void> {
    this.currentState = this.allStates[newState];
    await this.currentState.onEnterInState();
  }
}
