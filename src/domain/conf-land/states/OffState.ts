import { AbstractNodeAlgorithmState } from "@/domain/framework/raft/states/AbstractNodeAlgorithmState";

export class OffState extends AbstractNodeAlgorithmState {
  name = "off" as const;
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onEnterInState(): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onLeaveState(): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onReceiveNetworkRequest(): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onVoteRequest(): void {}

  onBroadcastRequest(): Promise<void> {
    return Promise.resolve(undefined);
  }
}
