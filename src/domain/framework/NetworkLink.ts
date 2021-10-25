export type NetworkLinkStatus = "connected" | "disconnected";

export interface NetworkLink {
  fromNodeId: string;
  toNodeId: string;
  status: NetworkLinkStatus;
}
