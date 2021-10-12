import { RaftNodeState } from "@/domain/RaftNode";

export interface ChangeStateEvent {
  type: "change-state";
  toState: RaftNodeState;
  nodeId: string;
  isAsyncEvent: false;
}

export class ChangeStateEventBuilder {
  static aChangeStateEvent(): ChangeStateEventBuilder {
    return new ChangeStateEventBuilder();
  }

  private stateToGoTo?: RaftNodeState;
  private nodeId?: string;

  forNodeId(nodeId: string): this {
    this.nodeId = nodeId;
    return this;
  }

  toState(toState: RaftNodeState): this {
    this.stateToGoTo = toState;
    return this;
  }

  build(): ChangeStateEvent {
    if (!this.stateToGoTo) {
      throw new Error(
        "Cannot build a change-state event without toState attribute"
      );
    }
    if (!this.nodeId) {
      throw new Error(
        "Cannot build a change-state event without nodeId attribute"
      );
    }
    return {
      type: "change-state",
      nodeId: this.nodeId,
      toState: this.stateToGoTo,
      isAsyncEvent: false,
    };
  }
}
