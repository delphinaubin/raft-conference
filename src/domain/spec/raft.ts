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

class BroadcastEvent {
  constructor(readonly log: number) {}
}

type Event =
  | TimerTimeout
  | NodeTransition
  | VoteRequest
  | VoteResponse
  | BroadcastEvent;

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

  addTimer(timer: Timer): void {
    this.timers.push(timer);
  }

  private removeTimer(timer: Timer): void {
    const index = this.timers.indexOf(timer, 0);
    if (index > -1) {
      this.timers.splice(index, 1);
    }
  }

  timeout(timer: Timer): void {
    const index = this.timers.indexOf(timer, 0);
    if (index > -1) {
      this.removeTimer(timer);
      this.eventBus.publish(timer.channel, timer.event);
    }
  }

  cancel(timer: Timer): void {
    this.removeTimer(timer);
  }
}

export enum NodeRole {
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
  node: NodeData;

  electionTimer: Timer | undefined;
  leaderFailureTimer: Timer | undefined;

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
      this.node = new NodeData(id, nodes);
    } else {
      this.node = nodeData;
    }
    this.node.nodes = nodes;
    this.eventBus.subscribe(
      `node-${this.node.id}-timer-leaderFailure`,
      `node-${this.node.id}-timer-leaderFailure`,
      () => this.onElectionTimeoutOrLeaderFailed()
    );
    this.eventBus.subscribe(
      `node-${this.node.id}-timer-election`,
      `node-${this.node.id}-timer-election`,
      () => this.onElectionTimeoutOrLeaderFailed()
    );
    this.eventBus.subscribe(
      `node-${this.node.id}-vote-requests`,
      `vote-requests`,
      (voteRequest) => this.onVoteRequest(voteRequest)
    );
    this.eventBus.subscribe(
      `vote-response-${this.node.id}`,
      `vote-response-${this.node.id}`,
      (voteResponse) => this.onVoteResponse(voteResponse)
    );
    this.eventBus.subscribe(
      `broadcast-${this.node.id}`,
      `broadcast`,
      (broadcast) => this.broadcast(broadcast)
    );
    this.eventBus.subscribe(
      `broadcast-${this.node.id}`,
      `leader-broadcast`,
      (broadcast) => this.broadcast(broadcast)
    );
    if (!recoveringFromCrash) {
      this.init();
    } else {
      this.recover();
    }
  }

  init(): void {
    console.log(`Node ${this.node.id} entering follower state`);
    this.node.currentRole = NodeRole.Follower;
    this.startLeaderFailureTimer();
  }

  recover(): void {
    console.log(`Node ${this.node.id} is recovering from crash`);
    this.node.currentLeader = null;
    this.node.votesReceived = [];
    this.node.votedFor = null;
    this.node.sentLength = [];
    this.node.ackedLength = [];
  }

  startLeaderFailureTimer(): void {
    const timerName = `node-${this.node.id}-timer-leaderFailure`;
    const timer = new Timer(new Date(), timerName, new TimerTimeout());
    this.timers.addTimer(timer);
    this.leaderFailureTimer = timer;
  }

  startElectionTimer(): void {
    const timerName = `node-${this.node.id}-timer-election`;
    const timer = new Timer(new Date(), timerName, new TimerTimeout());
    this.timers.addTimer(timer);
    this.leaderFailureTimer = timer;
  }

  cancelElectionTimer(): void {
    this.cancelTimer(this.electionTimer);
    this.electionTimer = undefined;
  }

  cancelLeaderFailureTimer(): void {
    this.cancelTimer(this.leaderFailureTimer);
    this.leaderFailureTimer = undefined;
  }

  cancelTimer(timer: Timer | undefined): void {
    if (timer != undefined) {
      this.timers.cancel(timer);
    }
  }

  onVoteRequest(event: Event): void {
    const voteRequest = event as VoteRequest;
    if (voteRequest.candidateId != this.node.id) {
      console.log(
        `Node ${this.node.id} receiving vote request from node ${voteRequest.candidateId}`
      );
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
        this.node.currentRole = NodeRole.Follower;
        this.node.votedFor = voteRequest.candidateId;
        const response = new VoteResponse(
          this.node.id,
          this.node.currentTerm,
          true
        );
        this.eventBus.publish(`vote-response-${this.node.id}`, response);
      } else {
        const response = new VoteResponse(
          this.node.id,
          this.node.currentTerm,
          false
        );
        this.eventBus.publish(`vote-response-${this.node.id}`, response);
      }
    }
  }

  onVoteResponse(event: Event): void {
    const voteResponse = event as VoteResponse;
    console.log(
      `Node ${this.node.id} receiving vote response from ${voteResponse.voterId} (granted: ${voteResponse.granted})`
    );
    if (
      this.node.currentRole == NodeRole.Candidate &&
      this.node.currentTerm == voteResponse.term &&
      voteResponse.granted
    ) {
      this.node.votesReceived.push(voteResponse.voterId);
      if (this.node.votesReceived.length >= (this.node.nodes.length + 1) / 2) {
        console.log(`Node ${this.node.id} entering leader state`);
        this.node.currentRole = NodeRole.Leader;
        this.node.currentLeader = this.node.id;
        this.cancelElectionTimer();
        this.node.nodes
          .filter((nodeId) => nodeId != this.node.id)
          .forEach((follower) => {
            this.node.sentLength[follower] = this.node.log.length;
            this.node.ackedLength[follower] = 0;
            this.replicateLog(follower);
          });
      }
    } else if (voteResponse.term > this.node.currentTerm) {
      this.node.currentTerm = voteResponse.term;
      this.node.currentRole = NodeRole.Follower;
      this.node.votedFor = null;
      this.cancelElectionTimer();
    }
  }

  onElectionTimeoutOrLeaderFailed(): void {
    console.log(`Node ${this.node.id} entering candidate state`);
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

  private replicateLog(follower: NodeId) {
    const i = this.node.sentLength[follower];
  }

  private broadcast(event: Event) {
    const broadcastEvent = event as BroadcastEvent;
    if (this.node.currentRole == NodeRole.Leader) {
      this.appendRecordToLog(broadcastEvent);
    } else {
      this.eventBus.publish("leader-broadcast", event);
    }
  }

  private appendRecordToLog(broadcastEvent: BroadcastEvent) {
    this.node.log.push(new Log(broadcastEvent.log, this.node.currentTerm));
    this.node.ackedLength[this.node.id] = this.node.log.length;
  }
}
