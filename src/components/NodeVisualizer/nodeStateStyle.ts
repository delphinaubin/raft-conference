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
    color: "black",
    borderColor: "deeppink",
    labelColor: "deeppink",
  },
  candidate: {
    icon: "☝️",
    color: "black",
    borderColor: "cyan",
    labelColor: "cyan",
  },
  follower: {
    icon: "😶",
    color: "black",
    borderColor: "lightGrey",
    labelColor: "lightGrey",
  },
  off: {
    icon: "❌",
    color: "black",
    borderColor: "red",
    labelColor: "red",
  },
} as const;
