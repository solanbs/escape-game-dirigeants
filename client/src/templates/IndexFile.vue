<script setup lang="ts">
/*
 * Template IndexFile : listing de fichiers en ligne (page « Index of /… »),
 * comme un serveur web qui affiche le contenu d'un dossier.
 *
 * Ne fait QUE de la mise en page : tout le texte vient de `data`, c'est-à-dire
 * du bloc `data:` d'un YAML de page qui a `template: IndexFile`.
 * Pas de barre de navigateur ici : c'est l'enveloppe (PageIndexFile.vue) qui l'affiche.
 * Mise en page reprise de FakeAlarmeArchive.vue.
 *
 * Seule interaction : cliquer sur un fichier l'ouvre dans l'aperçu sous le tableau.
 * Un fichier sans `contenu` affiche « aperçu indisponible ».
 */
import { ref } from 'vue'
import '@/styles/style_index_file.css'
import type { Fichier, IndexFileData } from '@escape/shared'

defineProps<{ data: IndexFileData }>()

/** Fichier ouvert dans l'aperçu (null = aucun). */
const ouvert = ref<Fichier | null>(null)

/** Le dossier parent « ../ » n'est pas un fichier : il ne s'ouvre pas. */
const estParent = (f: Fichier) => f.nom === '../'

function ouvrir(f: Fichier) {
  if (!estParent(f)) ouvert.value = f
}

/** Icône selon l'extension, comme les listings Apache. */
function icone(f: Fichier) {
  if (estParent(f)) return '↩️'
  if (f.nom.endsWith('/')) return '📁'
  if (/\.(txt|md|log|cfg|ini)$/i.test(f.nom)) return '📄'
  if (/\.pdf$/i.test(f.nom)) return '📕'
  if (/\.(zip|tar|gz|rar|7z)$/i.test(f.nom)) return '🗜️'
  if (/\.(png|jpe?g|gif|bmp)$/i.test(f.nom)) return '🖼️'
  return '📄'
}
</script>

<template>
  <main class="index-site" :style="{ '--couleur-principale': data.couleur || undefined }">
    <div class="index-conteneur">
      <h1 class="index-titre">Index of {{ data.chemin }}</h1>

      <table class="index-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Last modified</th>
            <th>Size</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(f, i) in data.fichiers"
            :key="f.id ?? i"
            :class="{ 'index-ligne--avant': f.mis_en_avant, 'index-ligne--ouverte': ouvert === f }"
          >
            <td>
              <span class="index-icone" aria-hidden="true">{{ icone(f) }}</span>
              <span v-if="estParent(f)" class="index-parent">{{ f.nom }}</span>
              <a v-else href="#" @click.prevent="ouvrir(f)">{{ f.nom }}</a>
            </td>
            <td>{{ f.date }}</td>
            <td>{{ f.taille ?? '-' }}</td>
          </tr>
        </tbody>
      </table>

      <!-- Aperçu du fichier cliqué -->
      <section v-if="ouvert" class="index-apercu">
        <div class="index-apercu__entete">
          <span>Affichage du fichier : {{ ouvert.nom }}</span>
          <button type="button" aria-label="Fermer l'aperçu" @click="ouvert = null">×</button>
        </div>
        <pre v-if="ouvert.contenu" class="index-apercu__contenu">{{ ouvert.contenu }}</pre>
        <p v-else class="index-apercu__vide">
          Aperçu indisponible pour ce fichier. Le téléchargement est désactivé sur ce serveur.
        </p>
      </section>

      <address class="index-pied">Apache Server</address>
    </div>
  </main>
</template>
