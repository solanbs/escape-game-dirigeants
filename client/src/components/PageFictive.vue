<script setup lang="ts">
/*
 * Enveloppe GÉNÉRIQUE des pages fictives : affiche n'importe quelle page YAML,
 * quel que soit son template. Remplace PageArticle.vue et FakeAlarmeAnnonce.vue.
 *
 *   1. trouver la page          → pages.ts (demain : page:watch auprès du serveur)
 *   2. dessiner la barre        → à partir de l'enveloppe (url, onglet.icone)
 *   3. choisir le template      → registry.ts, d'après `page.template`
 *   4. lui passer le contenu    → `page.data`
 */
import '@/styles/style_google.css'
import { pages } from '@/data/pages'
import { TEMPLATES, estTemplateConnu } from '@/registry'

// `siteId` = nom du fichier YAML sans « .yml » (provisoire : deviendra l'url).
const props = defineProps<{ siteId: string }>()
defineEmits<{ back: [] }>()

// 1. Trouver la page
const page = pages[props.siteId]

// 3. Choisir le composant d'après le champ `template:` du YAML.
//    null si le nom n'est pas dans le registre (faute de frappe, template pas encore écrit).
const composant = page && estTemplateConnu(page.template) ? TEMPLATES[page.template] : null

if (!page) console.warn(`[PageFictive] aucune page "${props.siteId}" (fichier ${props.siteId}.yml manquant ?)`)
else if (!composant) console.warn(`[PageFictive] "${props.siteId}" : template inconnu "${page.template}" (absent de registry.ts)`)

// 4. Le contenu. TypeScript ne peut pas savoir que `data` a la forme attendue par CE
//    template : le YAML n'est lu qu'à l'exécution. On le lui affirme avec `as any`.
//    La vraie vérification sera faite par le serveur, qui validera chaque YAML contre
//    le schéma de son template (shared/src/templates/) au démarrage.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data = page?.data as any

// Domaine affiché dans l'onglet : début de l'url (« leboncoin.fr/annonce/… » → « leboncoin.fr »)
const domaine = page?.url.split('/')[0] ?? props.siteId
</script>

<template>
  <div class="browser-window browser-window--maximized fake-site-browser">
    <!-- 2. Barre du navigateur : la même pour toutes les pages, remplie par l'enveloppe -->
    <div class="browser-tabs">
      <button class="browser-tab" type="button" @click="$emit('back')">
        <span class="browser-tab__logo">G</span>
        <span>Google</span>
        <span class="browser-tab__close" aria-hidden="true">×</span>
      </button>
      <button class="browser-tab browser-tab--active" type="button">
        <span class="browser-tab__logo browser-tab__logo--site">{{ page?.onglet?.icone }}</span>
        <span>{{ domaine }}</span>
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
        <span>{{ page?.url ?? siteId }}</span>
      </div>
      <button type="button" aria-label="Favoris">☆</button>
      <button type="button" aria-label="Menu">⋮</button>
    </div>

    <!-- 4. Le contenu : le composant choisi reçoit uniquement `data` -->
    <component :is="composant" v-if="page && composant" :data="data" />

    <!-- Page ou template introuvable : un message plutôt qu'un écran vide -->
    <main v-else class="page-fictive__erreur">
      <h1>Ce site est inaccessible</h1>
      <p v-if="!page">
        Aucune page <code>{{ siteId }}</code> : vérifier que
        <code>scenarios/scenario1_red_team/pages/{{ siteId }}.yml</code> existe.
      </p>
      <p v-else>
        Template <code>{{ page.template }}</code> inconnu : vérifier l'orthographe dans le YAML,
        ou l'ajouter à <code>client/src/registry.ts</code>.
      </p>
      <button type="button" @click="$emit('back')">Retour</button>
    </main>
  </div>
</template>

<style scoped>
.page-fictive__erreur {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  padding: 2rem;
  background: #f8f9fa;
  color: #5f6368;
  text-align: center;
}

.page-fictive__erreur h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #202124;
}

.page-fictive__erreur p {
  margin: 0;
  max-width: 40rem;
  line-height: 1.5;
}

.page-fictive__erreur button {
  margin-top: 0.5rem;
  padding: 0.5rem 1.5rem;
  border: 1px solid #dadce0;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}
</style>
