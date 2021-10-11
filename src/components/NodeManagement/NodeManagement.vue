<template>
  <a-drawer
    @close="onDrawerClose"
    title="Node management"
    placement="right"
    :visible="drawerVisible"
    :width="500"
  >
    <template v-if="selectedNode !== null">
      <h1>{{ selectedNode.name }}</h1>
      <a-form
        layout="vertical"
        :label-col="{ span: 8 }"
        :wrapper-col="{ span: 16 }"
      >
        <a-form-item>
          <a-button
            v-if="!isNodeOff"
            @click="switchOffNode"
            type="primary"
            danger
            >Turn this node off</a-button
          >
          <a-button type="primary" v-if="isNodeOff" @click="switchOnNode"
            >Turn this node on</a-button
          >
        </a-form-item>
        <a-form-item label="Send value to node">
          <a-input-search
            type="number"
            placeholder="Enter the value to send"
            enter-button="Send"
            size="large"
            v-model:value="logToSend"
            @search="sendLog"
          />
        </a-form-item>
      </a-form>
    </template>
  </a-drawer>
</template>
<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { RaftNode } from "@/domain/RaftNode";

@Options({
  props: {
    selectedNode: [null, Object],
  },
})
export default class NodeManagement extends Vue {
  selectedNode!: RaftNode | null;
  logToSend: string | null = null;

  get drawerVisible(): boolean {
    return this.selectedNode !== null;
  }

  get isNodeOff(): boolean {
    return this.selectedNode?.state === "off";
  }

  onDrawerClose(): void {
    this.$emit("close-drawer");
  }
  switchOffNode(): void {
    this.$emit("switch-node-state", "off");
  }

  switchOnNode(): void {
    this.$emit("switch-node-state", "on");
  }

  sendLog(): void {
    if (this.logToSend !== null) {
      this.$emit("send-log-to-node", +this.logToSend);
      this.logToSend = null;
    }
  }
}
</script>
<style></style>
