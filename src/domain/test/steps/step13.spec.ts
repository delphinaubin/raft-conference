import { getCandidateStateMock } from "@/domain/test/getCandidateStateMock";
import { fakeRandomTimerDurationWithMinimumTime } from "@/domain/test/fakeRandomTimerDurationWithMinimumTime";
import { TimerEventBuilder } from "@/domain/framework/event/TimerEventBuilder";
import { differ } from "@/domain/test/differ";

describe("Step 13", () => {
  test("Candidate restarts its election process if previous one timed out", (done) => {
    const candidateNodeId = "3";
    const { candidateState, dependencies } = getCandidateStateMock(
      candidateNodeId,
      ["1", "2", candidateNodeId]
    );
    const timerId = 1234;
    dependencies.timerManager.startTimer = jest.fn().mockReturnValue(timerId);
    const initialTerm = 4;
    candidateState.onEnterInState();
    expect(dependencies.timerManager.startTimer).toHaveBeenCalledWith(
      fakeRandomTimerDurationWithMinimumTime(candidateNodeId, 500),
      candidateNodeId,
      expect.any(String)
    );
    dependencies.nodeMemoryState.term = initialTerm;
    dependencies.eventBus.emitEvent(
      TimerEventBuilder.aTimerEvent()
        .withTimerId(timerId)
        .withLabel("dummy timer")
        .withStatus("ended")
        .startedByNodeId(candidateNodeId)
        .build()
    );
    differ(() => {
      expect(dependencies.nodeMemoryState.term).toEqual(initialTerm + 1);
      done();
    });
  });
});
