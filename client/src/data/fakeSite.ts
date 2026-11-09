export type SiteId =
  | 'porte-fonctionnement'
  | 'porte-pannes'
  | 'porte-installation'
  | 'porte-boite-depot'
  | 'alarme-supersecure'
  | 'alarme-annonce-occasion'
  | 'alarme-guide-demarrage'
  | 'alarme-forum-entraide'
  | 'alarme-leurre-codes'
  | 'alarme-archives-notices'

export type FakeSiteData = {
  domaine: string
  rubrique: string
  titre: string
  introduction: string
  points: string[]
}

export const sites: Record<SiteId, FakeSiteData> = {
  'porte-fonctionnement': {
    domaine: 'science-mag.fake',
    rubrique: 'Technologie & Physique',
    titre: 'Comment ça marche ? Les portes magnétiques',
    introduction: 'Un article de vulgarisation expliquant le principe d’un électro-aimant.',
    points: ['L’électricité active le verrou', 'La coupure de courant libère la porte', 'Le principe de Sécurité Positive'],
  },
  'porte-pannes': {
    domaine: 'blog-technique.fake',
    rubrique: 'Diagnostic fictif',
    titre: 'Pannes de contrôle d’accès',
    introduction: 'Un guide fictif pour observer les indices d’une panne dans le scénario.',
    points: ['Le rôle du voyant', 'L’alimentation simulée', 'Le journal de maintenance'],
  },
  'porte-installation': {
    domaine: 'guide-installation.fake',
    rubrique: 'Documentation fabricant · Simulation',
    titre: 'Installer un contrôle d’accès',
    introduction: 'Une page leurre fictive présentant une installation sans détail exploitable.',
    points: ['Identifier les composants', 'Respecter les consignes du responsable', 'Tester dans l’interface du jeu'],
  },
  'porte-boite-depot': {
    domaine: 'carnet-maintenance.fake',
    rubrique: 'Notice de scénario',
    titre: 'Notice de la boîte de dépôt',
    introduction: 'Une notice fictive mentionne une alimentation et un voyant à recouper.',
    points: ['Observer le voyant', 'Repérer l’alimentation sur le schéma', 'Simuler une coupure dans le jeu'],
  },
  'alarme-supersecure': {
    domaine: 'supersecure.fr',
    rubrique: 'Site officiel',
    titre: 'SuperSecure : La référence de l\'alarme professionnelle',
    introduction: 'Systèmes de sécurité haute performance avec intervention sur site.',
    points: ['Télésurveillance 24/7', 'Intervention en 15 minutes', 'Rappel : changez votre code d\'usine'],
  },
  'alarme-annonce-occasion': {
    domaine: 'leboncoin.fr',
    rubrique: 'Petites annonces',
    titre: 'Vends Centrale SuperSecure V2 - Très bon état',
    introduction: 'Annonce de vente d\'un boîtier d\'alarme d\'occasion.',
    points: ['Marque SuperSecure bien visible', 'Modèle V2', 'Vendu sans la notice papier'],
  },
  'alarme-guide-demarrage': {
    domaine: 'support.supersecure.fr',
    rubrique: 'Centre d\'aide',
    titre: 'Première mise en service de votre alarme',
    introduction: 'Guide pour faire l\'installation de votre nouvelle alarme.',
    points: ['Regarder l’étiquette sous le boîtier', 'Comparer la référence du modèle', 'Consulter la notice d’archive correspondante'],
  },
  'alarme-forum-entraide': {
    domaine: 'brico-forum.fr',
    rubrique: 'Forum de discussion',
    titre: 'Code usine SuperSecure V2 perdu !',
    introduction: 'Discussion entre utilisateurs cherchant à réinitialiser le mot de passe d\'une ancienne centrale.',
    points: ['Les codes génériques (0000, 1234) ne fonctionnent pas sur ce modèle', 'La sécurité de la version V2 nécessite un code spécifique', 'Un membre conseille de rechercher les anciens manuels d\'installation numérisés'],
  },
  'alarme-leurre-codes': {
    domaine: 'astuces-secu-maison.com',
    rubrique: 'Blog Sécurité',
    titre: 'Les 10 codes d\'alarme les plus courants à éviter',
    introduction: 'Article de prévention listant les mots de passe par défaut les plus utilisés par les fabricants et les utilisateurs.',
    points: ['1234, souvent utilisé par défaut par les installateurs', '2580 (colonne centrale du clavier)', '0000 (Fréquent sur les vieux modèles d\'entrée de gamme)'],
  },
  'alarme-archives-notices': {
    domaine: 'notices-pdf-archives.com',
    rubrique: 'Base de données',
    titre: 'Archive technique : SuperSecure Gamme 2019',
    introduction: 'Répertoire web en accès libre archivant d\'anciennes documentations et manuels numérisés.',
    points: ['Notice d’installation complète au format texte', 'Instructions de premier démarrage de la série V2', 'Mémo de configuration contenant le code usine d\'origine'],
  },
}