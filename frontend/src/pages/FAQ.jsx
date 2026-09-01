import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronDown, Languages } from 'lucide-react'

const FAQS = [
  {
    category: 'Général',
    items: [
      {
        q: "Lingua est-il vraiment gratuit ?",
        a: "Oui, totalement. Lingua est gratuit pour tous les apprenants. Pas d'abonnement caché, pas de limite artificielle. Notre mission est de rendre l'apprentissage des langues accessible à tous.",
      },
      {
        q: "Quelles langues sont disponibles ?",
        a: "Lingua propose actuellement 9 langues : anglais, espagnol, allemand, arabe, italien, portugais, chinois, japonais et français. De nouvelles langues sont régulièrement ajoutées.",
      },
      {
        q: "Dois-je créer un compte pour utiliser Lingua ?",
        a: "Oui, un compte gratuit est nécessaire pour accéder aux conversations IA, sauvegarder votre vocabulaire et suivre votre progression.",
      },
    ],
  },
  {
    category: "L'IA",
    items: [
      {
        q: "Comment fonctionne le coach IA ?",
        a: "Le coach IA utilise un modèle de langage avancé. Vous lui parlez dans votre langue maternelle (le français), et il vous répond dans la langue que vous apprenez, tout en corrigeant vos erreurs et en expliquant les points de grammaire.",
      },
      {
        q: "L'IA s'adapte-t-elle à mon niveau ?",
        a: "Absolument. L'IA tient compte de votre niveau déclaré (débutant, intermédiaire, avancé) et ajuste automatiquement sa complexité au fil de vos échanges.",
      },
      {
        q: "Les corrections sont-elles fiables ?",
        a: "Les corrections sont générées par des modèles d'IA de haute qualité et sont très fiables pour les erreurs courantes de grammaire, conjugaison et vocabulaire. Comme tout outil automatisé, une erreur occasionnelle reste possible.",
      },
      {
        q: "Mes conversations sont-elles privées ?",
        a: "Vos conversations sont stockées de manière sécurisée et utilisées uniquement pour améliorer votre expérience personnelle. Nous ne partageons pas vos données avec des tiers.",
      },
    ],
  },
  {
    category: 'Vocabulaire & Progression',
    items: [
      {
        q: "Comment fonctionne le vocabulaire automatique ?",
        a: "À chaque conversation, l'IA détecte les mots nouveaux ou difficiles et les ajoute automatiquement à votre carnet de vocabulaire personnel, avec traduction et contexte d'utilisation.",
      },
      {
        q: "Que signifient le streak et les XP ?",
        a: "Le streak est le nombre de jours consécutifs où vous avez pratiqué. Les XP (points d'expérience) sont gagnés à chaque conversation et permettent de mesurer votre progression globale.",
      },
      {
        q: "Puis-je consulter mon vocabulaire hors ligne ?",
        a: "La version actuelle nécessite une connexion internet. Une version hors ligne est prévue dans une prochaine mise à jour.",
      },
    ],
  },
  {
    category: 'Compte & Technique',
    items: [
      {
        q: "Comment modifier mon profil ou changer de langue cible ?",
        a: "Rendez-vous dans votre profil (icône en bas de l'application) puis appuyez sur Modifier le profil. Vous pouvez y changer votre langue cible, votre niveau et vos informations personnelles.",
      },
      {
        q: "L'application est-elle disponible sur mobile ?",
        a: "Lingua fonctionne parfaitement depuis un navigateur mobile. Des applications iOS et Android natives sont en cours de développement.",
      },
      {
        q: "Comment contacter le support ?",
        a: "Envoyez-nous un message à support@lingua.app. Nous répondons généralement sous 24 heures.",
      },
    ],
  },
]

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left gap-4 group">
        <span className="font-extrabold text-duo-text text-sm group-hover:text-duo-green transition-colors">
          {q}
        </span>
        <ChevronDown
          size={18}
          className={`text-duo-muted shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <p className="text-duo-muted font-semibold text-sm leading-relaxed pb-4">
          {a}
        </p>
      )}
    </div>
  )
}

export default function FAQ() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen font-duo bg-white">

      {/* Navbar */}
      <header className="bg-white border-b-2 border-duo-border sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4">
          <button onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-duo-gray transition-colors text-duo-muted hover:text-duo-text">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <Languages size={26} className="text-duo-green" />
            <span className="text-xl font-black text-duo-green">Lingua</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-white to-slate-50 py-16 px-4 text-center">
        <div className="max-w-xl mx-auto">
          <h1 className="text-4xl font-black text-duo-text mb-3">Questions fréquentes</h1>
          <p className="text-duo-muted font-semibold text-lg">
            Tout ce que vous devez savoir sur Lingua et son fonctionnement.
          </p>
        </div>
      </section>

      {/* FAQ content */}
      <section className="py-12 px-4 max-w-3xl mx-auto">
        <div className="space-y-10">
          {FAQS.map(section => (
            <div key={section.category}>
              <h2 className="text-xs font-extrabold text-duo-muted uppercase tracking-widest mb-4 border-b-2 border-duo-border pb-2">
                {section.category}
              </h2>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6">
                {section.items.map(item => (
                  <FAQItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-14 text-center bg-duo-green-bg border-2 border-green-200 rounded-2xl p-8">
          <p className="font-extrabold text-duo-text text-lg mb-2">Vous n'avez pas trouvé votre réponse ?</p>
          <p className="text-duo-muted font-semibold text-sm mb-5">Notre équipe est disponible pour vous aider.</p>
          <a href="mailto:support@lingua.app"
            className="duo-btn duo-btn-green text-sm px-8 py-3 inline-block">
            CONTACTER LE SUPPORT
          </a>
        </div>
      </section>

      {/* Footer minimal */}
      <footer className="bg-white border-t-2 border-duo-border py-6 px-4 text-center mt-10">
        <p className="text-duo-muted text-xs font-bold">© 2025 Lingua. Tous droits réservés.</p>
      </footer>
    </div>
  )
}
