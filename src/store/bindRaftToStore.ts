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

export const eventBus = new EventBus();
const timerManager = new TimerManager(eventBus);

export const nodes = new Map(
  nodesToCreate.map((node) => {
    return [
      node.id,
      new NodeAlgorithm(
        {
          candidate: new CandidateState(eventBus, timerManager, node.id),
          follower: new FollowerState(eventBus, timerManager, node.id),
          leader: new LeaderState(eventBus, timerManager, node.id),
          off: new OffState(eventBus, timerManager, node.id),
        },
        eventBus,
        node.id
      ),
    ];
  })
);

export const networkManager = new NetworkManager(eventBus);
