import { RaftNodeState } from "@/domain/RaftNode";
import { NodeAlgorithmState } from "@/domain/raft/states/NodeAlgorithmState";
import { EventBus } from "@/domain/event/EventBus";

type NodeAlgorithmStates = Record<RaftNodeState, NodeAlgorithmState>;

export interface NodeMemoryState {
  term: number;
  votedFor?: string;
  votesReceived: string[];
}

export abstract class AbstractNodeAlgorithm {
  protected currentState!: NodeAlgorithmState;
  constructor(
    protected readonly allStates: NodeAlgorithmStates,
    private readonly eventBus: EventBus,
    public readonly id: string,
    protected readonly nodeMemoryState: NodeMemoryState,
    private readonly allNodesIds: string[]
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
          if (event.networkRequest.receiverNodeId === this.id) {
            await this.currentState.onReceiveNetworkRequest(
              event.networkRequest
            );
          }
          break;
        }
      }
    });
  }

  abstract getInitialState(): RaftNodeState;

  async goToState(newState: RaftNodeState): Promise<void> {
    this.currentState && (await this.currentState.onLeaveState());
    this.currentState = this.allStates[newState];
    await this.currentState.onEnterInState();
  }
}
