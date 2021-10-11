import { createStore } from "vuex";
import { RaftNode, RaftNodeState } from "@/domain/RaftNode";
import { NetworkLink } from "@/domain/NetworkLink";
import { eventBus, nodes, nodesToCreate } from "@/store/bindRaftToStore";
import { RaftEvent } from "@/domain/event/EventBus";
import { getNetworkLinksBetweenNodes } from "@/store/getNetworkLinksBetweenNodes";
import { ChangeStateEventBuilder } from "@/domain/event/ChangeStateEventBuilder";
import { BroadcastRequestBuilder } from "@/domain/network/BroadcastRequestBuilder";
import { NetworkRequestEventBuilder } from "@/domain/event/NetworkEventBuilder";

export interface HistoryEntry {
  raftEvent: RaftEvent;
}

export interface State {
  history: HistoryEntry[];
  nodes: RaftNode[];
  networkLinks: NetworkLink[];
  selectedNode: RaftNode | null;
}

const initialState: State = {
  nodes: [],
  networkLinks: [],
  history: [],
  selectedNode: null,
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
    setSelectedNode(state, selectedNode: RaftNode | null) {
      state.selectedNode = selectedNode || null;
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
    selectedNodeChange({ commit }, selectedNode: RaftNode | null) {
      commit("setSelectedNode", selectedNode);
    },
    async switchNodeState(
      _,
      { nodeId, newNodeState }: { nodeId: string; newNodeState: "off" | "on" }
    ) {
      let stateToGoTo: RaftNodeState;
      if (newNodeState === "off") {
        stateToGoTo = "off";
      } else {
        const nodeToSwitchOn = nodes.get(nodeId);
        if (!nodeToSwitchOn) {
          throw new Error(
            `Cannot switch node with id ${nodeId} on because it doesnt exist`
          );
        }
        stateToGoTo = nodeToSwitchOn.getInitialState();
      }

      await eventBus.emitEvent(
        ChangeStateEventBuilder.aChangeStateEvent()
          .forNodeId(nodeId)
          .toState(stateToGoTo)
          .build()
      );
    },
    async sendLogToNode(
      _,
      { nodeId, logToSend }: { nodeId: string; logToSend: number }
    ) {
      await eventBus.emitEvent(
        NetworkRequestEventBuilder.aNetworkRequestEvent()
          .withNetworkRequest(
            BroadcastRequestBuilder.aBroadcastRequest()
              .withLog(logToSend)
              .withReceiverNodeId(nodeId)
              .build()
          )
          .build()
      );
    },
  },
  modules: {},
});

eventBus.subscribe(async (event) => {
  console.log(event);
  await store.dispatch("eventBusEvent", event);
});

export default store;
