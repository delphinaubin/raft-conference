<template>
  <h1>Raft algorithm demo</h1>
  <button @click="resetSelection">Reset selection</button>
  <NodeVisualizer
    :nodes="nodes"
    :networkLinks="networkLinks"
    :selected-nodes="selectedNodes"
    :selected-network-links="selectedNetworkLinks"
    @selected-nodes-change="selectedNodesChange"
    @selected-network-links-change="selectedNetwotkLinksChange"
  ></NodeVisualizer>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import NodeVisualizer from "./components/NodeVisualizer/NodeVisualizer.vue";
import { RaftNode } from "@/domain/RaftNode";
import { NetworkLink } from "@/domain/NetworkLink";

@Options({
  components: {
    NodeVisualizer,
  },
})
export default class App extends Vue {
  selectedNodes: RaftNode[] = [];
  selectedNetworkLinks: NetworkLink[] = [];

  nodes: RaftNode[] = [
    {
      id: "1",
      name: "Node 1",
      state: "leader",
    },
    {
      id: "2",
      name: "Node 2",
      state: "follower",
    },
    {
      id: "3",
      name: "Node 3",
      state: "follower",
    },
  ];

  resetSelection(): void {
    this.selectedNodes = [];
    this.selectedNetworkLinks = [];
  }

  selectedNodesChange(selectedNodes: RaftNode[]): void {
    this.selectedNodes = selectedNodes;
  }

  selectedNetwotkLinksChange(selectedNetworkLinks: NetworkLink[]): void {
    this.selectedNetworkLinks = selectedNetworkLinks;
  }

  networkLinks: NetworkLink[] = [
    {
      fromNodeId: "1",
      toNodeId: "2",
      status: "connected",
    },
    {
      fromNodeId: "2",
      toNodeId: "3",
      status: "connected",
    },
    {
      fromNodeId: "1",
      toNodeId: "3",
      status: "connected",
    },
  ];
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
