Presentation scenarii
===

## Setup
Setup
Toutes les node connaissent les autres node

On a une node off - il ne se passe rien

### 1 - Démarre une node
⚙ On fait commencer la node en leader<br/>
❌ On envoie un message au leader, il ne se passe rien...

### 2 - Persistence
⚙ Persistence du log du leader (onBroadcastRequest)<br/>
✅ 1 node (leader) --> on écrit ça marche<br/>
❌ Off le node --> ça ne marche plus

### 3 - Failover
⚙ 3 nodes (tous leader) pour avoir du failover<br/>
✅ On peut écrire le message sur plusieurs nodes<br/>
❌ On envoie un message node 1 et on envoie message node2 (pas de synchro entre les 2)

### 4 - One leader, 2 followers
⚙ 3 nodes avec (if id === 1 je suis leader sinon follower)<br/>
✅ On ne peut écrire des messages que vers le leader<br/>
❌ On envoie un message node 1 (OK) mais les followers ne se mettent pas à jour

### 5 - Leader's broadcast request sends log request
⚙ On broadcast sur le leader => On envoie une logRequest aux followers<br/>
Les followers annulent et remplacent leur log à la reception d'une logRequest<br/>
✅ On envoie un message au leader (OK), les followers se mettent bien à jour<br/>
❌ On met une node 2 hors network<br/>
On envoie un nouveau message au leader => la node 2 hors network ne reçoit pas le message<br/>
On reconnecte la node 2 => elle a un message de retard si on ne renvoie pas de message au leader

### 6 - Leader sends log requests periodically
⚙ On code la réplication de log<br/>
On envoie des logRequest de manière périodique (toutes les 3 secondes) aux followers depuis le leader<br/>
✅ On envoie un message node 1 (OK), les followers se mettent bien à jour<br/>
On déconnecte node 2 du network<br/>
On envoie un message node 1 (OK), node 3 se met bien à jour (mais pas node 2)<br/>
On reconnecte node 2 => elle se met à jour<br/>
❌ si le leader devient off, le système ne marche plus<br/>

### 7 - Promotes follower to leader if it didn't receive log request from leader
⚙ On code le no leader ack timeout sur les followers<br/>
Je lance un timer, si je n'ai pas eu de nouvelles après 4 secs randomizées, je passe leader<br/>
Pourquoi randomizées ? Pour éviter que 2 noeuds deviennent leader en même temps<br/>
✅  Si le leader devient off, une autre node devient leader<br/>
❌  J'ai communiqué à mes clients l'adresse du leader, hors il est tombé<br/>
Le client doit pouvoir communiquer avec n'importe quel noeud du cluster<br/>

### 8 - Follower relays broadcast requests to the leader
⚙ Broadcast leader: quand je reçois une logRequest je set mon leader<br/>
Si mon leader est set, quand je reçois une broadcast request, renvoie une relayBroadcastRequest au leader<br/>
✅  Je peux envoyer des logs sur n'importe quel node<br/>
❌  Je coupe le réseau de node 2 --> node 2 devient leader, j'ai donc deux leaders (node 1 et node 2)<br/>
J'écris sur leader 1 puis sur leader 2, ils ont des logs divergents<br/>
Je reconnecte leader 2 au network -> node 3 reçoit des logRequests de leader 1, leader 2, et ses logs clignottent<br/>
/!\ Dans ce scénario, leader 2 n'aurait dû jamais passer leader<br/>
Pour qu'une node devienne leader il faut qu'elle ait l'accord des autres noeuds
 
### 9 - Follower becomes candidate when leader fails
⚙ Le candidate<br/>
On leader timeout je deviens candidate et non plus leader<br/>
Quand deviens candidate, je vote pour moi:<br/>
```typescript
votedFor = this.nodeId
nodesWhoVotedForMe.clear()
nodesWhoVotedForMe.add(this.nodeId)
```
Quand je deviens candidate j'envoie une voteRequest à tous les autres noeuds<br/>
Quand je suis follower et je reçois une voteRequest:<br/>
Si je n'ai pas encore voté (votedFor == undefined), je vote granted = true et je set mon votedFor<br/>
Si j'ai voté: je vote granted = false<br/>
Quand je suis candidate et je reçois une voteResponse:<br/>
Si la voteResponse est granted = true:<br/>
J'ajoute le vote au set des nodesWhoVotedForMe<br/>
Si j'ai une majorité stricte de votants (nombre de vote reçus > this.allNodesId.length / 2):<br/>
alors je deviens leader<br/>
✅ J'ai 1 leader et 2 followers, je off le leader: un des autres followers devient candidate puis leader<br/>
✅ J'ai 1 leader et 2 followers, je coupe le network au node 2, elle passe candidat et non plus leader<br/>
❌ Par contre la node 2 coupée du network reste candidat toute sa vie, même reconnectée au network<br/>

### 10 - Candidates which receives a logRequest becomes follower
⚙ Si un candidat reçoit une logrequest, il redevient follower<br/>
✅ J'ai 1 leader et 2 followers, je coupe le network au node 2, elle passe candidat et non plus leader<br/>
Quand la node 2 se reconnecte au network, elle repasse follower<br/>
❌ J'ai 1 leader et 2 followers, je coupe le network au leader<br/>
On envoie log 1 au leader<br/>
Node 2 est élu leader<br/>
On envoie log 2 à node 2<br/>
Je reconnecte node 1, on a 2 leaders et node 3 hésite entre leader au follower

ℹ Interméde<br/>
On ne sait pas ici forcément quel leader a raison<br/>
Il existe en raft plusieurs mécanismes (term, logTerm, commit) pour gérer ce genre de cas et déterminer quel leader il faut suivre<br/>
On introduit ici la notion de term: le leader qui a raison est le dernier leader en date<br/>
Le term pourrait être une date, mais les dates en système distribué, c'est mal (et on explique pourquoi)<br/>
Alors on va plutôt utiliser un entier appeler le term pour compter les élections

### 11 - When a node becomes candidate it increments its term
⚙ Quand une node devient candidat son term augmente de 1<br/>
Les leaders envoient le term dans leurs logRequest<br/>
En tant que follower, si je reçois une logRequest d'un term inférieur je ne l'accepte pas<br/>
par contre si le term est supérieur je l'accepte et je maj mon term<br/>
✅ J'ai 1 leader et 2 followers, je coupe le network au leader<br/>
J'envoie un message au leader 1<br/>
Node 2 est élu leader<br/>
J'envoie un message au leader 2<br/>
Je reconnecte node 1, on a 2 leaders, mais par contre node 3 ne prend plus les logRequest de node 1<br/>
❌ Dans ce scénario, j'ai toujours 2 leaders<br/>

### 12 - As a leader when I receive a log request with a term greater than mine I update my term and become follower
⚙ En tant que leader onLogRequest avec un term > à mon term<br/>
J'update mon term<br/>
Je passe follower<br/>
✅ J'ai 1 leader et 2 followers, je coupe le network au leader<br/>
Node 2 est élu leader<br/>
Je reconnecte node 1, on a 2 leaders<br/>
L'ancien leader repasse follower<br/>
❌ J'ai 1 leader et 2 followers, je déco node 2 du network<br/>
Node 2 passe candidat<br/>
On déco node 1 du network<br/>
On reco node 2<br/>
Node 3 passe candidat<br/>
Rien ne se passe, on est bloqué, on a deux candidats

### 13 - Candidate restarts its election process if previous one timed out
⚙ Quand une node devient candidat, elle démarre une élection et set un timer random (500)<br/>
Si le timer tombe en timeout: elle redémarre une élection avec term + 1<br/>
(note: si le candidat redevient follower, son timer est cancel)<br/>
❌ J'ai 1 leader et 2 followers, je déco node 2 du network<br/>
Node 2 passe candidat<br/>
On déco node 1 du network<br/>
On reco node 2<br/>
Node 3 passe candidat<br/>
Rien ne se passe, on est bloqué, on a deux candidats<br/>
Mais au moins les élections redémarrent avec term + 1

### 14 - Candidate sends its terms in voteRequests
⚙ Les candidats envoient leur term avec les voteRequest<br/>
Quand un candidat reçoit une voteRequest avec un term > au sien<br/>
Il maj mon term<br/>
Il set votedFor à undefined<br/>
Il clear mon nodesWhichVotedForMe<br/>
Il repasse follower<br/>
✅ J'ai 1 leader et 2 followers, je coupe le network au leader et sur node 3<br/>
Node 2 devient candidat, node 3 devient candidat<br/>
Je reconnecte le network entre node 2 et node 3<br/>
A la premiere réelection le candidat 3 redevient follower<br/>
A la seconde le candidat 3 élit le candidat 2<br/>
❌  J'ai 1 leader et 2 followers, je déco le leader du network<br/>
On envoie 1 dans le leader<br/>
On envoie 2 dans le nouveau leader, node 2<br/>
On reconnecte l'ancien leader (node 1)<br/>
Node 1 repasse follower<br/>
La log de node 1 est perdue

ℹ on peut perdre des logs dans le système<br/>
il ne faut pas que les leader valident les écriture d'entrées alors qu'elles ne sont pas répliquées<br/>
comment gérer ça avec raft ? avec le commit<br/>
slide à présenter sur les commit

### 15 - Follower acks log requests
⚙ Les followers repondent au logrequest dans tous les cas (success à true si ok, sinon success à false) et with ack<br/>
Le leader met à jour son ack dans une broadcast request
```typescript
ackedLength[this.nodeId] = this.nodeMemoryState.log.length
```
Le leader met à jour son ack pour ce follower s'il est success
```typescript
ackedLength[follower] = response.ack
```
Le nombre de acklength doit être égal à this.nodememorystate.log.length
if(nombre de acks > nombre de nodes / 2)<br/>
je met le commit à this.nodeMemoryState.log.length<br/>
Le commit length est envoyé par le leader<br/>
En tant que follower, je met à jour mon commit length<br/>
✅  J'ai 1 leader et 2 followers, je déco le leader du network<br/>
On envoie 1 dans le leader<br/>
On envoie 2 dans le nouveau leader, node 2<br/>
On reconnecte l'ancien leader (node 1)<br/>
Node 1 repasse follower<br/>
La log de node 1 est perdue mais elle n'a jamais été validée donc c'est pas grave<br/>
❌  J'ai 1 leader et 2 followers, je déco node 2 du network<br/>
On envoie 1 dans node 1, 1 est répliqué à node 3<br/>
On turn node 1 off<br/>
On reconnecte node 2<br/>
Node 3 perd son log en recevant une logRequest de node 2<br/>
Pourtant le log de node 3 avait été validé il faut donc rajouter une sécurité

### 16 - Follower accepts logRequest 
⚙ En tant que follower je n'accepte la request que si request.leaderCommit >= this.nodeMemoryState.commitLength<br/>
✅  J'ai 1 leader et 2 followers, je déco node 2 du network<br/>
On envoie 1 dans node 1, 1 est répliqué à node 3<br/>
On turn node 1 off<br/>
On reconnecte node 2<br/>
Node 3 ne perd plus song log<br/>
❌  Par contre, node 2 est toujours le leader<br/>
Et le node 3 ne fait que passer candidat sans jamais devenir leader, et redevient follower à la réception d'une logRequest<br/>
Pourquoi ? Parce qu'il n'y a pas de condition pour le candidat qui devient follower à la réception d'une logRequest, c'est systématique<br/>
ℹ parler du fait que raft garantisse que le cluster revienne à un état stable, mais pas après quelle durée

### 17 - Candidates doesn't become follower on logRequest when logRequest's term is lower than it's term
⚙ Le candidat qui reçoit une logRequest ne redevient follower que si le term de la logRequest est > à son term<br/>
Le leader qui reçoit une voteRequest avec un term > au sien met votedFor sur le sender, met à jour son term, renvoie une voteResponse à granted et devient follower<br/>
✅  J'ai 1 leader et 2 followers, je déco node 2 du network<br/>
On envoie 1 dans node 1, 1 est répliqué à node 3<br/>
On turn node 1 off<br/>
On reconnecte node 2<br/>
Node 3 ne perd plus son log<br/>
Node 2 n'est plus incorrectement leader<br/>
Node 3 devient candidat plusieurs fois, et dès que son term est supérieur à celui de node 2, alors node 2 vote pour node 3 et node 3 devient leader


### 18 - All nodes start in follower state

### 19 - Truly random timer
