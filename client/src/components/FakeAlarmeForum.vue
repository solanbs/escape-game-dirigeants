<script setup lang="ts">
import '@/styles/style_alarme_forum.css'
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
        <span class="browser-tab__logo browser-tab__logo--site">💬</span>
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
      <button type="button" aria-label="" @click="$emit('back')">←</button>
      <button type="button" aria-label="Avancer">→</button>
      <button type="button" aria-label="Actualiser">↻</button>
      <div class="browser-address">
        <span>🔒</span>
        <span>{{ site.domaine }}</span>
      </div>
      <button type="button" aria-label="Favoris">☆</button>
      <button type="button" aria-label="Menu">⋮</button>
    </div>

    <main class="forum-site">
      <div class="forum-container">
        <header class="forum-header">
          <div class="forum-logo">🛠️ Brico-Forum</div>
          <div class="forum-nav">Portail > Électricité > Alarmes & Domotique</div>
        </header>

        <div class="thread-title">
          <h1>[Résolu] Code usine SuperSecure V2 perdu !</h1>
        </div>

        <div class="post">
          <div class="post-author">
            <div class="avatar">D</div>
            <strong>DedeBricol</strong>
          </div>
          <div class="post-content">
            <p>Bonjour à tous, j'ai racheté une centrale SuperSecure modèle V2 d'occasion. Je veux la réinitialiser mais je suis bloqué au code usine. J'ai essayé 0000, 1234, 1111... rien ne passe ! Quelqu'un a l'astuce ?</p>
            <span class="post-date">Posté le 14/05/2026 à 09:12</span>
          </div>
        </div>

        <div class="post">
          <div class="post-author">
            <div class="avatar">S</div>
            <strong>SecuPro</strong>
            <small>Installateur Pro</small>
          </div>
          <div class="post-content">
            <p>Salut Dede. Laisse tomber les codes génériques, la V2 a été conçue pour éviter ça. Le code de déverrouillage est spécifique à cette série.</p>
            <p>Le seul moyen c'est de retrouver le mémo d'installation de 2019. Cherche <strong>"V2_Master_Manual"</strong> dans les bases de données de notices en ligne ou d'archives PDF. Le code est dedans.</p>
            <span class="post-date">Posté le 14/05/2026 à 10:45</span>
          </div>
        </div>

      </div>
    </main>
  </div>
</template>