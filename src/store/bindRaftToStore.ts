import { NetworkManager } from "@/domain/network/NetworkManager";
import { RaftNode } from "@/domain/RaftNode";
import { NodeAlgorithm } from "@/domain/raft/NodeAlgorithm";
import { CandidateState } from "@/domain/raft/states/CandidateState";
import { FollowerState } from "@/domain/raft/states/FollowerState";
import { LeaderState } from "@/domain/raft/states/LeaderState";
import { OffState } from "@/domain/raft/states/OffState";
import { EventBus } from "@/domain/event/EventBus";
import { TimerManager } from "@/domain/timer/TimerManager";

export const nodesToCreate: RaftNode[] = [
  { id: "1", name: "Node 1", state: "off" },
  { id: "2", name: "Node 2", state: "off" },
  { id: "3", name: "Node 3", state: "off" },
];

const INITIAL_NODE_MEMORY_STATE = () => ({
  term: 0,
  votesReceived: [],
  sentLength: {},
  ackedLength: {},
  log: [],
  commitLength: 0,
});

export const eventBus = new EventBus();
const timerManager = new TimerManager(eventBus);

const allNodeIds = nodesToCreate.map(({ id }) => id);

export const nodes = new Map(
  nodesToCreate.map((node) => {
    const nodeMemoryStateReference = INITIAL_NODE_MEMORY_STATE();

    return [
      node.id,
      new NodeAlgorithm(
        {
          candidate: new CandidateState(
            eventBus,
            timerManager,
            node.id,
            nodeMemoryStateReference,
            allNodeIds
          ),
          follower: new FollowerState(
            eventBus,
            timerManager,
            node.id,
            nodeMemoryStateReference,
            allNodeIds
          ),
          leader: new LeaderState(
            eventBus,
            timerManager,
            node.id,
            nodeMemoryStateReference,
            allNodeIds
          ),
          off: new OffState(
            eventBus,
            timerManager,
            node.id,
            nodeMemoryStateReference,
            allNodeIds
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

export const networkManager = new NetworkManager(eventBus);
