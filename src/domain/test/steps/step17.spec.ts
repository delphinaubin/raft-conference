import { getCandidateStateMock } from "@/domain/test/getCandidateStateMock";
import { LogRequestBuilder } from "@/domain/framework/network/LogRequestBuilder";
import { getLeaderStateMock } from "@/domain/test/getLeaderStateMock";
import { VoteRequestBuilder } from "@/domain/framework/network/VoteRequestBuilder";
import { VoteResponseBuilder } from "@/domain/framework/network/VoteResponseBuilder";

describe("Step 17", () => {
  test("Candidate doesn't become follower on LogRequest when LogRequest term is lower than its term", () => {
    const candidateNodeId = "3";
    const { candidateState, dependencies } = getCandidateStateMock(
      candidateNodeId,
      ["1", "2", candidateNodeId]
    );
    const candidateTerm = 3;
    const leaderTerm = candidateTerm - 1;
    dependencies.nodeMemoryState.term = candidateTerm;
    dependencies.eventBus.subscribe((event) => {
      if (
        event.event.type === "change-state" &&
        event.event.toState === "follower" &&
        event.event.nodeId === candidateNodeId
      ) {
        throw "Candidate should not become follower because its term is greater";
      }
    });
    candidateState.onReceiveNetworkRequest(
      LogRequestBuilder.aLogRequest()
        .withSenderNodeId("1")
        .withReceiverNodeId(candidateNodeId)
        .withLogEntries([])
        .withTerm(leaderTerm)
        .build()
    );
  });
  test("Candidate which becomes follower on LogRequest updates its term", () => {
    const candidateNodeId = "3";
    const { candidateState, dependencies } = getCandidateStateMock(
      candidateNodeId,
      ["1", "2", candidateNodeId]
    );
    const candidateTerm = 3;
    const leaderTerm = candidateTerm + 2;
    dependencies.nodeMemoryState.term = candidateTerm;
    candidateState.onReceiveNetworkRequest(
      LogRequestBuilder.aLogRequest()
        .withSenderNodeId("1")
        .withReceiverNodeId(candidateNodeId)
        .withLogEntries([])
        .withTerm(leaderTerm)
        .build()
    );

    expect(dependencies.nodeMemoryState.term).toEqual(leaderTerm);
  });

  test("Leader which receives a LogRequest with a greater term than him votes ok and becomes follower", (done) => {
    jest.setTimeout(500);
    expect.assertions(3);
    const leaderNodeId = "1";
    const candidateNodeId = "3";
    const { leaderState, dependencies } = getLeaderStateMock(leaderNodeId, [
      leaderNodeId,
      "2",
      candidateNodeId,
    ]);
    const leaderTerm = 1;
    const candidateTerm = leaderTerm + 1;
    dependencies.nodeMemoryState.term = leaderTerm;

    dependencies.eventBus.subscribe((event) => {
      if (
        event.event.type === "change-state" &&
        event.event.toState === "follower" &&
        event.event.nodeId === leaderNodeId
      ) {
        done();
      }
    });

    leaderState.onReceiveNetworkRequest(
      VoteRequestBuilder.aVoteRequest()
        .withSenderNodeId(candidateNodeId)
        .withReceiverNodeId(leaderNodeId)
        .withTerm(candidateTerm)
        .build()
    );
    expect(dependencies.nodeMemoryState.votedFor).toEqual(candidateNodeId);
    expect(dependencies.nodeMemoryState.term).toEqual(candidateTerm);
    expect(dependencies.networkManager.sendRequest).toHaveBeenCalledWith(
      VoteResponseBuilder.aVoteResponse()
        .withSenderNodeId(leaderNodeId)
        .withReceiverNodeId(candidateNodeId)
        .withGranted(true)
        .build()
    );
  });

  test("Leader which receives a LogRequest with a lesser or equal term rejects it", () => {
    const leaderNodeId = "1";
    const candidateNodeId = "3";
    const { leaderState, dependencies } = getLeaderStateMock(leaderNodeId, [
      leaderNodeId,
      "2",
      candidateNodeId,
    ]);
    const leaderTerm = 1;
    const candidateTerm = leaderTerm - 1;
    dependencies.nodeMemoryState.term = leaderTerm;

    dependencies.eventBus.subscribe((event) => {
      if (
        event.event.type === "change-state" &&
        event.event.toState === "follower" &&
        event.event.nodeId === leaderNodeId
      ) {
        throw "Leader should not become follower because it has a greater or equal term";
      }
    });

    leaderState.onReceiveNetworkRequest(
      VoteRequestBuilder.aVoteRequest()
        .withSenderNodeId(candidateNodeId)
        .withReceiverNodeId(leaderNodeId)
        .withTerm(candidateTerm)
        .build()
    );
    expect(dependencies.nodeMemoryState.votedFor).not.toEqual(candidateNodeId);
    expect(dependencies.nodeMemoryState.term).toEqual(leaderTerm);
    expect(dependencies.networkManager.sendRequest).not.toHaveBeenCalled();
  });
});
