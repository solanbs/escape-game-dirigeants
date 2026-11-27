<script setup lang="ts">
/*
 * Template Forum : un fil de discussion sur un forum.
 *
 * Ne fait QUE de la mise en page : tout le texte vient de `data`, c'est-à-dire
 * du bloc `data:` d'un YAML de page qui a `template: Forum`.
 * Pas de barre de navigateur ici : c'est l'enveloppe (PageForum.vue) qui l'affiche.
 * Mise en page reprise de FakeAlarmeForum.vue.
 */
import '@/styles/style_forum.css'
import type { ForumData } from '@escape/shared'
import { enGras, paragraphes } from '@/data/texte'

defineProps<{ data: ForumData }>()

/** Initiale affichée quand le message n'a pas d'avatar (« DedeBricol » → « D »). */
const initiale = (nom: string) => nom.trim().charAt(0).toUpperCase()
</script>

<template>
  <main class="forum-site" :style="{ '--couleur-principale': data.couleur }">
    <div class="forum-conteneur">
      <!-- Bandeau du forum : nom + fil d'Ariane -->
      <header class="forum-entete">
        <div class="forum-entete__nom">
          <span v-if="data.site.logo">{{ data.site.logo }}</span>
          {{ data.site.nom }}
        </div>
        <nav v-if="data.fil_ariane?.length" class="forum-entete__fil" aria-label="Fil d'Ariane">
          <template v-for="(etape, i) in data.fil_ariane" :key="i">
            <span v-if="i > 0" aria-hidden="true"> › </span>{{ etape }}
          </template>
        </nav>
      </header>

      <!-- Titre du sujet -->
      <div class="forum-sujet">
        <h1>
          <span v-if="data.resolu" class="forum-sujet__resolu">[Résolu]</span>
          <span v-html="enGras(data.titre)" />
        </h1>
        <p class="forum-sujet__compte">
          {{ data.messages.length }} message{{ data.messages.length > 1 ? 's' : '' }}
        </p>
      </div>

      <!-- Les messages -->
      <article
        v-for="(message, i) in data.messages"
        :key="message.id ?? i"
        class="forum-message"
        :class="{ 'forum-message--premier': i === 0 }"
      >
        <aside class="forum-message__auteur">
          <div class="forum-avatar">{{ message.avatar || initiale(message.auteur) }}</div>
          <strong>{{ message.auteur }}</strong>
          <small v-if="message.statut">{{ message.statut }}</small>
          <span v-if="i === 0" class="forum-message__badge">Auteur du sujet</span>
        </aside>

        <div class="forum-message__contenu">
          <div class="forum-message__entete">
            <span>Posté le {{ message.date }}</span>
            <span class="forum-message__numero">#{{ i + 1 }}</span>
          </div>
          <div class="forum-message__texte">
            <p v-for="(p, j) in paragraphes(message.texte)" :key="j" v-html="enGras(p)" />
          </div>
        </div>
      </article>

      <p v-if="!data.messages.length" class="forum-vide">Aucun message dans ce sujet.</p>

      <!-- Zone de réponse (décorative) -->
      <div class="forum-reponse" aria-hidden="true">
        <div class="forum-reponse__champ">Connectez-vous pour répondre à ce sujet.</div>
        <button type="button" disabled>Répondre</button>
      </div>
    </div>
  </main>
</template>
