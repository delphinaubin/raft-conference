import { NodeAlgorithm } from "@/domain/conf-land/NodeAlgorithm";

describe("Step 4", () => {
  it("has 1 leader and 2 followers (should fail after Step 18)", () => {
    const dummy = <never>{};
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const dummyEventBus = <never>{ subscribe: () => {} };

    const nodeAlgorithm1 = new NodeAlgorithm(
      dummy,
      dummyEventBus,
      "1",
      dummy,
      []
    );
    expect(nodeAlgorithm1.getInitialState()).toEqual("leader");

    const nodeAlgorithm2 = new NodeAlgorithm(
      dummy,
      dummyEventBus,
      "2",
      dummy,
      []
    );
    expect(nodeAlgorithm2.getInitialState()).toEqual("follower");

    const nodeAlgorithm3 = new NodeAlgorithm(
      dummy,
      dummyEventBus,
      "3",
      dummy,
      []
    );
    expect(nodeAlgorithm3.getInitialState()).toEqual("follower");
  });
});
