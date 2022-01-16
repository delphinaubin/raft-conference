import { getLeaderStateMock } from "@/domain/test/getLeaderStateMock";
import { LogRequestBuilder } from "@/domain/framework/network/LogRequestBuilder";
import { TimerEventBuilder } from "@/domain/framework/event/TimerEventBuilder";
import { differ } from "@/domain/test/differ";
import { BroadcastRequestBuilder } from "@/domain/framework/network/BroadcastRequestBuilder";
import Mock = jest.Mock;

describe("Step 6", () => {
  test("Leader sends log requests periodically", (done) => {
    const timerId = 12;
    const leaderNodeId = "1";
    const { leaderState, dependencies } = getLeaderStateMock(leaderNodeId, [
      leaderNodeId,
      "2",
      "3",
    ]);
    dependencies.networkManager.sendRequest = jest.fn();
    dependencies.timerManager.startTimer = jest.fn().mockReturnValue(timerId);
    leaderState.onEnterInState();
    expect(dependencies.networkManager.sendRequest).toHaveBeenCalledWith(
      LogRequestBuilder.aLogRequest()
        .withReceiverNodeId("2")
        .withSenderNodeId(leaderNodeId)
        .withLogEntries([])
        .build()
    );
    expect(dependencies.networkManager.sendRequest).toHaveBeenCalledWith(
      LogRequestBuilder.aLogRequest()
        .withReceiverNodeId("3")
        .withSenderNodeId(leaderNodeId)
        .withLogEntries([])
        .build()
    );

    expect(dependencies.timerManager.startTimer).toHaveBeenCalledWith(
      3_000,
      leaderNodeId,
      expect.any(String)
    );
    (dependencies.networkManager.sendRequest as Mock).mockClear();
    (dependencies.timerManager.startTimer as Mock).mockClear();

    dependencies.eventBus.emitEvent(
      TimerEventBuilder.aTimerEvent()
        .withTimerId(timerId)
        .withLabel("dummy timer")
        .withStatus("ended")
        .startedByNodeId(leaderNodeId)
        .build()
    );

    differ(() => {
      expect(dependencies.networkManager.sendRequest).toHaveBeenCalledWith(
        LogRequestBuilder.aLogRequest()
          .withReceiverNodeId("2")
          .withSenderNodeId(leaderNodeId)
          .withLogEntries([])
          .build()
      );
      expect(dependencies.networkManager.sendRequest).toHaveBeenCalledWith(
        LogRequestBuilder.aLogRequest()
          .withReceiverNodeId("3")
          .withSenderNodeId(leaderNodeId)
          .withLogEntries([])
          .build()
      );
      expect(dependencies.timerManager.startTimer).toHaveBeenCalledWith(
        3_000,
        leaderNodeId,
        expect.any(String)
      );
      done();
    });
  });

  test("leader's broadcast request doesn't send log request anymore", () => {
    const leaderNodeId = "1";
    const { leaderState, dependencies } = getLeaderStateMock(leaderNodeId, [
      leaderNodeId,
      "2",
      "3",
    ]);
    dependencies.networkManager.sendRequest = jest.fn();
    leaderState.onReceiveNetworkRequest(
      BroadcastRequestBuilder.aBroadcastRequest()
        .withReceiverNodeId(leaderNodeId)
        .withLog(42)
        .build()
    );
    expect(dependencies.networkManager.sendRequest).not.toHaveBeenCalled();
  });
});
