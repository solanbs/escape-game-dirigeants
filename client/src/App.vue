<script setup lang="ts">
import { computed, onMounted, ref, type Component } from 'vue'
import Fenetre from '@/components/Fenetre.vue'
import BureauWindows from '@/components/BureauWindows.vue'
import FakeGoogle from '@/components/FakeGoogle.vue'
import FakeMail from '@/components/FakeMail.vue'
import PageAnnonce from '@/components/PageAnnonce.vue'
import PageArticle from '@/components/PageArticle.vue'
import PageFacebook from '@/components/PageFacebook.vue'
import PageFictive from '@/components/PageFictive.vue'
import PageForum from '@/components/PageForum.vue'
import PageIndexFile from '@/components/PageIndexFile.vue'
import PageLinkedin from '@/components/PageLinkedin.vue'
import PageSite from '@/components/PageSite.vue'
import { pages } from '@/data/pages'
import { api } from '@/services/api'
import { connect, game, testAnswer } from '@/stores/game'

const ouverte = ref(true)
const page = ref<'jeu' | 'windows' | 'google' | 'mail' | 'site' | 'pages'>('jeu')
/** Page fictive ouverte : nom de son fichier YAML dans scenarios/scenario1_red_team/pages/. */
const siteId = ref('')
/** Où revenir en quittant une page : le faux Google ou la liste de test. */
const origine = ref<'google' | 'pages'>('google')
const ping = ref('en attente…')

/**
 * Enveloppe à utiliser pour chaque template (champ `template:` des YAML).
 * Pour un nouveau template : créer son enveloppe Page<Nom>.vue et l'ajouter ici.
 * Un template absent de cette table (faute de frappe…) est affiché par PageFictive,
 * qui montre un message « template inconnu » au lieu d'un écran vide.
 */
const ENVELOPPES: Record<string, Component> = {
  Annonce: PageAnnonce,
  Article: PageArticle,
  Facebook: PageFacebook,
  Forum: PageForum,
  IndexFile: PageIndexFile,
  Linkedin: PageLinkedin,
  Site: PageSite,
}

const enveloppe = computed(() => ENVELOPPES[pages[siteId.value]?.template ?? ''])

function ouvrirPage(id: string, depuis: 'google' | 'pages') {
  siteId.value = id
  origine.value = depuis
  page.value = 'site'
}

/** Toutes les pages YAML, triées par template puis par nom (bouton « Pages (test) »). */
const listePages = Object.entries(pages)
  .map(([id, p]) => ({ id, url: p.url, template: p.template, gere: p.template in ENVELOPPES }))
  .sort((a, b) => a.template.localeCompare(b.template) || a.id.localeCompare(b.id))

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
        :class="{ 'navigation__bouton--actif': page === 'windows' || page === 'google' || page === 'mail' || page === 'site' }"
        type="button"
        @click="page = 'windows'"
      >
        Bureau Windows 11
      </button>
      <button
        class="navigation__bouton"
        :class="{ 'navigation__bouton--actif': page === 'pages' }"
        type="button"
        @click="page = 'pages'"
      >
        Pages (test)
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

    <BureauWindows v-else-if="page === 'windows'" @back="page = 'jeu'" @google="page = 'google'" @mail="page = 'mail'" />

    <FakeGoogle
      v-else-if="page === 'google'"
      @close="page = 'windows'"
      @open-mail="page = 'mail'"
      @open-site="(id) => ouvrirPage(id, 'google')"
    />

    <FakeMail
      v-else-if="page === 'mail'"
      @close="page = 'windows'"
      @badge-obtenu="() => {}"
    />

    <!-- Liste de test : toutes les pages YAML, pour les ouvrir sans passer par Google -->
    <main v-else-if="page === 'pages'" class="liste-pages">
      <h1>Pages du scénario ({{ listePages.length }})</h1>
      <p class="liste-pages__aide">
        Fichiers de <code>scenarios/scenario1_red_team/pages/</code>. Cliquer ouvre la page comme depuis Google.
      </p>
      <table>
        <thead>
          <tr><th>Template</th><th>Fichier</th><th>Adresse</th></tr>
        </thead>
        <tbody>
          <tr v-for="p in listePages" :key="p.id">
            <td>
              {{ p.template }}
              <small v-if="!p.gere" class="liste-pages__a-faire">template à faire</small>
            </td>
            <td><button type="button" @click="ouvrirPage(p.id, 'pages')">{{ p.id }}</button></td>
            <td><code>{{ p.url }}</code></td>
          </tr>
        </tbody>
      </table>
    </main>

    <!-- Pages fictives -->
    <!-- :key force une nouvelle enveloppe à chaque page (sinon deux articles de suite
         réutiliseraient la même, sans recharger le contenu). -->
    <component
      :is="enveloppe"
      v-else-if="enveloppe"
      :key="siteId"
      :site-id="siteId"
      @back="page = origine"
    />

    <!-- Template sans enveloppe ou page introuvable : message explicite. -->
    <PageFictive v-else :key="siteId" :site-id="siteId" @back="page = origine" />
  </div>
</template>

<style scoped>
.liste-pages {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  background: #ffffff;
  color: #222222;
  font-family: system-ui, sans-serif;
}

.liste-pages h1 {
  margin: 0 0 0.3rem;
  font-size: 1.4rem;
}

.liste-pages__aide {
  margin: 0 0 1.5rem;
  color: #666666;
}

.liste-pages table {
  border-collapse: collapse;
  width: 100%;
  max-width: 1000px;
}

.liste-pages th,
.liste-pages td {
  padding: 0.4rem 0.8rem;
  border-bottom: 1px solid #eeeeee;
  text-align: left;
}

.liste-pages td button {
  padding: 0;
  border: none;
  background: none;
  color: #1a73e8;
  font: inherit;
  cursor: pointer;
}

.liste-pages td button:hover {
  text-decoration: underline;
}

.liste-pages__a-faire {
  margin-left: 0.4rem;
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
  background: #fff3cd;
  color: #7a5b00;
  font-size: 0.75rem;
}
</style>
