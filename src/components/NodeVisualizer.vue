<template>
  <v-network-graph
    v-model:selected-nodes="selectedNodeIds"
    v-model:selected-edges="selectedEdgeIds"
    :nodes="nodes"
    :edges="edges"
    :style="{ width: '100%', height: '40rem' }"
    :layouts="layouts"
    :configs="configs"
    :zoom-level="2"
  >
    <template #edge-label="{ edge, ...slotProps }">
      <v-edge-label
        :text="edge.label"
        align="center"
        vertical-align="above"
        v-bind="slotProps"
      />
    </template>
    <template
      #override-node-label="{
        nodeId,
        scale,
        text,
        x,
        y,
        config,
        textAnchor,
        dominantBaseline,
      }"
    >
      <text
        x="0"
        y="0"
        :font-size="16 * scale"
        text-anchor="middle"
        dominant-baseline="central"
        fill="#ffffff"
        >{{ nodeStateToIcon(nodes[nodeId].state) }}
      </text>
      <text
        :x="x"
        :y="y"
        :font-size="config.fontSize * scale"
        :text-anchor="textAnchor"
        :dominant-baseline="dominantBaseline"
        :fill="config.color"
        >{{ text }}</text
      >
    </template>
  </v-network-graph>
  <pre>
# Selected nodes
{{ JSON.stringify(selectedNodeIds, null, 2) }}
# Selected edges
{{ JSON.stringify(selectedEdgeIds, null, 2) }}
  </pre>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { Edge, Edges, Layouts, Node, Nodes } from "v-network-graph";

@Options({})
export default class NodeVisualizer extends Vue {
  selectedNodeIds: string[] = [];
  selectedEdgeIds: string[] = [];

  nodes: Nodes = {
    node1: { name: "Node 1", state: "leader" },
    node2: { name: "Node 2", state: "follower" },
    node3: { name: "Node 3", state: "candidate" },
  };
  edges: Edges = {
    edge12: { source: "node1", target: "node2" },
    edge23: { source: "node2", target: "node3" },
    edge31: { source: "node3", target: "node1", label: "❌" },
  };

  layouts: Layouts = {
    nodes: {
      node1: { x: 50, y: 0 },
      node2: { x: 0, y: 75 },
      node3: { x: 100, y: 75 },
    },
  };

  configs = {
    view: {
      scalingObjects: true,
      panEnabled: false,
    },
    node: {
      selectable: true,
      normal: {
        color: (node: Node): string => {
          return node.name === "Node 1" ? "pink" : "#F44";
        },
      },
    },
    edge: {
      selectable: true,
      normal: {
        color: (edge: Edge): string =>
          edge.source === "node1" ? "pink" : "orange",
      },
    },
  };

  nodeStateToIcon(
    nodeState: "leader" | "follower" | "candidate"
  ): "👑" | "☝️" | "😶" {
    switch (nodeState) {
      case "follower": {
        return "😶";
      }
      case "leader": {
        return "👑";
      }
      case "candidate": {
        return "☝️";
      }
    }
  }
}
</script>

<style scoped>
pre {
  text-align: left;
  font-size: 1.5rem;
}
</style>
