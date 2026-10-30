<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Fenetre from '@/components/Fenetre.vue'
import { api } from '@/services/api'
import { connect, game, testAnswer } from '@/stores/game'

const ouverte = ref(true)
const ping = ref('en attente…')

onMounted(async () => {
  connect()

  try {
    const res = await api.ping()
    ping.value = res.ok ? `ok — uptime ${res.uptime.toFixed(1)} s` : 'ko'
  } catch {
    ping.value = 'injoignable (le serveur tourne-t-il sur le port 3000 ?)'
  }
})
</script>

<template>
  <main class="bureau">
    <Fenetre v-if="ouverte" title="Poste de travail" @close="ouverte = false">
      <p class="ligne">
        API <code>/api/ping</code> : <strong>{{ ping }}</strong>
      </p>

      <p class="ligne">
        Temps réel :
        <strong :class="game.connected ? 'etat--on' : 'etat--off'">
          {{ game.connected ? 'connecté' : 'déconnecté' }}
        </strong>
      </p>

      <button class="bouton" type="button" @click="testAnswer">Envoyer une réponse de test</button>
      <p v-if="game.lastMessage" class="ligne">{{ game.lastMessage }}</p>

      <h2 class="journal__titre">Journal</h2>
      <ul class="journal">
        <li v-for="(entry, index) in game.events" :key="index">{{ entry }}</li>
        <li v-if="game.events.length === 0" class="journal__vide">Aucun événement reçu</li>
      </ul>
    </Fenetre>

    <button v-else class="bouton bouton--relance" type="button" @click="ouverte = true">
      Rouvrir la fenêtre
    </button>
  </main>
</template>
