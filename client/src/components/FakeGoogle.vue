<script setup lang="ts">
import { ref } from 'vue'
import '@/styles/style_google.css'
const pesquisa = ref('')
const compteOuvert = ref(false)
const ongletCompte = ref('compte')
const estMaximisee = ref(true)
const rechercheLancee = ref(false)

const lancerRecherche = () => {
  rechercheLancee.value = pesquisa.value.trim().length > 0
}

defineEmits<{
  close: []
}>()
</script>

<template>
  <div class="browser-window" :class="{ 'browser-window--maximized': estMaximisee }">
    <div class="browser-tabs">
      <button class="browser-tab browser-tab--active" type="button" @click="$emit('close')">
        <span class="browser-tab__logo">G</span>
        <span>Google</span>
        <span class="browser-tab__close" aria-hidden="true">×</span>
      </button>
      <button class="browser-tab__new" type="button" aria-label="Nouvel onglet">+</button>
      <div class="browser-window__controls">
        <button type="button" aria-label="Réduire">−</button>
        <button type="button" aria-label="Agrandir" @click="estMaximisee = !estMaximisee">□</button>
        <button type="button" aria-label="Fermer" @click="$emit('close')">×</button>
      </div>
    </div>

    <div class="browser-toolbar">
      <button type="button" aria-label="Retour">←</button>
      <button type="button" aria-label="Avancer">→</button>
      <button type="button" aria-label="Actualiser">↻</button>
      <div class="browser-address">
        <span>🔒</span>
        <span>google.fake</span>
      </div>
      <button type="button" aria-label="Favoris">☆</button>
      <button type="button" aria-label="Menu">⋮</button>
    </div>

  <div class="google-page">
    <header class="google-header">
      <a href="#" class="header-link">Gmail</a>
      <a href="#" class="header-link">Images</a>
      <button class="apps-button" aria-label="Applications Google">
        <svg focusable="false" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M6,8c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM12,20c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM6,20c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM6,14c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM12,14c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM16,6c0,1.1 0.9,2 2,2s2,-0.9 2,-2 -0.9,-2 -2,-2 -2,0.9 -2,2zM12,8c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM18,14c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM18,20c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2z"></path>
        </svg>
      </button>
      <button
        class="profile-avatar"
        type="button"
        aria-label="Ouvrir le compte des attaquants"
        @click="compteOuvert = !compteOuvert"
      >
        A
      </button>

      <section v-if="compteOuvert" class="account-panel" aria-label="Compte Google des attaquants">
        <div class="account-panel__identity">
          <div class="account-panel__avatar">A</div>
          <strong>Les attaquants</strong>
          <span>attaquants@google.fake</span>
        </div>

        <div class="account-panel__tabs" role="tablist" aria-label="Options du compte">
          <button
            v-for="onglet in [
              { id: 'compte', label: 'Compte' },
              { id: 'activite', label: 'Activité' },
              { id: 'securite', label: 'Sécurité' },
            ]"
            :key="onglet.id"
            class="account-panel__tab"
            :class="{ 'account-panel__tab--active': ongletCompte === onglet.id }"
            type="button"
            role="tab"
            :aria-selected="ongletCompte === onglet.id"
            @click="ongletCompte = onglet.id"
          >
            {{ onglet.label }}
          </button>
        </div>

        <p v-if="ongletCompte === 'compte'" class="account-panel__content">
          Compte utilisé par l'équipe des attaquants.
        </p>
        <p v-else-if="ongletCompte === 'activite'" class="account-panel__content">
          Dernière activité : recherche confidentielle.
        </p>
        <p v-else class="account-panel__content">
          La sécurité du compte est renforcée.
        </p>
      </section>
    </header>

    <main class="google-main">
      <div class="logo-container">
        <h1 class="google-logo">Google</h1>
      </div>

      <div class="search-container">
        <div class="search-bar">
          <span class="search-icon-left">+</span>
          <input 
            type="text" 
            v-model="pesquisa" 
            class="search-input" 
            placeholder="Rechercher"
            aria-label="Recherche Google"
            @keyup.enter="lancerRecherche"
            autofocus 
          />
          <button class="search-submit" type="button" @click="lancerRecherche">Rechercher</button>
        </div>
      </div>

      <div class="search-buttons">
        <button class="btn" type="button" @click="lancerRecherche">Recherche Google</button>
        <button class="btn">J'ai de la chance</button>
      </div>

      <p v-if="rechercheLancee" class="search-feedback">
        Résultats de recherche pour : <strong>{{ pesquisa }}</strong>
      </p>

      <div class="language-offer">
        Disponible sur Google en : <a href="#">français</a>
      </div>
    </main>

    <footer class="google-footer">
      <div class="footer-location">France</div>
    </footer>
  </div>
  </div>
</template>

<style scoped>

</style>