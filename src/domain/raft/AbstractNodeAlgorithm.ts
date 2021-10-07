import { RaftNodeState } from "@/domain/RaftNode";
import { NodeAlgorithmState } from "@/domain/raft/states/NodeAlgorithmState";
import { EventBus } from "@/domain/event/EventBus";
import { LogEntry } from "@/domain/log/LogEntry";

type NodeAlgorithmStates = Record<RaftNodeState, NodeAlgorithmState>;

export interface NodeMemoryState {
  term: number;
  votedFor?: string;
  votesReceived: string[];
  leader?: string;
  sentLength: { [nodeId: string]: number };
  ackedLength: { [nodeId: string]: number };
  commitLength: number;
  log: LogEntry[];
}

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
    allNodesIds.forEach((node) => {
      nodeMemoryState.sentLength[node] = 0;
      nodeMemoryState.ackedLength[node] = 0;
    });

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
