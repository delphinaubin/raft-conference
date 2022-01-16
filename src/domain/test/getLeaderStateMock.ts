import { LeaderState } from "@/domain/conf-land/states/LeaderState";
import {
  getStateDependenciesMock,
  StateDependenciesMock,
} from "@/domain/test/getStateDependenciesMock";

export function getLeaderStateMock(
  nodeId: string,
  allNodeIds: string[]
): {
  leaderState: LeaderState;
  dependencies: StateDependenciesMock;
} {
  const dependencies = getStateDependenciesMock();
  return {
    leaderState: new LeaderState(
      dependencies.eventBus,
      dependencies.timerManager,
      nodeId,
      dependencies.nodeMemoryState,
      allNodeIds,
      dependencies.networkManager
    ),
    dependencies,
  };
}
