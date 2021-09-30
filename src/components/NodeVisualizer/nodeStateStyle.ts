import { RaftNodeState } from "@/domain/RaftNode";

export interface NodeStyle {
  icon: string;
  color: string;
  borderColor: string;
  labelColor: string;
}

export const NODE_STATE_STYLE: Record<RaftNodeState, NodeStyle> = {
  leader: {
    icon: "👑",
    color: "white",
    borderColor: "royalBlue",
    labelColor: "royalBlue",
  },
  candidate: {
    icon: "☝️",
    color: "white",
    borderColor: "navy",
    labelColor: "navy",
  },
  follower: {
    icon: "😶",
    color: "white",
    borderColor: "slateGrey",
    labelColor: "slateGrey",
  },
  off: {
    icon: "❌",
    color: "white",
    borderColor: "orangeRed",
    labelColor: "red",
  },
} as const;
