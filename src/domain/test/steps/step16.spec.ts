import { getFollowerStateMock } from "@/domain/test/getFollowerStateMock";
import { LogRequestBuilder } from "@/domain/framework/network/LogRequestBuilder";
import { LogResponseBuilder } from "@/domain/framework/network/LogResponseBuilder";
import Mock = jest.Mock;

describe("Step 16", () => {
  test("Follower rejects LogRequest if leader's commit is lower than its commit", () => {
    const followerNodeId = "2";
    const { followerState, dependencies } = getFollowerStateMock(
      followerNodeId,
      ["1", followerNodeId, "3"]
    );

    const followerCommitLength = 3;
    const leaderCommitLength = followerCommitLength - 1;
    dependencies.nodeMemoryState.commitLength = followerCommitLength;

    const followerTerm = 1;
    dependencies.nodeMemoryState.term = followerTerm;
    const leaderTerm = 2;

    const oldFollowerLeaderId = "old leader";
    dependencies.nodeMemoryState.leader = oldFollowerLeaderId;

    const leaderLogEntries = [
      {
        value: 2,
        term: 1,
      },
      {
        value: 3,
        term: 1,
      },
    ];
    const followerLogEntries = [
      {
        value: 2,
        term: 1,
      },
      {
        value: 3,
        term: 1,
      },
      {
        value: 4,
        term: 1,
      },
    ];
    dependencies.nodeMemoryState.log = followerLogEntries;
    followerState.onEnterInState();
    (dependencies.timerManager.startTimer as Mock).mockClear();
    followerState.onReceiveNetworkRequest(
      LogRequestBuilder.aLogRequest()
        .withSenderNodeId("1")
        .withReceiverNodeId(followerNodeId)
        .withLogEntries(leaderLogEntries)
        .withLeaderCommit(leaderCommitLength)
        .withTerm(leaderTerm)
        .build()
    );

    expect(dependencies.nodeMemoryState.log).toEqual(followerLogEntries);
    expect(dependencies.timerManager.cancelTimer).not.toHaveBeenCalled();
    expect(dependencies.timerManager.startTimer).not.toHaveBeenCalled();
    expect(dependencies.nodeMemoryState.leader).toEqual(oldFollowerLeaderId);
    expect(dependencies.nodeMemoryState.term).toEqual(followerTerm);

    expect(dependencies.nodeMemoryState.commitLength).toEqual(
      followerCommitLength
    );
    expect(dependencies.networkManager.sendRequest).toHaveBeenCalledWith(
      LogResponseBuilder.aLogResponse()
        .withSenderNodeId(followerNodeId)
        .withReceiverNodeId("1")
        .withAckLength(3)
        .withSuccess(false)
        .build()
    );
  });
});
