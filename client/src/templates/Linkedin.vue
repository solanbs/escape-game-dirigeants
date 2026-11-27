<script setup lang="ts">
/*
 * Template Linkedin : profil sur un réseau social professionnel.
 *
 * Ne fait QUE de la mise en page : tout le texte vient de `data`, c'est-à-dire
 * du bloc `data:` d'un YAML de page qui a `template: Linkedin`.
 * Pas de barre de navigateur ici : c'est l'enveloppe (PageLinkedin.vue) qui l'affiche.
 *
 * Disposition : carte de profil (bannière, photo, nom, titre…), puis les rubriques
 * Infos, Activité, Expérience, Formation ; les compétences dans la colonne de droite.
 * Une rubrique vide (absente ou "") ne s'affiche pas.
 */
import '@/styles/style_linkedin.css'
import type { LinkedinData } from '@escape/shared'
import { enGras, paragraphes } from '@/data/texte'

const props = defineProps<{ data: LinkedinData }>()

/** Initiale affichée quand il n'y a pas d'image (« Aérofourneau » → « A »). */
const initiale = (nom: string) => nom.trim().charAt(0).toUpperCase()

/** « sept. 2025 – aujourd'hui », « 2018 – oct. 2026 », ou rien si aucune date. */
function periode(debut?: string, fin?: string) {
  if (!debut && !fin) return ''
  return `${debut || '?'} – ${fin || "aujourd'hui"}`
}

/** Seules les lignes non vides comptent (le YAML peut contenir des champs ""). */
const experiences = (props.data.experiences ?? []).filter((e) => e.poste || e.entreprise)
const formations = (props.data.formations ?? []).filter((f) => f.ecole)
const competences = (props.data.competences ?? []).filter(Boolean)
const activite = (props.data.activite ?? []).filter((p) => p.texte)
</script>

<template>
  <main class="li-site" :style="{ '--couleur-principale': data.couleur || undefined }">
    <!-- Barre du réseau (décorative) -->
    <header class="li-barre">
      <div class="li-barre__inner">
        <div class="li-barre__gauche">
          <span class="li-barre__logo" aria-hidden="true">💼</span>
          <div class="li-barre__recherche">🔍 <span>Recherche</span></div>
        </div>
        <nav class="li-barre__nav" aria-hidden="true">
          <span><b>🏠</b>Accueil</span>
          <span><b>👥</b>Réseau</span>
          <span><b>💼</b>Emplois</span>
          <span><b>💬</b>Messagerie</span>
          <span><b>🔔</b>Notifications</span>
        </nav>
      </div>
    </header>

    <div class="li-page">
      <div class="li-principal">
        <!-- Carte de profil -->
        <section class="li-carte li-profil">
          <div
            class="li-banniere"
            :style="data.profil.banniere ? { backgroundImage: `url(${data.profil.banniere})` } : undefined"
          />
          <div class="li-profil__corps">
            <div class="li-photo">
              <img v-if="data.profil.photo" :src="data.profil.photo" :alt="data.profil.nom" />
              <span v-else>{{ initiale(data.profil.nom) }}</span>
            </div>

            <div class="li-profil__infos">
              <div>
                <h1 class="li-nom">{{ data.profil.nom }}</h1>
                <p v-if="data.profil.titre" class="li-titre" v-html="enGras(data.profil.titre)" />
                <p class="li-lieu">
                  <template v-if="data.profil.localisation">{{ data.profil.localisation }} · </template>
                  <span class="li-lien">Coordonnées</span>
                </p>
                <p class="li-relations li-lien">{{ data.profil.relations || '500+ relations' }}</p>
              </div>

              <div v-if="data.profil.entreprise_actuelle" class="li-entreprise">
                <span class="li-logo-carre">{{ initiale(data.profil.entreprise_actuelle) }}</span>
                {{ data.profil.entreprise_actuelle }}
              </div>
            </div>

            <div class="li-boutons" aria-hidden="true">
              <span class="li-bouton li-bouton--plein">➕ Se connecter</span>
              <span class="li-bouton">✉️ Message</span>
              <span class="li-bouton li-bouton--gris">Plus</span>
            </div>
          </div>
        </section>

        <!-- Infos -->
        <section v-if="data.a_propos" class="li-carte li-rubrique">
          <h2>Infos</h2>
          <div class="li-texte">
            <p v-for="(p, i) in paragraphes(data.a_propos)" :key="i" v-html="enGras(p)" />
          </div>
        </section>

        <!-- Activité -->
        <section v-if="activite.length" class="li-carte li-rubrique">
          <h2>Activité</h2>
          <p class="li-sous-titre li-lien">{{ data.profil.relations || '500+ relations' }}</p>

          <article v-for="(pub, i) in activite" :key="pub.id ?? i" class="li-post">
            <p class="li-post__entete">
              <strong>{{ pub.auteur || data.profil.nom }}</strong> a publié ceci · {{ pub.date }}
            </p>
            <div class="li-texte">
              <p v-for="(p, j) in paragraphes(pub.texte)" :key="j" v-html="enGras(p)" />
            </div>
            <img v-if="pub.image" class="li-post__image" :src="pub.image" alt="" />
            <p v-if="pub.reactions || pub.commentaires?.length" class="li-post__compteurs">
              <span v-if="pub.reactions">👍💡 {{ pub.reactions }}</span>
              <span v-if="pub.commentaires?.length">
                {{ pub.commentaires.length }} commentaire{{ pub.commentaires.length > 1 ? 's' : '' }}
              </span>
            </p>
            <ul v-if="pub.commentaires?.length" class="li-commentaires">
              <li v-for="(com, k) in pub.commentaires" :key="com.id ?? k">
                <strong>{{ com.auteur }}</strong> <span v-html="enGras(com.texte)" />
              </li>
            </ul>
          </article>
        </section>

        <!-- Expérience -->
        <section v-if="experiences.length" class="li-carte li-rubrique">
          <h2>Expérience</h2>
          <ul class="li-liste">
            <li v-for="(xp, i) in experiences" :key="xp.id ?? i" class="li-element">
              <span class="li-logo-carre li-logo-carre--grand">{{ initiale(xp.entreprise || xp.poste) }}</span>
              <div>
                <h3>{{ xp.poste }}</h3>
                <p>{{ xp.entreprise }}</p>
                <p v-if="periode(xp.debut, xp.fin)" class="li-gris">{{ periode(xp.debut, xp.fin) }}</p>
                <p v-if="xp.lieu" class="li-gris">{{ xp.lieu }}</p>
                <div v-if="xp.description" class="li-texte li-element__description">
                  <p v-for="(p, j) in paragraphes(xp.description)" :key="j" v-html="enGras(p)" />
                </div>
              </div>
            </li>
          </ul>
        </section>

        <!-- Formation -->
        <section v-if="formations.length" class="li-carte li-rubrique">
          <h2>Formation</h2>
          <ul class="li-liste">
            <li v-for="(f, i) in formations" :key="f.id ?? i" class="li-element">
              <span class="li-logo-carre li-logo-carre--grand">🎓</span>
              <div>
                <h3>{{ f.ecole }}</h3>
                <p v-if="f.diplome">{{ f.diplome }}</p>
                <p v-if="periode(f.debut, f.fin)" class="li-gris">{{ periode(f.debut, f.fin) }}</p>
              </div>
            </li>
          </ul>
        </section>
      </div>

      <!-- Colonne de droite -->
      <aside class="li-colonne">
        <section v-if="competences.length" class="li-carte li-rubrique">
          <h2>Compétences</h2>
          <ul class="li-competences">
            <li v-for="(c, i) in competences" :key="i">{{ c }}</li>
          </ul>
        </section>

        <section class="li-carte li-rubrique li-langue" aria-hidden="true">
          <h2>Langue du profil</h2>
          <p class="li-gris">Français</p>
        </section>
      </aside>
    </div>
  </main>
</template>
