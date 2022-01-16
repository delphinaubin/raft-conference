import { getLeaderStateMock } from "@/domain/test/getLeaderStateMock";
import { BroadcastRequestBuilder } from "@/domain/framework/network/BroadcastRequestBuilder";
import { getFollowerStateMock } from "@/domain/test/getFollowerStateMock";
import { LogRequestBuilder } from "@/domain/framework/network/LogRequestBuilder";
import { LogResponseBuilder } from "@/domain/framework/network/LogResponseBuilder";
import { TimerEventBuilder } from "@/domain/framework/event/TimerEventBuilder";

describe("Step 15", () => {
  test("Leader update its ack on BroadcastRequest", () => {
    const leaderNodeId = "3";
    const { leaderState, dependencies } = getLeaderStateMock(leaderNodeId, [
      leaderNodeId,
      "2",
      "3",
    ]);

    dependencies.nodeMemoryState.ackedLength[leaderNodeId] = 0;
    leaderState.onReceiveNetworkRequest(
      BroadcastRequestBuilder.aBroadcastRequest()
        .withReceiverNodeId(leaderNodeId)
        .withLog(42)
        .build()
    );

    expect(dependencies.nodeMemoryState.log).toHaveLength(1);
    expect(dependencies.nodeMemoryState.ackedLength[leaderNodeId]).toEqual(1);
  });

  describe("Follower sends log response to leader", () => {
    test("success true if leader has greater or equal term", () => {
      const followerNodeId = "2";
      const leaderNodeId = "1";
      const { followerState, dependencies } = getFollowerStateMock(
        followerNodeId,
        [leaderNodeId, followerNodeId, "3"]
      );

      const followerTerm = 2;
      const leaderTerm = followerTerm + 1;
      dependencies.nodeMemoryState.term = followerTerm;

      const leaderLogEntries = [
        {
          value: 42,
          term: 0,
        },
      ];
      followerState.onReceiveNetworkRequest(
        LogRequestBuilder.aLogRequest()
          .withSenderNodeId(leaderNodeId)
          .withReceiverNodeId(followerNodeId)
          .withLogEntries(leaderLogEntries)
          .withTerm(leaderTerm)
          .build()
      );

      expect(dependencies.networkManager.sendRequest).toHaveBeenCalledWith(
        LogResponseBuilder.aLogResponse()
          .withSenderNodeId(followerNodeId)
          .withReceiverNodeId(leaderNodeId)
          .withAckLength(leaderLogEntries.length)
          .withSuccess(true)
          .build()
      );
    });
    test("success false if leader has lower term", () => {
      const followerNodeId = "2";
      const leaderNodeId = "1";
      const { followerState, dependencies } = getFollowerStateMock(
        followerNodeId,
        [leaderNodeId, followerNodeId, "3"]
      );

      const followerTerm = 2;
      const leaderTerm = followerTerm - 1;
      dependencies.nodeMemoryState.term = followerTerm;

      const leaderLogEntries = [
        {
          value: 42,
          term: 0,
        },
      ];
      followerState.onReceiveNetworkRequest(
        LogRequestBuilder.aLogRequest()
          .withTerm(leaderTerm)
          .withSenderNodeId(leaderNodeId)
          .withReceiverNodeId(followerNodeId)
          .withLogEntries(leaderLogEntries)
          .build()
      );

      expect(dependencies.networkManager.sendRequest).toHaveBeenCalledWith(
        LogResponseBuilder.aLogResponse()
          .withSenderNodeId(followerNodeId)
          .withReceiverNodeId(leaderNodeId)
          .withAckLength(0)
          .withSuccess(false)
          .build()
      );
    });
  });

  describe("Leader updates follower acks in its nodeMemoryState on LogResponse", () => {
    describe("success case", () => {
      test("Leader updates ackLength, and update the commitLength when the majority of consumer has updated ackLength", () => {
        const leaderNodeId = "3";
        const followerNodeId = "2";
        const { leaderState, dependencies } = getLeaderStateMock(leaderNodeId, [
          leaderNodeId,
          followerNodeId,
          "3",
        ]);

        const lastAckLength = 2;
        dependencies.nodeMemoryState.log = [
          {
            value: 12,
            term: 1,
          },
          {
            value: 24,
            term: 1,
          },
        ];
        dependencies.nodeMemoryState.ackedLength[leaderNodeId] = lastAckLength;

        leaderState.onReceiveNetworkRequest(
          LogResponseBuilder.aLogResponse()
            .withSenderNodeId(followerNodeId)
            .withReceiverNodeId(leaderNodeId)
            .withAckLength(lastAckLength)
            .withSuccess(true)
            .build()
        );

        expect(
          dependencies.nodeMemoryState.ackedLength[followerNodeId]
        ).toEqual(lastAckLength);

        expect(dependencies.nodeMemoryState.commitLength).toEqual(
          lastAckLength
        );
      });
      test("Leader updates ackLength, but doesn't update the commitLength when the majority of consumer has not updated ackLength", () => {
        const leaderNodeId = "3";
        const followerNodeId = "2";
        const { leaderState, dependencies } = getLeaderStateMock(leaderNodeId, [
          leaderNodeId,
          followerNodeId,
          "3",
          "4",
          "5",
        ]);

        const lastAckLength = 2;
        dependencies.nodeMemoryState.log = [
          {
            value: 12,
            term: 1,
          },
          {
            value: 24,
            term: 1,
          },
        ];
        dependencies.nodeMemoryState.ackedLength[leaderNodeId] = lastAckLength;
        const oldCommitLength = 1;
        dependencies.nodeMemoryState.commitLength = oldCommitLength;

        leaderState.onReceiveNetworkRequest(
          LogResponseBuilder.aLogResponse()
            .withSenderNodeId(followerNodeId)
            .withReceiverNodeId(leaderNodeId)
            .withAckLength(lastAckLength)
            .withSuccess(true)
            .build()
        );

        expect(
          dependencies.nodeMemoryState.ackedLength[followerNodeId]
        ).toEqual(lastAckLength);

        expect(dependencies.nodeMemoryState.commitLength).toEqual(
          oldCommitLength
        );
      });
    });

    test("failure case", () => {
      const leaderNodeId = "3";
      const followerNodeId = "2";
      const { leaderState, dependencies } = getLeaderStateMock(leaderNodeId, [
        leaderNodeId,
        followerNodeId,
        "3",
      ]);

      const oldFollowerAckLength = 1;
      dependencies.nodeMemoryState.ackedLength[followerNodeId] =
        oldFollowerAckLength;

      const followerAckLength = 2;
      leaderState.onReceiveNetworkRequest(
        LogResponseBuilder.aLogResponse()
          .withSenderNodeId(followerNodeId)
          .withReceiverNodeId(leaderNodeId)
          .withAckLength(followerAckLength)
          .withSuccess(false)
          .build()
      );

      expect(dependencies.nodeMemoryState.ackedLength[followerNodeId]).toEqual(
        oldFollowerAckLength
      );
    });
  });

  test("Leader sends its commit length il LogRequest ", () => {
    const leaderNodeId = "1";
    const { leaderState, dependencies } = getLeaderStateMock(leaderNodeId, [
      leaderNodeId,
      "2",
      "3",
    ]);

    const timerId = 32;
    dependencies.timerManager.startTimer = jest.fn().mockReturnValue(timerId);
    const leaderCommit = 3;
    dependencies.nodeMemoryState.commitLength = leaderCommit;

    leaderState.onEnterInState();
    dependencies.eventBus.emitEvent(
      TimerEventBuilder.aTimerEvent()
        .withTimerId(timerId)
        .withLabel("dummy timer")
        .withStatus("ended")
        .startedByNodeId(leaderNodeId)
        .build()
    );

    expect(dependencies.networkManager.sendRequest).toHaveBeenCalledWith(
      LogRequestBuilder.aLogRequest()
        .withSenderNodeId(leaderNodeId)
        .withReceiverNodeId("2")
        .withLogEntries([])
        .withLeaderCommit(leaderCommit)
        .build()
    );

    expect(dependencies.networkManager.sendRequest).toHaveBeenCalledWith(
      LogRequestBuilder.aLogRequest()
        .withSenderNodeId(leaderNodeId)
        .withReceiverNodeId("3")
        .withLogEntries([])
        .withLeaderCommit(leaderCommit)
        .build()
    );
  });

  test("Follower updates its commitLength on leader LogRequest with up to date term", () => {
    const followerNodeId = "2";
    const { followerState, dependencies } = getFollowerStateMock(
      followerNodeId,
      ["1", followerNodeId, "3"]
    );
    dependencies.nodeMemoryState.commitLength = 1;
    const leaderCommitLength = 2;
    followerState.onReceiveNetworkRequest(
      LogRequestBuilder.aLogRequest()
        .withSenderNodeId("1")
        .withReceiverNodeId(followerNodeId)
        .withLogEntries([])
        .withLeaderCommit(leaderCommitLength)
        .build()
    );

    expect(dependencies.nodeMemoryState.commitLength).toEqual(
      leaderCommitLength
    );
  });

  test("Follower doesn't update its commitLength on leader LogRequest with outdated term", () => {
    const followerNodeId = "2";
    const { followerState, dependencies } = getFollowerStateMock(
      followerNodeId,
      ["1", followerNodeId, "3"]
    );
    dependencies.nodeMemoryState.commitLength = 1;
    const followerTerm = 3;
    dependencies.nodeMemoryState.term = followerTerm;
    const followerCommitLength = 1;
    dependencies.nodeMemoryState.commitLength = followerCommitLength;
    const leaderCommitLength = 2;
    followerState.onReceiveNetworkRequest(
      LogRequestBuilder.aLogRequest()
        .withSenderNodeId("1")
        .withTerm(followerTerm - 1)
        .withReceiverNodeId(followerNodeId)
        .withLogEntries([])
        .withLeaderCommit(leaderCommitLength)
        .build()
    );

    expect(dependencies.nodeMemoryState.commitLength).toEqual(
      followerCommitLength
    );
  });
});
