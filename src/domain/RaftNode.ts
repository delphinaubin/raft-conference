export interface RaftNode {
  id: string;
  name: string;
  state: RaftNodeState;
}

export type RaftNodeState = "leader" | "follower" | "candidate" | "off";
