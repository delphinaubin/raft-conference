import { RaftNodeState } from "@/domain/framework/RaftNode";

export interface NodeStyle {
  icon: string;
  color: string;
  borderColor: string;
  labelColor: string;
}

export const NODE_STATE_STYLE: Record<RaftNodeState, NodeStyle> = {
  leader: {
    icon: "👑",
    color: "transparent",
    borderColor: "deeppink",
    labelColor: "deeppink",
  },
  candidate: {
    icon: "☝️",
    color: "transparent",
    borderColor: "cyan",
    labelColor: "cyan",
  },
  follower: {
    icon: "😶",
    color: "transparent",
    borderColor: "lightGrey",
    labelColor: "lightGrey",
  },
  off: {
    icon: "❌",
    color: "transparent",
    borderColor: "red",
    labelColor: "red",
  },
} as const;
