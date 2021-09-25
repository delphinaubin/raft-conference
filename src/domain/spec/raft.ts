type NodeId = number;

export class RaftStorage {
  data: Map<NodeId, NodeData> = new Map<NodeId, NodeData>();

  store(data: NodeData): void {
    this.data.set(data.id, data);
  }

  retrieve(id: NodeId): NodeData | undefined {
    const data = this.data.get(id);
    if (data == undefined) {
      return data;
    }
    const retrievedData = new NodeData(data.id, data.nodes);
    retrievedData.currentTerm = data.currentTerm;
    retrievedData.votedFor = data.votedFor;
    retrievedData.log = data.log;
    retrievedData.commitLength = data.commitLength;
    return retrievedData;
  }
}

export interface EventBus {
  subscribe(
    subId: string,
    channel: string,
    callback: (event: Event) => void
  ): void;
  unsubscribe(id: string): void;
  publish(channel: string, event: Event): void;
}

export class TimerTimeout {}
export class NodeTransition {
  constructor(readonly newRole: NodeRole) {}
}
export class VoteRequest {
  constructor(
    readonly candidateId: NodeId,
    readonly candidateTerm: number,
    readonly candidateLogLength: number,
    readonly candidateLogTerm: number
  ) {}
}

export class VoteResponse {
  constructor(
    readonly voterId: NodeId,
    readonly term: number,
    readonly granted: boolean
  ) {}
}

type Event = TimerTimeout | NodeTransition | VoteRequest | VoteResponse;

class Subscription {
  constructor(
    readonly subId: string,
    readonly channel: string,
    readonly callback: (event: Event) => void
  ) {}
}

export class ProdEventBus implements EventBus {
  subscriptions: Subscription[] = [];

  subscribe(
    subId: string,
    channel: string,
    callback: (event: Event) => void
  ): void {
    this.subscriptions.push(new Subscription(subId, channel, callback));
  }

  unsubscribe(id: string): void {
    const index = this.subscriptions.findIndex((sub) => sub.subId == id);
    if (index > -1) {
      this.subscriptions.splice(index, 1);
    }
  }

  publish(channel: string, event: Event): void {
    console.log(`Publishing event to ${channel}. Event:`, event);
    const subs = this.subscriptions.filter((sub) => sub.channel == channel);
    subs.forEach((sub) => {
      console.log(`Triggering subscriber ${sub.subId} event callback`);
      sub.callback(event);
    });
  }
}

export class Timer {
  startDate: Date;

  constructor(
    readonly dueDate: Date,
    readonly channel: string,
    readonly event: Event
  ) {
    this.startDate = new Date();
  }
}

export class Timers {
  eventBus: EventBus;
  timers: Timer[] = [];

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  addTimer(timer: Timer) {
    this.timers.push(timer);
  }

  removeTimer(timer: Timer) {
    const index = this.timers.indexOf(timer, 0);
    if (index > -1) {
      this.timers.splice(index, 1);
    }
  }

  timeout(timer: Timer) {
    const index = this.timers.indexOf(timer, 0);
    if (index > -1) {
      this.removeTimer(timer);
      this.eventBus.publish(timer.channel, timer.event);
    }
  }

  cancel(timer: Timer) {
    this.removeTimer(timer);
  }
}

enum NodeRole {
  Follower,
  Candidate,
  Leader,
}

class Log {
  constructor(readonly value: number, readonly term: number) {}
}

export class NodeData {
  id: NodeId;
  nodes: NodeId[];
  currentTerm = 0;
  votedFor: NodeId | null = null;
  log: Log[] = [];
  commitLength = 0;
  currentRole = NodeRole.Follower;
  currentLeader: NodeId | null = null;
  votesReceived: NodeId[] = [];
  sentLength: number[] = [];
  ackedLength: number[] = [];

  constructor(id: NodeId, nodes: NodeId[]) {
    this.id = id;
    this.nodes = nodes;
  }
}

export class RaftNode {
  storage: RaftStorage;
  timers: Timers;
  eventBus: EventBus;
  data: NodeData;
  role: Role;

  constructor(
    storage: RaftStorage,
    timers: Timers,
    eventBus: EventBus,
    id: NodeId,
    nodes: NodeId[],
    recoveringFromCrash: boolean
  ) {
    this.storage = storage;
    this.timers = timers;
    this.eventBus = eventBus;
    const nodeData = storage.retrieve(id);
    if (nodeData == undefined) {
      this.data = new NodeData(id, nodes);
    } else {
      this.data = nodeData;
    }
    this.data.nodes = nodes;
    this.role = new Follower(this.eventBus, this.timers, this.data);
    this.eventBus.subscribe(
      `node-${this.data.id}-timer-leaderFailure`,
      `node-${this.data.id}-timer-leaderFailure`,
      this.onLeaderFailureTimer
    );
    this.eventBus.subscribe(
      `node-${this.data.id}-vote-requests`,
      `vote-requests`,
      this.onVoteRequest
    );
    if (!recoveringFromCrash) {
      this.role.init();
    } else {
      this.role.recover();
    }
  }

  onLeaderFailureTimer(): void {
    this.role.onLeaderFailureTimer();
  }

  onNodeTransition(transition: NodeTransition): void {
    if (transition.newRole == NodeRole.Follower) {
      if (this.data.currentRole != NodeRole.Follower) {
        this.role = new Follower(this.eventBus, this.timers, this.data);
      }
    } else if (transition.newRole == NodeRole.Candidate) {
      if (this.data.currentRole != NodeRole.Candidate) {
        this.role = new Candidate(this.eventBus, this.timers, this.data);
      }
    }
    this.role.init();
  }

  onVoteRequest(voteRequest: Event) {
    this.role.onVoteRequest(voteRequest as VoteRequest);
  }
}

export interface Role {
  init(): void;
  recover(): void;
  leaveState(): void;
  onLeaderFailureTimer(): void;
  onVoteRequest(voteRequest: VoteRequest): void;
}

export class Follower implements Role {
  eventBus: EventBus;
  timers: Timers;
  node: NodeData;
  activeTimers: Timer[] = [];

  constructor(eventBus: EventBus, timers: Timers, data: NodeData) {
    this.eventBus = eventBus;
    this.timers = timers;
    this.node = data;
  }

  onLeaderFailureTimer(): void {
    this.node.currentTerm += 1;
  }

  init(): void {
    console.log(`node ${this.node.id} entering follower state`);
    this.node.currentRole = NodeRole.Follower;
    this.launchLeaderFailureTimer();
  }

  recover(): void {
    console.log(`node ${this.node.id} is recovering from crash`);
    this.node.currentLeader = null;
    this.node.votesReceived = [];
    this.node.votedFor = null;
    this.node.sentLength = [];
    this.node.ackedLength = [];
  }

  leaveState(): void {
    console.log(`node ${this.node.id} leaving candidate state`);
    this.activeTimers.forEach((timer) => this.timers.cancel(timer));
  }

  launchLeaderFailureTimer(): void {
    const timer = new Timer(
      new Date(),
      `node-${this.node.id}-timer-leaderFailure`,
      new TimerTimeout()
    );
    this.timers.addTimer(timer);
    this.activeTimers.push(timer);
  }

  onVoteRequest(voteRequest: VoteRequest): void {
    console.log(
      `Follower ${this.node.id} receiving vote request from node ${voteRequest.candidateId}`
    );
    if (voteRequest.candidateId != this.node.id) {
      const myLogTerm = this.node.log[this.node.log.length - 1].term;
      const logOk =
        voteRequest.candidateLogTerm > myLogTerm ||
        (voteRequest.candidateLogTerm == myLogTerm &&
          voteRequest.candidateLogLength >= this.node.log.length);
      const termOk =
        voteRequest.candidateTerm > this.node.currentTerm ||
        (voteRequest.candidateTerm == this.node.currentTerm &&
          (this.node.votedFor == voteRequest.candidateId ||
            this.node.votedFor == null));

      if (logOk && termOk) {
        this.node.currentTerm = voteRequest.candidateTerm;
        // reset to follower
        this.node.votedFor = voteRequest.candidateId;
        const response = new VoteResponse(
          this.node.id,
          this.node.currentTerm,
          true
        );
        this.eventBus.publish(`vote-response-${this.node.id}`, response);
      }
    }
  }
}

export class Candidate implements Role {
  eventBus: EventBus;
  timers: Timers;
  node: NodeData;
  activeTimers: Timer[] = [];

  constructor(eventBus: EventBus, timers: Timers, data: NodeData) {
    this.eventBus = eventBus;
    this.timers = timers;
    this.node = data;
  }

  init(): void {
    console.log(`node ${this.node.id} entering candidate state`);
    this.node.currentRole = NodeRole.Candidate;
    this.node.currentTerm += 1;
    this.node.votedFor = this.node.id;
    this.node.votesReceived = [this.node.id];
    let lastTerm = 0;
    if (this.node.log.length > 0) {
      lastTerm = this.node.log[this.node.log.length - 1].term;
    }
    const voteRequest = new VoteRequest(
      this.node.id,
      this.node.currentTerm,
      this.node.log.length,
      lastTerm
    );
    this.eventBus.publish("vote-requests", voteRequest);
  }

  recover(): void {
    console.warn(`node ${this.node.id} in candidate state can't recover`);
  }

  leaveState(): void {
    console.log(`node ${this.node.id} leaving candidate state`);
  }

  onLeaderFailureTimer(): void {
    console.warn(
      `node ${this.node.id} in candidate state ignoring leader failure timer`
    );
  }

  onVoteRequest(voteRequest: VoteRequest): void {
    console.log(
      `Candidate ${this.node.id} receiving vote request from node ${voteRequest.candidateId}. The request is denied.`
    );
  }
}
