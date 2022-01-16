import { BroadcastRequestBuilder } from "@/domain/framework/network/BroadcastRequestBuilder";
import { getLeaderStateMock } from "@/domain/test/getLeaderStateMock";

describe("Step 2", () => {
  test("leader persistence", () => {
    const { leaderState, dependencies } = getLeaderStateMock("1", ["1"]);
    leaderState.onReceiveNetworkRequest(
      BroadcastRequestBuilder.aBroadcastRequest()
        .withReceiverNodeId("1")
        .withLog(42)
        .build()
    );

    expect(dependencies.nodeMemoryState.log).toEqual([
      {
        term: 0,
        value: 42,
      },
    ]);
  });
});
