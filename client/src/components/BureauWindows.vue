<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import '@/styles/style_windows.css'

defineEmits<{
  back: []
  google: []
}>()

const menuOuvert = ref(false)
const maintenant = ref(new Date())
let horloge: number

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
        <button v-for="app in ['🌐 Edge', '✉️ Courrier', '📅 Calendrier', '⚙️ Paramètres', '🎮 Xbox', '🎬 Netflix']"
          :key="app" class="start-menu__app" type="button">
          <span class="app-icon">{{ app.slice(0, 2) }}</span>
          <span>{{ app.slice(3) }}</span>
        </button>
      </div>

      <div class="start-menu__footer">
        <div class="start-menu__user">
          <span class="user-avatar" aria-hidden="true">👤</span>
          <span>JustGeekFR</span>
        </div>
        <button class="start-menu__power" type="button" aria-label="Marche/Arrêt" @click="eteindrePC">
          ⏻
        </button>
      </div>
    </div>

    <div class="windows-page__desktop">
      <!-- Icônes du bureau -->
      <button class="desktop-icon" type="button">
        <span class="desktop-icon__picture">💻</span>
        <span class="desktop-icon__text">Ce PC</span>
      </button>

      <button class="desktop-icon" type="button">
        <span class="desktop-icon__picture">📁</span>
        <span class="desktop-icon__text">Documents</span>
      </button>

      <button class="desktop-icon" type="button">
        <span class="desktop-icon__picture">🗑️</span>
        <span class="desktop-icon__text">Corbeille</span>
      </button>

      <button class="desktop-icon" type="button" @click="$emit('google')">
        <span class="desktop-icon__picture">🌐</span>
        <span class="desktop-icon__text">Google</span>
      </button>
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
        <button class="taskbar__btn" type="button" aria-label="Explorateur de fichiers">📁</button>
        <button class="taskbar__btn" type="button" aria-label="Navigateur" @click="$emit('google')">🌐</button>
      </div>
      <time class="taskbar__clock">
        {{ formatHeure() }}<br />
        <small>{{ formatDate() }}</small>
      </time>
    </nav>
  </main>
</template>
