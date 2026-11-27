/**
 * Id de session lisible : date + heure + nom d'équipe.
 * Ex. makeSessionId(new Date(2026, 10, 9, 14, 30), 'Les Requins') → '2026-11-09_14h30_les-requins'
 */
export function makeSessionId(date: Date, teamName: string): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  const time = `${pad(date.getHours())}h${pad(date.getMinutes())}`
  return `${day}_${time}_${slugify(teamName) || 'equipe'}`
}

/** 'Les Élèves d'Été !' → 'les-eleves-d-ete' */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
