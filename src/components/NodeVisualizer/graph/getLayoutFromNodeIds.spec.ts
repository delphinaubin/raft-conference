import { getLayoutFromNodeIds } from "./getLayoutFromNodeIds";

describe("getLayoutFromNodeIds", () => {
  it("centers horizontally a single node", () => {
    const result = getLayoutFromNodeIds(["id1"]);
    expect(result).toEqual({
      id1: { x: 50, y: 0 },
    });
  });

  it("creates an horizontal line for 2 nodes", () => {
    const result = getLayoutFromNodeIds(["id1", "id2"]);
    expect(result).toEqual({
      id1: { x: 0, y: 0 },
      id2: { x: 100, y: 0 },
    });
  });

  it("creates a triangle for 3 nodes", () => {
    const result = getLayoutFromNodeIds(["id1", "id2", "id3"]);
    expect(result).toEqual({
      id1: { x: 50, y: 0 },
      id2: { x: 0, y: 75 },
      id3: { x: 100, y: 75 },
    });
  });

  it("creates a square for 4 nodes", () => {
    const result = getLayoutFromNodeIds(["id1", "id2", "id3", "id4"]);
    expect(result).toEqual({
      id1: { x: 0, y: 0 },
      id2: { x: 100, y: 0 },
      id3: { x: 0, y: 75 },
      id4: { x: 100, y: 75 },
    });
  });

  it("creates an house shape for 5 nodes", () => {
    const result = getLayoutFromNodeIds(["id1", "id2", "id3", "id4", "id5"]);
    expect(result).toEqual({
      id1: { x: 50, y: 0 },
      id2: { x: 0, y: 75 },
      id3: { x: 100, y: 75 },
      id4: { x: 0, y: 150 },
      id5: { x: 100, y: 150 },
    });
  });
});
