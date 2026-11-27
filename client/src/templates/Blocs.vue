<script setup lang="ts">
/*
 * Affiche une liste de blocs (le `corps:` ou la `colonne:` d'un YAML).
 * Utilisé par Article.vue et Site.vue.
 *
 * Pour ajouter un type de bloc : une branche `v-else-if` dans le template
 * ci-dessous, et ses règles CSS dans style_blocs.css.
 */
import '@/styles/style_blocs.css'
import type { Bloc } from '@escape/shared'
import { enGras } from '@/data/texte'

// `blocs` est facultatif : `colonne:` peut être absent du YAML.
defineProps<{ blocs?: Bloc[] }>()

/** Type de bloc non prévu : rien à l'écran, un avertissement dans la console. */
function blocInconnu(bloc: { type?: unknown }) {
  console.warn(`[Blocs] type de bloc inconnu : "${String(bloc.type)}"`)
  return false
}
</script>

<template>
  <div class="blocs">
    <template v-for="(bloc, i) in blocs ?? []" :key="bloc.id ?? i">
        <!-- Bloc intertitre -->
        <h2 v-if="bloc.type === 'intertitre'" class="bloc-intertitre" v-html="enGras(bloc.texte)" />

        <!-- Bloc paragraphe -->
        <p v-else-if="bloc.type === 'paragraphe'" class="bloc-paragraphe" v-html="enGras(bloc.texte)" />

        <!-- Bloc liste -->
        <ul v-else-if="bloc.type === 'liste'" class="bloc-liste">
            <li
                v-for="(elm, j) in bloc.elements ?? []"
                :key="j"
                class="bloc-liste__item"
            >
                <template v-if="typeof elm === 'string'">
                <span v-html="enGras(elm)" />
                </template>

                <template v-else-if="elm">
                <span v-if="elm.icone" class="bloc-liste__icone" aria-hidden="true">{{ elm.icone }}</span>
                <strong v-if="elm.label" class="bloc-liste__label">{{ elm.label }}</strong>
                <span v-if="elm.texte" class="bloc-liste__texte" v-html="enGras(elm.texte)" />
                <small v-if="elm.note" class="bloc-liste__note">{{ elm.note }}</small>
                </template>
            </li>
        </ul>

        <!-- BLoc Etapes -->
        <ol v-else-if="bloc.type === 'etapes'" class="bloc-etapes">
            <li
                v-for="(elm, j) in bloc.elements ?? []" :key="j" class="bloc-etapes__item"
            >
                <strong v-if="elm.titre" class="bloc-etapes__titre" v-html="enGras(elm.titre)" />
                <p v-if="elm.texte" class="bloc-etapes__texte" v-html="enGras(elm.texte)"/>

            </li>
        </ol>

        <!-- Bloc encadré -->
        <div v-else-if="bloc.type === 'encadre'" :id="bloc.id" class="bloc-encadre"
        >
        <aside :class="`bloc-encadre--${bloc.ton ?? 'info'}`" :aria-label="!bloc.titre ? ((bloc.ton ?? 'info') === 'alerte' ? 'Alerte' : 'Information') : undefined"
        >
            <span v-if="bloc.icone" class="bloc-encadre__icone" aria-hidden="true" >{{ bloc.icone }}</span>

            <strong v-if="bloc.titre" class="bloc-encadre__titre" v-html="enGras(bloc.titre)" />

            <p v-if="bloc.texte" class="bloc-encadre__texte" v-html="enGras(bloc.texte)" />

            <p v-if="bloc.avertissement" class="bloc-encadre__note" >{{ bloc.avertissement }}</p>

            <button v-if="bloc.bouton" class="bloc-encadre__bouton" type="button" >{{ bloc.bouton }}</button>
        </aside>
        </div>

        <!-- Bloc Citation -->
        <blockquote v-else-if="bloc.type === 'citation'" class="bloc-citation">
            <p v-if="bloc.texte" class="bloc-citation__texte" v-html="enGras(bloc.texte)" />
            <footer v-if="bloc.auteur" class="bloc-citation__auteur">{{ bloc.auteur }}</footer>
        </blockquote>

        <!-- Bloc Tableau -->
        <table v-else-if="bloc.type === 'tableau'" class="bloc-tableau">
            <thead v-if="bloc.colonnes">
                <tr>
                    <th v-for="(entete, i) in bloc.colonnes" :key="i" v-html="enGras(entete)" />
                </tr>
            </thead>
            <tbody>
                <tr v-for="(ligne, i) in bloc.lignes ?? []" :key="i">
                    <td v-for="(cellule, j) in ligne" :key="j" v-html="enGras(cellule)" />
                </tr>
            </tbody>
        </table>

        <!-- Bloc Image -->
        <figure v-else-if="bloc.type === 'image'" class="bloc-image">
            <img v-if="bloc.fichier" :src="bloc.fichier" :alt="bloc.legende" />
            <figcaption v-if="bloc.legende" class="bloc-image__legende">{{ bloc.legende }}</figcaption>
        </figure>

        <!-- Bloc chiffres -->
        <section v-else-if="bloc.type === 'chiffres'" :id="bloc.id" class="bloc-chiffres" >
        <ul class="bloc-chiffres__liste">
            <li v-for="(elm, j) in bloc.elements ?? []" :key="j" class="bloc-chiffres__item" >
            <data
                v-if="elm.valeur !== undefined && elm.valeur !== null && elm.valeur !== ''"
                :value="elm.valeur"
                class="bloc-chiffres__chiffre"
            >
                {{ elm.valeur }}
            </data>
            <span v-if="elm.label" class="bloc-chiffres__texte" v-html="enGras(elm.label)" />
            </li>
        </ul>
        </section>

        <!-- Bloc Cartes -->
        <section v-else-if="bloc.type === 'cartes'" :id="bloc.id" class="bloc-cartes" >
        <ul class="bloc-cartes__liste">
            <li v-for="(elm, j) in bloc.elements ?? []" :key="j" class="bloc-cartes__item" >
            <article class="bloc-cartes__carte">
                <span v-if="elm.icone" class="bloc-cartes__icone" aria-hidden="true" >{{ elm.icone }}</span>

                <h3 v-if="elm.titre" class="bloc-cartes__titre" v-html="enGras(elm.titre)" />

                <p v-if="elm.texte" class="bloc-cartes__texte" v-html="enGras(elm.texte)" />
            </article>
            </li>
        </ul>
        </section>

        <!-- Bloc Personnes -->
        <section v-else-if="bloc.type === 'personnes'" :id="bloc.id" class="bloc-personnes" :aria-labelledby="bloc.titre ? `${bloc.id ?? 'bloc-personnes'}-titre` : undefined">
            <h2 v-if="bloc.titre" :id="`${bloc.id ?? 'bloc-personnes'}-titre`" class="bloc-personnes__titre" v-html="enGras(bloc.titre)" />

            <ul class="bloc-personnes__liste">
                <li v-for="(personne, i) in bloc.liste ?? []" :key="personne.nom + '-' + i" class="bloc-personnes__item" >
                <article class="bloc-personnes__carte">
                    <img v-if="personne.photo" :src="personne.photo" :alt="personne.nom" class="bloc-personnes__photo" loading="lazy" />

                    <div class="bloc-personnes__infos">
                    <h3 class="bloc-personnes__nom">{{ personne.nom }}</h3>
                    <p v-if="personne.poste" class="bloc-personnes__poste">{{ personne.poste }}</p>
                    <p v-if="personne.bio" class="bloc-personnes__bio" v-html="enGras(personne.bio)" />
                    </div>
                </article>
                </li>
            </ul>
        </section>


        <!-- Bloc Actus -->
        <section v-else-if="bloc.type === 'actus'" :id="bloc.id" class="bloc-actus">

            <ul class="bloc-actus__liste">
                <li v-for="(actu, j) in bloc.elements ?? []" :key="actu.id ?? j" class="bloc-actus__item" >
                <article class="bloc-actus__carte">

                    <div class="bloc-actus__infos">
                    <h3 class="bloc-actus__titre-actu" v-html="enGras(actu.titre)" />
                    <p v-if="actu.date" class="bloc-actus__date">{{ actu.date }}</p>
                    <p v-if="actu.extrait" class="bloc-actus__resume" v-html="enGras(actu.extrait)" />
                    </div>
                </article>
                </li>
            </ul>
        </section>

        <!-- Bloc Temoignages -->
        <section v-else-if="bloc.type === 'temoignages'" :id="bloc.id" class="bloc-temoignages" >
        <ul class="bloc-temoignages__liste">
            <li v-for="(temoignage, j) in bloc.elements ?? []" :key="j" class="bloc-temoignages__item" >
            <article class="bloc-temoignages__carte">
                <div class="bloc-temoignages__infos" >
                <blockquote
                    v-if="temoignage.texte"
                    class="bloc-temoignages__texte"
                >
                    <p v-html="enGras(temoignage.texte)" />
                </blockquote>

                <cite v-if="temoignage.auteur" class="bloc-temoignages__auteur" v-html="enGras(temoignage.auteur)" />
                </div>
            </article>
            </li>
        </ul>
        </section>

        <!-- Bloc Contact -->
        <section v-else-if="bloc.type === 'contact'" :id="bloc.id" class="bloc-contact">
            <h2 v-if="bloc.titre" class="bloc-contact__titre" v-html="enGras(bloc.titre)" />

            <article class="bloc-contact__carte">
                <div class="bloc-contact__infos">
                <p v-if="bloc.texte" class="bloc-contact__texte" v-html="enGras(bloc.texte)" />
                <p v-if="bloc.adresse" class="bloc-contact__adresse">{{ bloc.adresse }}</p>
                <p v-if="bloc.email" class="bloc-contact__email">{{ bloc.email }}</p>
                <p v-if="bloc.telephone" class="bloc-contact__telephone">{{ bloc.telephone }}</p>
                </div>
            </article>
        </section>

        <!-- Type non géré (pas encore écrit ci-dessus, ou faute de frappe dans le YAML) -->
        <template v-else-if="blocInconnu(bloc)" />
    </template>
  </div>
</template>
