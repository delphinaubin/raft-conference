<template>
  <div class="node-container" :style="{ borderColor: statusStyle.borderColor }">
    <span class="icon">{{ statusStyle.icon }}</span>
    <span class="label" :style="{ color: statusStyle.labelColor }">{{
      node.name
    }}</span>
  </div>
</template>
<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { RaftNode } from "@/domain/framework/RaftNode";
import {
  NODE_STATE_STYLE,
  NodeStyle,
} from "@/components/NodeVisualizer/nodeStateStyle";
@Options({
  props: {
    node: Object,
  },
})
export default class NetworkLinkNode extends Vue {
  node!: RaftNode;

  get statusStyle(): NodeStyle {
    return NODE_STATE_STYLE[this.node.state];
  }
}
</script>
<style>
.node-container {
  border: solid 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 8rem;
  height: 8rem;
  border-radius: 50%;
  justify-content: center;
}

.node-container .label {
  font-size: 1.3rem;
}

.node-container .icon {
  font-size: 2rem;
}
</style>
