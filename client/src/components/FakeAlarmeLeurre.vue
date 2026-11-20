<script setup lang="ts">
import '@/styles/style_alarme_leurre.css'
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
        <span class="browser-tab__logo browser-tab__logo--site">🔐</span>
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

    <main class="blog-site">
      <header class="blog-header">
        <div class="container">
          <div class="logo">Astuces Sécurité Maison</div>
        </div>
      </header>

      <div class="container">
        <article class="post-card">
          <h1>Les 10 codes d'alarme les plus courants (à changer d'urgence !)</h1>
          
          <p class="intro">
            Vous venez d'emménager ou d'acheter une alarme d'occasion ? Les installateurs laissent très souvent le code maître par défaut. Voici les combinaisons qui ouvriront votre porte aux cambrioleurs si vous ne les modifiez pas :
          </p>

          <ul class="code-list">
            <li>
              <strong>1234</strong> : Le grand classique. Utilisé sur 60% des alarmes bon marché.
            </li>
            <li>
              <strong>0000</strong> : L'ancien standard. (Souvent utilisé sur les toutes premières générations de SuperSecure, mais abandonné depuis).
            </li>
            <li>
              <strong>2580</strong> : La ligne droite du milieu sur un clavier numérique.
            </li>
            <li>
              <strong>1111</strong> et <strong>9999</strong> : Les extrêmes de facilité.
            </li>
            <li>
              <strong>L'année de naissance</strong> : La pire idée pour votre sécurité.
            </li>
          </ul>

          <div class="warning-box">
            <strong>Notre conseil :</strong> Si votre clavier affiche "Erreur" avec ces codes, c'est que votre système utilise un code sécurisé unique fourni sur la notice constructeur.
          </div>

        </article>
      </div>
    </main>
  </div>
</template>