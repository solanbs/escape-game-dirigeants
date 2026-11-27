# Escape game dirigeants

Escape game de sensibilisation à la cybersécurité. Un serveur Node (Express + Socket.IO) sert le front (Vue 3) et fait tourner le moteur de jeu ; un processus séparé, `iot-gateway`, pilote le matériel.

La documentation est dans [docs/](./docs/README.md). Les règles de travail communes (architecture à respecter, vérifications avant chaque push) sont dans [CLAUDE.md](./CLAUDE.md).

## Lancer en développement

```bash
npm install
cp .env.example .env      # puis ajuster si besoin
npm run dev               # shared + serveur + front
npm run dev:gateway       # dans un autre terminal, si on teste l'IoT
```

- Front : http://localhost:5173 (Vite, rechargement à chaud ; `/api` et `/socket.io` sont redirigés vers le serveur)
- Serveur : http://localhost:3000

## Vérifier

```bash
npm test          # tests du serveur et du gateway
npm run typecheck # vérification TypeScript de tous les paquets
npm run demo      # une partie du scénario de démonstration, jouée dans le terminal
npm run tablette -w @escape/server -- ops123   # une fausse tablette connectée au serveur
npm run check        # typecheck + tests + build
npm run check:docker # images Docker, démarrage et vérifications : obligatoire avant chaque push
```

Les mots de passe des rôles du scénario de démonstration sont dans `scenarios/demo/config.yaml`.

La CI GitHub Actions (`.github/workflows/ci.yml`) rejoue `npm run check` et `npm run check:docker` sur chaque push sur `main` et chaque pull request.

## Lancer avec Docker

```bash
cp .env.example .env      # docker compose y lit IOT_GATEWAY_TOKEN, IOT_AUDIO_DRIVER…
docker compose up --build
```

- `game` : le serveur sert le front compilé et le WebSocket sur http://localhost:3000, avec le scénario indiqué par `SCENARIO_DIR` (par défaut `scenarios/demo`).
- `gateway` : le processus IoT. Sans enceinte branchée, mettre `IOT_AUDIO_DRIVER=fake` dans `.env`.
- Les conteneurs sont à l'heure de Paris (`TZ`), pour les logs et les ids de session.
- `./data` est monté pour la future base SQLite.

## Structure

```
docs/          documentation (voir docs/README.md)
scenarios/     les scénarios : déroulé, pages, recherches, config (YAML)
templates/     gabarits YAML vierges pour écrire les pages
shared/        contrats communs au serveur, au front et au gateway
server/        serveur et moteur de jeu (server/src/modules/)
client/        front Vue 3 + Vite
iot-gateway/   processus qui pilote le matériel
data/          volume persistant
```
