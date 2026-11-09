<script setup lang="ts">
import '@/styles/style_leboncoin.css'
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
        <span class="browser-tab__logo browser-tab__logo--site">🛒</span>
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

    <main class="lbc-site">
      <header class="lbc-header">
        <div class="lbc-container header-inner">
          <div class="lbc-logo">LeBonCoin <span>Pro</span></div>
          <div class="lbc-search">
            <input type="text" value="Alarme SuperSecure" disabled />
            <button>Rechercher</button>
          </div>
        </div>
      </header>

      <div class="lbc-container ad-layout">
        <div class="ad-main">
          <!-- Placeholder pour la photo du boîtier -->
          <div class="ad-image-gallery">
            <div class="ad-main-image">
              <span class="image-placeholder">📷 Photo du boîtier SuperSecure V2</span>
            </div>
          </div>

          <div class="ad-details">
            <h1>Centrale d'alarme professionnelle SuperSecure (Modèle V2)</h1>
            <div class="ad-price">150 €</div>
            <div class="ad-date">Publié le 12/09/2026 à 14h30</div>

            <h2>Description</h2>
            <div class="ad-description">
              <p>Suite à la cessation d'activité de notre boutique, je revends cette centrale d'alarme de la marque SuperSecure.</p>
              <p>Il s'agit de la fameuse version V2 (celle avec le clavier en façade et le liseré bleu). Le matériel est robuste et fonctionne parfaitement. Idéal pour sécuriser un petit entrepôt ou des bureaux.</p>
              <p><strong>Attention :</strong> Je n'ai plus la boîte d'origine ni le manuel papier. Il faudra fouiller sur internet ou dans les archives de la marque pour retrouver le code de déverrouillage d'usine pour la réinitialiser. Le boîtier est actuellement verrouillé.</p>
              <p>Remise en main propre privilégiée.</p>
            </div>
          </div>
        </div>

        <aside class="ad-sidebar">
          <div class="seller-card">
            <div class="seller-avatar">M</div>
            <div class="seller-info">
              <strong>Marc_Bordeaux33</strong>
              <span>Particulier</span>
              <div class="seller-rating">⭐⭐⭐⭐⭐ (14 avis)</div>
            </div>
            <button class="btn-contact">Envoyer un message</button>
            <button class="btn-phone">Voir le numéro</button>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>