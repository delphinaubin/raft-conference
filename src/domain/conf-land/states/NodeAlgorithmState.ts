import {
  AbstractNodeAlgorithmState,
  ConcreteNodeToNodeNetworkRequestBuilder,
} from "@/domain/framework/raft/states/AbstractNodeAlgorithmState";
import {
  isRequestIsNodeToNodeRequest,
  NetworkRequest,
} from "@/domain/framework/network/NetworkRequest";

export abstract class NodeAlgorithmState extends AbstractNodeAlgorithmState {
  onReceiveNetworkRequest(request: NetworkRequest): void {
    if (isRequestIsNodeToNodeRequest(request)) {
      if (request.term > this.nodeMemoryState.term) {
        this.nodeMemoryState.term = request.term;
        this.changeState("follower");
        return;
      }
    }
    super.onReceiveNetworkRequest(request);
  }

  protected sendNetworkRequest(
    requestBuilder: ConcreteNodeToNodeNetworkRequestBuilder
  ): void {
    super.sendNetworkRequest(
      requestBuilder.withTerm(this.nodeMemoryState.term)
    );
  }
}
