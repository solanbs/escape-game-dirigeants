export type SiteId =
  | 'porte-fonctionnement'
  | 'porte-pannes'
  | 'porte-installation'
  | 'porte-boite-depot'
  | 'proces-officiel'
  | 'proces-journal'
  | 'proces-archives'
  | 'startup-officiel'
  | 'startup-linkedin'
  | 'startup-actualite'
  | 'alarme-entreprise'
  | 'alarme-avis'
  | 'alarme-forum'

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
  'proces-officiel': {
    domaine: 'justice-officielle.fake',
    rubrique: 'Site officiel',
    titre: 'Dossier public du tribunal',
    introduction: 'Calendrier fictif de l’affaire opposant deux entreprises.',
    points: ['Audience préparatoire : 12 mars', 'Témoin principal : John Due', 'Pièce consultable : rapport financier'],
  },
  'proces-journal': {
    domaine: 'journal-du-soir.fake',
    rubrique: 'Enquête',
    titre: 'Le procès qui intrigue le secteur',
    introduction: 'Un article fictif rassemble les événements importants de l’affaire.',
    points: ['Le conflit a commencé après une fusion', 'Plusieurs dirigeants sont entendus', 'La prochaine audience est annoncée'],
  },
  'proces-archives': {
    domaine: 'archives-juridiques.fake',
    rubrique: 'Archives',
    titre: 'Historique judiciaire de l’entreprise',
    introduction: 'Cette archive fictive permet de recouper les dates et les noms.',
    points: ['Dossier 2019-A', 'Dossier 2022-C', 'Dossier actuel : affaire des dirigeants'],
  },
  'startup-officiel': {
    domaine: 'nova-startup.fake',
    rubrique: 'Site officiel',
    titre: 'Nova Startup — notre histoire',
    introduction: 'Présentation fictive de la start-up et de ses fondateurs.',
    points: ['Fondée par John Due', 'Spécialisée dans les objets connectés', 'Siège situé à Bordeaux'],
  },
  'startup-linkedin': {
    domaine: 'reseau-pro.fake',
    rubrique: 'Réseau professionnel',
    titre: 'Nova Startup et ses employés',
    introduction: 'Une page fictive de réseau professionnel rassemble les profils clés.',
    points: ['John Due — direction', 'Maya Martin — opérations', 'Léo Bernard — ingénierie'],
  },
  'startup-actualite': {
    domaine: 'tech-actualites.fake',
    rubrique: 'Actualités',
    titre: 'La start-up qui veut changer son secteur',
    introduction: 'Un article fictif évoque les projets et partenaires de l’entreprise.',
    points: ['Nouveau laboratoire', 'Partenariat avec un fabricant', 'Lancement prévu cet automne'],
  },
  'alarme-entreprise': {
    domaine: 'supersecure.com',
    rubrique: 'SuperSecure · Protection professionnelle',
    titre: 'SuperSecure protège votre entreprise 24h/24',
    introduction: 'SuperSecure accompagne les entreprises avec des solutions de télésurveillance, d’alarme et d’intervention adaptées à chaque site.',
    points: ['Accueil principal', 'Salle des archives', 'Panneau de contrôle de l’escape game'],
  },
  'alarme-avis': {
    domaine: 'avis-locaux.fake',
    rubrique: 'Avis',
    titre: 'Les visiteurs parlent de la sécurité',
    introduction: 'Des avis fictifs donnent des indices sur les habitudes du bâtiment.',
    points: ['Le lecteur est près de l’accueil', 'Le voyant est visible depuis le couloir', 'Les interventions sont consignées'],
  },
  'alarme-forum': {
    domaine: 'forum-batiment.fake',
    rubrique: 'Forum · Discussion',
    titre: 'Le code de test du scénario',
    introduction: 'Un message fictif mentionne un code utilisable uniquement dans le jeu.',
    points: ['Code de scénario : LUMIERE-42', 'Ce code ne correspond à aucun système réel', 'À saisir uniquement dans le panneau de l’escape game'],
  },
}