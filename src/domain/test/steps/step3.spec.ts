import { nodesToCreate } from "@/domain/conf-land/nodesToCreate";

describe("Step 3", () => {
  it("have 3 nodes", () => {
    expect(nodesToCreate).toHaveLength(3);
    expect(nodesToCreate.map(({ id }) => id)).toEqual(["1", "2", "3"]);
  });
});
