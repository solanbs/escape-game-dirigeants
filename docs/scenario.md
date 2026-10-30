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
| Alarme | SuperSecure |

### Organigramme

| Rôle | Nom | Remarque |
|---|---|---|
| Chef | Sébastien Friand | Ex-Femme : Laura Rolland |
| Comptable ( hacké ) | Maël Morin | Cible lors de l'intrusion |

### L'employé corrompu

- **Nom :** David Ecnasiol
- **Profil :** ancien employé, aux prud'hommes avec l'entreprise
- **Procès :** licenciement abusif. Motif : il a couché avec l'ex-femme du patron.

---

## 3. Déroulé de la partie

### Étape 1 : Trouver un employé à contacte

Les joueurs sont forcés à font de l'**OSINT** et tombent sur une page web d'un procès en cours pour licenciement abusif d'un employé de l'écurie : David Ecnasiol.
Avec plus d'OSINT, ils trouvent son adresse mail et tentent de le contacter.

### Étape 2 : Corruption d'un employé

David accepte de coopérer, en échange d'informations qui lui permettraient de gagner son procès.

### Étape 3 : L'arnaque et la boîte

- Le gars les arnaque : il faut ouvrir la boîte soi-même.
- Mécanisme d'ouverture :
    - avec un **aimant**
    - avec un **domino**, pour ne pas couper le câble

### Étape 4 : Intrusion dans l'entreprise

- **Alarme à désactiver**
    - Indice : papier d'imprimante ou autre
    - Solution : **nom de la société sur le boîtier** (SuperSecure) + **code de base** du fabricant
- **Post-it + clé USB** : permettent de mettre en place un **accès distant (remote access)** sur le réseau de l'entreprise. Le post-it est lié à l'indice du code de l'alarme.
- **Recherche dans l'entreprise** : fouille des lieux

### Étape 5 : Élévation de privilèges

- **EoP** (Escalation of Privilege) via **GTFOBins**

### Étape 6 : Vol de données

- Exfiltration des plans aéro

---

## 4. Fin

- **Vol de données + ransomware**
- **Débrief / sensibilisation :** ce que va faire l'entreprise attaquée par la suite (réaction, gestion de crise, conséquences)

---

## 5. Données de jeu

### Identifiants

- **Format des identifiants :** 1re lettre du prénom + nom de famille (ex. `ymorin`)
- **Mot de passe :** `jEsu!SnEt0n1996!` *(à vérifier, illisible en partie)*

### Objets personnels de Yaël Morin (indices)

- **Carte des 30 ans** (décembre 1996), avec son nom et son prénom, offerte par sa mamie
- **Photo de son chien** : Yug
- **Carnet**
- **Courrier du boss** adressé à « Y. Morin »

---

## À vérifier (lecture des notes incertaine)

- [ ] Nom de famille de l'employé corrompu : « Ecrosiel » ?
- [ ] Mot de passe exact
- [ ] Nom du chien : « Yug » ?
- [ ] Carte des 30 ans : « de sa mamie » ou « de sa mariée » ?