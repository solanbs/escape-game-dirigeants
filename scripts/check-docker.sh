#!/usr/bin/env bash
# Vérification Docker obligatoire avant chaque push (voir CLAUDE.md).
#
#   npm run check:docker
#
# Construit les images, démarre game + gateway dans un projet Compose isolé
# (escape-check, port 3999 par défaut), vérifie que tout démarre et répond,
# puis arrête tout. Code de sortie 0 = OK, 1 = échec (avec les logs utiles).
set -euo pipefail

cd "$(dirname "$0")/.."

PROJECT=escape-check
export GAME_PORT="${CHECK_PORT:-3999}"
export IOT_GATEWAY_TOKEN="${IOT_GATEWAY_TOKEN:-check-docker-token}"
export IOT_AUDIO_DRIVER=fake
# Clavier et porte : le vrai bus HTTP des ESP32, sur un port à part pour ne pas
# gêner un gateway de dev.
export IOT_DOOR_DRIVER=http
export IOT_KEYPAD_DRIVER=http
export IOT_DEVICE_TOKEN="${IOT_DEVICE_TOKEN:-check-device-token}"
export IOT_DEVICES_HTTP_PORT="${CHECK_DEVICES_PORT:-18080}"
DEVICES_URL="http://localhost:${IOT_DEVICES_HTTP_PORT}"
PASSWORD="${CHECK_PASSWORD:-ops123}"   # mot de passe ops de scenarios/demo/config.yaml
URL="http://localhost:${GAME_PORT}"

compose() { docker compose -p "$PROJECT" "$@"; }
logs() { compose logs --no-color "$@" 2>/dev/null | sed 's/\x1b\[[0-9;]*m//g'; }

ok()   { echo "  ✅ $1"; }
fail() {
  echo "  ❌ $1"
  echo
  echo "----- logs game -----";    logs game    | tail -40
  echo "----- logs gateway -----"; logs gateway | tail -20
  exit 1
}

cleanup() { compose down --remove-orphans >/dev/null 2>&1 || true; }
trap cleanup EXIT

echo "▶ Construction et démarrage (projet $PROJECT, ports $GAME_PORT et $IOT_DEVICES_HTTP_PORT)…"
compose up -d --build >/dev/null 2>&1 || { compose up -d --build; fail "docker compose up --build a échoué"; }

echo "▶ Vérifications"

# 1. Le serveur répond
for _ in $(seq 1 60); do
  curl -sf --max-time 5 "$URL/api/ping" >/dev/null 2>&1 && break
  sleep 1
done
curl -sf --max-time 5 "$URL/api/ping" >/dev/null || fail "le serveur ne répond pas sur $URL/api/ping"
ok "le serveur répond (/api/ping)"

# 2. Le scénario est chargé (sinon le serveur aurait refusé de démarrer)
logs game | grep -q "scénario chargé" || fail "le scénario n'a pas été chargé"
ok "scénario chargé"

# 3. Le front est servi
curl -sf --max-time 5 "$URL/" | grep -q '<div id="app">' || fail "le front n'est pas servi sur $URL/"
ok "front servi"

# 4. Les conteneurs tournent toujours (pas de redémarrage en boucle)
for service in game gateway; do
  state=$(compose ps --format '{{.Service}} {{.State}}' | awk -v s="$service" '$1 == s { print $2 }')
  [ "$state" = "running" ] || fail "le conteneur $service n'est pas en marche (état : ${state:-absent})"
done
ok "conteneurs game et gateway en marche"

# 5. Le gateway IoT est connecté au serveur
for _ in $(seq 1 20); do
  logs game | grep -q "Gateway connected" && break
  sleep 1
done
logs game | grep -q "Gateway connected" || fail "le gateway IoT ne s'est pas connecté"
ok "gateway IoT connecté"

# 6. Le bus HTTP des appareils (clavier, porte) répond et exige son jeton
code_sans=$(curl -s --max-time 5 -o /dev/null -w '%{http_code}' "$DEVICES_URL/devices/door-main/state" || true)
code_avec=$(curl -s --max-time 5 -o /dev/null -w '%{http_code}' -H "x-device-token: $IOT_DEVICE_TOKEN" "$DEVICES_URL/devices/inconnu/state" || true)
[ "$code_sans" = "401" ] || fail "le bus HTTP des appareils ne refuse pas une requête sans jeton (code $code_sans)"
[ "$code_avec" = "404" ] || fail "le bus HTTP des appareils ne répond pas avec le jeton (code $code_avec)"
ok "bus HTTP des appareils (clavier, porte) en marche et protégé par jeton"

# 7. Une tablette se connecte avec un mot de passe de rôle, une autre est refusée
tablet() { SERVER_URL="$URL" timeout 8 npx tsx server/scripts/tablette.ts "$1" 2>&1 || true; }
tablet "$PASSWORD" | grep -q "connectée" || fail "une tablette n'arrive pas à se connecter avec « $PASSWORD »"
ok "tablette connectée avec un mot de passe de rôle"
tablet "mauvais-mot-de-passe-check" | grep -q "refusée" || fail "un mauvais mot de passe n'est pas refusé"
ok "mauvais mot de passe refusé"

# 8. Aucune erreur dans les logs du serveur
if logs game | grep -qE "(ERROR|FATAL):"; then
  fail "des erreurs apparaissent dans les logs du serveur"
fi
ok "aucune erreur dans les logs du serveur"

echo
echo "✅ Docker OK : on peut pousser."
