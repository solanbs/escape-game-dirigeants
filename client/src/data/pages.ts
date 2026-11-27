import { load } from 'js-yaml'

/*
 * PROVISOIRE : pages fictives lues directement par le client.
 *
 * Cible (docs/architecture.md, sections 9 à 11) : les YAML restent sur le
 * serveur, et le navigateur du jeu reçoit une page via `page:watch { url }`.
 * Ce fichier disparaîtra alors ; le format des pages, lui, ne change pas.
 *
 * Pour l'instant la clé est le nom du fichier sans ".yml", parce que App.vue
 * ouvre les pages par leur ancien `siteId`. Elle deviendra l'`url`.
 */

/** Un fichier de page : l'enveloppe (lue par le navigateur) + le contenu (pour le template). */
export type PageFichier = {
  url: string
  /** Nom du template qui affiche `data` (ClassifiedAd, Article…). */
  template: string
  visibleTo?: string[]
  when?: string | string[]
  onglet?: { icone?: string }
  /** Contenu transmis tel quel au template ; son type dépend de `template`. */
  data: unknown
}

const fichiers = import.meta.glob<string>('../../../scenarios/scenario1_red_team/pages/*.yml', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const idDepuisChemin = (chemin: string) => chemin.split('/').pop()!.replace(/\.yml$/, '')

export const pages: Record<string, PageFichier> = {}

for (const [chemin, contenu] of Object.entries(fichiers)) {
  const id = idDepuisChemin(chemin)
  try {
    pages[id] = load(contenu) as PageFichier
  } catch (erreur) {
    console.error(`[pages] ${id}.yml illisible :`, erreur)
  }
}

/** Renvoie la page si elle existe et utilise le template attendu, sinon undefined (avec un avertissement). */
export function pageAvecTemplate(id: string, template: string): PageFichier | undefined {
  const page = pages[id]
  if (!page) {
    console.warn(`[pages] aucune page "${id}" (fichier ${id}.yml manquant ?)`)
    return undefined
  }
  if (page.template !== template) {
    console.warn(`[pages] "${id}" utilise le template "${page.template}", attendu "${template}"`)
    return undefined
  }
  return page
}
