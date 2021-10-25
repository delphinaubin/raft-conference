Presentation scenarii
===


## Setup
tous les node connaissent les autres nodes



Premier scenar
1 node (leader) --> on écrit ça marche
[C] Persistence du log du leader
❌ Off le node --> ça ne marche plus


3 nodes (tous leader)
❌ On envoie un message node 1 et on envoie message node2 (pas de synchro)

3 nodes (if id === 1 je suis leader sinon follower)
[C] Réplication de log
✅ On envoie au leader replication follower
❌ On envoie un message à un follower --> pas de replication
[C] Broadcast leader
✅ On envoie un message à un follower --> replication
✅ On éteint un follower --> ça fonctionne toujours
❌ On éteint le leader --> ça ne fonctionne plus
[C] Le (No leader ack timeout) -->  Je deviens leader --> pour que ça se fasse en même temps mon timer est aléatoire
❌ Je coupe le réseau entre le leader et les autres nodes --> j'ai 2 leaders
❌ J'écris sur leader 1 puis sur leader 2 --> Divergence de log
[C] Le candidate
- Je devient candidate j'envoie une vote request en votant pour moi (candidateId = this.id), je note que j'ai voté pour moi
- Je suis node je reçoit une voteRequest(je dit oui (voteResponse) si j'ai pas déjà voté et je note pour qui j'ai voté)
- Je suis candidat quand je reçois une vote response -->
- si elle me dit oui j'incrémente le nombre de votes pour moi
- si j'ai la majorité stricte je devient leader
✅ Je coupe le réseau entre le leader et les autres nodes --> j'ai 1 leader (+ ancien leader isolé) --> je peux écrire des logs

❌ J'ai un node isolé du leader --> j'écris des logs sur le leader le node ne se met pas à jour
Je tue le leader --> Et mon node devient candidate (force timer end) --> Mon node (en retard) devient leader
J'écris des messages sur le nouveau leader --> divergence de log
[C] le node vote non si la logLength du candidate < this.logLength
✅ Même scenar qui fonctionne

❌ J'ai un leader isolé, un autre devient leader, Je reconnecte leader isolé --> J'ai 2 leaders
[C] Term
Quand je démarre : term = 0
Quand je devient candidate, this.term++ et j'envoie ma voteRequest avec mon term
Quand je reçoit une voteRequest avec un term > this.term --> Je met à jour mon term et je deviens follower
En tant que leader quand j'envoie des log request j'y place mon term
En tant que node si je reçoit une logRequest avec un term > this.term --> Je met à jour mon term et je deviens follower
❌ Même scenar --> ✅ On a 1 leader, ❌ on va avoir un conflit de logRequest donc le vieux leader peut diffuser des faux logs aux followers
[C] En tant que follower si je reçoit une logRequest avec un term < this.term --> je ne la prend pas en compte
✅ Même scenar qui fonctionne







## Pour après (peut être dans des slides)


⚠️ Au bout de 10 ans tout le log prend des giga je ne peux pas l'envoyer toutes les secondes... (truncate de log, logTerm et tout le tralala)




❌ On 1 leader, le dernier log est OK ✅ mais le vieux leader a plus de logs que les autres (logLength >)
// Le but est de supprimer les logs non partagés chez le vieux leader
// Commment savoir quels logs ne sont pas partagés ? --> logTerm
[C] Chaque entrée de logs est associée au term courrant
[C]





⚠️ --> Scenar à trouver :





❌ Si on reconnecte le leader isolé aux autres nodes c'est la merde on a 2 leader et divergence de logs





# Scenario 1

Node 1 logLength 1
Node 2 logLength 2
--> Je sais que node 2 est le meilleur leader potentiel

# Scenario 2

Node 1 logLength 2
Node 2 logLength 2 aussi mais divergent
--> Je ne sais pas qui le meilleur leader potentiel --> J'ai besoin du logterm





# TODO
[X] Rendre les valeurs optionels dans les builders pour coder petit à petit
[X] Sur le node manager j'affiche les logs du node et logLength
[ ] Faire un tableau d'état de node et afficher
- les timers ⚠️
- les logs
- votedFor
- Vote received
[ ] Etre capable de revenir dans le passé
[ ] Sur le nodemanager j'afficher les timers en cours et je peux forcer la fin d'un timer


# Idée pres
donner des noms aux nodes (Michel, Jean pierre, ...)
