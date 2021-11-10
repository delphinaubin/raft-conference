Presentation scenarii
===


## Setup
Setup
Toutes les node connaissent les autres node

On a une node off - il ne se passe rien

[C] On fait commencer la node en leader
❌ On envoie un message au leader, il ne se passe rien...

[C] Persistence du log du leader (onBroadcastRequest)
✅ 1 node (leader) --> on écrit ça marche
❌ Off le node --> ça ne marche plus

[C] 3 nodes (tous leader) pour avoir du failover
✅ On peut écrire le message sur plusieurs nodes
❌ On envoie un message node 1 et on envoie message node2 (pas de synchro entre les 2)

[C] 3 nodes avec (if id === 1 je suis leader sinon follower)
✅ On ne peut écrire des messages que vers le leader
❌ On envoie un message node 1 (OK) mais les followers ne se mettent pas à jour

[C] On broadcast sur le leader => On envoie une logRequest aux followers
Les followers annulent et remplacent leur log à la reception d'une logRequest
✅ On envoie un message au leader (OK), les followers se mettent bien à jour
❌ On met une node 2 hors network
On envoie un nouveau message au leader => la node 2 hors network ne reçoit pas le message
On reconnecte la node 2 => elle a un message de retard si on ne renvoie pas de message au leader

[C] On code la réplication de log
On envoie des logRequest de manière périodique (toutes les 3 secondes) aux followers depuis le leader
✅ On envoie un message node 1 (OK), les followers se mettent bien à jour
On déconnecte node 2 du network
On envoie un message node 1 (OK), node 3 se met bien à jour (mais pas node 2)
On reconnecte node 2 => elle se met à jour
❌ si le leader devient off, le système ne marche plus

[C] On code le no leader ack timeout sur les followers
Je lance un timer, si je n'ai pas eu de nouvelles après 4 secs randomizées, je passe leader
Pourquoi randomizées ? Pour éviter que 2 noeuds deviennent leader en même temps
✅  Si le leader devient off, une autre node devient leader
❌  J'ai communiqué à mes clients l'adresse du leader, hors il est tombé
Le client doit pouvoir communiquer avec n'importe quel noeud du cluster

(cas start timer aléatoire)

[C] Broadcast leader: quand je reçois une logRequest je set mon leader
Si mon leader est set, quand je reçois une broadcast request, renvoie une relayBroadcastRequest au leader
✅  Je peux envoyer des logs sur n'importe quel node
❌  Je coupe le réseau de node 2 --> node 2 devient leader, j'ai donc deux leaders (node 1 et node 2)
J'écris sur leader 1 puis sur leader 2, ils ont des logs divergents
Je reconnecte leader 2 au network -> node 3 reçoit des logRequests de leader 1, leader 2, et ses logs clignottent
/!\ Dans ce scénario, leader 2 n'aurait dû jamais passer leader
Pour qu'une node devienne leader il faut qu'elle ait l'accord des autres noeuds

[C] Le candidate
On leader timeout je deviens candidate et non plus leader
Quand deviens candidate, je vote pour moi:
votedFor = this.nodeId
nodesWhoVotedForMe.clear()
nodesWhoVotedForMe.add(this.nodeId)
Quand je deviens candidate j'envoie une voteRequest à tous les autres noeuds
Quand je suis follower et je reçois une voteRequest:
Si je n'ai pas encore voté (votedFor == undefined), je vote granted = true et je set mon votedFor
Si j'ai voté: je vote granted = false
Quand je suis candidate et je reçois une voteResponse:
Si la voteResponse est granted = true:
J'ajoute le vote au set des nodesWhoVotedForMe
Si j'ai une majorité stricte de votants (nombre de vote reçus > this.allNodesId.length / 2):
alors je deviens leader
✅ J'ai 1 leader et 2 followers, je off le leader: un des autres followers devient candidate puis leader
✅ J'ai 1 leader et 2 followers, je coupe le network au node 2, elle passe candidat et non plus leader
❌ Par contre la node 2 coupée du network reste candidat toute sa vie, même reconnectée au network

[C] Si un candidat reçoit une logrequest, il redevient follower
✅ J'ai 1 leader et 2 followers, je coupe le network au node 2, elle passe candidat et non plus leader
Quand la node 2 se reconnecte au network, elle repasse follower
❌ J'ai 1 leader et 2 followers, je coupe le network au leader
On envoie log 1 au leader
Node 2 est élu leader
On envoie log 2 à node 2
Je reconnecte node 1, on a 2 leaders

[I] Interméde
On ne sait pas ici forcément quel leader a raison
Il existe en raft plusieurs mécanismes (term, logTerm, commit) pour gérer ce genre de cas et déterminer quel leader il faut suivre
On introduit ici la notion de term: le leader qui a raison est le dernier leader en date
Le term pourrait être une date, mais les dates en système distribué, c'est mal (et on explique pourquoi)
Alors on va plutôt utiliser un entier appeler le term pour compter les élections

[C] Quand une node devient candidat son term augmente de 1
Les leaders envoient le term dans leurs logRequest
si je reçois une logRequest d'un term inférieur je ne l'accepte pas
par contre si le term est supérieur je l'accepte et je maj mon term
✅ J'ai 1 leader et 2 followers, je coupe le network au leader
J'envoie un message au leader 1
Node 2 est élu leader
J'envoie un message au leader 2
Je reconnecte node 1, on a 2 leaders, mais par contre node 3 ne prend plus les logRequest de node 1
❌ Dans ce scénario, j'ai toujours 2 leaders

[C] En tant que leader onLogRequest avec un term > à mon term
J'update mon term
Je passe follower
✅ J'ai 1 leader et 2 followers, je coupe le network au leader
Node 2 est élu leader
Je reconnecte node 1, on a 2 leaders
L'ancien leader repasse follower
❌ J'ai 1 leader et 2 followers, je déco node 2 du network
Node 2 passe candidat
On déco node 1 du network
On reco node 2
Node 3 passe candidat
Rien ne se passe, on est bloqué, on a deux candidats

[C] Quand une node devient candidat, elle démarre une élection et set un timer random (2000)
Si le timer tombe en timeout: elle redémarre une élection avec term + 1
(note: si le candidat redevient follower, son timer est cancel)
❌ J'ai 1 leader et 2 followers, je déco node 2 du network
Node 2 passe candidat
On déco node 1 du network
On reco node 2
Node 3 passe candidat
Rien ne se passe, on est bloqué, on a deux candidats
Mais au moins les élections redémarrent avec term + 1

[C] Les candidats envoient leur term avec les voteRequest
Quand un candidat reçoit une voteRequest avec un term > au sien
Il maj mon term
Il set votedFor à undefined
Il clear mon nodesWhichVotedForMe
Il repasse follower
✅ J'ai 1 leader et 2 followers, je coupe le network au leader et sur node 3
Node 2 devient candidat, node 3 devient candidat
Je reconnecte le network entre node 2 et node 3
A la premiere réelection le candidat 3 redevient follower
A la seconde le candidat 3 élit le candidat 2
❌  J'ai 1 leader et 2 followers, je déco le leader du network
On envoie 1 dans le leader
On envoie 2 dans le nouveau leader, node 2
On reconnecte l'ancien leader (node 1)
Node 1 repasse follower
La log de node 1 est perdue

[I] on peut perdre des logs dans le système
il ne faut pas que les leader valident les écriture d'entrées alors qu'elles ne sont pas répliquées
comment gérer ça avec raft ? avec le commit
slide à présenter sur les commit

[C] Les followers repondent au logrequest dans tous les cas (success à true si ok, sinon success à false) et with ack
Le leader met à jour son ack dans une broadcast request
ackedLength[this.nodeId] = this.nodeMemoryState.log.length
Le leader met à jour son ack pour ce follower s'il est success
ackedLength[follower] = response.ack
if(nombre de acks > nombre de nodes / 2)
je met le commit à this.nodeMemoryState.log.length
✅  J'ai 1 leader et 2 followers, je déco le leader du network
On envoie 1 dans le leader
On envoie 2 dans le nouveau leader, node 2
On reconnecte l'ancien leader (node 1)
Node 1 repasse follower
La log de node 1 est perdue mais elle n'a jamais été validée donc c'est pas grave
❌  J'ai 1 leader et 2 followers, je déco node 2 du network
On envoie 1 dans node 1, 1 est répliqué à node 3
On turn node 1 off
On reconnecte node 2
Node 3 perd son log en recevant une logRequest de node 2
Pourtant le log de node 3 avait été validé il faut donc rajouter une sécurité

[C] En tant que follower je n'accepte la request que si request.leaderCommit >= this.nodeMemoryState.commitLength
✅  J'ai 1 leader et 2 followers, je déco node 2 du network
On envoie 1 dans node 1, 1 est répliqué à node 3
On turn node 1 off
On reconnecte node 2
Node 3 ne perd plus song log
❌  Par contre, node 2 est toujours le leader
Et le node 3 ne fait que passer candidat sans jamais devenir leader, et redevient follower à la réception d'une logRequest
Pourquoi ? Parce qu'il n'y a pas de condition pour le candidat qui devient follower à la réception d'une logRequest, c'est systématique
[i] parler du fait que raft garantisse que le cluster revienne à un état stable, mais pas après quelle durée

[C] Le candidat qui reçoit une logRequest ne redevient follower que si le term de la logRequest est > à son term
Le leader qui reçoit une voteRequest avec un term > à son term met à jour son term et redevient follower
✅  J'ai 1 leader et 2 followers, je déco node 2 du network
On envoie 1 dans node 1, 1 est répliqué à node 3
On turn node 1 off
On reconnecte node 2
Node 3 ne perd plus son log
Node 2 n'est plus incorrectement leader
❌  Par contre, node 3 n'arrive pas à devenir leader
Pourquoi ? Au bout d'un moment, node 3 devient candidat, et son term est suffisamment grand pour refaire devenir candidat node 2
Mais avec nos timers aléatoires, node 2 détecte qu'il n'y a pas de leader et passe candidat avant que l'élection se termine
Pendant un brief instant, le term de node 3 > au term de node 2... et on repart dans un cycle potentiellement infini.

[i] Hack dû aux timers qui ne sont pas vraiment aléatoires, pour casser le cycle il faut que le leader réponde
[C] Le leader qui reçoit une voteRequest avec un term > au sien met votedFor sur le sender, renvoie une voteResponse à granted et devient follower
✅  J'ai 1 leader et 2 followers, je déco node 2 du network
On envoie 1 dans node 1, 1 est répliqué à node 3
On turn node 1 off
On reconnecte node 2
Node 3 ne perd plus son log
Node 2 n'est plus incorrectement leader
Node 3 devient candidat plusieurs fois, et dès que son term est supérieur à celui de node 2, alors node 2 vote pour node 3 et node 3 devient leader

[Fin]

# TODO
[X] Rendre les valeurs optionels dans les builders pour coder petit à petit
[X] Sur le node manager j'affiche les logs du node et logLength
[X] Faire un tableau d'état de node et afficher
- les timers ⚠️
- les logs
- votedFor
- Vote received
[X] Etre capable de revenir dans le passé
[X] Sur le nodemanager j'afficher les timers en cours et je peux forcer la fin d'un timer

# Idée pres
donner des noms aux nodes (Michel, Jean pierre, ...)
