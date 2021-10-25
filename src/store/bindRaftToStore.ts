import { NodeToNodeNetworkManager } from "@/domain/network/NodeToNodeNetworkManager";
import { RaftNode } from "@/domain/RaftNode";
import { NodeAlgorithm } from "@/domain/raft/NodeAlgorithm";
import { CandidateState } from "@/domain/raft/states/CandidateState";
import { FollowerState } from "@/domain/raft/states/FollowerState";
import { LeaderState } from "@/domain/raft/states/LeaderState";
import { OffState } from "@/domain/raft/states/OffState";
import { EventBus } from "@/domain/event/EventBus";
import { TimerManager } from "@/domain/timer/TimerManager";
import { NodeMemoryStateManager } from "@/domain/memory-state/NodeMemoryStateManager";

export const nodesToCreate: RaftNode[] = [
  { id: "1", name: "Node 1", state: "off" },
  { id: "2", name: "Node 2", state: "off" },
  { id: "3", name: "Node 3", state: "off" },
];

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
