<script setup lang="ts">

import '@/styles/sytle_alarme.css'
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
    <!-- Barre du navigateur -->
    <div class="browser-tabs">
      <button class="browser-tab" type="button" @click="$emit('back')">
        <span class="browser-tab__logo">G</span>
        <span>Google</span>
        <span class="browser-tab__close" aria-hidden="true">×</span>
      </button>
      <button class="browser-tab browser-tab--active" type="button">
        <span class="browser-tab__logo browser-tab__logo--site">🛡️</span>
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

    <!-- Contenu du site web (Scrollable) -->
    <main class="corporate-site">
      <!-- Navigation du site -->
      <nav class="corp-nav">
        <div class="corp-nav__brand">
          <span class="corp-nav__logo">🛡️</span>
          <span class="corp-nav__name">SUPERSECURE</span>
        </div>
        <div class="corp-nav__links">
          <a href="#">Accueil</a>
          <a href="#">Nos Systèmes</a>
          <a href="#">Télésurveillance</a>
          <a href="#">Contact</a>
        </div>
        <div class="corp-nav__actions">
          <span class="corp-phone">📞 0800 112 112</span>
          <button class="corp-btn corp-btn--outline">Espace Client</button>
        </div>
      </nav>

      <!-- Bannière marketing -->
      <header class="corp-hero">
        <div class="corp-hero__content">
          <h1>Protégez ce qui compte le plus.</h1>
          <p>Une protection professionnelle, une intervention rapide, 24h/24 et 7j/7.</p>
          <div class="corp-hero__stats">
            <div>
              <strong>15 000+</strong>
              <span>clients protégés</span>
            </div>
            <div>
              <strong>4,8/5</strong>
              <span>note moyenne</span>
            </div>
            <div>
              <strong>20 min</strong>
              <span>délai d’intervention</span>
            </div>
          </div>
        </div>
      </header>

      <section class="corp-alert-banner" aria-label="Message important de sécurité">
        <p class="corp-alert-banner__reminder">⚠️ Pensez à changer le code de base de votre alarme.</p>
      </section>

      <!-- Arguments de vente -->
      <section class="corp-features">
        <div class="feature">
          <span class="feature-icon">👁️</span>
          <h3>Télésurveillance 24/7</h3>
          <p>Nos opérateurs veillent sur vos locaux de jour comme de nuit.</p>
        </div>
        <div class="feature">
          <span class="feature-icon">⚡</span>
          <h3>Intervention Rapide</h3>
          <p>Un réseau d'agents répartis sur tout le territoire national.</p>
        </div>
        <div class="feature">
          <span class="feature-icon">📱</span>
          <h3>Application Mobile</h3>
          <p>Contrôlez votre système d'alarme du bout des doigts.</p>
        </div>
      </section>

      <section class="corp-reviews">
        <p class="corp-reviews__eyebrow">Ils nous font confiance</p>
        <h2>Une sécurité reconnue par nos clients</h2>
        <div class="corp-reviews__rating" aria-label="Note de 4,8 sur 5">
          <strong>4,8</strong>
          <span>★★★★★</span>
          <small>sur 5 · basée sur 2 400 avis</small>
        </div>
        <blockquote>
          « Une équipe disponible et une intervention annoncée clairement dès le déclenchement. »
          <cite>— Avis client vérifié</cite>
        </blockquote>
      </section>
    </main>
  </div>
</template>