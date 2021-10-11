import { EventBus } from "@/domain/event/EventBus";
import { NetworkRequestEventBuilder } from "@/domain/event/NetworkEventBuilder";
import { NodeToNodeRequest } from "@/domain/network/NetworkRequest";

export class NodeToNodeNetworkManager {
  constructor(private readonly eventBus: EventBus) {}

  private disabledConnections = new Set<string>();

  disableConnection(senderNodeId: string, receiverNodeId: string): void {
    this.disabledConnections.add(`${senderNodeId}-->${receiverNodeId}`);
  }

  enableConnection(senderNodeId: string, receiverNodeId: string): void {
    this.disabledConnections.delete(`${senderNodeId}-->${receiverNodeId}`);
  }

  async sendRequest(request: NodeToNodeRequest): Promise<void> {
    if (
      this.isConnectionEnabled(request.senderNodeId, request.receiverNodeId)
    ) {
      await this.eventBus.emitEvent(
        NetworkRequestEventBuilder.aNetworkRequestEvent()
          .withNetworkRequest(request)
          .build()
      );
    }
  }

  private isConnectionEnabled(
    senderNodeId: string,
    receiverNodeId: string
  ): boolean {
    return !this.disabledConnections.has(`${senderNodeId}-->${receiverNodeId}`);
  }
}