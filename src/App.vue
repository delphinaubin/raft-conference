<template>
  <h1>Raft algorithm demo</h1>
  <a-button type="primary" @click="resetSelection">Reset selection</a-button>
  <NodeVisualizer
    :nodes="nodes"
    :networkLinks="networkLinks"
    :selected-node="selectedNode"
    :selected-network-links="selectedNetworkLinks"
    @selected-node-change="selectedNodeChange"
    @selected-network-links-change="selectedNetworkLinksChange"
  ></NodeVisualizer>
  <NodeManagement
    :selected-node="selectedNode"
    @close-drawer="resetSelection"
    @switch-node-state="switchNodeState"
    @send-log-to-node="sendLogToNode"
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

@Options({
  components: {
    NodeManagement,
    EventHistory,
    NodeVisualizer,
  },
})
export default class App extends Vue {
  selectedNetworkLinks: NetworkLink[] = [];

  get nodes(): RaftNode[] {
    return store.state.nodes;
  }

  get selectedNode(): RaftNode | null {
    return store.state.selectedNode;
  }

  get networkLinks(): NetworkLink[] {
    return store.state.networkLinks;
  }

  get historyEntries(): HistoryEntry[] {
    return store.state.history;
  }

  get nodeNamesById(): Map<string, string> {
    return new Map(store.state.nodes.map((node) => [node.id, node.name]));
  }

  resetSelection(): void {
    store.dispatch("selectedNodeChange", null);
    this.selectedNetworkLinks = [];
  }

  selectedNodeChange(selectedNode: RaftNode | null): void {
    store.dispatch("selectedNodeChange", selectedNode);
  }

  selectedNetworkLinksChange(selectedNetworkLinks: NetworkLink[]): void {
    this.selectedNetworkLinks = selectedNetworkLinks;
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

  sendLogToNode(logToSend: number) {
    if (!this.selectedNode) {
      throw new Error("There is no selected node so we cant switch its state");
    }
    store.dispatch("sendLogToNode", {
      nodeId: this.selectedNode.id,
      logToSend,
    });
    // TODO DAU : dispatch the action to the store
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
