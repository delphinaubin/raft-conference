import { getLeaderStateMock } from "@/domain/test/getLeaderStateMock";
import { BroadcastRequestBuilder } from "@/domain/framework/network/BroadcastRequestBuilder";
import { LogRequestBuilder } from "@/domain/framework/network/LogRequestBuilder";
import { getFollowerStateMock } from "@/domain/test/getFollowerStateMock";

describe("Step 5", () => {
  const leaderNodeId = "1";
  test("leader's broadcast request sends log request (should fail after step 6)", () => {
    const { leaderState, dependencies } = getLeaderStateMock(leaderNodeId, [
      leaderNodeId,
      "2",
      "3",
    ]);
    dependencies.networkManager.sendRequest = jest.fn();
    leaderState.onReceiveNetworkRequest(
      BroadcastRequestBuilder.aBroadcastRequest()
        .withReceiverNodeId(leaderNodeId)
        .withLog(42)
        .build()
    );
    expect(dependencies.networkManager.sendRequest).toHaveBeenCalledWith(
      LogRequestBuilder.aLogRequest()
        .withReceiverNodeId("2")
        .withSenderNodeId(leaderNodeId)
        .withLogEntries([{ term: 0, value: 42 }])
        .build()
    );
    expect(dependencies.networkManager.sendRequest).toHaveBeenCalledWith(
      LogRequestBuilder.aLogRequest()
        .withReceiverNodeId("3")
        .withSenderNodeId(leaderNodeId)
        .withLogEntries([{ term: 0, value: 42 }])
        .build()
    );
  });

  test("follower should persist log on log request", () => {
    const { followerState, dependencies } = getFollowerStateMock(leaderNodeId, [
      leaderNodeId,
    ]);
    const someLogEntries = [{ term: 0, value: 42 }];
    followerState.onReceiveNetworkRequest(
      LogRequestBuilder.aLogRequest()
        .withSenderNodeId("0")
        .withReceiverNodeId(leaderNodeId)
        .withLogEntries(someLogEntries)
        .build()
    );

    expect(dependencies.nodeMemoryState.log).toEqual(someLogEntries);
  });
});
