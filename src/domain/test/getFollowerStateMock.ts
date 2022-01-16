import { FollowerState } from "@/domain/conf-land/states/FollowerState";
import {
  getStateDependenciesMock,
  StateDependenciesMock,
} from "@/domain/test/getStateDependenciesMock";

export function getFollowerStateMock(
  nodeId: string,
  allNodeIds: string[]
): {
  followerState: FollowerState;
  dependencies: StateDependenciesMock;
} {
  const dependencies = getStateDependenciesMock();
  return {
    followerState: new FollowerState(
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
