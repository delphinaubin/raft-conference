<template>
  <v-network-graph
    :nodes="graphNodes"
    :edges="graphEdges"
    :style="{ width: '100%', height: '40rem' }"
    :layouts="layouts"
    :configs="configs"
    :zoom-level="2"
    :event-handlers="eventHandlers"
    :selected-nodes="selectedNodesIds"
    :selected-edges="selectedEdgeIds"
  >
    <template #edge-label="{ edge, ...slotProps }">
      <v-edge-label
        v-if="edge.status === 'disconnected'"
        text="❌"
        align="center"
        vertical-align="center"
        v-bind="slotProps"
      />
    </template>
    <template
      #override-node-label="{
        nodeId,
        scale,
        x,
        y,
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
        >{{ nodeStateToStyle(graphNodes[nodeId].state).icon }}
      </text>
      <text
        :x="x"
        :y="y"
        :font-size="configs.node.label.fontSize * scale"
        :text-anchor="textAnchor"
        :dominant-baseline="dominantBaseline"
        :fill="configs.node.label.color(graphNodes[nodeId])"
        >{{ graphNodes[nodeId].name }}</text
      >
    </template>

    <template #override-node="{ nodeId, scale, config, ...slotProps }">
      <circle
        class="animated-circle"
        :r="config.radius * scale"
        :fill="configs.node.normal.color(graphNodes[nodeId])"
        :stroke="configs.node.normal.strokeColor(graphNodes[nodeId])"
        :stroke-width="configs.node.normal.strokeWidth(graphNodes[nodeId])"
        v-bind="slotProps"
      />
    </template>
  </v-network-graph>
</template>

<script lang="ts">
import { Edge, EventHandlers, Layouts, Node } from "v-network-graph";
import { RaftNode, RaftNodeState } from "@/domain/RaftNode";
import { Options, Vue } from "vue-class-component";
import { NetworkLink, NetworkLinkStatus } from "@/domain/NetworkLink";
import { getLayoutFromNodeIds } from "@/components/NodeVisualizer/getLayoutFromNodeIds";

const NODE_STATE_STYLE: Record<RaftNodeState, NodeStyle> = {
  leader: {
    icon: "👑",
    color: "white",
    borderColor: "royalBlue",
    labelColor: "royalBlue",
  },
  candidate: {
    icon: "☝️",
    color: "white",
    borderColor: "navy",
    labelColor: "navy",
  },
  follower: {
    icon: "😶",
    color: "white",
    borderColor: "slateGrey",
    labelColor: "slateGrey",
  },
  off: {
    icon: "❌",
    color: "white",
    borderColor: "orangeRed",
    labelColor: "red",
  },
} as const;

interface NodeStyle {
  icon: string;
  color: string;
  borderColor: string;
  labelColor: string;
}

type GraphNode = Node & { state: RaftNodeState };
type GraphEdge = Edge & { status: NetworkLinkStatus };

@Options({
  props: {
    nodes: Array,
    networkLinks: Array,
    selectedNodes: Array,
    selectedNetworkLinks: Array,
  },
})
export default class NodeVisualizer extends Vue {
  nodes!: RaftNode[];
  networkLinks!: NetworkLink[];
  selectedNodes!: RaftNode[];
  selectedNetworkLinks!: NetworkLink[];

  get graphNodes(): Record<string, GraphNode> {
    return this.nodes.reduce((result, node) => {
      return {
        ...result,
        [node.id]: { ...node, name: `${node.name} (${node.state})` },
      };
    }, {});
  }

  get graphEdges(): Record<string, GraphEdge> {
    return this.networkLinks.reduce((result, networkLink) => {
      return {
        ...result,
        [`${networkLink.fromNodeId}_${networkLink.toNodeId}`]: {
          source: networkLink.fromNodeId,
          target: networkLink.toNodeId,
          status: networkLink.status,
        },
      };
    }, {});
  }

  get layouts(): Layouts {
    return {
      nodes: getLayoutFromNodeIds(this.nodes.map(({ id }) => id)),
    };
  }

  get configs(): unknown {
    return {
      view: {
        scalingObjects: true,
        panEnabled: false,
        zoomEnabled: false,
      },
      node: {
        selectable: true,
        normal: {
          color: (node: GraphNode): string => {
            return this.nodeStateToStyle(node.state).color;
          },
          strokeColor: (node: GraphNode): string => {
            return this.nodeStateToStyle(node.state).borderColor;
          },
          strokeWidth: (node: GraphNode): number => {
            return this.nodeStateToStyle(node.state).borderColor ===
              "transparent"
              ? 0
              : 3;
          },
        },
        hover: {
          color: (node: GraphNode): string => {
            return this.nodeStateToStyle(node.state).color;
          },
        },
        label: {
          fontSize: 10,
          color: (node: GraphNode): string => {
            return this.nodeStateToStyle(node.state).labelColor;
          },
        },
      },
      edge: {
        selectable: true,
        marker: {
          target: {
            type: "arrow",
            width: 4,
            height: 4
          },
        },
        normal: {
          color: (edge: Edge): string =>
            edge.status === "connected" ? "lightgreen" : "orangered",
          dasharray: (edge: Edge): number =>
            edge.status === "connected" ? 0 : 8,
        },
        hover: {
          color: "black",
        },
        selected: {
          color: "black",
        },
      },
    };
  }

  get eventHandlers(): EventHandlers {
    return {
      "node:select": (selectedNodesIds) => {
        const selectedNodes = selectedNodesIds.map((nodeId) =>
          this.nodes.find((node) => node.id === nodeId)
        );

        const hackBecauseThisGraphLibraryHandlesStatesLikeShit =
          selectedNodesIds.toString() !== this.selectedNodesIds.toString();

        if (hackBecauseThisGraphLibraryHandlesStatesLikeShit) {
          this.$emit("selected-nodes-change", selectedNodes);
        }
      },
      "edge:select": (selectedEdgeIds) => {
        const selectedNetworkLinks = selectedEdgeIds
          .map((edgeId) => {
            const [fromNodeId, toNodeId] = edgeId.split("_");
            return {
              fromNodeId,
              toNodeId,
            };
          })
          .map(({ fromNodeId, toNodeId }) =>
            this.networkLinks.find(
              (networkLink) =>
                networkLink.fromNodeId === fromNodeId &&
                networkLink.toNodeId === toNodeId
            )
          );

        const hackBecauseThisGraphLibraryHandlesStatesLikeShit =
          selectedEdgeIds.toString() !== this.selectedEdgeIds.toString();

        if (hackBecauseThisGraphLibraryHandlesStatesLikeShit) {
          this.$emit("selected-network-links-change", selectedNetworkLinks);
        }
      },
    };
  }

  get selectedNodesIds(): string[] {
    return this.selectedNodes.map(({ id }) => id);
  }

  get selectedEdgeIds(): string[] {
    return this.selectedNetworkLinks.map(
      ({ fromNodeId, toNodeId }) => `${fromNodeId}_${toNodeId}`
    );
  }

  nodeStateToStyle(nodeState: RaftNodeState): NodeStyle {
    return NODE_STATE_STYLE[nodeState];
  }
}
</script>

<style scoped="true">
.animated-circle {
  transition: fill 0.1s linear, stroke 0.1s linear, stroke-width 0.1s linear,
    r 0.1s linear;
}
</style>
