import { Position } from "v-network-graph";

interface NodePosition {
  x: number;
  y: number;
}

export function getLayoutFromNodeIds(
  nodeIds: string[]
): Record<string, NodePosition> {
  const Y_STEP = 75;
  const X_STEP = 100;
  let numberOfRemainingNodes = nodeIds.length;
  const shouldHaveATriangleOnTop = numberOfRemainingNodes % 2 !== 0;
  const nodePositions: Position[] = [];

  let currentYPositon = 0;
  if (shouldHaveATriangleOnTop) {
    nodePositions.push({
      y: currentYPositon,
      x: X_STEP / 2,
    });
    currentYPositon += Y_STEP;
  }
  while (numberOfRemainingNodes > 0) {
    nodePositions.push(
      {
        y: currentYPositon,
        x: 0,
      },
      {
        y: currentYPositon,
        x: X_STEP,
      }
    );
    currentYPositon += Y_STEP;
    numberOfRemainingNodes -= 2;
  }
  return nodeIds.reduce(
    (result, nodeId, index) => ({
      ...result,
      [nodeId]: nodePositions[index],
    }),
    {}
  );
}
