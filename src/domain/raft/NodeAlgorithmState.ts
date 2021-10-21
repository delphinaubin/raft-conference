import { AbstractNodeAlgorithmState } from "@/domain/raft/states/AbstractNodeAlgorithmState";

export abstract class NodeAlgorithmState extends AbstractNodeAlgorithmState {
  helloWorld(): void {
    // Do nothing
  }
}
