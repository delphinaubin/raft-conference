import { RaftNodeState } from "@/domain/RaftNode";
import { NodeAlgorithmState } from "@/domain/raft/states/NodeAlgorithmState";
import { EventBus } from "@/domain/event/EventBus";
import { NodeMemoryState } from "@/domain/memory-state/NodeMemoryStateManager";

type NodeAlgorithmStates = Record<RaftNodeState, NodeAlgorithmState>;

export abstract class AbstractNodeAlgorithm {
  protected currentState!: NodeAlgorithmState;
  constructor(
    protected readonly allStates: NodeAlgorithmStates,
    private readonly eventBus: EventBus,
    public readonly id: string,
    protected readonly nodeMemoryState: NodeMemoryState,
    // TODO this is reported as unused, but why?
    private readonly allNodesIds: string[]
  ) {
    allNodesIds.forEach((nodeId) => {
      nodeMemoryState.sentLength[nodeId] = 0;
      nodeMemoryState.ackedLength[nodeId] = 0;
    });

    eventBus.subscribe(({ event }) => {
      switch (event.type) {
        case "change-state": {
          if (event.nodeId === this.id) {
            if (event.toState !== this.currentState?.name) {
              this.goToState(event.toState);
            }
          }
          break;
        }
        case "network": {
          if (event.networkRequest.receiverNodeId === this.id) {
            this.currentState.onReceiveNetworkRequest(event.networkRequest);
          }
          break;
        }
      }
    });
  }

  abstract getInitialState(): RaftNodeState;

  goToState(newState: RaftNodeState): void {
    this.currentState && this.currentState.onLeaveState();
    this.currentState = this.allStates[newState];
    this.currentState.onEnterInState();
  }
}
