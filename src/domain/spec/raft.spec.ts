import {
  RaftStorage,
  Timers,
  Timer,
  ProdEventBus,
  TimerTimeout,
  NodeRole,
  RaftNode,
  BroadcastEvent,
} from "./raft";

describe("event-bus", () => {
  it("handles single subscriptions", () => {
    const eventBus = new ProdEventBus();
    let function1Called = false;
    let function2Called = false;
    eventBus.subscribe("sub-test", "sub-test", () => (function1Called = true));
    eventBus.subscribe("sub-test2", "sub-test", () => (function2Called = true));
    eventBus.publish("sub-test", new TimerTimeout());
    expect(function1Called).toBe(true);
    expect(function2Called).toBe(true);
  });
  it("handles unsubscribe", () => {
    const eventBus = new ProdEventBus();
    let function1Called = false;
    let function2Called = false;
    eventBus.subscribe("sub-test", "sub-test", () => (function1Called = true));
    eventBus.subscribe("sub-test2", "sub-test", () => (function2Called = true));
    eventBus.unsubscribe("sub-test");
    eventBus.publish("sub-test", new TimerTimeout());
    expect(function1Called).toBe(false);
    expect(function2Called).toBe(true);
  });
});

describe("timers", () => {
  it("can timeout", () => {
    const eventBus = new ProdEventBus();
    const timers = new Timers(eventBus);
    let functionCalled = false;
    eventBus.subscribe(
      "timer-test",
      "timer-test",
      () => (functionCalled = true)
    );
    const timer = new Timer(new Date(), "timer-test", new TimerTimeout());
    timers.addTimer(timer);
    timers.timeout(timer);
    expect(functionCalled).toBe(true);
  });

  it("handles timer cancellation", () => {
    const eventBus = new ProdEventBus();
    const timers = new Timers(eventBus);
    let functionCalled = false;
    eventBus.subscribe(
      "timer-test",
      "timer-test",
      () => (functionCalled = true)
    );
    const timer = new Timer(new Date(), "timer-test", new TimerTimeout());
    timers.addTimer(timer);
    timers.cancel(timer);
    timers.timeout(timer);
    expect(functionCalled).toBe(false);
  });
});

describe("follower", () => {
  it("launches timer on init", () => {
    const eventBus = new ProdEventBus();
    const storage = new RaftStorage();
    const timers = new Timers(eventBus);

    const node = new RaftNode(storage, timers, eventBus, 101, [101], false);
    expect(timers.timers[0]).toBeDefined();
  });

  it("becomes candidate on leader failure", () => {
    const eventBus = new ProdEventBus();
    const storage = new RaftStorage();
    const timers = new Timers(eventBus);

    const node = new RaftNode(storage, timers, eventBus, 101, [101], false);
    timers.timeout(timers.timers[0]);
    expect(node.node.currentRole).toBe(NodeRole.Candidate);
  });
});

describe("raft system", function () {
  const timeoutLeaderFailure = (nodeId: number, timers: Timers) => {
    timers.timers
      .filter((timer) => timer.channel == `node-${nodeId}-timer-leaderFailure`)
      .forEach((timer) => timers.timeout(timer));
  };

  const timeoutLeaderLogReplicate = (nodeId: number, timers: Timers) => {
    timers.timers
      .filter(
        (timer) => timer.channel == `node-${nodeId}-timer-leaderReplicateLog`
      )
      .forEach((timer) => timers.timeout(timer));
  };

  it("a node becomes leader", () => {
    const eventBus = new ProdEventBus();
    const storage = new RaftStorage();
    const timers = new Timers(eventBus);

    const node101 = new RaftNode(
      storage,
      timers,
      eventBus,
      101,
      [101, 102, 103],
      false
    );
    const node102 = new RaftNode(
      storage,
      timers,
      eventBus,
      102,
      [101, 102, 103],
      false
    );
    const node103 = new RaftNode(
      storage,
      timers,
      eventBus,
      103,
      [101, 102, 103],
      false
    );

    timeoutLeaderFailure(101, timers);

    expect(node101.node.currentRole).toBe(NodeRole.Leader);
  });

  it("nodes become follower during log request", () => {
    const eventBus = new ProdEventBus();
    const storage = new RaftStorage();
    const timers = new Timers(eventBus);

    const node101 = new RaftNode(
      storage,
      timers,
      eventBus,
      101,
      [101, 102, 103],
      false
    );
    const node102 = new RaftNode(
      storage,
      timers,
      eventBus,
      102,
      [101, 102, 103],
      false
    );
    const node103 = new RaftNode(
      storage,
      timers,
      eventBus,
      103,
      [101, 102, 103],
      false
    );

    timeoutLeaderFailure(101, timers);
    timeoutLeaderLogReplicate(101, timers);

    expect(node102.node.currentLeader).toBe(101);
    expect(node103.node.currentLeader).toBe(101);
  });
});
