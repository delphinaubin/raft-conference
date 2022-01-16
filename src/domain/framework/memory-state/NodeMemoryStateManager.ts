import { LogEntry } from "@/domain/framework/log/LogEntry";

export interface NodeMemoryState {
  term: number;
  votedFor?: string;
  nodesWhichVotedForMe: SetProxy<string>;
  leader?: string;
  sentLength: { [nodeId: string]: number };
  ackedLength: { [nodeId: string]: number };
  commitLength: number;
  log: LogEntry[];
}

interface MemoryStateChangeEvent {
  nodeId: string;
  newNodeMemoryState: NodeMemoryState;
}

class SetProxy<T> {
  internalSet: Set<T>;
  constructor(private readonly onChangeCallBack: () => void) {
    this.internalSet = new Set();
  }

  add(value: T): void {
    this.internalSet.add(value);
    this.onChangeCallBack();
  }

  delete(value: T): void {
    this.internalSet.delete(value);
    this.onChangeCallBack();
  }
  clear(): void {
    this.internalSet.clear();
    this.onChangeCallBack();
  }

  has(value: T): boolean {
    return this.internalSet.has(value);
  }

  get size(): number {
    return this.internalSet.size;
  }

  getValues(): T[] {
    return Array.from(this.internalSet.values());
  }
}

export const INITIAL_NODE_MEMORY_STATE: (
  onChange: () => void
) => NodeMemoryState = (onChange) => ({
  term: 0,
  nodesWhichVotedForMe: new SetProxy(onChange),
  sentLength: {},
  ackedLength: {},
  log: [],
  commitLength: 0,
});

type MemoryStateChangeCallBack = (e: MemoryStateChangeEvent) => void;

export class NodeMemoryStateManager {
  private readonly callBacks: MemoryStateChangeCallBack[] = [];

  onNodeMemoryStateChange(callBack: MemoryStateChangeCallBack): void {
    this.callBacks.push(callBack);
  }

  getNodeInitialMemoryState(forNodeId: string): NodeMemoryState {
    const nodeMemoryStateReference = INITIAL_NODE_MEMORY_STATE(() => {
      this.notifySubscribersOfChange(forNodeId, nodeMemoryStateReference);
    });
    return new Proxy<NodeMemoryState>(nodeMemoryStateReference, {
      set: (nodeMemoryState, prop, value): boolean => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (nodeMemoryState as any)[prop] = value;
        this.notifySubscribersOfChange(forNodeId, nodeMemoryState);
        return true;
      },
    });
  }

  private notifySubscribersOfChange(
    forNodeId: string,
    nodeMemoryState: NodeMemoryState
  ) {
    this.callBacks.forEach((cb) =>
      cb({
        nodeId: forNodeId,
        newNodeMemoryState: nodeMemoryState,
      })
    );
  }
}
