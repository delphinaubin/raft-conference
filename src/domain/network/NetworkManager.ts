import { AbstractNodeAlgorithm } from "@/domain/raft/AbstractNodeAlgorithm";

export interface NetworkRequest<T = unknown> {
  fromNodeId: string;
  toNodeId: string;
  payload: T;
}

export class NetworkManager {
  constructor(private readonly nodes: Map<string, AbstractNodeAlgorithm>) {}

  async sendRequest(request: NetworkRequest): Promise<void> {
    const targetNode = this.nodes.get(request.toNodeId);
    if (!targetNode) {
      throw new Error(
        `Network 404 : node with id ${request.toNodeId} not found !`
      );
    }
    await targetNode.onReceiveNetworkRequest(request.payload);
  }
}
