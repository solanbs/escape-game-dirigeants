# ---------- 1. Installation des dépendances (tous les workspaces) ----------
FROM node:22-slim AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/
COPY iot-gateway/package.json iot-gateway/

RUN npm ci

# ---------- 2. Build : shared, puis serveur et client ----------
FROM node:22-slim AS build
WORKDIR /app
ENV NODE_ENV=development

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.base.json ./
COPY shared/ shared/
COPY server/ server/
COPY client/ client/
COPY iot-gateway/ iot-gateway/

RUN npm run build && npm run build:gateway

# ---------- 3. Image finale : JS compilé + front statique ----------
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY server/package.json server/
COPY client/package.json client/
COPY iot-gateway/package.json iot-gateway/

RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/shared/dist ./shared/dist
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/client/dist ./client/dist
COPY --from=build /app/iot-gateway/dist ./iot-gateway/dist

EXPOSE 3000

CMD ["node", "server/dist/index.js"]

# ---------- 4. Image du gateway : même code, avec mpv pour l'enceinte filaire ----------
FROM runtime AS gateway

RUN DEBIAN_FRONTEND=noninteractive apt-get update \
 && apt-get install -y --no-install-recommends mpv alsa-utils \
 && rm -rf /var/lib/apt/lists/*

CMD ["node", "iot-gateway/dist/index.js"]
