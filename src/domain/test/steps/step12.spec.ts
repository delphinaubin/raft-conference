import { getLeaderStateMock } from "@/domain/test/getLeaderStateMock";
import { differ } from "@/domain/test/differ";
import { LogRequestBuilder } from "@/domain/framework/network/LogRequestBuilder";

describe("Step 12", () => {
  test("As a leader if I receive a log request with a term greater than mine I update my term and becomes follower", (done) => {
    jest.setTimeout(500);
    expect.assertions(1);
    const leaderNodeId = "3";
    const { leaderState, dependencies } = getLeaderStateMock(leaderNodeId, [
      leaderNodeId,
      "2",
      "3",
    ]);

    const leaderTerm = 2;
    dependencies.nodeMemoryState.term = leaderTerm;
    const newLeaderTerm = leaderTerm + 1;

    differ(() => {
      leaderState.onReceiveNetworkRequest(
        LogRequestBuilder.aLogRequest()
          .withSenderNodeId("2")
          .withReceiverNodeId(leaderNodeId)
          .withTerm(newLeaderTerm)
          .withLogEntries([])
          .build()
      );

      expect(dependencies.nodeMemoryState.term).toEqual(newLeaderTerm);
    });

    dependencies.eventBus.subscribe((event) => {
      if (
        event.event.type === "change-state" &&
        event.event.toState === "follower" &&
        event.event.nodeId === leaderNodeId
      ) {
        done();
      }
    });
  });

  test("As a leader if I receive a log request with a term lower or equal than mine I reject it", (done) => {
    jest.setTimeout(500);
    const leaderNodeId = "3";
    const { leaderState, dependencies } = getLeaderStateMock(leaderNodeId, [
      leaderNodeId,
      "2",
      "3",
    ]);

    const currentLeaderTerm = 2;
    dependencies.nodeMemoryState.term = currentLeaderTerm;
    const outdatedLeaderTerm = currentLeaderTerm - 1;

    differ(() => {
      leaderState.onReceiveNetworkRequest(
        LogRequestBuilder.aLogRequest()
          .withSenderNodeId("2")
          .withReceiverNodeId(leaderNodeId)
          .withTerm(outdatedLeaderTerm)
          .withLogEntries([])
          .build()
      );

      expect(dependencies.nodeMemoryState.term).toEqual(currentLeaderTerm);
      done();
    });

    dependencies.eventBus.subscribe((event) => {
      if (
        event.event.type === "change-state" &&
        event.event.toState === "follower" &&
        event.event.nodeId === leaderNodeId
      ) {
        throw "The leader should not become follower if the log request comes from an outdated leader";
      }
    });
  });
});
