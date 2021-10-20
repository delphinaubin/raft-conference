import { EventBus } from "@/domain/event/EventBus";
import { NetworkRequestEventBuilder } from "@/domain/event/NetworkEventBuilder";
import { NodeToNodeRequest } from "@/domain/network/NetworkRequest";
import {cloneDeep} from "lodash";

export class NodeToNodeNetworkManager {
  constructor(private readonly eventBus: EventBus) {}

  private disabledConnections = new Set<string>();

  disableConnection(senderNodeId: string, receiverNodeId: string): void {
    this.disabledConnections.add(`${senderNodeId}-->${receiverNodeId}`);
  }

  enableConnection(senderNodeId: string, receiverNodeId: string): void {
    this.disabledConnections.delete(`${senderNodeId}-->${receiverNodeId}`);
  }

  sendRequest(request: NodeToNodeRequest): void {
    const toAvoidSharingMemoryBetweenNodes = cloneDeep(request);
    if (
      this.isConnectionEnabled(request.senderNodeId, request.receiverNodeId)
    ) {
      this.eventBus.emitEvent(
        NetworkRequestEventBuilder.aNetworkRequestEvent()
          .withNetworkRequest(toAvoidSharingMemoryBetweenNodes)
          .build()
      );
    } else {
      console.log(
        `Request ${request.type} from node ${request.senderNodeId} to node ${request.receiverNodeId} does not get through`
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
