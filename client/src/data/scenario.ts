/*
 * PROVISOIRE : données du jeu encore écrites en TypeScript, pour la messagerie
 * (FakeMail.vue) et le bureau de Maël (BureauWindows.vue).
 *
 * Dans l'architecture cible (docs/architecture.md), elles deviennent des nœuds
 * du scénario (scenario.yaml) gérés par le serveur. Les pages et les recherches
 * Google, elles, sont déjà en YAML (pages.ts, recherches.ts).
 *
 * Recréé le 27/11/2026 à l'identique de la version d'origine (fichier jamais
 * commité, supprimé par erreur), sans la partie Google devenue inutile.
 */

export type FichierBureau = {
  nom: string
  icone: string
  contenu: string
}

export type DossierBureau = {
  id: string
  nom: string
  icone: string
  fichiers: FichierBureau[]
}

export type DocumentPoubelle = {
  id: string
  nom: string
  utile: boolean
  contenu: string
}

export const EMAIL_JOUEURS = 'attaquants@proton.fake'
export const EMAIL_DAVID = 'david.ecnasiol@aerofourneau.fake'
export const DELAI_REPONSE_MS = 1200

export const dossiersMael: DossierBureau[] = [
  {
    id: 'documents',
    nom: 'Documents',
    icone: '📁',
    fichiers: [
      {
        nom: 'Identifiants.txt',
        icone: '📄',
        contenu:
          "Compte intranet : morinm\nNom d'utilisateur : Morin + première lettre du prénom\nSession : Maël Morin\nMot de passe perso : Ne jamais écrire ici.",
      },
      {
        nom: 'Rappels.txt',
        icone: '📝',
        contenu:
          "À faire : changer le mot de passe du compte comptable.\nRetourner à la boîte aux livres.\nCarbona Racing Team - Maël Morin",
      },
    ],
  },
  {
    id: 'telechargements',
    nom: 'Téléchargements',
    icone: '⬇️',
    fichiers: [
      {
        nom: 'manuel_remote_shell.txt',
        icone: '📄',
        contenu:
          "La clé USB doit être branchée sur une session ouverte.\nConnexion valide : nom de famille suivi de la première lettre du prénom.",
      },
    ],
  },
  {
    id: 'bureau',
    nom: 'Bureau',
    icone: '🖥️',
    fichiers: [
      {
        nom: 'Pense-bête.txt',
        icone: '📝',
        contenu:
          "SÉANCE COMPTA\nUtilisateur : MorinM\nMot de passe : vérifier dans le gestionnaire de mots de passe.",
      },
    ],
  },
  {
    id: 'corbeille',
    nom: 'Corbeille',
    icone: '🗑️',
    fichiers: [],
  },
]

export const documentsPoubelle: DocumentPoubelle[] = [
  {
    id: 'note-licenciement',
    nom: 'Note interne – dossier David Ecnasiol.pdf',
    utile: true,
    contenu:
      'Note confidentielle : décision de licenciement validée avant la publication de la startup Aérofourneau Consulting.',
  },
  {
    id: 'rapport-fournisseurs',
    nom: 'Rapport fournisseurs.pdf',
    utile: false,
    contenu: 'Inventaire mensuel des fournisseurs et factures de l’écurie.',
  },
  {
    id: 'planning-course',
    nom: 'Planning de course.docx',
    utile: false,
    contenu: 'Planning des essais et participation aux prochaines courses.',
  },
]
