import { createStore } from "vuex";
import { RaftNode, RaftNodeState } from "@/domain/RaftNode";
import { NetworkLink } from "@/domain/NetworkLink";
import { NodeAlgorithm } from "@/domain/raft/NodeAlgorithm";
import { CandidateState } from "@/domain/raft/states/CandidateState";
import { FollowerState } from "@/domain/raft/states/FollowerState";
import { LeaderState } from "@/domain/raft/states/LeaderState";
import { OffState } from "@/domain/raft/states/OffState";

export interface State {
  nodes: RaftNode[];
  networkLinks: NetworkLink[];
}

const initialState: State = {
  nodes: [],
  networkLinks: [],
};

export default createStore({
  state: initialState,
  mutations: {
    setNodes(state, nodes: RaftNode[]) {
      state.nodes = nodes;
    },
    setNetworkLinks(state, networkLinks: NetworkLink[]) {
      state.networkLinks = networkLinks;
    },
    setNodeState(
      state,
      { nodeId, newState }: { nodeId: string; newState: RaftNodeState }
    ) {
      state.nodes.forEach((node) => {
        if (node.id === nodeId) {
          node.state = newState;
        }
      });
    },
  },
  actions: {
    init({ commit }): void {
      const nodesToCreate: RaftNode[] = [
        { id: "1", name: "Node 1", state: "off" },
        { id: "2", name: "Node 2", state: "off" },
        { id: "3", name: "Node 3", state: "off" },
      ];

      const nodes = new Map(
        nodesToCreate.map((node) => {
          return [
            node.id,
            new NodeAlgorithm(
              {
                candidate: new CandidateState(),
                follower: new FollowerState(),
                leader: new LeaderState(),
                off: new OffState(),
              },
              {
                async beforeStateChange(
                  oldState: RaftNodeState,
                  newState: RaftNodeState
                ): Promise<void> {
                  console.log("beforeStateChange", oldState, newState);
                },
                async afterStateChange(
                  oldState: RaftNodeState,
                  newState: RaftNodeState
                ): Promise<void> {
                  commit("setNodeState", { nodeId: node.id, newState });

                  console.log("afterStateChange", oldState, newState);
                },
              }
            ),
          ];
        })
      );
      const networkLinks = nodesToCreate.reduce((allLinks, node) => {
        return [
          ...allLinks,
          ...nodesToCreate
            .filter((n) => n.id !== node.id)
            .map(
              (n): NetworkLink => ({
                fromNodeId: node.id,
                toNodeId: n.id,
                status: "connected",
              })
            ),
        ];
      }, <NetworkLink[]>[]);

      commit("setNodes", nodesToCreate);
      commit("setNetworkLinks", networkLinks)

    },
  },
  modules: {},
});
