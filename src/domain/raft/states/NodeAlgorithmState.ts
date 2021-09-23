import { RaftNodeState } from "@/domain/RaftNode";

export abstract class NodeAlgorithmState {
  private changeStateCallBack?: (newState: RaftNodeState) => void;

  abstract name: RaftNodeState;

  onEnterInState(): Promise<void> {
    return Promise.resolve(undefined);
  }

  onChangeState(changeStateCallBack: (newState: RaftNodeState) => void): void {
    this.changeStateCallBack = changeStateCallBack;
  }

  protected changeState(newState: RaftNodeState): void {
    this.changeStateCallBack && this.changeStateCallBack(newState);
  }
}
