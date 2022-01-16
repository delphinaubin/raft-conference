import { getFollowerStateMock } from "@/domain/test/getFollowerStateMock";
import { LogRequestBuilder } from "@/domain/framework/network/LogRequestBuilder";
import { BroadcastRequestBuilder } from "@/domain/framework/network/BroadcastRequestBuilder";
import { RelayBroadcastRequestBuilder } from "@/domain/framework/network/RelayBroadcastRequestBuilder";

describe("Step 8", () => {
  test("follower registers its leader when it receives a log request", () => {
    const leaderNodeId = "1";
    const followerNodeId = "2";
    const { followerState, dependencies } = getFollowerStateMock(
      followerNodeId,
      [leaderNodeId, followerNodeId]
    );
    followerState.onReceiveNetworkRequest(
      LogRequestBuilder.aLogRequest()
        .withLogEntries([])
        .withReceiverNodeId(followerNodeId)
        .withSenderNodeId(leaderNodeId)
        .build()
    );

    expect(dependencies.nodeMemoryState.leader).toEqual(leaderNodeId);
  });
  test("follower relays incoming broadcast requests to the leader", () => {
    const leaderNodeId = "1";
    const followerNodeId = "2";

    const { followerState, dependencies } = getFollowerStateMock(
      followerNodeId,
      [leaderNodeId, followerNodeId]
    );
    dependencies.nodeMemoryState.leader = leaderNodeId;

    followerState.onReceiveNetworkRequest(
      BroadcastRequestBuilder.aBroadcastRequest()
        .withReceiverNodeId(followerNodeId)
        .withLog(42)
        .build()
    );

    expect(dependencies.networkManager.sendRequest).toHaveBeenCalledWith(
      RelayBroadcastRequestBuilder.aRelayBroadcastRequest()
        .withReceiverNodeId(leaderNodeId)
        .withSenderNodeId(followerNodeId)
        .withLog(42)
        .build()
    );
  });
});
