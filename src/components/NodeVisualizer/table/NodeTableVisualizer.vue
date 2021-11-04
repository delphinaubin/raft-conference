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
        <span v-if="log && log.lastLog">
          <a-tag :color="log.isLastLogCommited ? 'green' : 'pink'">{{
            log.lastLog
          }}</a-tag>
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

      <template #timers="{ text: timers }">
        <NodeTimer
          v-for="(timer, index) in timers"
          :key="index"
          :time="timer.time"
          :name="timer.name"
        ></NodeTimer>
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
import NodeTimer from "./NodeTimer.vue";
import { NodeMemoryState } from "@/domain/framework/memory-state/NodeMemoryStateManager";
import { cloneDeep } from "lodash";
import { EyeOutlined } from "@ant-design/icons-vue";
import { State } from "@/store";
@Options({
  props: {
    nodes: Array,
    nodesMemoryState: Array,
    nodeTimers: Object,
  },
  components: {
    EyeOutlined,
    NodeTimer,
  },
})
export default class NodeTableVisualizer extends Vue {
  nodes!: RaftNode[];
  nodesMemoryState!: { nodeId: string; memoryState: NodeMemoryState }[];
  nodeTimers!: State["timers"];

  get tableDataSource(): {
    node: RaftNode;
    timers: { time: number; name: string }[];
    log: { lastLog: number; isLastLogCommited: boolean } | undefined;
  }[] {
    return this.nodes.map((node) => {
      const memoryState = this.nodesMemoryState.find(
        ({ nodeId }) => nodeId === node.id
      )?.memoryState;

      let log = undefined;
      if (memoryState) {
        log = {
          lastLog: memoryState.log[memoryState.log.length - 1]?.value,
          isLastLogCommited:
            memoryState.commitLength === memoryState.log.length,
        };
      }
      return {
        key: node.id,
        node,
        timers: this.nodeTimers[node.id] || [],
        log,
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
        dataIndex: "log",
        slots: { customRender: "log" },
      },
      {
        title: "timers",
        key: "timers",
        dataIndex: "timers",
        slots: { customRender: "timers" },
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
