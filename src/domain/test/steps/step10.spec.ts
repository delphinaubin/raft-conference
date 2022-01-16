import { getCandidateStateMock } from "@/domain/test/getCandidateStateMock";
import { differ } from "@/domain/test/differ";
import { LogRequestBuilder } from "@/domain/framework/network/LogRequestBuilder";

describe("Step 10", () => {
  test("candidate which received a log request becomes follower", (done) => {
    jest.setTimeout(500);
    const candidateNodeId = "3";
    const { candidateState, dependencies } = getCandidateStateMock(
      candidateNodeId,
      ["1", "2", candidateNodeId]
    );

    differ(() =>
      candidateState.onReceiveNetworkRequest(
        LogRequestBuilder.aLogRequest()
          .withSenderNodeId("1")
          .withReceiverNodeId(candidateNodeId)
          .withLogEntries([])
          .build()
      )
    );

    dependencies.eventBus.subscribe((event) => {
      if (
        event.event.type === "change-state" &&
        event.event.toState === "follower" &&
        event.event.nodeId === candidateNodeId
      ) {
        done();
      }
    });
  });
});
