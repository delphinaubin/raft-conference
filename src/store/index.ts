import { createStore } from "vuex";
import { RaftNode, RaftNodeState } from "@/domain/RaftNode";
import { NetworkLink } from "@/domain/NetworkLink";
import { eventBus, nodes, nodesToCreate } from "@/store/bindRaftToStore";
import { RaftEvent } from "@/domain/event/EventBus";
import { getNetworkLinksBetweenNodes } from "@/store/getNetworkLinksBetweenNodes";
import { ChangeStateEventBuilder } from "@/domain/event/ChangeStateEventBuilder";

export interface HistoryEntry {
  raftEvent: RaftEvent;
}

export interface State {
  history: HistoryEntry[];
  nodes: RaftNode[];
  networkLinks: NetworkLink[];
}

const initialState: State = {
  nodes: [],
  networkLinks: [],
  history: [],
};

const store = createStore({
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
    addEventToHistory(state, event: RaftEvent) {
      state.history.push({
        raftEvent: event,
      });
    },
  },
  actions: {
    async init({ commit }): Promise<void> {
      commit("setNodes", nodesToCreate);
      commit("setNetworkLinks", getNetworkLinksBetweenNodes(nodesToCreate));
      await Array.from(nodes.values()).reduce(async (lastPromise, node) => {
        await lastPromise;
        await eventBus.emitEvent(
          ChangeStateEventBuilder.aChangeStateEvent()
            .forNodeId(node.id)
            .toState(node.getInitialState())
            .build()
        );
      }, Promise.resolve());
    },
    eventBusEvent({ commit }, event: RaftEvent): void {
      switch (event.type) {
        case "change-state": {
          commit("setNodeState", {
            nodeId: event.nodeId,
            newState: event.toState,
          });
        }
      }
      commit("addEventToHistory", event);
    },
  },
  modules: {},
});

eventBus.subscribe(async (event) => {
  console.log(event);
  await store.dispatch("eventBusEvent", event);
});

export default store;
