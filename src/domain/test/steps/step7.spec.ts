import { getFollowerStateMock } from "@/domain/test/getFollowerStateMock";
import { fakeRandomTimerDurationWithMinimumTime } from "@/domain/test/fakeRandomTimerDurationWithMinimumTime";
import { TimerEventBuilder } from "@/domain/framework/event/TimerEventBuilder";
import { LogRequestBuilder } from "@/domain/framework/network/LogRequestBuilder";
import Mock = jest.Mock;

describe("Step 7", () => {
  it("promotes follower to leader if it didnt receive log request from leader (should fail after step 9)", (done) => {
    if (+process.env.stepNumber >= 9) {
      done()
      return;
    }
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
        event.event.toState === "leader" &&
        event.event.nodeId === followerNodeId
      ) {
        done();
      }
    });
  });

  it("cancel timer when the follower receives a leader log request", () => {
    const followerNodeId = "2";
    const timerId = 12;
    const { followerState, dependencies } = getFollowerStateMock(
      followerNodeId,
      ["1", followerNodeId]
    );
    dependencies.timerManager.startTimer = jest.fn().mockReturnValue(timerId);
    dependencies.timerManager.cancelTimer = jest.fn();

    followerState.onEnterInState();
    (dependencies.timerManager.startTimer as Mock).mockClear();
    followerState.onReceiveNetworkRequest(
      LogRequestBuilder.aLogRequest()
        .withLogEntries([])
        .withReceiverNodeId(followerNodeId)
        .withSenderNodeId("1")
        .build()
    );

    expect(dependencies.timerManager.cancelTimer).toHaveBeenCalledWith(timerId);
    expect(dependencies.timerManager.startTimer).toHaveBeenCalledWith(
      fakeRandomTimerDurationWithMinimumTime(followerNodeId, 4_000),
      followerNodeId,
      expect.any(String)
    );
  });
});
