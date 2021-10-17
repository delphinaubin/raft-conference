<template>
  <h1>Raft algorithm demo</h1>
  <a-button type="primary" @click="resetSelection">Reset selection</a-button>
  <NodeVisualizer
    :nodes="nodes"
    :networkLinks="networkLinks"
    :selected-node="selectedNode"
    :selected-network-link="selectedNetworkLink"
    @selected-node-change="selectedNodeChange"
    @selected-network-link-change="selectedNetworkLinkChange"
  ></NodeVisualizer>
  <NodeManagement
    :selected-node="selectedNode"
    @close-drawer="resetSelection"
    @switch-node-state="switchNodeState"
    @send-log-to-node="sendLogToNode"
  />

  <NetworkManagement
    :nodes="nodes"
    :selected-network-link="selectedNetworkLink"
    @close-drawer="resetSelection"
    @switch-network-link-status="switchNetworkLinkStatus"
  />
  <EventHistory
    :historyEntries="historyEntries"
    :nodeNamesById="nodeNamesById"
  />
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import NodeVisualizer from "./components/NodeVisualizer/NodeVisualizer.vue";
import { RaftNode } from "@/domain/RaftNode";
import { NetworkLink } from "@/domain/NetworkLink";
import store, { HistoryEntry } from "@/store";
import EventHistory from "@/components/EventHistory/EventHistory.vue";
import NodeManagement from "@/components/NodeManagement/NodeManagement.vue";
import NetworkManagement from "@/components/NetworkManagement/NetworkManagement.vue";

@Options({
  components: {
    NetworkManagement,
    NodeManagement,
    EventHistory,
    NodeVisualizer,
  },
})
export default class App extends Vue {
  get nodes(): RaftNode[] {
    return store.state.nodes;
  }

  get selectedNode(): RaftNode | null {
    return store.state.selectedNode;
  }

  get selectedNetworkLink(): NetworkLink | null {
    return store.state.selectedNetworkLink;
  }

  get networkLinks(): NetworkLink[] {
    return store.state.networkLinks;
  }

  get historyEntries(): HistoryEntry[] {
    return store.getters.sortedHistory;
  }

  get nodeNamesById(): Map<string, string> {
    return new Map(store.state.nodes.map((node) => [node.id, node.name]));
  }

  resetSelection(): void {
    store.dispatch("selectedNodeChange", null);
    store.dispatch("selectedNetworkLinkChange", null);
  }

  selectedNodeChange(selectedNode: RaftNode | null): void {
    store.dispatch("selectedNodeChange", selectedNode);
  }

  selectedNetworkLinkChange(selectedNetworkLink: NetworkLink): void {
    store.dispatch("selectedNetworkLinkChange", selectedNetworkLink);
  }
  created(): void {
    store.dispatch("init");
  }

  switchNodeState(newNodeState: "on" | "off"): void {
    if (!this.selectedNode) {
      throw new Error("There is no selected node so we cant switch its state");
    }
    store.dispatch("switchNodeState", {
      nodeId: this.selectedNode.id,
      newNodeState,
    });
  }

  switchNetworkLinkStatus(
    newNetworkLinkStatus: "connected" | "disconnected"
  ): void {
    if (!this.selectedNetworkLink) {
      throw new Error(
        "There is no selected network link so we cant change its status"
      );
    }
    store.dispatch("switchNetworkLinkStatus", {
      fromNodeId: this.selectedNetworkLink.fromNodeId,
      toNodeId: this.selectedNetworkLink.toNodeId,
      newNetworkLinkStatus,
    });
  }

  sendLogToNode(logToSend: number): void {
    if (!this.selectedNode) {
      throw new Error("There is no selected node so we cant switch its state");
    }
    store.dispatch("sendLogToNode", {
      nodeId: this.selectedNode.id,
      logToSend,
    });
  }
}
</script>

<style>
#app {
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
