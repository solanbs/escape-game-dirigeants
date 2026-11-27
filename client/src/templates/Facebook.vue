<script setup lang="ts">
/*
 * Template Facebook : profil sur un réseau social personnel.
 *
 */
import '@/styles/style_facebook.css'
import type { FacebookData } from '@escape/shared'
import { enGras, paragraphes } from '@/data/texte'

const props = defineProps<{ data: FacebookData }>()

/** Initiale affichée quand il n'y a pas de photo (« David Ecnasiol » → « D »). */
const initiale = (nom: string) => nom.trim().charAt(0).toUpperCase()

/** « 1 commentaire » / « 3 commentaires ». */
const nbCommentaires = (n: number) => `${n} commentaire${n > 1 ? 's' : ''}`

/** Auteur d'une publication : le sien, sinon le propriétaire du profil. */
const auteurDe = (auteur?: string) => auteur || props.data.profil.nom
</script>

<template>
  <main class="fb-site" :style="{ '--couleur-principale': data.couleur }">
    <!-- Barre du réseau social (décorative) -->
    <header class="fb-barre">
      <div class="fb-barre__gauche">
        <span class="fb-barre__logo" aria-hidden="true">{{ initiale(data.profil.nom) }}</span>
        <div class="fb-barre__recherche">🔍 <span>Rechercher</span></div>
      </div>
      <nav class="fb-barre__nav" aria-hidden="true">
        <span>🏠</span><span class="fb-barre__nav--actif">👥</span><span>🎬</span><span>🛒</span>
      </nav>
      <div class="fb-barre__droite" aria-hidden="true">
        <span>💬</span><span>🔔</span>
      </div>
    </header>

    <!-- En-tête du profil -->
    <section class="fb-entete">
      <div class="fb-entete__inner">
        <div
          class="fb-couverture"
          :style="data.profil.couverture ? { backgroundImage: `url(${data.profil.couverture})` } : undefined"
        />

        <div class="fb-identite">
          <div class="fb-photo">
            <img v-if="data.profil.photo" :src="data.profil.photo" :alt="data.profil.nom" />
            <span v-else>{{ initiale(data.profil.nom) }}</span>
          </div>

          <div class="fb-identite__texte">
            <h1 class="fb-nom">{{ data.profil.nom }}</h1>
            <p v-if="data.profil.amis" class="fb-amis">{{ data.profil.amis }}</p>
          </div>

          <div class="fb-identite__boutons">
            <button type="button" class="fb-bouton fb-bouton--principal">➕ Ajouter</button>
            <button type="button" class="fb-bouton">💬 Message</button>
          </div>
        </div>

        <nav class="fb-onglets" aria-label="Sections du profil">
          <span class="fb-onglets__actif">Publications</span>
          <span>À propos</span>
          <span>Amis</span>
          <span>Photos</span>
        </nav>
      </div>
    </section>

    <!-- Corps : Intro à gauche, fil à droite -->
    <div class="fb-corps">
      <aside class="fb-colonne">
        <section v-if="data.profil.bio || data.intro?.length" class="fb-carte fb-intro">
          <h2>Intro</h2>
          <p v-if="data.profil.bio" class="fb-intro__bio" v-html="enGras(data.profil.bio)" />
          <ul v-if="data.intro?.length" class="fb-intro__liste">
            <li v-for="(ligne, i) in data.intro" :key="i" v-html="enGras(ligne)" />
          </ul>
        </section>
      </aside>

      <div class="fb-fil">
        <article
          v-for="(pub, i) in data.publications"
          :key="pub.id ?? i"
          class="fb-carte fb-pub"
        >
          <!-- En-tête : auteur, date -->
          <header class="fb-pub__entete">
            <div class="fb-avatar">
              <img
                v-if="!pub.auteur && data.profil.photo"
                :src="data.profil.photo"
                :alt="data.profil.nom"
              />
              <span v-else>{{ initiale(auteurDe(pub.auteur)) }}</span>
            </div>
            <div>
              <strong class="fb-pub__auteur">{{ auteurDe(pub.auteur) }}</strong>
              <div class="fb-pub__date">{{ pub.date }} · 🌍</div>
            </div>
            <span class="fb-pub__menu" aria-hidden="true">···</span>
          </header>

          <!-- Contenu -->
          <div class="fb-pub__texte">
            <p v-for="(p, j) in paragraphes(pub.texte)" :key="j" v-html="enGras(p)" />
          </div>
          <img v-if="pub.image" class="fb-pub__image" :src="pub.image" alt="" />

          <!-- Compteurs -->
          <div v-if="pub.reactions || pub.commentaires?.length" class="fb-pub__compteurs">
            <span v-if="pub.reactions">
              <span class="fb-pub__emojis" aria-hidden="true">👍❤️</span> {{ pub.reactions }}
            </span>
            <span v-if="pub.commentaires?.length" class="fb-pub__nb-com">
              {{ nbCommentaires(pub.commentaires.length) }}
            </span>
          </div>

          <!-- Actions (décoratives) -->
          <div class="fb-pub__actions" aria-hidden="true">
            <span>👍 J'aime</span>
            <span>💬 Commenter</span>
            <span>↗️ Partager</span>
          </div>

          <!-- Commentaires -->
          <ul v-if="pub.commentaires?.length" class="fb-commentaires">
            <li v-for="(com, k) in pub.commentaires" :key="com.id ?? k" class="fb-commentaire">
              <div class="fb-avatar fb-avatar--petit">
                <span>{{ initiale(com.auteur) }}</span>
              </div>
              <div class="fb-commentaire__bulle">
                <strong>{{ com.auteur }}</strong>
                <span v-html="enGras(com.texte)" />
              </div>
            </li>
          </ul>
        </article>

        <p v-if="!data.publications.length" class="fb-carte fb-vide">Aucune publication pour le moment.</p>
      </div>
    </div>
  </main>
</template>
