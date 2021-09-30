import { EventBus } from "@/domain/event/EventBus";
import { NetworkRequestEventBuilder } from "@/domain/event/NetworkEventBuilder";

export interface NetworkRequest<T = unknown> {
  fromNodeId: string;
  toNodeId: string;
  payload: T;
}

export class NetworkManager {
  constructor(private readonly eventBus: EventBus) {}

  private disabledConnections = new Set<string>();

  disableConnection(fromNodeId: string, toNodeId: string): void {
    this.disabledConnections.add(`${fromNodeId}-->${toNodeId}`);
  }

  enableConnection(fromNodeId: string, toNodeId: string): void {
    this.disabledConnections.delete(`${fromNodeId}-->${toNodeId}`);
  }

  async sendRequest(request: NetworkRequest): Promise<void> {
    if (this.isConnectionEnabled(request.fromNodeId, request.toNodeId)) {
      await this.eventBus.emitEvent(
        NetworkRequestEventBuilder.aNetworkRequestEvent()
          .withFromNodeId(request.fromNodeId)
          .withToNodeId(request.toNodeId)
          .withPayload(request.payload)
          .build()
      );
    }
  }

  private isConnectionEnabled(fromNodeId: string, toNodeId: string): boolean {
    return !this.disabledConnections.has(`${fromNodeId}-->${toNodeId}`);
  }
}
