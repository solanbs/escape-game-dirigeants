<script setup lang="ts">
/*
 * Template Site : site vitrine d'une entreprise ou d'une marque.
 *
 * Ne fait QUE de la mise en page : tout le texte vient de `data`, c'est-à-dire
 * du bloc `data:` d'un YAML de page qui a `template: Site`.
 * Pas de barre de navigateur ici : c'est l'enveloppe (PageSite.vue) qui l'affiche.
 * Mise en page inspirée de FakeAlarmeSuperSecure.vue.
 *
 * De haut en bas : en-tête (logo, nom, menu, téléphone, bouton), bandeau d'accroche,
 * corps (les mêmes blocs que les articles, via Blocs.vue), pied de page.
 */
import '@/styles/style_site.css'
import type { SiteData } from '@escape/shared'
import { enGras, paragraphes } from '@/data/texte'
import Blocs from '@/templates/Blocs.vue'

defineProps<{ data: SiteData }>()
</script>

<template>
  <main class="site" :style="{ '--couleur-principale': data.couleur || undefined }">
    <!-- En-tête -->
    <header class="site-entete">
      <div class="site-entete__marque">
        <span v-if="data.entete.logo" class="site-entete__logo">{{ data.entete.logo }}</span>
        <div>
          <div class="site-entete__nom">{{ data.entete.nom }}</div>
          <div v-if="data.entete.slogan" class="site-entete__slogan">{{ data.entete.slogan }}</div>
        </div>
      </div>

      <nav v-if="data.entete.menu?.length" class="site-entete__menu" aria-label="Menu du site">
        <a
          v-for="(lien, i) in data.entete.menu"
          :key="i"
          href="#"
          :class="{ 'site-entete__menu--actif': i === 0 }"
          @click.prevent
        >{{ lien }}</a>
      </nav>

      <div v-if="data.entete.telephone || data.entete.bouton" class="site-entete__actions">
        <span v-if="data.entete.telephone" class="site-entete__tel">📞 {{ data.entete.telephone }}</span>
        <button v-if="data.entete.bouton" type="button" class="site-bouton">{{ data.entete.bouton }}</button>
      </div>
    </header>

    <!-- Bandeau d'accroche (image de fond si fournie, sinon dégradé de la couleur du site) -->
    <section
      v-if="data.bandeau?.titre"
      class="site-bandeau"
      :class="{ 'site-bandeau--image': data.bandeau.image }"
      :style="data.bandeau.image ? { backgroundImage: `url(${data.bandeau.image})` } : undefined"
    >
      <div class="site-bandeau__contenu">
        <p v-if="data.bandeau.surtitre" class="site-bandeau__surtitre">{{ data.bandeau.surtitre }}</p>
        <h1 v-html="enGras(data.bandeau.titre)" />
        <p v-for="(p, i) in paragraphes(data.bandeau.texte)" :key="i" class="site-bandeau__texte" v-html="enGras(p)" />
        <button v-if="data.bandeau.bouton" type="button" class="site-bouton site-bouton--clair">
          {{ data.bandeau.bouton }}
        </button>
      </div>
    </section>

    <!-- Corps : les blocs -->
    <div class="site-corps">
      <Blocs :blocs="data.corps" />
    </div>

    <!-- Pied de page -->
    <footer class="site-pied">
      <div class="site-pied__marque">
        <span v-if="data.entete.logo">{{ data.entete.logo }}</span> {{ data.entete.nom }}
      </div>
      <nav v-if="data.entete.menu?.length" class="site-pied__menu" aria-hidden="true">
        <span v-for="(lien, i) in data.entete.menu" :key="i">{{ lien }}</span>
      </nav>
      <p class="site-pied__texte">{{ data.pied_de_page || `© ${data.entete.nom}` }}</p>
    </footer>
  </main>
</template>
