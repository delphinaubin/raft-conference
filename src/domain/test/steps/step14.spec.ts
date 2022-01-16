import { getCandidateStateMock } from "@/domain/test/getCandidateStateMock";
import { VoteRequestBuilder } from "@/domain/framework/network/VoteRequestBuilder";
import { differ } from "@/domain/test/differ";

describe("Step 14", () => {
  test("Candidate sends its term in VoteRequest", () => {
    const candidateNodeId = "3";
    const { candidateState, dependencies } = getCandidateStateMock(
      candidateNodeId,
      ["1", "2", candidateNodeId]
    );
    const candidateTerm = 4;
    dependencies.nodeMemoryState.term = candidateTerm;
    candidateState.onEnterInState();

    expect(dependencies.networkManager.sendRequest).toHaveBeenCalledWith(
      VoteRequestBuilder.aVoteRequest()
        .withTerm(candidateTerm)
        .withReceiverNodeId("1")
        .withSenderNodeId(candidateNodeId)
        .build()
    );

    expect(dependencies.networkManager.sendRequest).toHaveBeenCalledWith(
      VoteRequestBuilder.aVoteRequest()
        .withTerm(candidateTerm)
        .withReceiverNodeId("2")
        .withSenderNodeId(candidateNodeId)
        .build()
    );
  });

  test("When a candidate receives a VoteRequest with a greater term than his it becomes follower", (done) => {
    expect.assertions(3);
    jest.setTimeout(500);
    const candidateNodeId = "3";
    const { candidateState, dependencies } = getCandidateStateMock(
      candidateNodeId,
      ["1", "2", candidateNodeId]
    );

    const candidateTerm = 2;
    dependencies.nodeMemoryState.term = candidateTerm;
    dependencies.nodeMemoryState.votedFor = candidateNodeId;
    dependencies.nodeMemoryState.nodesWhichVotedForMe.add(candidateNodeId);

    const otherCandidateTerm = candidateTerm + 1;

    differ(() => {
      candidateState.onReceiveNetworkRequest(
        VoteRequestBuilder.aVoteRequest()
          .withReceiverNodeId(candidateNodeId)
          .withSenderNodeId("1")
          .withTerm(otherCandidateTerm)
          .build()
      );
      expect(dependencies.nodeMemoryState.term).toEqual(otherCandidateTerm);
      expect(dependencies.nodeMemoryState.votedFor).toBeUndefined();
      expect(dependencies.nodeMemoryState.nodesWhichVotedForMe.size).toEqual(0);
    });
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

  test("When a candidate receives a VoteRequest with a lower term than his it rejects it", (done) => {
    jest.setTimeout(500);
    const candidateNodeId = "3";
    const { candidateState, dependencies } = getCandidateStateMock(
      candidateNodeId,
      ["1", "2", candidateNodeId]
    );

    const candidateTerm = 2;
    dependencies.nodeMemoryState.term = candidateTerm;
    dependencies.nodeMemoryState.votedFor = candidateNodeId;
    dependencies.nodeMemoryState.nodesWhichVotedForMe.add(candidateNodeId);

    const otherCandidateTerm = candidateTerm - 1;

    differ(() => {
      candidateState.onReceiveNetworkRequest(
        VoteRequestBuilder.aVoteRequest()
          .withReceiverNodeId(candidateNodeId)
          .withSenderNodeId("1")
          .withTerm(otherCandidateTerm)
          .build()
      );
      expect(dependencies.nodeMemoryState.term).toEqual(candidateTerm);
      expect(dependencies.nodeMemoryState.votedFor).toEqual(candidateNodeId);
      expect(dependencies.nodeMemoryState.nodesWhichVotedForMe.size).toEqual(1);
      done();
    });
    dependencies.eventBus.subscribe((event) => {
      if (
        event.event.type === "change-state" &&
        event.event.toState === "follower" &&
        event.event.nodeId === candidateNodeId
      ) {
        throw "Candidate should not become follower because its term is greater";
      }
    });
  });
});
