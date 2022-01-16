export function fakeRandomTimerDurationWithMinimumTime(
  starterNodeId: string,
  miniumTime: number
): number {
  return 4_000 * +starterNodeId + miniumTime;
}
