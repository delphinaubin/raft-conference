<template>
  <a-drawer
    @close="onDrawerClose"
    title="Network management"
    placement="right"
    :visible="drawerVisible"
    :width="500"
  >
    <template v-if="selectedNetworkLink !== null">
      <div class="network-link">
        <NetworkLinkNode :node="fromNode" />
        <ArrowRightOutlined class="arrow" :style="{ color: '#222' }" />
        <NetworkLinkNode :node="toNode" />
      </div>
      <div class="actions-container">
        <a-button
          v-if="!isLinkOff"
          @click="disconnectLink"
          type="primary"
          danger
          >Disconnect this link</a-button
        >
        <a-button type="primary" v-if="isLinkOff" @click="conectLink"
          >Connect link</a-button
        >
      </div>
    </template>
  </a-drawer>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { NetworkLink } from "@/domain/framework/NetworkLink";
import { RaftNode } from "@/domain/framework/RaftNode";
import {
  NODE_STATE_STYLE,
  NodeStyle,
} from "@/components/NodeVisualizer/nodeStateStyle";
import NetworkLinkNode from "@/components/NetworkManagement/NetworkLinkNode.vue";
import { ArrowRightOutlined } from "@ant-design/icons-vue";

@Options({
  props: {
    selectedNetworkLink: [null, Object],
    nodes: Array,
  },
  components: {
    NetworkLinkNode,
    ArrowRightOutlined,
  },
})
export default class NetworkManagement extends Vue {
  selectedNetworkLink!: NetworkLink;
  nodes!: RaftNode[];

  get fromNode(): RaftNode {
    return this.getNodeFromId(this.selectedNetworkLink.fromNodeId);
  }

  get toNode(): RaftNode {
    return this.getNodeFromId(this.selectedNetworkLink.toNodeId);
  }

  get isLinkOff(): boolean {
    return this.selectedNetworkLink.status === "disconnected";
  }

  get drawerVisible(): boolean {
    return this.selectedNetworkLink !== null;
  }

  private getNodeFromId(nodeId: string): RaftNode {
    const nodeToFind = this.nodes.find((node) => node.id === nodeId);
    if (!nodeToFind) {
      throw new Error(`Cannot find node with id ${nodeId} in nodes`);
    }
    return nodeToFind;
  }

  onDrawerClose(): void {
    this.$emit("close-drawer");
  }

  getNodeStatusStyle(node: RaftNode): NodeStyle {
    return NODE_STATE_STYLE[node.state];
  }

  disconnectLink(): void {
    this.$emit("switch-network-link-status", "disconnected");
  }
  conectLink(): void {
    this.$emit("switch-network-link-status", "connected");
  }
}
</script>

<style>
.network-link {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-around;
}
.arrow {
  font-size: 4rem;
  color: #fff !important;
}

.actions-container {
  margin: 2rem;
  text-align: center;
}
</style>
