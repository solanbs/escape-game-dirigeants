<script setup lang="ts">
import '@/styles/style_google.css'
import type { LinkedinData } from '@escape/shared'
import { pageAvecTemplate } from '@/data/pages'
import Linkedin from '@/templates/Linkedin.vue'

const props = defineProps<{ siteId: string }>()
defineEmits<{ back: [] }>()

// 1. Trouver la page (scenarios/scenario1_red_team/pages/<siteId>.yml)
const page = pageAvecTemplate(props.siteId, 'Linkedin')
// La vérification du template garantit la forme de `data` (le serveur validera le YAML).
const data = page?.data as LinkedinData | undefined

// Domaine affiché dans l'onglet : début de l'url (« leboncoin.fr/annonce/… » → « leboncoin.fr »)
const domaine = page?.url.split('/')[0] ?? ''
</script>

<template>
  <div v-if="page && data" class="browser-window browser-window--maximized fake-site-browser">
    <!-- 2. Barre du navigateur : identique pour toutes les pages, remplie par l'enveloppe -->
    <div class="browser-tabs">
      <button class="browser-tab" type="button" @click="$emit('back')">
        <span class="browser-tab__logo">G</span>
        <span>Google</span>
        <span class="browser-tab__close" aria-hidden="true">×</span>
      </button>
      <button class="browser-tab browser-tab--active" type="button">
        <span class="browser-tab__logo browser-tab__logo--site">{{ page.onglet?.icone }}</span>
        <span>{{ domaine }}</span>
        <span class="browser-tab__close" aria-hidden="true">×</span>
      </button>
      <button class="browser-tab__new" type="button" aria-label="Nouvel onglet">+</button>
      <div class="browser-window__controls">
        <button type="button" aria-label="Réduire">−</button>
        <button type="button" aria-label="Agrandir">□</button>
        <button type="button" aria-label="Fermer" @click="$emit('back')">×</button>
      </div>
    </div>

    <div class="browser-toolbar">
      <button type="button" aria-label="Retour" @click="$emit('back')">←</button>
      <button type="button" aria-label="Avancer">→</button>
      <button type="button" aria-label="Actualiser">↻</button>
      <div class="browser-address">
        <span>🔒</span>
        <span>{{ page.url }}</span>
      </div>
      <button type="button" aria-label="Favoris">☆</button>
      <button type="button" aria-label="Menu">⋮</button>
    </div>

    <!-- 3. Le contenu du site : le template reçoit uniquement `data` -->
    <Linkedin :data="data" />
  </div>
</template>
