<script setup lang="ts">
import '@/styles/style_article.css'
import type { ArticleData } from '@escape/shared'
import { enGras } from '@/data/texte'
import Blocs from '@/templates/Blocs.vue'

defineProps<{ data: ArticleData }>()
</script>

<template>
  <main class="article-site" :style="{ '--couleur-principale': data.couleur }">
    <!-- En-tête du site qui publie l'article (journal, blog, centre d'aide) -->
    <header class="article-header">
      <div class="article-header__inner">
        <div class="article-header__marque">
          <span v-if="data.site.logo" class="article-header__logo">{{ data.site.logo }}</span>
          <div>
            <div class="article-header__nom" v-html="enGras(data.site.nom)" />
            <div v-if="data.site.slogan" class="article-header__slogan">{{ data.site.slogan }}</div>
          </div>
        </div>

        <div v-if="data.site.recherche" class="article-header__recherche">
          <input type="text" placeholder="Rechercher…" disabled />
          <button type="button" aria-label="Rechercher">🔍</button>
        </div>
      </div>

      <nav v-if="data.site.rubriques?.length" class="article-header__rubriques">
        <a v-for="(rubrique, i) in data.site.rubriques" :key="i" href="#" @click.prevent>{{ rubrique }}</a>
      </nav>
    </header>

    <!-- Corps de page : l'article, et la colonne de droite si le YAML en a une -->
    <div class="article-page" :class="{ 'article-page--avec-colonne': data.colonne?.length }">
      <div class="article-principal">
        <nav v-if="data.fil_ariane?.length" class="article-fil" aria-label="Fil d'Ariane">
          <template v-for="(etape, i) in data.fil_ariane" :key="i">
            <span v-if="i > 0" class="article-fil__sep" aria-hidden="true">›</span>
            <span :class="{ 'article-fil__courant': i === data.fil_ariane.length - 1 }">{{ etape }}</span>
          </template>
        </nav>

        <article class="article">
          <div v-if="data.rubrique" class="article__rubrique">{{ data.rubrique }}</div>

          <h1 class="article__titre" v-html="enGras(data.titre)" />

          <div v-if="data.auteur || data.date || data.temps_lecture" class="article__meta">
            <span v-if="data.auteur">Par <strong>{{ data.auteur }}</strong></span>
            <span v-if="data.date">{{ data.date }}</span>
            <span v-if="data.temps_lecture">⏱ {{ data.temps_lecture }}</span>
          </div>

          <p v-if="data.chapo" class="article__chapo" v-html="enGras(data.chapo)" />

          <Blocs :blocs="data.corps" />

          <ul v-if="data.tags?.length" class="article__tags" aria-label="Mots-clés">
            <li v-for="(tag, i) in data.tags" :key="i">#{{ tag }}</li>
          </ul>
        </article>
      </div>

      <aside v-if="data.colonne?.length" class="article-colonne">
        <Blocs :blocs="data.colonne" />
      </aside>
    </div>
  </main>
</template>
