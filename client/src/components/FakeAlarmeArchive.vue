<script setup lang="ts">
import '@/styles/style_archive.css'
import '@/styles/style_google.css'
import { sites, type SiteId } from '@/data/fakeSite'
import { ref } from 'vue'

const props = defineProps<{ siteId: SiteId }>()
defineEmits<{ back: [] }>()
const site = sites[props.siteId]
const codeRevele = ref(false)
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
        <span class="browser-tab__logo browser-tab__logo--site">📁</span>
        <span>{{ site.domaine }}</span>
        <span class="browser-tab__close" aria-hidden="true">×</span>
      </button>
      <button class="browser-tab__new" type="button" aria-label="Nouvel onglet">+</button>
      <div class="browser-window__controls">
        <button type="button" aria-label="Réduire">−</button>
        <button type="button" aria-label="Agrandir">□</button>
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

    <main class="archive-site">
      <div class="archive-container">
        <header class="archive-header">
          <h1>Index of /manuals/supersecure/2019/</h1>
        </header>

        <table class="archive-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Last modified</th>
              <th>Size</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><a href="#">../</a></td>
              <td>-</td>
              <td>-</td>
            </tr>
            <tr>
              <td><a href="#">V1_Setup_Guide.pdf</a></td>
              <td>12-May-2018 14:22</td>
              <td>1.2M</td>
            </tr>
            <tr class="highlight-row">
              <td>📄 <strong>V2_Master_Manual.txt</strong></td>
              <td>04-Sep-2019 09:11</td>
              <td>45K</td>
            </tr>
            <tr>
              <td><a href="#">V3_Network_Config.pdf</a></td>
              <td>21-Nov-2021 16:45</td>
              <td>3.4M</td>
            </tr>
          </tbody>
        </table>

        <!-- Faux aperçu du fichier texte cliqué -->
        <div class="file-preview">
          <div class="file-preview-header">Affichage du fichier : V2_Master_Manual.txt</div>
          <pre class="file-content">
==================================================
SUPERSECURE - CENTRALE D'ALARME MODÈLE V2
MÉMO D'INSTALLATION RAPIDE POUR TECHNICIENS
==================================================

1. Câblage des capteurs filaires (Bornier A à D)
2. Mise sous tension secteur (220V)
3. Armement de la batterie de secours.

ATTENTION - SÉCURITÉ INITIALE :
Toutes les centrales V2 quittent l'usine avec un verrouillage actif pour éviter la reconfiguration par des tiers lors du transport. 
Pour accéder au panneau de contrôle lors de la première installation, vous devez saisir le code d'usine par défaut.

--> CODE USINE SÉRIE V2 : {{ codeRevele ? '4729' : '[à confirmer]' }}

Note : Ce code doit impérativement être écrasé lors du premier paramétrage réseau.
          </pre>
        </div>
        <p class="archive-hint">
          Recoupez la marque, le modèle V2 et l’indice du forum avant d’afficher le code.
        </p>
        <button class="back-btn" type="button" @click="codeRevele = true">
          Valider le recoupement et afficher le code
        </button>
      </div>
    </main>
  </div>
</template>