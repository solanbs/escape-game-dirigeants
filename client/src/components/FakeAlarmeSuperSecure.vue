<script setup lang="ts">
import '@/styles/style_supersecure.css'
import '@/styles/style_google.css'
import { sites, type SiteId } from '@/data/fakeSite'

const props = defineProps<{ siteId: SiteId }>()
defineEmits<{ back: [] }>()
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
    </div>

    <!-- Contenu du site officiel -->
    <main class="corporate-site">
      <nav class="corp-nav">
        <div class="corp-nav__brand">
          <span class="corp-nav__logo">🛡️</span>
          <span class="corp-nav__name">SUPERSECURE</span>
        </div>
        <div class="corp-nav__links">
          <a href="#">Accueil</a>
          <a href="#">Équipements</a>
          <a href="#">Télésurveillance</a>
          <a href="#">Support Technique</a>
        </div>
        <div class="corp-nav__actions">
          <span class="corp-phone">📞 0800 112 112</span>
          <button class="corp-btn corp-btn--primary">Espace Client</button>
        </div>
      </nav>

      <!-- Message d'alerte sécurité -->
      <section class="corp-alert-banner">
        <div class="alert-content">
          <span class="alert-icon">⚠️</span>
          <div class="alert-text">
            <strong>Rappel de sécurité majeur :</strong>
            <p>Afin de garantir l'intégrité de vos locaux, il est impératif de modifier le code d'usine figurant sur la notice lors de la première mise sous tension de votre centrale V2.</p>
          </div>
        </div>
      </section>

      <header class="corp-hero">
        <div class="corp-hero__content">
          <h1>La dissuasion absolue.</h1>
          <p>La référence en protection professionnelle. Une détection infaillible reliée à notre centre de commandement.</p>
          <div class="corp-hero__stats">
            <div>
              <strong>24/7</strong>
              <span>Télésurveillance active</span>
            </div>
            <div>
              <strong>15 min</strong>
              <span>Délai d'intervention garanti</span>
            </div>
          </div>
        </div>
      </header>

      <section class="corp-features">
        <div class="feature">
          <span class="feature-icon">🚨</span>
          <h3>Levée de doute immédiate</h3>
          <p>Nos opérateurs analysent les flux vidéo dès le déclenchement des sirènes.</p>
        </div>
        <div class="feature">
          <span class="feature-icon">🚔</span>
          <h3>Intervention Physique</h3>
          <p>En cas d'intrusion confirmée, un agent motorisé sécurise le site en moins de 15 minutes.</p>
        </div>
      </section>
    </main>
  </div>
</template>