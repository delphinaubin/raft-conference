import { RaftNodeState } from "@/domain/RaftNode";
import { NodeAlgorithmState } from "@/domain/raft/states/NodeAlgorithmState";

type NodeAlgorithmStates = Record<RaftNodeState, NodeAlgorithmState>;

interface AbstractNodeAlgorithmEventHandler {
  beforeStateChange(
    oldState: RaftNodeState | undefined,
    newState: RaftNodeState
  ): Promise<void>;

  afterStateChange(
    oldState: RaftNodeState,
    newState: RaftNodeState
  ): Promise<void>;
}

export abstract class AbstractNodeAlgorithm {
  protected state!: NodeAlgorithmState;
  constructor(
    protected readonly allStates: NodeAlgorithmStates,
    private readonly eventHandler: AbstractNodeAlgorithmEventHandler
  ) {
    this.goToState(this.getInitialState());
  }

  abstract getInitialState(): RaftNodeState;

  async goToState(newState: RaftNodeState): Promise<void> {
    const oldState = this.state?.name;
    await this.eventHandler.beforeStateChange(oldState, newState);
    this.state = this.allStates[newState];
    this.state.onChangeState((newState) => {
      this.goToState(newState);
    });
    await this.state.onEnterInState();
    this.eventHandler.afterStateChange(oldState, newState);
  }
}
