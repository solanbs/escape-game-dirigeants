# Référencements

Ce tableau relie les pages et résultats consultables par les joueurs aux indices
du scénario. Les éléments marqués **À définir** restent à préciser.

| Étape | Référence / point d’entrée | Contenu ou indice à trouver | Déduction / action attendue |
|---|---|---|---|
| 1 — OSINT | Procès de l'entreprise — plusieurs pages, dont une seule nomme David Ecnasiol | Une page évoque le licenciement abusif d'un ancien employé, David Ecnasiol. Les autres pages servent de résultats leurres. | Identifier David comme personne à contacter. |
| 1 — OSINT | Site de l'entreprise | Présentation de l'écurie et de ses activités. **À définir :** informations utiles à l'enquête et nom définitif de l'entreprise. | Confirmer l'entreprise ciblée et contextualiser le procès. |
| 1 — OSINT | Startup de David Ecnasiol | Profil de la startup et adresse mail de David. | Contacter David par mail. |
| 1 — OSINT | LinkedIn de David Ecnasiol | **À définir :** éléments de profil reliant David à l'entreprise ou à sa startup. | Recouper les informations trouvées sur le procès et le site de la startup. |
| 1 — OSINT | Facebook de David Ecnasiol | **À définir :** informations personnelles utiles, sans donner directement les réponses des étapes suivantes. | Compléter le profil de David et confirmer son identité. |
| 1 — Contact | Mail | Échange avec David : il propose de donner son badge en échange d'un document utile à son procès. **À définir :** contenu exact, déclencheur et éventuel délai de réponse. | Comprendre l'échange et chercher le document demandé dans les poubelles. |
| 2 — Dumpster diving | Documents trouvés à l'extérieur des bureaux — référence numérique ou support de jeu à définir | Plusieurs documents de l'écurie, dont un élément utile au procès de David. | Retrouver la preuve demandée et la transmettre à David. |
| 3 — Boîte | Boîte magnétique — pages expliquant l'ouverture de portes magnétiques | Documentation et indices sur la boîte. La solution retenue est une coupure d'alimentation **simulée dans le jeu**. **À définir :** les indices qui permettent de déduire cette solution. | Résoudre l'énigme simulée de la boîte et récupérer le badge. |
| 4 — Intrusion | Site de l'alarme SuperSecure | Avertissement de changer le code par défaut et mention d'une intervention d'un agent de sécurité en 15 minutes. | Comprendre qu'il faut trouver le code constructeur et agir avant l'arrivée de l'agent. |
| 4 — Intrusion | Revendeur de boîtier sur Leboncoin | Annonce présentant le boîtier de l'alarme et sa marque : SuperSecure. | Identifier le fabricant, puis rechercher son code par défaut. |
| 4 — Intrusion | Blogs sur SuperSecure et le code | Pages de documentation et résultats leurres autour du système et de son code par défaut. **À définir :** source et indice exacts qui conduisent à la bonne réponse. | Trouver le code permettant de désactiver l'alarme. |
| 4 — Intrusion | LinkedIn de Sébastien Friand | Profil du dirigeant de l'entreprise. **À définir :** utilité de cette référence dans la chaîne d'indices. | À définir. |
| 4 — Recherche locale | Poste Windows de Maël Morin | **À définir :** fichiers, messages ou autres traces contenant les indices permettant de retrouver ses identifiants. | Trouver les informations de session nécessaires pour installer le remote shell. |
| 5 — Élévation de privilèges | Poste des attaquants / navigateur | **À construire :** environnement d'énigme autour de l'élévation de privilèges via GTFOBins. | Obtenir les privilèges nécessaires à l'accès aux plans aéro. |
| 6 — Vol de données | Poste des attaquants / interface de jeu | **À construire :** exfiltration des plans aéro et lancement simulé du ransomware. | Terminer l'attaque et déclencher le débrief. |

## Recherches Google et résultats attendus

Les requêtes ci-dessous sont des exemples de ce que les joueurs peuvent taper.
Les titres, extraits et pages sont fictifs et doivent être consultables dans le
navigateur du jeu. Les résultats utiles doivent guider sans afficher
immédiatement la réponse. Les informations techniques sur la boîte et l'alarme
restent propres au scénario et simulées.

| Recherche saisie | Résultats à afficher (ordre suggéré) | Indice apporté |
|---|---|---|
| `[NOM ENTREPRISE]` | 1. **[NOM ENTREPRISE] — site officiel** — présentation de l'écurie. 2. **Actualités de [NOM ENTREPRISE]** — articles fictifs. 3. **Résultats sportifs** — leurre ou contenu de contexte. 4. **Procès Affaire de licenciement abusif chez [NOM ENTREPRISE]** | Permet de trouver le site de l'entreprise, de confirmer son activité et de trouver le procès et le nom de David Ecnasiol |

| `David Ecnasiol ` | 1. **La startup de David Ecnasiol** — site fictif avec une adresse de contact. 2. **David Ecnasiol — profil professionnel** — lien vers son LinkedIn fictif. 3. **Homonymes : David E.** — leurre. 4. **David Ecnasiol — Facebook** — profil fictif et publications. | L'adresse du site de la startup permet de trouver le mail de David. |

| `David Ecnasiol LinkedIn` | 1. **David Ecnasiol — LinkedIn** — profil indiquant son ancien poste chez [NOM ENTREPRISE] et sa startup. 2. **Offres d'emploi chez [NOM ENTREPRISE]** — leurre. | Confirme le lien entre David, l'entreprise et sa startup. |

| `ouverture porte magnétique principe` | 1. **Comment fonctionne une porte à verrouillage magnétique ?** — explication générale du principe. 2. **Pannes fréquentes des accès contrôlés** — indique qu'une coupure d'alimentation peut modifier l'état du verrou, sans procédure applicable à un site réel. 3. **Installer un contrôle d'accès** — leurre. | Oriente vers l'hypothèse de coupure d'alimentation, à valider avec les indices propres à la boîte du jeu. |

| `alarme SuperSecure boîtier` | 1. **SuperSecure — système d'alarme** — site fictif signalant que le code d'usine doit être changé et qu'un agent intervient sous 15 minutes. 2. **Revendeur SuperSecure — annonce** — lien vers l'annonce fictive du boîtier sur Leboncoin. 3. **Avis sur les alarmes** — leurre. | Identifie le fabricant et la contrainte de temps. |
| `SuperSecure code usine` | 1. **Guide SuperSecure : mise en service** — indique que le code initial figure dans la documentation de mise en service. 2. **Code oublié : contacter l'installateur** — leurre. 3. **Forum : configuration d'une alarme** — discussion fictive, indice partiel mais pas le code. | Oriente vers une autre recherche ou vers la documentation trouvée dans le jeu. **À définir :** chaîne d'indices menant au code fictif. |
| `Sébastien Friand [NOM ENTREPRISE]` | 1. **Sébastien Friand — LinkedIn** — profil fictif le présentant comme dirigeant. 2. **Actualités de [NOM ENTREPRISE]** — article de contexte. 3. **Homonyme** — leurre. | Confirme son rôle. **À définir :** éventuel indice utile à la progression. |

## Parcours front à prévoir

- Google doit relier les recherches du tableau aux références ci-dessus, avec
  des résultats utiles et quelques leurres cohérents.
- Le navigateur doit permettre de consulter les sites, profils et blogs
  référencés.
- Le mail doit prendre en charge l'échange scénarisé avec David.
- Le bureau Windows doit donner accès aux documents et traces de Maël Morin.
- Les étapes 5 et 6 se déroulent sur les ordinateurs et tablettes, après le
  retour des joueurs dans la camionnette.
