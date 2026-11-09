<script setup lang="ts">
import '@/styles/style_porte_magnetique_pannes.css'
import '@/styles/style_google.css'
import { sites, type SiteId } from '@/data/fakeSite'

const props = defineProps<{ siteId: SiteId }>()
defineEmits<{ back: [] }>()
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
        <span class="browser-tab__logo browser-tab__logo--site">🛠️</span>
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

    <main class="security-blog">
      <header class="blog-header">
        <div class="blog-container">
          <span class="category-badge">Diagnostic fictif</span>
          <h1>Pannes de contrôle d’accès : les premiers indices</h1>
          <p class="post-meta">Carnet technique du scénario · Lecture : 3 min</p>
        </div>
      </header>

      <article class="blog-container blog-content">
        <p class="lead-text">
          Une porte magnétique associe un lecteur, un voyant, une alimentation et un
          dispositif de sortie autorisée. Un changement d’état peut donc venir d’une
          panne électrique ou d’un défaut signalé par le système.
        </p>

        <h2>Les contrôles à observer</h2>
        <ol class="method-steps">
          <li><strong>Voyant :</strong> noter sa couleur et la comparer au tableau de mission.</li>
          <li><strong>Alimentation :</strong> vérifier uniquement l’indication affichée dans la simulation.</li>
          <li><strong>Journal :</strong> relever l’heure et le message associé à l’anomalie.</li>
        </ol>

        <div class="info-box">
          <div class="info-icon">💡</div>
          <div class="info-text">
            <strong>Indice du jeu</strong>
            <p>Une coupure d’alimentation simulée peut modifier l’état du verrou dans l’énigme.</p>
          </div>
        </div>
      </article>
    </main>
  </div>
</template>
