<template>
  <div class="node-table-visualizer-container">
    <a-table
      :columns="columns"
      :data-source="tableDataSource"
      :pagination="false"
    >
      <template #state="{ text }">
        <span :style="{ color: getStateNodeStyle(text).labelColor }"
          >{{ getStateNodeStyle(text).icon }} {{ text }}</span
        >
      </template>

      <template #log="{ text: log }">
        <span v-if="log && log.length > 0">
          {{ log[log.length - 1].value }}
        </span>
      </template>

      <template #actions="{ text: nodeId }">
        <a-button
          @click="logNodeMemoryState(nodeId)"
          shape="circle"
          type="default"
          ><template #icon><EyeOutlined /></template
        ></a-button>
      </template>
    </a-table>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { RaftNode, RaftNodeState } from "@/domain/framework/RaftNode";
import {
  NodeStyle,
  NODE_STATE_STYLE,
} from "@/components/NodeVisualizer/nodeStateStyle";
import { NodeMemoryState } from "@/domain/framework/memory-state/NodeMemoryStateManager";
import { cloneDeep } from "lodash";
import { EyeOutlined } from "@ant-design/icons-vue";
@Options({
  props: {
    nodes: Array,
    nodesMemoryState: Array,
  },
  components: {
    EyeOutlined,
  },
})
export default class NodeTableVisualizer extends Vue {
  nodes!: RaftNode[];
  nodesMemoryState!: { nodeId: string; memoryState: NodeMemoryState }[];

  get tableDataSource(): {
    node: RaftNode;
    memoryState: NodeMemoryState | Record<string, unknown>;
  }[] {
    return this.nodes.map((node) => {
      return {
        key: node.id,
        node,
        memoryState: this.nodesMemoryState.find(
          ({ nodeId }) => nodeId === node.id
        )?.memoryState || { log: [] },
      };
    });
  }

  get columns(): unknown[] {
    return [
      {
        title: "Name",
        key: "name",
        dataIndex: "node.name",
      },
      {
        title: "State",
        key: "state ",
        dataIndex: "node.state",
        slots: { customRender: "state" },
      },
      {
        title: "Last log",
        key: "log",
        dataIndex: "memoryState.log",
        slots: { customRender: "log" },
      },
      {
        title: "",
        key: "actions",
        dataIndex: "node.id",
        slots: { customRender: "actions" },
      },
    ];
  }

  getStateNodeStyle(state: RaftNodeState): NodeStyle {
    return NODE_STATE_STYLE[state];
  }

  logNodeMemoryState(nodeId: string): void {
    const memoryStateToLog = this.nodesMemoryState.find(
      (e) => e.nodeId === nodeId
    );
    const nodeToLog = this.nodes.find((e) => e.id === nodeId);
    if (!memoryStateToLog || !nodeToLog) {
      console.warn(
        `No memory state to log for node ${nodeId} or no Node in the node table`
      );
      return;
    }
    const nodeStyle = this.getStateNodeStyle(nodeToLog.state);
    console.info(
      `\n\n\n%c${nodeStyle.icon} ${nodeToLog.name} (${nodeToLog.state})`,
      `color: ${nodeStyle.labelColor}; font-size: 1.5rem`
    );
    console.info("%cAll state", "font-size: 1rem");
    const readableMemoryState = {
      ...memoryStateToLog.memoryState,
      nodesWhichVotedForMe: `[${memoryStateToLog.memoryState.nodesWhichVotedForMe
        .getValues()
        .join(", ")}]`,
    };
    console.table(cloneDeep(readableMemoryState));
    if (memoryStateToLog.memoryState.log.length > 0) {
      console.info("%cAll node logs", "font-size: 1rem");
      console.table(cloneDeep(memoryStateToLog.memoryState.log));
    }
    console.info("\n\n");
  }
}
</script>

<style>
.node-table-visualizer-container {
  padding: 1rem;
}
</style>
