import { NodeAlgorithm } from "@/domain/conf-land/NodeAlgorithm";
import { EventBus } from "@/domain/framework/event/EventBus";

describe("Step 18", () => {
  test("All nodes starts in follower state", () => {
    const dummy = <never>{};
    const nodeId = "1";
    const nodeAlgorithm = new NodeAlgorithm(
      dummy,
      new EventBus(),
      nodeId,
      dummy,
      []
    );
    expect(nodeAlgorithm.getInitialState()).toEqual("follower");
  });
});
