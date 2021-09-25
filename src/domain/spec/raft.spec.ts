import {
  RaftStorage,
  Timers,
  Timer,
  ProdEventBus,
  TimerTimeout,
  RaftNode,
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
});
