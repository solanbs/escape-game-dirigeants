<script setup lang="ts">
import '@/styles/style_alarme_guide.css'
import '@/styles/style_google.css'
import { sites, type SiteId } from '@/data/fakeSite'

const props = defineProps<{ siteId: SiteId }>()
defineEmits<{ back: [] }>()
const site = sites[props.siteId]
</script>

<template>
  <div class="browser-window browser-window--maximized fake-site-browser">
    <!-- Barre du navigateur (habituelle) -->
    <div class="browser-tabs">
      <button class="browser-tab" type="button" @click="$emit('back')">
        <span class="browser-tab__logo">G</span><span>Google</span>
        <span class="browser-tab__close" aria-hidden="true">×</span>
      </button>
      <button class="browser-tab browser-tab--active" type="button">
        <span class="browser-tab__logo browser-tab__logo--site">📖</span><span>{{ site.domaine }}</span>
        <span class="browser-tab__close" aria-hidden="true">×</span>
      </button>
      <div class="browser-window__controls">
        <button type="button" @click="$emit('back')">×</button>
      </div>
    </div>
    <div class="browser-toolbar">
      <button type="button" @click="$emit('back')">←</button>
      <button type="button" aria-label="Avancer">→</button>
      <button type="button" aria-label="Actualiser">↻</button>
      <div class="browser-address"><span>🔒</span><span>{{ site.domaine }}</span></div>
    </div>

    <!-- Contenu Support -->
    <main class="support-site">
      <header class="support-header">
        <h1>Centre d'aide SuperSecure</h1>
        <p>Base de connaissances et manuels d'installation</p>
      </header>

      <article class="support-content">
        <div class="breadcrumb">Accueil > Matériel > Série V2 > Mise en service</div>
        
        <h2>Première mise en service : Initialisation du système V2</h2>
        <p class="support-lead">
          Pour des raisons de sécurité évidentes, la centrale SuperSecure V2 vous est livrée verrouillée. Une initialisation matérielle est requise lors du premier branchement.
        </p>

        <div class="support-steps">
          <div class="step">
            <div class="step-num">1</div>
            <div class="step-text">
              <h3>Alimentation</h3>
              <p>Raccordez la centrale au secteur 220V et enclenchez la batterie de secours. Le clavier s'allume.</p>
            </div>
          </div>
          <div class="step">
            <div class="step-num">2</div>
            <div class="step-text">
              <h3>Code d'usine (Master Code)</h3>
              <p>
                <strong>Où trouver le code d'usine ?</strong> Il n'est pas imprimé sur la boîte ni sur l'appareil.
                Vous devez consulter le document texte nommé <code>V2_Master_Manual.txt</code> fourni sur le support numérique d'origine, ou disponible dans les archives de documentations techniques de 2019.
              </p>
            </div>
          </div>
          <div class="step">
            <div class="step-num">3</div>
            <div class="step-text">
              <h3>Modification</h3>
              <p>Saisissez le code d'usine. Le voyant passe au vert. Vous devez immédiatement définir votre propre code à 4 chiffres.</p>
            </div>
          </div>
        </div>
        
      </article>
    </main>
  </div>
</template>