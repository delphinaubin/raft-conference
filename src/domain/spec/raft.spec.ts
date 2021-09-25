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

  const expectLogMatches = (node: RaftNode, otherNode: RaftNode) => {
    const nodeLog = node.node.log;
    const otherNodeLog = otherNode.node.log;
    expect(nodeLog.length).toBe(otherNodeLog.length);
    for (let i = 0; i < nodeLog.length; i++) {
      expect(nodeLog[i].value).toBe(otherNodeLog[i].value);
      expect(nodeLog[i].term).toBe(otherNodeLog[i].term);
    }
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

  it("nodes broadcast events to leader", () => {
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

    eventBus.publish("broadcast-103", new BroadcastEvent(42));
    expect(node101.node.log[0].value).toBe(42);
    expect(node101.node.log[0].term).toBe(1);
  });

  it("nodes replicate events from leader", () => {
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

    eventBus.publish("broadcast-103", new BroadcastEvent(42));
    eventBus.publish("broadcast-103", new BroadcastEvent(43));
    eventBus.publish("broadcast-103", new BroadcastEvent(44));
    eventBus.publish("broadcast-103", new BroadcastEvent(45));
    timeoutLeaderLogReplicate(101, timers);

    expectLogMatches(node101, node102);
    expectLogMatches(node101, node103);
  });

  it("nodes vote for first request", () => {
    const eventBus = new ProdEventBus(true);
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
    timeoutLeaderFailure(102, timers);

    eventBus.deliverEventToSub("node-102-timer-leaderFailure");
    eventBus.deliverEventToSub("node-101-timer-leaderFailure");
    eventBus.deliverEventToSub("node-103-vote-requests");
    eventBus.deliverEventToSub("node-103-vote-requests");
    eventBus.deliverEventToSub("vote-response-101");
    eventBus.deliverEventToSub("vote-response-102");
    eventBus.deliverEventToSub("node-101-vote-requests");
    eventBus.deliverEventToSub("node-101-vote-requests");
    eventBus.deliverEventToSub("node-102-vote-requests");
    eventBus.deliverEventToSub("node-102-vote-requests");
    eventBus.deliverEventToSub("vote-response-101");
    eventBus.deliverEventToSub("vote-response-102");

    timeoutLeaderLogReplicate(102, timers);
    eventBus.deliverEventToSub("node-102-timer-leaderReplicateLog");
    eventBus.deliverEventToSub("replicate-log-101");
    eventBus.deliverEventToSub("replicate-log-103");
    eventBus.deliverEventToSub("log-response-102");
    eventBus.deliverEventToSub("log-response-102");

    expect(node101.node.currentRole).toBe(NodeRole.Follower);
    expect(node102.node.currentRole).toBe(NodeRole.Leader);
    expect(node103.node.currentRole).toBe(NodeRole.Follower);
  });
});
