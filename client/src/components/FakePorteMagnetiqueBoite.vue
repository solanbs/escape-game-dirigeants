<script setup lang="ts">
import '@/styles/style_porte_magnetique_boite.css'
import '@/styles/style_google.css'
import { sites, type SiteId } from '@/data/fakeSite'

const props = defineProps<{ siteId: SiteId }>()
defineEmits<{ back: [] }>()
const site = sites[props.siteId]
</script>

<template>
  <div class="browser-window browser-window--maximized fake-site-browser">
    <!-- Barre du navigateur (identique) -->
    <div class="browser-tabs">
      <button class="browser-tab" type="button" @click="$emit('back')">
        <span class="browser-tab__logo">G</span>
        <span>Google</span>
        <span class="browser-tab__close" aria-hidden="true">×</span>
      </button>
      <button class="browser-tab browser-tab--active" type="button">
        <span class="browser-tab__logo browser-tab__logo--site">📄</span>
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
    
    <!-- Contenu : Fausse Notice Réaliste -->
    <main class="fire-safety-site">
      <header class="fs-header">
        <div class="fs-container">
          <span class="fs-badge">Manuel Utilisateur - PDF Web Viewer</span>
          <h1>SecureBox MAG-200 : Boîte de dépôt sécurisée</h1>
        </div>
      </header>

      <article class="fs-container fs-content">
        <h2>1. Présentation du matériel</h2>
        <p>
          La SecureBox MAG-200 est une solution de stockage temporaire équipée d'un verrouillage électromagnétique à haute rétention (force d'arrachement de 150 kg). 
        </p>

        <h2>2. Caractéristiques et Alimentation</h2>
        <div class="fs-highlight">
          <div class="fs-icon">🔌</div>
          <div class="fs-text">
            <strong>Schéma d'alimentation (Port DC-IN) :</strong>
            <p>L'appareil nécessite une alimentation continue stricte. Le bloc d'alimentation 12V fourni doit être connecté au port situé à l'arrière de la boîte. <strong>Attention :</strong> Cet appareil fonctionne en mode "Sécurité Positive" (Fail-Safe).</p>
          </div>
        </div>

        <h2>3. Signification du Voyant d'état (LED)</h2>
        <ol>
          <li><strong>🔴 Voyant Rouge fixe :</strong> Boîte sous tension et verrouillée. L'électro-aimant est actif.</li>
          <li><strong>🟢 Voyant Vert clignotant :</strong> Code d'accès valide saisi, ouverture temporaire autorisée (5 secondes).</li>
          <li><strong>⚫ Voyant Éteint (Aucune lumière) :</strong> Absence d'alimentation électrique. <em>Note : En cas de coupure d'alimentation, le champ magnétique s'annule immédiatement et la porte se déverrouille librement.</em></li>
        </ol>

      </article>
    </main>
  </div>
</template>