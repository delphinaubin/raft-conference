TODO MVP
===

# Tous les states
- [onReceiveVoteRequest] Tous les états peuvent recevoir une requête de demande de vote pour qu'un node passe leader
    - Cette requête contient
        - id du candidat
        - term (int+)
        - longueur actuelle de l'historique des messages (=  log = ce qu'on veut stocker)
        - term de l'historique (a quel terme j'ai reçus mon dernier message ?)
    - Le node doit répondre oui je vote ou non je ne vote pas pour toi
    - Node on l'état de pour qui ils ont voté la dernière fois durant ce term
    

# Candidate
- [onEnterInState]
    - Je demarre un timer (sûrement random)
        - [onTimeout]
            Je relance le [onEnterInState]   
    - J'envoie une voteRequest où je vote pour moi

- [onReceiveVoteResponse] Candidate -->
  - Cette response contient
  - Voteur ID
  - term
  - approveCandidature? (boolean)
  (je decide si je deviens leader)

- [onReceiveLeaderLog]
    - Je check le term du leader log si il est > à mon term je redeviens follower   

# Follower     
- [onEnterInState]
    - Je suis follower
    - je démarre un timer electoral random
        - [onTimeout] --> Je deviens candidat

- [onReceiveLeaderLog]
        - Je reçois, leaderId, term, longueur du log, leader commit(int en cas de pb d'écriture sur disque mais qu'on aurait quand même dit que c'est bon), myMissingLogEntries
    - --> Je met à jour mon log
    - Je reset mon timer electoral

# Leader
- [onInit]
    - Je demarre un timer
    - [onTimeout]
        - j'envoie mes leader logs à tous les autres nodes (je place les infos en fonction de chaque etat de node)
        - Je redemarre le timer
- [onReceiveFollowerLogResponse]
    - Je mets à jour mon commit log pour tracer où on est chaque follower



# TODO IHM
 - Eteindre un node
 - Couper une connexion network
 - Envoyer un nouveau log à un node
 - Voir les logs (valeurs à persister) de chaque node
 - Voir l'historique de tout ce qui c'est passé
 - Corrompre un disque
 - Couper l'accès au disque d'un node (V2)
 - Step by step


