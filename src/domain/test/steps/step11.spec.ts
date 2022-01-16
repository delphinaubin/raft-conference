import { getCandidateStateMock } from "@/domain/test/getCandidateStateMock";
import { getLeaderStateMock } from "@/domain/test/getLeaderStateMock";
import { LogRequestBuilder } from "@/domain/framework/network/LogRequestBuilder";
import { getFollowerStateMock } from "@/domain/test/getFollowerStateMock";
import Mock = jest.Mock;

describe("Step 11", () => {
  test("when a node becomes candidate it increments its term", () => {
    const candidateNodeId = "3";
    const { candidateState, dependencies } = getCandidateStateMock(
      candidateNodeId,
      ["1", "2", candidateNodeId]
    );
    dependencies.nodeMemoryState.term = 2;
    candidateState.onEnterInState();
    expect(dependencies.nodeMemoryState.term).toEqual(2 + 1);
  });

  test("leader sends its term in log requests", () => {
    const leaderNodeId = "3";
    const { leaderState, dependencies } = getLeaderStateMock(leaderNodeId, [
      leaderNodeId,
      "2",
      "3",
    ]);
    const leaderTerm = 3;
    dependencies.nodeMemoryState.term = leaderTerm;
    leaderState.onEnterInState();

    expect(dependencies.networkManager.sendRequest).toHaveBeenCalledWith(
      LogRequestBuilder.aLogRequest()
        .withSenderNodeId(leaderNodeId)
        .withReceiverNodeId("2")
        .withLogEntries([])
        .withTerm(leaderTerm)
        .build()
    );
  });

  test("if a follower receives a log request with old term, it rejects it", () => {
    const followerNodeId = "2";
    const { followerState, dependencies } = getFollowerStateMock(
      followerNodeId,
      ["1", followerNodeId, "3"]
    );
    const followerTerm = 3;
    dependencies.nodeMemoryState.term = followerTerm;
    const logEntriesToReject = [
      {
        term: 1,
        value: 42,
      },
    ];
    dependencies.nodeMemoryState.log = [];
    const actualLeader = "actualLeader";
    dependencies.nodeMemoryState.leader = actualLeader;
    followerState.onEnterInState();
    (dependencies.timerManager.startTimer as Mock).mockClear();
    followerState.onReceiveNetworkRequest(
      LogRequestBuilder.aLogRequest()
        .withSenderNodeId("1")
        .withReceiverNodeId(followerNodeId)
        .withLogEntries(logEntriesToReject)
        .withTerm(followerTerm - 1)
        .build()
    );
    expect(dependencies.nodeMemoryState.log).not.toEqual(logEntriesToReject);
    expect(dependencies.timerManager.cancelTimer).not.toHaveBeenCalled();
    expect(dependencies.timerManager.startTimer).not.toHaveBeenCalled();
    expect(dependencies.nodeMemoryState.leader).toEqual(actualLeader);
  });

  test("if follower receives a log request with greater or equal term it accepts it and updates its term", () => {
    const followerNodeId = "2";
    const { followerState, dependencies } = getFollowerStateMock(
      followerNodeId,
      ["1", followerNodeId, "3"]
    );
    const followerTerm = 3;
    dependencies.nodeMemoryState.term = followerTerm;
    const logEntriesToAccept = [
      {
        term: 1,
        value: 42,
      },
    ];
    const newLeaderId = "1";
    dependencies.nodeMemoryState.log = [];
    const actualLeader = "actualLeader";
    dependencies.nodeMemoryState.leader = actualLeader;
    followerState.onEnterInState();
    (dependencies.timerManager.startTimer as Mock).mockClear();
    const newLeaderTerm = followerTerm + 1;
    followerState.onReceiveNetworkRequest(
      LogRequestBuilder.aLogRequest()
        .withSenderNodeId(newLeaderId)
        .withReceiverNodeId(followerNodeId)
        .withLogEntries(logEntriesToAccept)
        .withTerm(newLeaderTerm)
        .build()
    );
    expect(dependencies.nodeMemoryState.log).toEqual(logEntriesToAccept);
    expect(dependencies.timerManager.cancelTimer).toHaveBeenCalled();
    expect(dependencies.timerManager.startTimer).toHaveBeenCalled();
    expect(dependencies.nodeMemoryState.leader).toEqual(newLeaderId);
    expect(dependencies.nodeMemoryState.term).toEqual(newLeaderTerm);
  });
});
