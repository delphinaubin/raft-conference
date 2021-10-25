import { RaftNode } from "@/domain/framework/RaftNode";
import { NetworkLink } from "@/domain/framework/NetworkLink";

export function getNetworkLinksBetweenNodes(nodes: RaftNode[]): NetworkLink[] {
  return nodes.reduce((allLinks, node) => {
    return [
      ...allLinks,
      ...nodes
        .filter((n) => n.id !== node.id)
        .map(
          (n): NetworkLink => ({
            fromNodeId: node.id,
            toNodeId: n.id,
            status: "connected",
          })
        ),
    ];
  }, <NetworkLink[]>[]);
}
