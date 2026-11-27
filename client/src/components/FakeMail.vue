<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import '@/styles/style_google.css'
import {
  DELAI_REPONSE_MS,
  EMAIL_DAVID,
  EMAIL_JOUEURS,
  documentsPoubelle,
} from '@/data/scenario'

const emit = defineEmits<{ close: []; badgeObtenu: [] }>()

type Message = {
  id: number
  de: string
  a: string
  objet: string
  corps: string
  heure: string
  pieceJointe?: string
  envoye: boolean
}

const messages = ref<Message[]>([])
const selection = ref<number | null>(null)
const composition = ref(false)
const enAttente = ref(false)
const erreur = ref('')
const badgeAccorde = ref(false)
let prochainId = 1
const minuteurs: number[] = []

const brouillon = ref({ a: '', objet: '', corps: '', pieceJointe: '' })

const heure = () =>
  new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

const normaliser = (t: string) =>
  t.toLocaleLowerCase('fr-FR').normalize('NFD').replace(/\p{Diacritic}/gu, '')

const recus = computed(() => messages.value.filter((m) => !m.envoye))
const envoyes = computed(() => messages.value.filter((m) => m.envoye))
const dossier = ref<'recus' | 'envoyes'>('recus')
const liste = computed(() => (dossier.value === 'recus' ? recus.value : envoyes.value))
const messageOuvert = computed(() => messages.value.find((m) => m.id === selection.value))

const nomDocument = (id?: string) => documentsPoubelle.find((d) => d.id === id)?.nom

const ajouter = (m: Omit<Message, 'id' | 'heure'>) => {
  const message = { ...m, id: prochainId++, heure: heure() }
  messages.value.push(message)
  return message
}

ajouter({
  de: EMAIL_DAVID,
  a: EMAIL_JOUEURS,
  objet: 'Demande de coopération',
  corps: "Bonjour,\n\nJe suis David Ecnasiol. Je peux vous aider en échange d'une pièce utile à mon procès.\n\nDavid",
  envoye: false,
})
selection.value = 1

const repondreDavid = (objet: string, corps: string) => {
  enAttente.value = true
  minuteurs.push(
    window.setTimeout(() => {
      ajouter({ de: EMAIL_DAVID, a: EMAIL_JOUEURS, objet: `Re: ${objet}`, corps, envoye: false })
      enAttente.value = false
    }, DELAI_REPONSE_MS),
  )
}

const MOTS_DECLENCHEURS = ['badge', 'document', 'proces', 'prud', 'licenci', 'aide', 'piece']

const envoyer = () => {
  erreur.value = ''
  const b = brouillon.value
  if (!b.a.trim() || !b.corps.trim()) {
    erreur.value = 'Renseignez un destinataire et un message.'
    return
  }

  ajouter({
    de: EMAIL_JOUEURS,
    a: b.a.trim(),
    objet: b.objet || '(sans objet)',
    corps: b.corps,
    pieceJointe: b.pieceJointe || undefined,
    envoye: true,
  })

  const objet = b.objet || '(sans objet)'
  const versDavid = normaliser(b.a).includes(normaliser(EMAIL_DAVID))
  const texte = normaliser(`${b.objet} ${b.corps}`)

  if (!versDavid) {
    // Mauvaise adresse : message d'erreur automatique
    minuteurs.push(
      window.setTimeout(() => {
        ajouter({
          de: 'mailer-daemon@google.fake',
          a: EMAIL_JOUEURS,
          objet: 'Échec de distribution',
          corps: `Votre message n'a pas pu être remis à ${b.a}. Vérifiez l'adresse du destinataire.`,
          envoye: false,
        })
      }, 1500),
    )
  } else if (b.pieceJointe) {
    const doc = documentsPoubelle.find((d) => d.id === b.pieceJointe)
    if (doc?.utile) {
      if (!badgeAccorde.value) {
        badgeAccorde.value = true
        emit('badgeObtenu')
      }
      repondreDavid(
        objet,
        `Bonjour,\n\nC'est exactement la pièce qu'il me manquait, merci ! Cela change tout pour mon dossier.\n\nComme promis, mon ancien badge est dans la petite boîte à l'extérieur des locaux, près de l'entrée de service. Elle ne s'ouvre pas facilement : la porte magnétique ne cède que si l'alimentation est coupée. Bonne chance.\n\nDavid`,
      )
    } else {
      repondreDavid(
        objet,
        `Bonjour,\n\nMerci, mais ce document ne m'est d'aucune utilité pour mon procès. Je cherche une pièce interne prouvant que la décision de me licencier était déjà prise.\n\nDavid`,
      )
    }
  } else if (MOTS_DECLENCHEURS.some((mot) => texte.includes(mot))) {
    repondreDavid(
      objet,
      `Bonjour,\n\nOui, je peux vous confier mon ancien badge d'accès. En échange, j'ai besoin d'un document : une note interne de l'ancien employeur prouvant que mon licenciement était décidé d'avance. Je pense qu'elle a pu finir à la poubelle, à l'extérieur des bureaux.\n\nSi vous la retrouvez, renvoyez-la moi en pièce jointe.\n\nDavid`,
    )
  } else {
    repondreDavid(
      objet,
      `Bonjour,\n\nJe ne vois pas bien ce que vous me voulez. Pouvez-vous préciser l'objet de votre demande ?\n\nDavid`,
    )
  }

  brouillon.value = { a: '', objet: '', corps: '', pieceJointe: '' }
  composition.value = false
  dossier.value = 'envoyes'
}

const nouveau = () => {
  composition.value = true
  selection.value = null
}

const ouvrir = (m: Message) => {
  selection.value = m.id
  composition.value = false
}

onUnmounted(() => minuteurs.forEach((m) => window.clearTimeout(m)))
</script>

<template>
  <div class="browser-window browser-window--maximized">
    <div class="browser-tabs">
      <button class="browser-tab browser-tab--active" type="button" @click="emit('close')">
        <span class="browser-tab__logo">✉</span>
        <span>Courrier</span>
        <span class="browser-tab__close" aria-hidden="true">×</span>
      </button>
      <div class="browser-window__controls">
        <button type="button" aria-label="Fermer" @click="emit('close')">×</button>
      </div>
    </div>

    <div class="mail-app">
      <aside class="mail-app__side">
        <button class="mail-app__new" type="button" @click="nouveau">✏️ Nouveau message</button>
        <button type="button" :class="{ active: dossier === 'recus' }" @click="dossier = 'recus'">
          📥 Réception ({{ recus.length }})
        </button>
        <button type="button" :class="{ active: dossier === 'envoyes' }" @click="dossier = 'envoyes'">
          📤 Envoyés ({{ envoyes.length }})
        </button>
        <p class="mail-app__account">{{ EMAIL_JOUEURS }}</p>
      </aside>

      <section class="mail-app__list">
        <p v-if="liste.length === 0" class="mail-app__empty">Aucun message.</p>
        <button
          v-for="m in liste"
          :key="m.id"
          type="button"
          class="mail-app__row"
          :class="{ active: selection === m.id }"
          @click="ouvrir(m)"
        >
          <strong>{{ dossier === 'recus' ? m.de : m.a }}</strong>
          <span>{{ m.objet }}</span>
          <small>{{ m.heure }}</small>
        </button>
        <p v-if="enAttente" class="mail-app__empty">⏳ Un nouveau message est en cours d'arrivée…</p>
      </section>

      <section class="mail-app__reader">
        <form v-if="composition" class="mail-app__compose" @submit.prevent="envoyer">
          <label>À <input v-model="brouillon.a" type="email" placeholder="destinataire@exemple.fr" /></label>
          <label>Objet <input v-model="brouillon.objet" type="text" /></label>
          <label>
            Pièce jointe
            <select v-model="brouillon.pieceJointe">
              <option value="">Aucune</option>
              <option v-for="d in documentsPoubelle" :key="d.id" :value="d.id">{{ d.nom }}</option>
            </select>
          </label>
          <textarea v-model="brouillon.corps" rows="10" placeholder="Votre message…"></textarea>
          <p v-if="erreur" class="mail-app__error">{{ erreur }}</p>
          <button type="submit">Envoyer</button>
        </form>

        <article v-else-if="messageOuvert" class="mail-app__message">
          <h2>{{ messageOuvert.objet }}</h2>
          <p><strong>De :</strong> {{ messageOuvert.de }} — <strong>À :</strong> {{ messageOuvert.a }}</p>
          <p v-if="messageOuvert.pieceJointe">📎 {{ nomDocument(messageOuvert.pieceJointe) }}</p>
          <pre>{{ messageOuvert.corps }}</pre>
        </article>

        <p v-else class="mail-app__empty">Sélectionnez un message ou écrivez-en un nouveau.</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.mail-app {
  display: grid;
  grid-template-columns: 200px 300px 1fr;
  height: calc(100% - 80px);
  background: #fff;
  color: #202124;
  font-family: Arial, sans-serif;
}
.mail-app__side { display: flex; flex-direction: column; gap: 4px; padding: 12px; border-right: 1px solid #e0e0e0; }
.mail-app__side button { text-align: left; padding: 8px 10px; border: 0; border-radius: 16px; background: transparent; cursor: pointer; }
.mail-app__side button.active { background: #d3e3fd; font-weight: 600; }
.mail-app__new { background: #c2e7ff !important; font-weight: 600; margin-bottom: 8px; }
.mail-app__account { margin-top: auto; font-size: 12px; color: #5f6368; }
.mail-app__list { border-right: 1px solid #e0e0e0; overflow: auto; }
.mail-app__row { display: flex; flex-direction: column; width: 100%; padding: 10px 12px; border: 0; border-bottom: 1px solid #eee; background: #fff; text-align: left; cursor: pointer; gap: 2px; }
.mail-app__row.active, .mail-app__row:hover { background: #f2f6fc; }
.mail-app__row small { color: #5f6368; }
.mail-app__reader { padding: 16px 24px; overflow: auto; }
.mail-app__message pre { white-space: pre-wrap; font-family: inherit; line-height: 1.5; }
.mail-app__compose { display: flex; flex-direction: column; gap: 10px; }
.mail-app__compose label { display: flex; gap: 8px; align-items: center; }
.mail-app__compose input, .mail-app__compose select { flex: 1; padding: 6px; }
.mail-app__compose textarea { padding: 8px; font-family: inherit; }
.mail-app__compose button { align-self: flex-start; padding: 8px 20px; border: 0; border-radius: 16px; background: #0b57d0; color: #fff; cursor: pointer; }
.mail-app__empty { padding: 12px; color: #5f6368; }
.mail-app__error { color: #b3261e; }
</style>
