<template>
  <div class="container">
    <h2>Event history</h2>
    <a-timeline>
      <a-timeline-item
        class="history-item"
        :key="index"
        v-for="(entry, index) in formattedHistoryEntries"
      >
        <template #dot>
          <LoginOutlined
            v-if="entry.type === 'change-state'"
            :style="{ color: entry.color }"
          />
          <CloudOutlined
            v-if="entry.type === 'network'"
            :style="{ color: entry.color }"
          />
          <ClockCircleOutlined
            v-if="entry.type === 'timer'"
            :style="{ color: entry.color }"
          />
        </template>
        {{ entry.id }} {{ entry.label }}
      </a-timeline-item>
    </a-timeline>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { HistoryEntry } from "@/store";
import {
  LoginOutlined,
  CloudOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons-vue";
import { NODE_STATE_STYLE } from "@/components/NodeVisualizer/nodeStateStyle";
import { TimerStatus } from "@/domain/framework/event/TimerEventBuilder";
import { isRequestIsNodeToNodeRequest } from "@/domain/framework/network/NetworkRequest";

@Options({
  components: {
    CloudOutlined,
    LoginOutlined,
    ClockCircleOutlined,
  },
  props: {
    historyEntries: Array,
    nodeNamesById: Map,
  },
})
export default class EventHistory extends Vue {
  historyEntries!: HistoryEntry[];
  nodeNamesById!: Map<string, string>;

  get formattedHistoryEntries(): {
    label: string;
    type: string;
    color: string;
    id: number;
  }[] {
    return this.historyEntries.map((h) => {
      const event = h.raftEvent;
      switch (event.type) {
        case "change-state": {
          return {
            id: h.eventId,
            type: "change-state",
            label: `${this.nodeNamesById.get(event.nodeId)} becomes ${
              event.toState
            } ${NODE_STATE_STYLE[event.toState].icon}`,
            color: NODE_STATE_STYLE[event.toState].borderColor,
          };
        }
        case "network": {
          const senderLabel = isRequestIsNodeToNodeRequest(event.networkRequest)
            ? this.nodeNamesById.get(event.networkRequest.senderNodeId)
            : "User";

          if (event.networkRequest.type === "vote-response") {
            return {
              id: h.eventId,
              type: "network",
              label: `${senderLabel} sent ${
                event.networkRequest.type
              } to ${this.nodeNamesById.get(
                event.networkRequest.receiverNodeId
              )} ${event.networkRequest.granted ? "👍" : "👎"}`,
              color: "limegreen",
            };
          }

          return {
            id: h.eventId,
            type: "network",
            label: `${senderLabel} sent ${
              event.networkRequest.type
            } to ${this.nodeNamesById.get(
              event.networkRequest.receiverNodeId
            )}`,
            color: "limegreen",
          };
        }
        case "timer": {
          const statusToVerb: Record<TimerStatus, string> = {
            started: "started a timer",
            ended: "received the notification of the end of its timer",
            canceled: "canceled a timer",
          };

          return {
            id: h.eventId,
            type: "timer",
            label: `${this.nodeNamesById.get(event.starterNodeId)} ${
              statusToVerb[event.status]
            } (${event.label})`,
            color: "white",
          };
        }
      }
    });
  }
}
</script>
<style scoped>
.container {
  width: 30rem;
  margin-right: auto;
  margin-left: auto;
  text-align: left;
}
.history-item {
  font-size: 1rem;
  font-family: Arial;
}
</style>
