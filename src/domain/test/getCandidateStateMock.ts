import { CandidateState } from "@/domain/conf-land/states/CandidateState";
import {
  getStateDependenciesMock,
  StateDependenciesMock,
} from "@/domain/test/getStateDependenciesMock";

export function getCandidateStateMock(
  nodeId: string,
  allNodeIds: string[]
): { candidateState: CandidateState; dependencies: StateDependenciesMock } {
  const dependencies = getStateDependenciesMock();
  return {
    candidateState: new CandidateState(
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
