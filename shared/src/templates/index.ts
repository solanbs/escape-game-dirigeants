/**
 * Schémas des templates de page : un fichier par template.
 * Chaque type décrit le bloc `data:` des YAML qui utilisent ce template.
 */
export type { AnnonceData } from './Annonce.js'
export type { ArticleData } from './Article.js'
export type { FacebookData } from './Facebook.js'
export type { ForumData } from './Forum.js'
export type { IndexFileData } from './IndexFile.js'
export type { LinkedinData } from './Linkedin.js'
export type {
  Conditionnel, Profil, Publication, Commentaire, Message, Fichier, Experience, Formation,
} from './Communs.js'
export type { Bloc, BlocParagraphe, ElementListe } from './Bloc.js'
