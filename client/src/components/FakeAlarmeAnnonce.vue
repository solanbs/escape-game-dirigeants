<script setup lang="ts">
/*
 * PROVISOIRE : joue le rôle du « navigateur du jeu » pour une seule page.
 *
 * Il fait les trois choses que fera le futur navigateur (apps/Browser) pour
 * TOUTES les pages :
 *   1. trouver la page à afficher (ici dans pages.ts, demain via page:watch) ;
 *   2. dessiner la barre du navigateur (onglets + adresse) à partir de l'enveloppe ;
 *   3. passer `data` au template qui fait la mise en page (ici ClassifiedAd).
 *
 * Le template ClassifiedAd.vue, lui, est définitif.
 */
import '@/styles/style_google.css'
import type { ClassifiedAdData } from '@escape/shared'
import type { SiteId } from '@/data/fakeSite'
import { pageAvecTemplate } from '@/data/pages'
import ClassifiedAd from '@/templates/ClassifiedAd.vue'

const props = defineProps<{ siteId: SiteId }>()
defineEmits<{ back: [] }>()

// 1. Trouver la page (scenarios/scenario1_red_team/pages/<siteId>.yml)
const page = pageAvecTemplate(props.siteId, 'ClassifiedAd')
// La vérification du template garantit la forme de `data` (le serveur validera le YAML).
const data = page?.data as ClassifiedAdData | undefined

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
    <ClassifiedAd :data="data" />
  </div>
</template>
