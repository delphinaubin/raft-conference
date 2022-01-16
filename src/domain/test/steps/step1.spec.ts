import { NodeAlgorithm } from "@/domain/conf-land/NodeAlgorithm";

describe("Step 1", () => {
  it("starts nodes (should fail after Step 18)", () => {
    const dummy = <never>{};
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const dummyEventBus = <never>{ subscribe: () => {} };

    const nodeAlgorithm = new NodeAlgorithm(
      dummy,
      dummyEventBus,
      "1",
      dummy,
      []
    );
    expect(nodeAlgorithm.getInitialState()).toEqual("leader");
  });
});
