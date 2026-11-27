import { load } from 'js-yaml'
import fichier from '@scenarios/scenario1_red_team/search.yaml?raw'
import { idParUrl } from '@/data/pages'

/*
 * PROVISOIRE : recherches du faux Google, lues directement par le client dans
 * scenarios/scenario1_red_team/search.yaml (format : docs/format_pages.md).
 * Cible (docs/architecture.md) : message `search` envoyé au serveur.
 */

/** Une recherche telle qu'écrite dans search.yaml. */
type Recherche = {
  /** Expressions reconnues, ex. ["david ecnasiol", "ecnasiol"]. */
  query: string[]
  results: { url: string; title: string; snippet: string }[]
}

/** Un résultat affiché par le faux Google. */
export type Resultat = {
  url: string
  title: string
  snippet: string
  /** Page YAML qui a cette url (son nom de fichier) ; absent = aucune page derrière. */
  id?: string
}

let recherches: Recherche[] = []
try {
  recherches = (load(fichier) as Recherche[] | null) ?? []
} catch (erreur) {
  console.error('[recherches] search.yaml illisible :', erreur)
}

/** Minuscules, sans accents, espaces simplifiés. */
export const normaliser = (texte: string) =>
  texte
    .toLocaleLowerCase('fr-FR')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()

/** Petits mots ignorés quand on compare une requête aux résultats. */
const MOTS_VIDES = new Set(['le', 'la', 'les', 'l', 'de', 'du', 'des', 'd', 'un', 'une', 'et', 'a', 'au', 'aux', 'en', 'sur', 'pour'])

/** Mots significatifs d'un texte normalisé (« procès de Carbona » → ["proces", "carbona"]). */
const motsDe = (texte: string) =>
  normaliser(texte)
    .split(/[\s'’\-_/.,:;!?()«»"]+/)
    .filter((m) => m.length > 0 && !MOTS_VIDES.has(m))

/** Ajoute des résultats à une liste sans doublon d'url. */
function ajouter(liste: Resultat[], nouveaux: Resultat[]) {
  for (const r of nouveaux) if (!liste.some((x) => x.url === r.url)) liste.push(r)
}

/** Tous les résultats écrits dans search.yaml, sans doublon (pour le niveau 3). */
const tousLesResultats: Resultat[] = []
for (const recherche of recherches) ajouter(tousLesResultats, recherche.results ?? [])

/**
 * Trois niveaux, du plus précis au plus large :
 *
 * 1. EXPRESSION COMPLÈTE : la requête contient tous les mots d'une expression de
 *    search.yaml, dans n'importe quel ordre (« procès de Carbona » ⊃ « carbona proces »).
 *    La plus précise l'emporte (expression la plus longue ; à égalité, la première
 *    écrite) et ses résultats sont affichés SEULS : c'est le choix des rédacteurs.
 *
 * 2. EXPRESSION PARTIELLE : sinon, toutes les recherches dont une expression contient
 *    tous les mots tapés (« procès » ⊂ « carbona proces », « alarme » ⊂ « alarme supersecure »),
 *    dans l'ordre de search.yaml.
 *
 * 3. CE QUE GOOGLE AFFICHE : en plus du niveau 2, les résultats dont le titre, l'extrait
 *    ou l'adresse contiennent tous les mots tapés (« facebook », « leboncoin »).
 *    Volontairement PAS le texte des pages : un indice (ex. le code de l'archive)
 *    ne doit sortir que par les recherches prévues.
 */
export function rechercher(requete: string): Resultat[] {
  const texte = normaliser(requete)
  const mots = motsDe(requete)
  if (!mots.length) return []
  const avecId = (rs: Resultat[]) => rs.map((r) => ({ ...r, id: idParUrl[r.url] }))

  // 1. Expression complète
  let meilleure: { score: number; recherche: Recherche } | null = null
  for (const recherche of recherches) {
    for (const expression of recherche.query ?? []) {
      const exp = normaliser(expression)
      const correspond = motsDe(expression).every((mot) => mots.includes(mot) || texte.includes(mot))
      if (correspond && (!meilleure || exp.length > meilleure.score)) {
        meilleure = { score: exp.length, recherche }
      }
    }
  }
  if (meilleure) return avecId(meilleure.recherche.results ?? [])

  const resultats: Resultat[] = []

  // 2. Expression partielle
  for (const recherche of recherches) {
    const contientTout = (recherche.query ?? []).some((expression) => {
      const motsExp = motsDe(expression)
      return mots.every((mot) => motsExp.some((m) => m.startsWith(mot)))
    })
    if (contientTout) ajouter(resultats, recherche.results ?? [])
  }

  // 3. Titre, extrait, adresse
  ajouter(
    resultats,
    tousLesResultats.filter((r) => {
      const affiche = normaliser(`${r.title} ${r.snippet} ${r.url}`)
      return mots.every((mot) => affiche.includes(mot))
    }),
  )

  return avecId(resultats)
}

/** Une expression au hasard, pour le bouton « J'ai de la chance ». */
export function expressionAuHasard(): string {
  const toutes = recherches.flatMap((r) => r.query ?? [])
  return toutes[Math.floor(Math.random() * toutes.length)] ?? ''
}
