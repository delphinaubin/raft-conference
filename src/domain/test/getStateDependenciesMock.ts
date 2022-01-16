import { TimerManager } from "@/domain/framework/timer/TimerManager";
import {
  INITIAL_NODE_MEMORY_STATE,
  NodeMemoryState,
} from "@/domain/framework/memory-state/NodeMemoryStateManager";
import { NodeToNodeNetworkManager } from "@/domain/framework/network/NodeToNodeNetworkManager";
import { EventBus } from "@/domain/framework/event/EventBus";

export type StateDependenciesMock = {
  timerManager: TimerManager;
  networkManager: NodeToNodeNetworkManager;
  eventBus: EventBus;
  nodeMemoryState: NodeMemoryState;
};

export function getStateDependenciesMock(): StateDependenciesMock {
  const timerManager = <TimerManager>{};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const nodeMemoryState = INITIAL_NODE_MEMORY_STATE(() => {});
  const networkManager = <NodeToNodeNetworkManager>{};
  const eventBus = new EventBus();
  networkManager.sendRequest = jest.fn();
  timerManager.startTimer = jest.fn();
  timerManager.cancelTimer = jest.fn();
  return {
    eventBus,
    timerManager,
    nodeMemoryState,
    networkManager,
  };
}
