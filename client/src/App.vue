<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Fenetre from '@/components/Fenetre.vue'
import BureauWindows from '@/components/BureauWindows.vue'
import FakeGoogle from '@/components/FakeGoogle.vue'
import FakeSite from '@/components/FakeSite.vue'
import FakeAlarme from '@/components/FakeAlarme.vue'
import FakePorteMagnetiqueFonctionnement from '@/components/FakePorteMagnetiqueFonctionnement.vue'
import FakePorteMagnetiquePannes from '@/components/FakePorteMagnetiquePannes.vue'
import FakePorteMagnetiqueBoite from '@/components/FakePorteMagnetiqueBoite.vue'
import FakePorteMagnetiqueLeurre from '@/components/FakePorteMagnetiqueLeurre.vue'
import type { SiteId } from '@/data/fakeSite'
import { api } from '@/services/api'
import { connect, game, testAnswer } from '@/stores/game'

const ouverte = ref(true)
const page = ref<'jeu' | 'windows' | 'google' | 'site'>('jeu')
const siteId = ref<SiteId>('porte-fonctionnement')
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
  <div class="application">
    <nav class="navigation" aria-label="Navigation entre les pages">
      <button
        class="navigation__bouton"
        :class="{ 'navigation__bouton--actif': page === 'jeu' }"
        type="button"
        @click="page = 'jeu'"
      >
        Page actuelle
      </button>
      <button
        class="navigation__bouton"
        :class="{ 'navigation__bouton--actif': page === 'windows' || page === 'google' || page === 'site' }"
        type="button"
        @click="page = 'windows'"
      >
        Bureau Windows 11
      </button>
    </nav>

    <main v-if="page === 'jeu'" class="bureau">
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

    <BureauWindows v-else-if="page === 'windows'" @back="page = 'jeu'" @google="page = 'google'" />

    <FakeGoogle
      v-else-if="page === 'google'"
      @close="page = 'windows'"
      @open-site="(id) => { siteId = id; page = 'site' }"
    />

    <FakeAlarme
      v-else-if="siteId === 'alarme-entreprise'"
      :site-id="siteId"
      @back="page = 'google'"
    />

    <FakePorteMagnetiqueFonctionnement
      v-else-if="siteId === 'porte-fonctionnement'"
      :site-id="siteId"
      @back="page = 'google'"
    />

    <FakePorteMagnetiquePannes
      v-else-if="siteId === 'porte-pannes'"
      :site-id="siteId"
      @back="page = 'google'"
    />

    <FakePorteMagnetiqueLeurre
      v-else-if="siteId === 'porte-installation'"
      :site-id="siteId"
      @back="page = 'google'"
    />

    <FakePorteMagnetiqueBoite
      v-else-if="siteId === 'porte-boite-depot'"
      :site-id="siteId"
      @back="page = 'google'"
    />

    <FakeSite v-else :site-id="siteId" @back="page = 'google'" />
  </div>
</template>
