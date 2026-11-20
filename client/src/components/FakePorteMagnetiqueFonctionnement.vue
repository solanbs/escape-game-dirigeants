<script setup lang="ts">
import '@/styles/style_porte_magnetique_fonctionnement.css'
import '@/styles/style_google.css'
import { sites, type SiteId } from '@/data/fakeSite'

const props = defineProps<{
  siteId: SiteId
}>()

defineEmits<{
  back: []
}>()

const site = sites[props.siteId]
</script>

<template>
  <div class="browser-window browser-window--maximized fake-site-browser">
    <!-- Barre du navigateur -->
    <div class="browser-tabs">
      <button class="browser-tab" type="button" @click="$emit('back')">
        <span class="browser-tab__logo">G</span>
        <span>Google</span>
        <span class="browser-tab__close" aria-hidden="true">×</span>
      </button>
      <button class="browser-tab browser-tab--active" type="button">
        <span class="browser-tab__logo browser-tab__logo--site">📚</span>
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

    <!-- Portail de documentation technique -->
    <main class="kb-wrapper">
      <!-- Faux header du portail -->
      <header class="kb-header">
        <div class="kb-header-inner">
          <div class="kb-brand">
            <span class="kb-logo">🛡️</span>
            <span>Support & Documentation <strong>SecurTech</strong></span>
          </div>
          <div class="kb-search">
            <input type="text" placeholder="Rechercher une référence ou une erreur..." disabled />
            <button type="button">🔍</button>
          </div>
        </div>
      </header>

      <div class="kb-container">
        <!-- Contenu principal de l'article -->
        <div class="kb-main">
          <nav class="kb-breadcrumb">
            <a href="#">Accueil</a> > 
            <a href="#">Matériel de verrouillage</a> > 
            <a href="#">Série MAG (Ventouses)</a> > 
            <span>Fonctionnement et Sécurité Positive</span>
          </nav>

          <article class="kb-article">
            <h1>Principes de fonctionnement du verrouillage électromagnétique</h1>
            
            <div class="kb-meta">
              <span>Mise à jour : Il y a 14 jours</span>
              <span>ID Article : KB-8842-MAG</span>
              <button class="kb-print-btn">🖨️ Imprimer</button>
            </div>

            <p class="kb-lead">
              Ce document technique détaille le fonctionnement physique des ventouses électromagnétiques de la série MAG et leur comportement selon les normes d'évacuation incendie (EN 13637).
            </p>

            <h2>1. Le principe de l'électro-aimant</h2>
            <p>
              Les ventouses électromagnétiques n'ont aucun composant mécanique mobile (pas de pêne ni de cylindre). 
              Le verrouillage est assuré par une bobine de cuivre logée dans le corps de la ventouse. 
              <strong>C'est le passage du courant électrique continu (12V ou 24V DC) qui génère le champ magnétique.</strong> 
              Ce champ attire violemment la contre-plaque (armature) fixée sur l'ouvrant de la porte.
            </p>

            <div class="kb-info-box">
              <strong>Note d'installation :</strong> 
              Pour garantir une force de maintien optimale (jusqu'à 600 kg/6000N), la contre-plaque ne doit jamais être fixée rigidement. Un léger jeu mécanique (fourni par la rondelle de caoutchouc) est nécessaire pour un alignement parfait avec l'aimant.
            </div>

            <h2>2. La "Sécurité Positive" (Fail-Safe)</h2>
            <p>
              Contrairement aux gâches électriques à émission (qui ont besoin de courant pour s'ouvrir), 
              la norme impose que les ventouses fonctionnent en mode <em>Fail-Safe</em> (à manque de tension).
            </p>
            
            <p>
              La conséquence physique est immédiate : <strong>sans alimentation électrique, il n'y a plus de champ magnétique.</strong> 
              En cas de coupure de courant volontaire (via un déclencheur manuel vert), d'une coupure du disjoncteur, ou d'une panne secteur, le verrouillage est instantanément annulé et la porte devient libre pour permettre l'évacuation.
            </p>

            <h2>3. Tableau récapitulatif des états</h2>
            <table class="kb-table">
              <thead>
                <tr>
                  <th>Alimentation Électrique</th>
                  <th>État du champ magnétique</th>
                  <th>État de la porte</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Sous tension (12/24V)</strong></td>
                  <td>Actif (Force 300 à 600kg)</td>
                  <td><span class="status-locked">Verrouillée</span></td>
                </tr>
                <tr>
                  <td><strong>Hors tension (0V)</strong></td>
                  <td>Nul (0 kg)</td>
                  <td><span class="status-unlocked">Libre / Ouverte</span></td>
                </tr>
              </tbody>
            </table>

            <div class="kb-feedback">
              <p>Cet article vous a-t-il été utile ?</p>
              <button>👍 Oui</button>
              <button>👎 Non</button>
            </div>
          </article>
        </div>

        <!-- Barre latérale droite -->
        <aside class="kb-sidebar">
          <h3>Articles liés</h3>
          <ul class="kb-links">
            <li><a href="#">Câblage TCP/IP des contrôleurs de porte</a></li>
            <li><a href="#">Résoudre l'erreur "Défaut de contact" sur le voyant LED</a></li>
            <li><a href="#">Comment utiliser la clé de réarmement du boîtier vert</a></li>
            <li><a href="#">Schéma électrique d'une porte double battant</a></li>
          </ul>

          <div class="kb-support-box">
            <h4>Besoin d'assistance ?</h4>
            <p>Si la coupure d'alimentation ne suffit pas à réinitialiser votre système, contactez notre équipe technique de niveau 2.</p>
            <button class="support-btn">Ouvrir un ticket</button>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>