import { RaftNodeState } from "@/domain/RaftNode";
import { AbstractNodeAlgorithmState } from "@/domain/raft/states/AbstractNodeAlgorithmState";
import { EventBus } from "@/domain/event/EventBus";
import { LogEntry } from "@/domain/log/LogEntry";

type NodeAlgorithmStates = Record<RaftNodeState, AbstractNodeAlgorithmState>;

export interface NodeMemoryState {
  term: number;
  votedFor?: string;
  votesReceived: Set<string>;
  leader?: string;
  sentLength: { [nodeId: string]: number };
  ackedLength: { [nodeId: string]: number };
  commitLength: number;
  log: LogEntry[];
}

export abstract class AbstractNodeAlgorithm {
  protected currentState!: AbstractNodeAlgorithmState;
  constructor(
    protected readonly allStates: NodeAlgorithmStates,
    private readonly eventBus: EventBus,
    public readonly id: string,
    protected readonly nodeMemoryState: NodeMemoryState,
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
