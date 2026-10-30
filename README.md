# Escape game dirigeants

Squelette minimal : un serveur Node (Express + socket.io) qui sert le front Vue
et porte le moteur de jeu. Le front et le back sont séparés dans le code, pas
dans le déploiement.

## Lancer en développement

```bash
npm install
npm run dev
```

- Front : http://localhost:5173 (Vite, rechargement à chaud)
- API : http://localhost:3000

Vite proxifie `/api` et `/socket.io` vers le serveur : aucune URL en dur, aucun CORS.

## Lancer avec Docker

```bash
docker compose up --build
```

- Site : http://localhost:3000

Le serveur y sert `client/dist` et le WebSocket sur le même port. `./data` est
monté dans le conteneur pour accueillir la future base SQLite.

## Structure

```
shared/   types et noms d'événements communs (contrat front ↔ back)
server/   Express, socket.io, moteur de jeu (game.ts = seul dépositaire des réponses)
client/   Vue 3 + Vite + TypeScript
data/     volume persistant (vide pour l'instant)
```

## Où brancher la suite

| Besoin | Fichier |
|---|---|
| Scénario, énigmes, réponses | `server/src/game.ts` |
| Base SQLite | nouveau `server/src/db.ts` + `./data` déjà monté |
| Objets connectés (ESP32, relais) | namespace `/iot` dans `server/src/realtime.ts` |
| Nouvelles routes HTTP | `server/src/index.ts` |
| État de jeu côté front | `client/src/stores/game.ts` |
| Fenêtres du faux bureau | `client/src/components/` |

## Vérifier que la chaîne fonctionne

La fenêtre affiche :

- `API /api/ping : ok` → le front parle au back ;
- `Temps réel : connecté` → socket.io est passé ;
- le bouton de test envoie `admin` pour `puzzle-1` et doit faire apparaître
  `énigme résolue` et `iot → relay on` dans le journal.
