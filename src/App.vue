<template>
  <Header
    @stop-algorithm="stopAlgorithm"
    :isAlgorithmRunning="isAlgorithmRunning"
  />
  <NodeVisualizer
    :nodes="nodes"
    :networkLinks="networkLinks"
    :selected-node="selectedNode"
    :selected-network-link="selectedNetworkLink"
    :nodes-memory-state="allNodesMemoryState"
    :node-timers="allNodesTimers"
    @selected-node-change="selectedNodeChange"
    @selected-network-link-change="selectedNetworkLinkChange"
  ></NodeVisualizer>

  <NodeManagement
    :selected-node="selectedNode"
    :network-links="networkLinks"
    @close-drawer="resetSelection"
    @switch-node-state="switchNodeState"
    @switch-node-network-state="switchNodeNetworkState"
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
import NodeVisualizer from "@/components/NodeVisualizer/NodeVisualizer.vue";
import { RaftNode } from "@/domain/framework/RaftNode";
import { NetworkLink } from "@/domain/framework/NetworkLink";
import store, { HistoryEntry, State } from "@/store";
import EventHistory from "@/components/EventHistory/EventHistory.vue";
import NodeManagement from "@/components/NodeManagement/NodeManagement.vue";
import NetworkManagement from "@/components/NetworkManagement/NetworkManagement.vue";
import Header from "@/components/header/Header.vue";
import { NodeMemoryState } from "@/domain/framework/memory-state/NodeMemoryStateManager";

@Options({
  components: {
    Header,
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

  get allNodesMemoryState(): {
    nodeId: string;
    memoryState: NodeMemoryState;
  }[] {
    return store.state.nodesMemoryState;
  }

  get allNodesTimers(): State["timers"] {
    return store.state.timers;
  }

  get isAlgorithmRunning(): boolean {
    return store.state.isAlgorithmRunning;
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

  switchNodeNetworkState(newNodeNetworkState: "on" | "off"): void {
    if (!this.selectedNode) {
      throw new Error(
        "There is no selected node so we cant switch its network state"
      );
    }
    const nodeId = this.selectedNode?.id;
    const links = this.networkLinks.filter(
      (link) => link.fromNodeId == nodeId || link.toNodeId == nodeId
    );
    const newNetworkLinkStatus =
      newNodeNetworkState === "on" ? "connected" : "disconnected";
    links.forEach((link) => {
      store.dispatch("switchNetworkLinkStatus", {
        fromNodeId: link.fromNodeId,
        toNodeId: link.toNodeId,
        newNetworkLinkStatus,
      });
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
  stopAlgorithm(): void {
    store.dispatch("stopAlgorithm");
  }
}
</script>
