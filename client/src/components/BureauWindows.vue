<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import '@/styles/style_windows.css'
import { dossiersMael, type FichierBureau } from '@/data/scenario'

defineEmits<{
  back: []
  google: []
  mail: []
}>()

const menuOuvert = ref(false)
const maintenant = ref(new Date())
let horloge: number

// Explorateur de fichiers
const explorateurOuvert = ref(false)
const dossierActifId = ref('documents')
const fichierOuvert = ref<FichierBureau | null>(null)

const dossierActif = computed(
  () => dossiersMael.find((d) => d.id === dossierActifId.value) ?? dossiersMael[0],
)

const ouvrirDossier = (id: string) => {
  dossierActifId.value = id
  fichierOuvert.value = null
  explorateurOuvert.value = true
  menuOuvert.value = false
}

const basculerMenu = () => {
  menuOuvert.value = !menuOuvert.value
}

const eteindrePC = () => {
  window.alert('Extinction du système...')
}

const formatDate = () =>
  maintenant.value.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

const formatHeure = () =>
  maintenant.value.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })

onMounted(() => {
  horloge = window.setInterval(() => {
    maintenant.value = new Date()
  }, 1000)
})

onUnmounted(() => {
  window.clearInterval(horloge)
})

const appsMenu = [
  { icone: '🌐', nom: 'Edge', action: 'google' },
  { icone: '✉️', nom: 'Courrier', action: 'mail' },
  { icone: '📁', nom: 'Explorateur', action: 'fichiers' },
  { icone: '📅', nom: 'Calendrier', action: '' },
  { icone: '⚙️', nom: 'Paramètres', action: '' },
  { icone: '💬', nom: 'Teams', action: 'teams' },
] as const
</script>

<template>
  <main class="windows-container">
    <div v-if="menuOuvert" class="start-menu">
      <div class="start-menu__search">
        <span aria-hidden="true">🔍</span>
        <span>Tapez ici pour effectuer une recherche</span>
      </div>

      <div class="start-menu__header">
        <strong>Épinglé</strong>
        <button class="start-menu__all-apps" type="button">Toutes les applications &gt;</button>
      </div>

      <div class="start-menu__grid">
        <button
          v-for="app in appsMenu"
          :key="app.nom"
          class="start-menu__app"
          type="button"
          @click="
            app.action === 'google'
              ? ($emit('google'), (menuOuvert = false))
              : app.action === 'mail'
                ? ($emit('mail'), (menuOuvert = false))
                : app.action === 'fichiers'
                  ? ouvrirDossier('documents')
                  : app.action === 'teams'
                    ? ouvrirDossier('telechargements')
                    : null
          "
        >
          <span class="app-icon">{{ app.icone }}</span>
          <span>{{ app.nom }}</span>
        </button>
      </div>

      <div class="start-menu__footer">
        <div class="start-menu__user">
          <span class="user-avatar" aria-hidden="true">👤</span>
          <span>Maël Morin</span>
        </div>
        <button class="start-menu__power" type="button" aria-label="Marche/Arrêt" @click="eteindrePC">
          ⏻
        </button>
      </div>
    </div>

    <div class="windows-page__desktop">
      <!-- Icônes du bureau -->
      <button class="desktop-icon" type="button" @click="ouvrirDossier('telechargements')">
        <span class="desktop-icon__picture">💻</span>
        <span class="desktop-icon__text">Ce PC</span>
      </button>

      <button class="desktop-icon" type="button" @click="ouvrirDossier('documents')">
        <span class="desktop-icon__picture">📁</span>
        <span class="desktop-icon__text">Documents</span>
      </button>

      <button class="desktop-icon" type="button" @click="ouvrirDossier('corbeille')">
        <span class="desktop-icon__picture">🗑️</span>
        <span class="desktop-icon__text">Corbeille</span>
      </button>

      <button class="desktop-icon" type="button" @click="$emit('google')">
        <span class="desktop-icon__picture">🌐</span>
        <span class="desktop-icon__text">Google</span>
      </button>

      <button class="desktop-icon" type="button" @click="$emit('mail')">
        <span class="desktop-icon__picture">✉️</span>
        <span class="desktop-icon__text">Courrier</span>
      </button>

      <button class="desktop-icon" type="button" @click="ouvrirDossier('bureau')">
        <span class="desktop-icon__picture">📝</span>
        <span class="desktop-icon__text">Pense-bête</span>
      </button>

      <!-- Explorateur de fichiers -->
      <section v-if="explorateurOuvert" class="explorer" aria-label="Explorateur de fichiers">
        <header class="explorer__title">
          <span>📁 {{ dossierActif.nom }} — Maël Morin</span>
          <button type="button" aria-label="Fermer" @click="explorateurOuvert = false">×</button>
        </header>
        <div class="explorer__body">
          <nav class="explorer__nav">
            <button
              v-for="d in dossiersMael"
              :key="d.id"
              type="button"
              :class="{ active: d.id === dossierActifId }"
              @click="ouvrirDossier(d.id)"
            >
              {{ d.icone }} {{ d.nom }}
            </button>
          </nav>
          <div class="explorer__files">
            <button
              v-for="f in dossierActif.fichiers"
              :key="f.nom"
              type="button"
              class="explorer__file"
              @click="fichierOuvert = f"
            >
              <span>{{ f.icone }}</span>
              <span>{{ f.nom }}</span>
            </button>
            <p v-if="dossierActif.fichiers.length === 0">Ce dossier est vide.</p>
          </div>
          <article v-if="fichierOuvert" class="explorer__viewer">
            <h3>{{ fichierOuvert.nom }}</h3>
            <pre>{{ fichierOuvert.contenu }}</pre>
          </article>
        </div>
      </section>
    </div>

    <nav class="taskbar" aria-label="Barre des tâches">
      <div class="taskbar__center">
        <button
          class="taskbar__btn taskbar__start"
          :class="{ 'taskbar__btn--active': menuOuvert }"
          type="button"
          aria-label="Menu Démarrer"
          @click="basculerMenu"
        >
          <span class="win-icon" aria-hidden="true">
            <span class="blue-square"></span><span class="blue-square"></span>
            <span class="blue-square"></span><span class="blue-square"></span>
          </span>
        </button>
        <button class="taskbar__btn" type="button" aria-label="Recherche">🔍</button>
        <button class="taskbar__btn" type="button" aria-label="Explorateur de fichiers" @click="ouvrirDossier('documents')">📁</button>
        <button class="taskbar__btn" type="button" aria-label="Navigateur" @click="$emit('google')">🌐</button>
        <button class="taskbar__btn" type="button" aria-label="Courrier" @click="$emit('mail')">✉️</button>
      </div>
      <time class="taskbar__clock">
        {{ formatHeure() }}<br />
        <small>{{ formatDate() }}</small>
      </time>
    </nav>
  </main>
</template>

<style scoped>
.explorer {
  position: absolute;
  top: 60px;
  left: 140px;
  width: min(820px, 80vw);
  height: 480px;
  display: flex;
  flex-direction: column;
  background: #fff;
  color: #202124;
  border: 1px solid #9aa0a6;
  border-radius: 8px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
  z-index: 5;
  overflow: hidden;
}
.explorer__title { display: flex; justify-content: space-between; align-items: center; padding: 6px 12px; background: #e8eaed; font-size: 14px; }
.explorer__title button { border: 0; background: transparent; font-size: 18px; cursor: pointer; }
.explorer__body { display: grid; grid-template-columns: 170px 1fr 1fr; flex: 1; min-height: 0; }
.explorer__nav { display: flex; flex-direction: column; gap: 2px; padding: 8px; border-right: 1px solid #e0e0e0; }
.explorer__nav button { text-align: left; padding: 6px 8px; border: 0; border-radius: 4px; background: transparent; cursor: pointer; }
.explorer__nav button.active, .explorer__nav button:hover { background: #d3e3fd; }
.explorer__files { display: flex; flex-direction: column; padding: 8px; border-right: 1px solid #e0e0e0; overflow: auto; }
.explorer__file { display: flex; gap: 8px; padding: 6px 8px; border: 0; background: transparent; text-align: left; cursor: pointer; border-radius: 4px; }
.explorer__file:hover { background: #f1f3f4; }
.explorer__viewer { padding: 12px 16px; overflow: auto; }
.explorer__viewer pre { white-space: pre-wrap; font-family: Consolas, monospace; font-size: 13px; line-height: 1.5; }
</style>