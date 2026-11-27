/*
 * Registre des templates de page : nom du template → composant Vue.
 *
 * Le champ `template:` d'un YAML de page (ex. `template: Article`) est cherché
 * ici pour savoir quel composant affiche son `data`.
 * Utilisé par l'enveloppe des pages (PageFictive.vue), avec :
 *   <component :is="TEMPLATES[page.template]" :data="page.data" />
 *
 * Pour ajouter un template : l'importer, puis l'ajouter à TEMPLATES.
 * Le nom de la clé doit être EXACTEMENT celui écrit dans les YAML.
 */
import type { Component } from 'vue'
import Article from '@/templates/Article.vue'
import Annonce from '@/templates/Annonce.vue'
import Facebook from '@/templates/Facebook.vue'
import Forum from '@/templates/Forum.vue'
import IndexFile from '@/templates/IndexFile.vue'
import Linkedin from '@/templates/Linkedin.vue'

export const TEMPLATES = {
  Article,
  Annonce,
  Facebook,
  Forum,
  IndexFile,
  // CompanySite,
  Linkedin,
} satisfies Record<string, Component>

/** Nom d'un template connu : 'Article' | 'Annonce' | … */
export type NomTemplate = keyof typeof TEMPLATES

/** Vrai si le nom (lu dans un YAML) correspond à un template du registre. */
export function estTemplateConnu(nom: string): nom is NomTemplate {
  return Object.hasOwn(TEMPLATES, nom)
}
