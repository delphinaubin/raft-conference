import { getFollowerStateMock } from "@/domain/test/getFollowerStateMock";
import { fakeRandomTimerDurationWithMinimumTime } from "@/domain/test/fakeRandomTimerDurationWithMinimumTime";
import { TimerEventBuilder } from "@/domain/framework/event/TimerEventBuilder";
import { getCandidateStateMock } from "@/domain/test/getCandidateStateMock";
import { VoteRequestBuilder } from "@/domain/framework/network/VoteRequestBuilder";
import { VoteResponseBuilder } from "@/domain/framework/network/VoteResponseBuilder";
import { differ } from "@/domain/test/differ";

describe("Step 9", () => {
  test("follower becomes candidate when leader fails", (done) => {
    jest.setTimeout(500);
    const followerNodeId = "2";
    const timerId = 12;
    const { followerState, dependencies } = getFollowerStateMock(
      followerNodeId,
      ["1", followerNodeId]
    );
    dependencies.timerManager.startTimer = jest.fn().mockReturnValue(timerId);

    followerState.onEnterInState();

    expect(dependencies.timerManager.startTimer).toHaveBeenCalledWith(
      fakeRandomTimerDurationWithMinimumTime(followerNodeId, 4_000),
      followerNodeId,
      expect.any(String)
    );

    dependencies.eventBus.emitEvent(
      TimerEventBuilder.aTimerEvent()
        .withTimerId(timerId)
        .withLabel("dummy timer")
        .withStatus("ended")
        .startedByNodeId(followerNodeId)
        .build()
    );

    dependencies.eventBus.subscribe((event) => {
      if (
        event.event.type === "change-state" &&
        event.event.toState === "candidate" &&
        event.event.nodeId === followerNodeId
      ) {
        done();
      }
    });
  });

  test("candidate starts election when entering in state", () => {
    const candidateNodeId = "3";
    const { candidateState, dependencies } = getCandidateStateMock(
      candidateNodeId,
      ["1", "2", candidateNodeId]
    );

    dependencies.nodeMemoryState.nodesWhichVotedForMe.add(
      "old node id to remove"
    );
    candidateState.onEnterInState();
    expect(dependencies.nodeMemoryState.votedFor).toEqual(candidateNodeId);
    expect(dependencies.nodeMemoryState.nodesWhichVotedForMe.size).toEqual(1);
    expect(
      dependencies.nodeMemoryState.nodesWhichVotedForMe.has(candidateNodeId)
    ).toBe(true);

    expect(dependencies.networkManager.sendRequest).toHaveBeenCalledWith(
      VoteRequestBuilder.aVoteRequest()
        .withReceiverNodeId("1")
        .withSenderNodeId(candidateNodeId)
        .build()
    );
    expect(dependencies.networkManager.sendRequest).toHaveBeenCalledWith(
      VoteRequestBuilder.aVoteRequest()
        .withReceiverNodeId("2")
        .withSenderNodeId(candidateNodeId)
        .build()
    );
  });

  test("follower votes for candidate if it didn't vote before", () => {
    const candidateNodeId = "3";
    const followerNodeId = "2";
    const { followerState, dependencies } = getFollowerStateMock(
      followerNodeId,
      [followerNodeId, candidateNodeId]
    );

    dependencies.nodeMemoryState.votedFor = undefined;
    followerState.onReceiveNetworkRequest(
      VoteRequestBuilder.aVoteRequest()
        .withReceiverNodeId(followerNodeId)
        .withSenderNodeId(candidateNodeId)
        .build()
    );

    expect(dependencies.networkManager.sendRequest).toHaveBeenCalledWith(
      VoteResponseBuilder.aVoteResponse()
        .withReceiverNodeId(candidateNodeId)
        .withSenderNodeId(followerNodeId)
        .withGranted(true)
        .build()
    );
  });

  test("follower doesn't votes for candidate if it did vote before", () => {
    const candidateNodeId = "3";
    const followerNodeId = "2";
    const { followerState, dependencies } = getFollowerStateMock(
      followerNodeId,
      [followerNodeId, candidateNodeId]
    );

    dependencies.nodeMemoryState.votedFor = "1";
    followerState.onReceiveNetworkRequest(
      VoteRequestBuilder.aVoteRequest()
        .withReceiverNodeId(followerNodeId)
        .withSenderNodeId(candidateNodeId)
        .build()
    );

    expect(dependencies.networkManager.sendRequest).toHaveBeenCalledWith(
      VoteResponseBuilder.aVoteResponse()
        .withReceiverNodeId(candidateNodeId)
        .withSenderNodeId(followerNodeId)
        .withGranted(false)
        .build()
    );
  });

  describe("candidate handles vote response", () => {
    test("candidate adds the vote in its votedFor list", () => {
      const candidateNodeId = "3";
      const followerNodeId = "2";
      const { candidateState, dependencies } = getCandidateStateMock(
        candidateNodeId,
        [followerNodeId, candidateNodeId]
      );

      candidateState.onReceiveNetworkRequest(
        VoteResponseBuilder.aVoteResponse()
          .withSenderNodeId(followerNodeId)
          .withReceiverNodeId(candidateNodeId)
          .withGranted(true)
          .build()
      );

      expect(
        dependencies.nodeMemoryState.nodesWhichVotedForMe.has(followerNodeId)
      ).toBe(true);
    });
    test("candidate doesn't touch its votedFor list if vote response is not granted", () => {
      const candidateNodeId = "3";
      const followerNodeId = "2";
      const { candidateState, dependencies } = getCandidateStateMock(
        candidateNodeId,
        [followerNodeId, candidateNodeId]
      );

      candidateState.onReceiveNetworkRequest(
        VoteResponseBuilder.aVoteResponse()
          .withSenderNodeId(followerNodeId)
          .withReceiverNodeId(candidateNodeId)
          .withGranted(false)
          .build()
      );

      expect(
        dependencies.nodeMemoryState.nodesWhichVotedForMe.has(followerNodeId)
      ).toBe(false);
    });

    test("becomes leader if it gets the majority", (done) => {
      jest.setTimeout(500);
      const candidateNodeId = "3";
      const followerNodeId = "2";
      const { candidateState, dependencies } = getCandidateStateMock(
        candidateNodeId,
        ["1", followerNodeId, candidateNodeId]
      );
      dependencies.nodeMemoryState.nodesWhichVotedForMe.add(candidateNodeId);

      dependencies.eventBus.subscribe((event) => {
        if (
          event.event.type === "change-state" &&
          event.event.toState === "leader" &&
          event.event.nodeId === candidateNodeId
        ) {
          done();
        }
      });
      candidateState.onReceiveNetworkRequest(
        VoteResponseBuilder.aVoteResponse()
          .withSenderNodeId(followerNodeId)
          .withReceiverNodeId(candidateNodeId)
          .withGranted(true)
          .build()
      );
    });
    test("doesn't become leader if it doesn't get the majority", () => {
      const candidateNodeId = "3";
      const followerNodeId = "2";
      const { candidateState, dependencies } = getCandidateStateMock(
        candidateNodeId,
        ["1", followerNodeId, candidateNodeId, "4", "5"]
      );
      dependencies.nodeMemoryState.nodesWhichVotedForMe.add(candidateNodeId);

      differ(() =>
        candidateState.onReceiveNetworkRequest(
          VoteResponseBuilder.aVoteResponse()
            .withSenderNodeId(followerNodeId)
            .withReceiverNodeId(candidateNodeId)
            .withGranted(true)
            .build()
        )
      );

      dependencies.eventBus.subscribe((event) => {
        if (
          event.event.type === "change-state" &&
          event.event.toState === "leader" &&
          event.event.nodeId === candidateNodeId
        ) {
          throw "Should not become leader";
        }
      });
    });
  });
});
