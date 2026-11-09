# Scénario Escape Game

> Escape game de sensibilisation à la cybersécurité : les joueurs incarnent une équipe d'attaquants.

---

## 1. Contexte

- **Mission :** l'équipe est payée par un concurrent pour récupérer des secrets d'entreprise.
- **QG :** une camionnette équipée de **5 PC / tablettes**
    - 1 poste **master**
    - 4 postes **opé**

---

## 2. Univers et personnages

### L'entreprise ciblée

| Élément | Détail |
|---|---|
| Entreprise | '***' Racing Team |
| Secret à voler | Plans aéro |

### L'employé corrompu

- **Nom :** David Ecnasiol
- **Profil :** ancien employé, aux prud'hommes avec l'entreprise
- **Procès :** licenciement abusif. Motif : il a couché avec l'ex-femme du patron.

---

## 3. Déroulé de la partie

### Étape 1 : Trouver un employé à contacter

Les joueurs sont forcés à faire de l'**OSINT** et tombent sur une page web d'un procès en cours pour licenciement abusif d'un employé de l'écurie : David Ecnasiol.
Avec plus d'OSINT, ils trouvent son adresse mail et tentent de le contacter.

### Étape 2 : Corruption d'un employé / récupération d'informations

David accepte de donner son badge d'accès, que l'écurie a oublié de désactiver, en échange d'informations qui lui permettraient de gagner son procès.
En faisant du dumpster diving dans les poubelles à l'exterieur des bureaux de l'écurie, les attaquants trouvent plusieurs documents de l'écurie dont un très intéressant pour le procès de David.

### Étape 3 : La boite

David informe les attaquants que son badge se trouve dans une boite morte qui se trouve dans la rue devant les bureaux de l'écurie et qu'il l'ouvrira une fois les attaquants arrivés devant.

Au moment d'ouvrir la boîte, sa télécommande à distance ne fonctionne plus, les attaquants doivent donc trouver un moyen d'ouvrir la boite ( probablement boite à aimant donc désactiver éléctricité ou envoyer une impulsion électrique ou couper cables )

Ils récupèrent ensuite le badge qui leur permet d'entrer dans les bureaux.

### Étape 4 : Intrusion dans l'entreprise

- **Alarme à désactiver**
    - Indice : papier d'imprimante ou autre
    - Solution : **nom de la société sur le boîtier** (SuperSecure) + **code de base** du fabricant à trouver sur internet
- **Recherche dans l'entreprise** : les attaquants ont à leur disposition une clé usb permettant d'avoir un accès shell à distance dans l'entreprise. Pour l'installer, ils ont besoin d'avoir accès à une session ouverte. Ils doivent donc faire de la recherche physique dans l'entreprise pour trouver le nom, prénom, mot de passe et formule des identifiants de l'entreprise pour ouvrir la session de Maël Morin, un comptable possédant de faibles privilèges sur l'intranet de l'écurie.

### Étape 5 : Élévation de privilèges / TO DO

Une fois le remote shell installé, les attaquants sortent des bureaux de l'écurie et retournent dans leur camionette. La fin du scénario se déroule uniquement sur les ordinateurs / tablettes.

- **EoP** (Elévation de privilèges) via **GTFOBins**

### Étape 6 : Vol de données / TO DO

- Exfiltration des plans aéro
- Lancement d'un ransomware 

---

## 4. Fin

- **Vol de données + ransomware**
- **Débrief / sensibilisation :** ce que va faire l'entreprise attaquée par la suite ( contacter le campus cyber, assurances, porter plainte, gestion de crise... )

