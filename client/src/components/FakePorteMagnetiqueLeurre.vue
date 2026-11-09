<script setup lang="ts">
import '@/styles/style_porte_magnetique_leurre.css'
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
        <span class="browser-tab__logo browser-tab__logo--site">🛠️</span>
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

    <main class="tech-blog">
      <header class="tech-blog__header" style="background-color: #1e3a8a;">
        <div class="tech-blog__container">
          <span class="tech-category">Prestation de service</span>
          <h1>Installation de contrôle d'accès biométrique et RFID</h1>
          <p class="tech-author">Pro-Sécurité Intégration — Devis sur mesure</p>
        </div>
      </header>

      <article class="tech-blog__article tech-blog__container">
        <p class="tech-intro">
          Sécurisez vos locaux avec une solution fictive de contrôle d'accès centralisée,
          présentée ici uniquement comme un leurre du scénario.
        </p>

        <h2>Notre protocole d'installation</h2>
        <p>
          Une installation réelle doit être étudiée et réalisée par des professionnels habilités.
          Cette page se limite aux éléments généraux à observer dans l'escape game.
        </p>
        
        <div class="tech-alert tech-alert--info" style="border-left-color: #64748b; background-color: #f1f5f9;">
          <strong>Page leurre du scénario</strong>
          <p>Les composants et les caractéristiques affichés sont fictifs et ne doivent pas être utilisés pour configurer un système réel.</p>
        </div>

        <h2>Spécifications techniques des relais</h2>
        <p>
          Le scénario invite à identifier le lecteur, le voyant et l'alimentation sur une
          illustration. Aucune adresse réseau ni procédure de raccordement n'est fournie.
        </p>

        <ul>
          <li><strong>Observation :</strong> repérer les composants indiqués dans le scénario.</li>
          <li><strong>Recoupement :</strong> comparer le voyant avec le tableau de mission.</li>
          <li><strong>Simulation :</strong> poursuivre uniquement dans l'interface du jeu.</li>
        </ul>

        <hr class="tech-divider" />
        <button class="tech-btn" type="button">Demander un devis</button>
      </article>
    </main>
  </div>
</template>