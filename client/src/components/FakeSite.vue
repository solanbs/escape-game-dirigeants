<script setup lang="ts">
import '@/styles/style_fake_site.css'
import { sites, type SiteId } from '@/data/fakeSite'

const props = defineProps<{
  siteId: SiteId
}>()

defineEmits<{
  back: []
}>()

const site = sites[props.siteId]
</script>

<template>
  <div class="browser-window browser-window--maximized fake-site-browser">
    <div class="browser-tabs">
      <button class="browser-tab" type="button" @click="$emit('back')">
        <span class="browser-tab__logo">G</span>
        <span>Google</span>
        <span class="browser-tab__close" aria-hidden="true">×</span>
      </button>
      <button class="browser-tab browser-tab--active" type="button">
        <span class="browser-tab__logo browser-tab__logo--site">●</span>
        <span>{{ site.domaine }}</span>
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
        <span>{{ site.domaine }}</span>
      </div>
      <button type="button" aria-label="Favoris">☆</button>
      <button type="button" aria-label="Menu">⋮</button>
    </div>

    <main class="fake-site">
      <header class="fake-site__header">
        <h2>{{ site.titre }}</h2>
        <p class="fake-site__rubrique">{{ site.rubrique }}</p>
      </header>
      <article class="fake-site__article">
        <p class="fake-site__rubrique">{{ site.rubrique }}</p>
        <h1>{{ site.titre }}</h1>
        <p class="fake-site__intro">{{ site.introduction }}</p>
        <section class="fake-site__card">
          <h2>Informations trouvées</h2>
          <ul>
            <li v-for="point in site.points" :key="point">{{ point }}</li>
          </ul>
        </section>
        <button class="fake-site__button" type="button" @click="$emit('back')">
          Revenir aux résultats
        </button>
      </article>
    </main>
  </div>
</template>
