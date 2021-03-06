<template>
  <a-row>
    <a-col :span="12">
      <NodeTableVisualizer
        :nodes="nodes"
        :nodes-memory-state="nodesMemoryState"
        :node-timers="nodeTimers"
      ></NodeTableVisualizer>
    </a-col>
    <a-col :span="12">
      <NodeGraphVisualizer
        :nodes="nodes"
        :networkLinks="networkLinks"
        :selected-node="selectedNode"
        :selected-network-link="selectedNetworkLink"
        @selected-node-change="selectedNodeChange"
        @selected-network-link-change="selectedNetworkLinkChange"
      ></NodeGraphVisualizer>
    </a-col>
  </a-row>
</template>
<script lang="ts">
import { Options, Vue } from "vue-class-component";
import NodeGraphVisualizer from "@/components/NodeVisualizer/graph/NodeGraphVisualizer.vue";
import { RaftNode } from "@/domain/framework/RaftNode";
import { NetworkLink } from "@/domain/framework/NetworkLink";
import NodeTableVisualizer from "@/components/NodeVisualizer/table/NodeTableVisualizer.vue";
import { NodeMemoryState } from "@/domain/framework/memory-state/NodeMemoryStateManager";
import { State } from "@/store";

@Options({
  components: { NodeTableVisualizer, NodeGraphVisualizer },
  props: {
    nodes: Array,
    networkLinks: Array,
    selectedNode: [Object, null],
    selectedNetworkLink: [Object, null],
    nodesMemoryState: Array,
    nodeTimers: Object,
  },
})
export default class NodeVisualizer extends Vue {
  nodes!: RaftNode[];
  networkLinks!: NetworkLink[];
  selectedNode!: RaftNode | null;
  selectedNetworkLink!: NetworkLink;
  nodesMemoryState!: { nodeId: string; memoryState: NodeMemoryState }[];
  nodeTimers!: State["timers"];

  selectedNodeChange(selectedNode: RaftNode | null): void {
    this.$emit("selected-node-change", selectedNode);
  }

  selectedNetworkLinkChange(selectedNetworkLink: NetworkLink): void {
    this.$emit("selected-network-link-change", selectedNetworkLink);
  }
}
</script>
