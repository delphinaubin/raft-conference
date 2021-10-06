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

export class BroadcastEvent {
  constructor(readonly log: number) {}
}

class LogRequest {
  constructor(
    readonly leaderId: NodeId,
    readonly term: number,
    readonly logLength: number,
    readonly logTerm: number,
    readonly leaderCommit: number,
    readonly entries: Log[]
  ) {}
}

class LogResponse {
  constructor(
    readonly follower: NodeId,
    readonly term: number,
    readonly ack: number,
    readonly success: boolean
  ) {}
}

type Event =
  | TimerTimeout
  | NodeTransition
  | VoteRequest
  | VoteResponse
  | BroadcastEvent
  | LogRequest
  | LogResponse;

class Subscription {
  constructor(
    readonly subId: string,
    readonly channel: string,
    readonly callback: (event: Event) => void
  ) {}
}

class Step {
  constructor(readonly subscription: Subscription, readonly event: Event) {}
}

export class ProdEventBus implements EventBus {
  private stepByStep: boolean;
  callbackQueue: Step[] = [];
  subscriptions: Subscription[] = [];

  constructor(stepByStep?: boolean) {
    this.stepByStep = stepByStep != undefined && stepByStep;
  }

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
      if (this.stepByStep) {
        console.log(
          `Adding callback for subscription ${sub.subId} in step by step queue`
        );
        this.callbackQueue.push(new Step(sub, event));
      } else {
        console.log(`Triggering subscriber ${sub.subId} event callback`);
        sub.callback(event);
      }
    });
  }

  deliverEventToSub(subId: string): void {
    if (this.stepByStep) {
      //console.log(`Replaying first step for sub ${subId}`);
      //console.log(this.callbackQueue);
      const step = this.callbackQueue.filter(
        (step) => step.subscription.subId == subId
      )[0];
      if (step != undefined) {
        //console.log("Step found, running callback");
        step.subscription.callback(step.event);
        const stepIndex = this.callbackQueue.findIndex(
          (step) => step.subscription.subId == subId
        );
        if (stepIndex > -1) {
          //console.log("Step removed from callback queue");
          this.callbackQueue.splice(stepIndex, 1);
        }
      } else {
        //console.log("Step not found, running callback");
      }
    }
  }

  emptyCallbackQueue() : void {
    this.callbackQueue = [];
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

  private removeTimer(timer: Timer): void {
    const index = this.timers.indexOf(timer, 0);
    if (index > -1) {
      this.timers.splice(index, 1);
    }
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
  leaderReplicateLogTimer: Timer | undefined;

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
      `node-${this.node.id}-timer-leaderReplicateLog`,
      `node-${this.node.id}-timer-leaderReplicateLog`,
      () => this.onLeaderReplicateLogTimeout()
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
      `broadcast-${this.node.id}`,
      (broadcast) => this.broadcast(broadcast)
    );
    this.eventBus.subscribe(
      `replicate-log-${this.node.id}`,
      `replicate-log-${this.node.id}`,
      (logRequest) => this.onLogRequest(logRequest)
    );
    this.eventBus.subscribe(
      `log-response-${this.node.id}`,
      `log-response-${this.node.id}`,
      (logResponse) => this.onLogResponse(logResponse)
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
    this.cancelLeaderFailureTimer();
    const timerName = `node-${this.node.id}-timer-leaderFailure`;
    const timer = new Timer(new Date(), timerName, new TimerTimeout());
    this.timers.addTimer(timer);
    this.leaderFailureTimer = timer;
  }

  startElectionTimer(): void {
    this.cancelElectionTimer();
    const timerName = `node-${this.node.id}-timer-election`;
    const timer = new Timer(new Date(), timerName, new TimerTimeout());
    this.timers.addTimer(timer);
    this.leaderFailureTimer = timer;
  }

  startLeaderReplicateLogTimer(): void {
    this.cancelLeaderReplicateLogTimer();
    const timerName = `node-${this.node.id}-timer-leaderReplicateLog`;
    const timer = new Timer(new Date(), timerName, new TimerTimeout());
    this.timers.addTimer(timer);
    this.leaderReplicateLogTimer = timer;
  }

  cancelElectionTimer(): void {
    this.cancelTimer(this.electionTimer);
    this.electionTimer = undefined;
  }

  cancelLeaderFailureTimer(): void {
    this.cancelTimer(this.leaderFailureTimer);
    this.leaderFailureTimer = undefined;
  }

  cancelLeaderReplicateLogTimer(): void {
    this.cancelTimer(this.leaderReplicateLogTimer);
    this.leaderReplicateLogTimer = undefined;
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
      const myLogTerm = this.findLogIndexTerm(
        this.node.log.length,
        this.node.currentTerm
      );
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
        console.log(
          `Node ${this.node.id} votes for ${voteRequest.candidateId}`
        );
        this.eventBus.publish(
          `vote-response-${voteRequest.candidateId}`,
          response
        );
      } else {
        const response = new VoteResponse(
          this.node.id,
          this.node.currentTerm,
          false
        );
        console.log(
          `Node ${this.node.id} does not vote for ${voteRequest.candidateId}`
        );
        this.eventBus.publish(
          `vote-response-${voteRequest.candidateId}`,
          response
        );
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
      if (
        this.node.votesReceived.length >=
        Math.ceil((this.node.nodes.length + 1) / 2)
      ) {
        console.log(`Node ${this.node.id} entering leader state`);
        this.node.currentRole = NodeRole.Leader;
        this.node.currentLeader = this.node.id;
        this.cancelElectionTimer();
        this.node.nodes
          .filter((nodeId) => nodeId != this.node.id)
          .forEach((follower) => {
            this.node.sentLength[follower] = this.node.log.length;
            this.node.ackedLength[follower] = 0;
            this.startLeaderReplicateLogTimer();
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
    this.cancelLeaderFailureTimer();
    this.node.currentRole = NodeRole.Candidate;
    this.node.currentTerm += 1;
    this.node.votedFor = this.node.id;
    this.node.votesReceived = [this.node.id];
    let lastTerm = 0;
    if (this.node.log.length > 0) {
      lastTerm = this.node.log[this.node.log.length - 1].term;
    }
    console.log(`Node ${this.node.id} sending vote request to all nodes`);
    const voteRequest = new VoteRequest(
      this.node.id,
      this.node.currentTerm,
      this.node.log.length,
      lastTerm
    );
    this.eventBus.publish("vote-requests", voteRequest);
    this.startElectionTimer();
  }

  private replicateLog(follower: NodeId) {
    const i = this.node.sentLength[follower];
    const entries = this.node.log.slice(i);
    let prevLogTerm = 0;
    if (i > 0) {
      prevLogTerm = this.node.log[i - 1].term;
    }
    const logRequest = new LogRequest(
      this.node.id,
      this.node.currentTerm,
      i,
      prevLogTerm,
      this.node.commitLength,
      entries
    );
    console.log(
      `Node ${this.node.id} sends log request to follower ${follower}`
    );
    this.eventBus.publish(`replicate-log-${follower}`, logRequest);
  }

  private broadcast(event: Event) {
    const broadcastEvent = event as BroadcastEvent;
    if (this.node.currentRole == NodeRole.Leader) {
      console.log(
        `Node ${this.node.id} as leader received broadcast event:`,
        broadcastEvent
      );
      this.appendRecordToLog(broadcastEvent);
    } else {
      console.log(
        `Node ${this.node.id} forward broadcast event to leader ${this.node.currentLeader}:`,
        broadcastEvent
      );
      this.eventBus.publish(`broadcast-${this.node.currentLeader}`, event);
    }
  }

  private appendRecordToLog(broadcastEvent: BroadcastEvent) {
    this.node.log.push(new Log(broadcastEvent.log, this.node.currentTerm));
    this.node.ackedLength[this.node.id] = this.node.log.length;
  }

  private onLeaderReplicateLogTimeout() {
    if (this.node.currentRole == NodeRole.Leader) {
      console.log(
        `Node ${this.node.id} sends replicate node request to all nodes`
      );
      this.node.nodes
        .filter((node) => this.node.id != node)
        .forEach((node) => this.replicateLog(node));
      this.startLeaderReplicateLogTimer();
    }
  }

  private onLogRequest(event: Event) {
    const logRequest = event as LogRequest;
    console.log(
      `Node ${this.node.id} received log request from leader ${logRequest.leaderId} (entries size: ${logRequest.entries.length})`
    );
    if (logRequest.term > this.node.currentTerm) {
      this.node.currentTerm = logRequest.term;
      this.node.votedFor = null;
      this.node.currentRole = NodeRole.Follower;
      this.node.currentLeader = logRequest.leaderId;
      this.cancelLeaderFailureTimer();
      this.startLeaderFailureTimer();
    }
    if (logRequest.term == this.node.currentTerm) {
      this.node.currentRole = NodeRole.Follower;
      this.node.currentLeader = logRequest.leaderId;
      this.cancelLeaderFailureTimer();
      this.startLeaderFailureTimer();
    }
    const logOk =
      this.node.log.length >= logRequest.logLength &&
      (logRequest.logLength == 0 ||
        logRequest.logTerm == this.node.log[this.node.log.length - 1].term);

    if (logRequest.term == this.node.currentTerm && logOk) {
      this.appendEntries(
        logRequest.logLength,
        logRequest.leaderCommit,
        logRequest.entries
      );
      const ack = logRequest.logLength + logRequest.entries.length;
      const response = new LogResponse(
        this.node.id,
        this.node.currentTerm,
        ack,
        true
      );
      this.eventBus.publish(`log-response-${logRequest.leaderId}`, response);
    } else {
      const response = new LogResponse(
        this.node.id,
        this.node.currentTerm,
        0,
        false
      );
      this.eventBus.publish(`log-response-${logRequest.leaderId}`, response);
    }
  }

  private appendEntries(
    logLength: number,
    leaderCommit: number,
    entries: Log[]
  ) {
    if (entries.length > 0 && this.node.log.length > logLength) {
      if (this.node.log[logLength].term != entries[0].term) {
        this.node.log = this.node.log.slice(0, logLength - 1);
      }
    }
    if (logLength + entries.length > this.node.log.length) {
      for (let i = this.node.log.length - logLength; i < entries.length; i++) {
        this.node.log.push(entries[i]);
      }
    }
    if (leaderCommit > this.node.commitLength) {
      for (let i = this.node.commitLength; i < leaderCommit; i++) {
        console.log(`Delivering log ${this.node.log[i].value}`);
      }
      this.node.commitLength = leaderCommit;
    }
  }

  onLogResponse(event: Event): void {
    const logResponse = event as LogResponse;
    console.log(
      `Node ${this.node.id} received log response from node ${logResponse.follower} (success: ${logResponse.success})`
    );
    if (
      logResponse.term == this.node.currentTerm &&
      this.node.currentRole == NodeRole.Leader
    ) {
      if (
        logResponse.success &&
        logResponse.ack >= this.node.ackedLength[logResponse.follower]
      ) {
        this.node.sentLength[logResponse.follower] = logResponse.ack;
        this.node.ackedLength[logResponse.follower] = logResponse.ack;
        this.commitLogEntries();
      } else if (this.node.sentLength[logResponse.follower] > 0) {
        this.node.sentLength[logResponse.follower] =
          this.node.sentLength[logResponse.follower] - 1;
      }
    } else if (logResponse.term > this.node.currentTerm) {
      this.node.currentTerm = logResponse.term;
      this.node.currentRole = NodeRole.Follower;
      this.node.votedFor = null;
    }
  }

  private commitLogEntries() {
    const acks = (length: number) =>
      this.node.nodes.filter((node) => this.node.ackedLength[node] >= length)
        .length;
    const minAcks = Math.ceil((this.node.nodes.length + 1) / 2);
    const ready = [...Array(this.node.log.length)]
      .map((i) => i + 1)
      .filter((i) => acks(i) > minAcks);
    if (
      ready.length != 0 &&
      Math.max(...ready) > this.node.commitLength &&
      this.node.log[Math.max(...ready) - 1].term == this.node.currentTerm
    ) {
      for (let i = this.node.commitLength; i < Math.max(...ready); i++) {
        console.log(`Delivering log ${this.node.log[i].value}`);
      }
      this.node.commitLength = Math.max(...ready);
    }
  }

  private findLogByIndex(index: number): Log | undefined {
    if (index < this.node.log.length) {
      return this.node.log[index];
    } else {
      return undefined;
    }
  }

  private findLogIndexTerm(index: number, defaultTerm: number): number {
    const log = this.findLogByIndex(index);
    if (log != undefined) {
      return log.term;
    } else {
      return defaultTerm;
    }
  }
}
