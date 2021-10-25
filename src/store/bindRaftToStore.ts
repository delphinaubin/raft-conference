import { NodeToNodeNetworkManager } from "@/domain/framework/network/NodeToNodeNetworkManager";
import { NodeAlgorithm } from "@/domain/conf-land/NodeAlgorithm";
import { CandidateState } from "@/domain/conf-land/states/CandidateState";
import { FollowerState } from "@/domain/conf-land/states/FollowerState";
import { LeaderState } from "@/domain/conf-land/states/LeaderState";
import { OffState } from "@/domain/conf-land/states/OffState";
import { EventBus } from "@/domain/framework/event/EventBus";
import { TimerManager } from "@/domain/framework/timer/TimerManager";
import { NodeMemoryStateManager } from "@/domain/framework/memory-state/NodeMemoryStateManager";
import { nodesToCreate } from "@/domain/conf-land/nodesToCreate";

export const eventBus = new EventBus();

export const nodeMemoryStateManager = new NodeMemoryStateManager();

const timerManager = new TimerManager(eventBus);

const allNodeIds = nodesToCreate.map(({ id }) => id);

export const networkManager = new NodeToNodeNetworkManager(eventBus);

export const nodes = new Map(
  nodesToCreate.map((node) => {
    const nodeMemoryStateReference =
      nodeMemoryStateManager.getNodeInitialMemoryState(node.id);

    return [
      node.id,
      new NodeAlgorithm(
        {
          candidate: new CandidateState(
            eventBus,
            timerManager,
            node.id,
            nodeMemoryStateReference,
            allNodeIds,
            networkManager
          ),
          follower: new FollowerState(
            eventBus,
            timerManager,
            node.id,
            nodeMemoryStateReference,
            allNodeIds,
            networkManager
          ),
          leader: new LeaderState(
            eventBus,
            timerManager,
            node.id,
            nodeMemoryStateReference,
            allNodeIds,
            networkManager
          ),
          off: new OffState(
            eventBus,
            timerManager,
            node.id,
            nodeMemoryStateReference,
            allNodeIds,
            networkManager
          ),
        },
        eventBus,
        node.id,
        nodeMemoryStateReference,
        allNodeIds
      ),
    ];
  })
);
