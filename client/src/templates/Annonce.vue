<script setup lang="ts">
/*
 * Template Annonce : petite annonce de vente.
 *
 * Ne fait QUE de la mise en page : tout le texte vient de `data`, c'est-à-dire
 * du bloc `data:` d'un YAML de page qui a `template: Annonce`.
 * Pas de barre de navigateur ici : c'est le navigateur du jeu qui l'affiche.
 */
import '@/styles/style_leboncoin.css'
import type { AnnonceData } from '@escape/shared'
import { enGras, paragraphes } from '@/data/texte'

defineProps<{ data: AnnonceData }>()
</script>

<template>
  <main class="lbc-site" :style="{ '--couleur-principale': data.couleur }">
    <header class="lbc-header">
      <div class="lbc-container header-inner">
        <div class="lbc-logo">{{ data.site.logo }} {{ data.site.nom }}</div>
        <div class="lbc-search">
          <input type="text" :value="data.site.recherche" disabled />
          <button>Rechercher</button>
        </div>
      </div>
    </header>

    <div class="lbc-container ad-layout">
      <div class="ad-main">
        <div class="ad-image-gallery">
          <div class="ad-main-image">
            <img v-if="data.image?.fichier" :src="data.image.fichier" :alt="data.image.legende" />
            <span v-else class="image-placeholder">{{ data.image?.legende }}</span>
          </div>
        </div>

        <div class="ad-details">
          <h1>{{ data.titre }}</h1>
          <div class="ad-price">{{ data.prix }}</div>
          <div class="ad-date">
            Publié le {{ data.date }}<template v-if="data.lieu"> · {{ data.lieu }}</template>
          </div>

          <h2>Description</h2>
          <div class="ad-description">
            <p v-for="(p, i) in paragraphes(data.description)" :key="i" v-html="enGras(p)" />
          </div>
        </div>
      </div>

      <aside class="ad-sidebar">
        <div class="seller-card">
          <div class="seller-avatar">{{ data.vendeur.avatar || data.vendeur.nom.charAt(0) }}</div>
          <div class="seller-info">
            <strong>{{ data.vendeur.nom }}</strong>
            <span v-if="data.vendeur.type">{{ data.vendeur.type }}</span>
            <div v-if="data.vendeur.note !== undefined" class="seller-rating">
              {{ '⭐'.repeat(data.vendeur.note) }} ({{ data.vendeur.nombre_avis ?? 0 }} avis)
            </div>
          </div>
          <button class="btn-contact">Envoyer un message</button>
          <button class="btn-phone">Voir le numéro</button>
        </div>
      </aside>
    </div>
  </main>
</template>
