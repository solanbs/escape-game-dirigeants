/*
 * Mise en forme du texte écrit dans les YAML.
 * Le résultat est destiné à v-html : le HTML du texte est donc échappé d'abord,
 * seul le gras **mot** devient une balise.
 */

const echapper = (texte: string) =>
  texte.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** "**mot**" → "<strong>mot</strong>", le reste du texte étant échappé. */
export const enGras = (texte: string | undefined) =>
  echapper(texte ?? '').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

/** Découpe un texte en paragraphes (séparés par une ligne vide). */
export const paragraphes = (texte: string | undefined) =>
  (texte ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
