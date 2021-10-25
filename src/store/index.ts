import { createStore } from "vuex";
import { RaftNode, RaftNodeState } from "@/domain/RaftNode";
import { NetworkLink, NetworkLinkStatus } from "@/domain/NetworkLink";
import {
  eventBus,
  networkManager,
  nodeMemoryStateManager,
  nodes,
  nodesToCreate,
} from "@/store/bindRaftToStore";
import { RaftEvent } from "@/domain/event/EventBus";
import { getNetworkLinksBetweenNodes } from "@/store/getNetworkLinksBetweenNodes";
import { ChangeStateEventBuilder } from "@/domain/event/ChangeStateEventBuilder";
import { BroadcastRequestBuilder } from "@/domain/network/BroadcastRequestBuilder";
import { NetworkRequestEventBuilder } from "@/domain/event/NetworkEventBuilder";
import {
  INITIAL_NODE_MEMORY_STATE,
  NodeMemoryState,
} from "@/domain/memory-state/NodeMemoryStateManager";

export interface HistoryEntry {
  raftEvent: RaftEvent;
  eventId: number;
}

export interface State {
  history: HistoryEntry[];
  nodes: RaftNode[];
  networkLinks: NetworkLink[];
  selectedNode: RaftNode | null;
  selectedNetworkLink: NetworkLink | null;
  nodesMemoryState: { nodeId: string; memoryState: NodeMemoryState }[];
}

const initialState: State = {
  nodes: [],
  networkLinks: [],
  history: [],
  selectedNode: null,
  selectedNetworkLink: null,
  nodesMemoryState: [],
};

const store = createStore({
  state: initialState,
  mutations: {
    setNodes(state, nodes: RaftNode[]) {
      state.nodes = nodes;
      nodes.forEach((node) => {
        if (!state.nodesMemoryState.some(({ nodeId }) => nodeId === node.id)) {
          state.nodesMemoryState.push({
            nodeId: node.id,
            memoryState: INITIAL_NODE_MEMORY_STATE,
          });
        }
      });
    },

    setNodeMemoryState(
      state,
      {
        nodeId,
        newNodeMemoryState,
      }: { nodeId: string; newNodeMemoryState: NodeMemoryState }
    ) {
      const existingNodeMemoryStateIndex = state.nodesMemoryState.findIndex(
        (memoryState) => memoryState.nodeId === nodeId
      );
      if (existingNodeMemoryStateIndex === -1) {
        state.nodesMemoryState.push({
          nodeId,
          memoryState: newNodeMemoryState,
        });
      } else {
        state.nodesMemoryState[existingNodeMemoryStateIndex] = {
          nodeId,
          memoryState: newNodeMemoryState,
        };
      }
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
    addEventToHistory(
      state,
      { event, eventId }: { event: RaftEvent; eventId: number }
    ) {
      state.history.push({
        raftEvent: event,
        eventId,
      });
    },
    setSelectedNode(state, selectedNode: RaftNode | null) {
      state.selectedNode = selectedNode || null;
    },

    setSelectedNetworkLink(state, selectedNetworkLink: NetworkLink | null) {
      state.selectedNetworkLink = selectedNetworkLink || null;
    },
    changeNetworkLinkStatus(
      state,
      {
        fromNodeId,
        toNodeId,
        newNetworkLinkStatus,
      }: {
        fromNodeId: string;
        toNodeId: string;
        newNetworkLinkStatus: NetworkLinkStatus;
      }
    ) {
      const networkLinkToChange = state.networkLinks.find(
        (networkLink) =>
          networkLink.fromNodeId === fromNodeId &&
          networkLink.toNodeId === toNodeId
      );
      if (networkLinkToChange) {
        networkLinkToChange.status = newNetworkLinkStatus;
      }
    },
  },
  getters: {
    sortedHistory(state) {
      return [...state.history].sort(
        (entryA, entryB) => entryA.eventId - entryB.eventId
      );
    },
  },
  actions: {
    init({ commit }): void {
      commit("setNodes", nodesToCreate);
      commit("setNetworkLinks", getNetworkLinksBetweenNodes(nodesToCreate));
      Array.from(nodes.values()).forEach((node) => {
        eventBus.emitEvent(
          ChangeStateEventBuilder.aChangeStateEvent()
            .forNodeId(node.id)
            .toState(node.getInitialState())
            .build()
        );
      });
    },
    eventBusEvent(
      { commit },
      { event, eventId }: { event: RaftEvent; eventId: number }
    ): void {
      switch (event.type) {
        case "change-state": {
          commit("setNodeState", {
            nodeId: event.nodeId,
            newState: event.toState,
          });
        }
      }
      commit("addEventToHistory", { event, eventId });
    },
    selectedNodeChange({ commit }, selectedNode: RaftNode | null) {
      commit("setSelectedNode", selectedNode);
    },
    selectedNetworkLinkChange(
      { commit },
      selectedNetworkLink: NetworkLink | null
    ) {
      commit("setSelectedNetworkLink", selectedNetworkLink);
    },
    switchNodeState(
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

      eventBus.emitEvent(
        ChangeStateEventBuilder.aChangeStateEvent()
          .forNodeId(nodeId)
          .toState(stateToGoTo)
          .build()
      );
    },
    switchNetworkLinkStatus(
      { commit },
      {
        fromNodeId,
        toNodeId,
        newNetworkLinkStatus,
      }: {
        fromNodeId: string;
        toNodeId: string;
        newNetworkLinkStatus: NetworkLinkStatus;
      }
    ) {
      if (newNetworkLinkStatus === "disconnected") {
        networkManager.disableConnection(fromNodeId, toNodeId);
      } else {
        networkManager.enableConnection(fromNodeId, toNodeId);
      }
      commit("changeNetworkLinkStatus", {
        fromNodeId,
        toNodeId,
        newNetworkLinkStatus,
      });
    },
    sendLogToNode(
      _,
      { nodeId, logToSend }: { nodeId: string; logToSend: number }
    ) {
      eventBus.emitEvent(
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

eventBus.subscribe((event) => {
  store.dispatch("eventBusEvent", event);
});

nodeMemoryStateManager.onNodeMemoryStateChange(
  ({ nodeId, newNodeMemoryState }) => {
    store.commit("setNodeMemoryState", { nodeId, newNodeMemoryState });
  }
);

export default store;
