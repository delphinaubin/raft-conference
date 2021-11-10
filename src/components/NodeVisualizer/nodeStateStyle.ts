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
    borderColor: "#FFC30F",
    labelColor: "#FFC30F",
  },
  candidate: {
    icon: "☝️",
    color: "transparent",
    borderColor: "chocolate",
    labelColor: "chocolate",
  },
  follower: {
    icon: "😶",
    color: "transparent",
    borderColor: "BurlyWood",
    labelColor: "BurlyWood",
  },
  off: {
    icon: "❌",
    color: "transparent",
    borderColor: "red",
    labelColor: "red",
  },
} as const;
