<template>
  <h1>Raft algorithm demo</h1>
  <a-button type="primary" @click="resetSelection">Reset selection</a-button>
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
import store from "@/store";

@Options({
  components: {
    NodeVisualizer,
  },
})
export default class App extends Vue {
  selectedNodes: RaftNode[] = [];
  selectedNetworkLinks: NetworkLink[] = [];

  get nodes(): RaftNode[] {
    return store.state.nodes;
  }

  get networkLinks(): NetworkLink[] {
    return store.state.networkLinks;
  }

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
  created() {
    store.dispatch("init");
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
