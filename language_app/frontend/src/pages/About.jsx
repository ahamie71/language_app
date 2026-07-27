import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Target, Heart, Zap, Users, Languages, Globe2, Briefcase, Code2, Brain, Palette, Terminal } from 'lucide-react'

const VALUES = [
  {
    icon: Target,
    title: 'Notre mission',
    desc: "Rendre l'apprentissage des langues accessible à tous, gratuitement, grâce à la puissance de l'intelligence artificielle.",
    color: 'bg-violet-100',
    iconColor: 'text-violet-600',
    accent: 'from-violet-500 to-purple-600',
  },
  {
    icon: Heart,
    title: 'Notre philosophie',
    desc: "Apprendre une langue, c'est s'ouvrir au monde. Lingua est conçu pour que chaque échange soit une vraie expérience humaine, pas un exercice mécanique.",
    color: 'bg-rose-100',
    iconColor: 'text-rose-600',
    accent: 'from-rose-500 to-pink-600',
  },
  {
    icon: Zap,
    title: 'Notre technologie',
    desc: "Nous utilisons les modèles d'IA les plus avancés pour offrir des corrections instantanées, des conversations naturelles et un suivi personnalisé.",
    color: 'bg-amber-100',
    iconColor: 'text-amber-600',
    accent: 'from-amber-500 to-orange-500',
  },
  {
    icon: Users,
    title: 'Notre communauté',
    desc: "Plus de 10 000 apprenants actifs dans le monde. Une communauté bienveillante qui progresse ensemble, langue après langue.",
    color: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    accent: 'from-emerald-500 to-teal-500',
  },
]

const TEAM = [
  { name: 'Sophie Martin',  role: 'Co-fondatrice & CEO',        icon: Briefcase },
  { name: 'Lucas Bernard',  role: 'Co-fondateur & CTO',         icon: Code2 },
  { name: 'Amina Khalil',   role: 'Responsable IA & NLP',       icon: Brain },
  { name: 'Thomas Durand',  role: 'Designer UX/UI',             icon: Palette },
  { name: 'Yuki Tanaka',    role: 'Ingénieure linguistique',    icon: Languages },
  { name: 'Rayan Oussama',  role: 'Développeur fullstack',      icon: Terminal },
]

export default function About() {
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
      <section className="bg-gradient-to-b from-white to-slate-50 py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <Globe2 size={56} className="text-duo-green mx-auto mb-6" />
          <h1 className="text-4xl font-black text-duo-text mb-4">
            À propos de <span className="text-duo-green">Lingua</span>
          </h1>
          <p className="text-duo-muted font-semibold text-lg leading-relaxed">
            Lingua est né d'une idée simple : tout le monde mérite d'apprendre une langue, sans barrière financière, sans méthode ennuyeuse. L'IA nous permet enfin de tenir cette promesse.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-duo-green py-10">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-3 gap-4 text-center text-duo-black">
          {[['2023', 'Année de création'], ['10K+', 'Apprenants actifs'], ['9', 'Langues disponibles']].map(([n, l]) => (
            <div key={l}>
              <div className="text-3xl md:text-4xl font-black">{n}</div>
              <div className="text-sm font-bold opacity-80 mt-1">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-4 max-w-5xl mx-auto">
        <h2 className="text-3xl font-black text-duo-text text-center mb-12">Ce qui nous anime</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {VALUES.map((v, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className={`h-1.5 bg-gradient-to-r ${v.accent}`} />
              <div className="p-6 flex gap-4">
                <div className={`w-12 h-12 rounded-xl ${v.color} flex items-center justify-center shrink-0`}>
                  <v.icon size={22} className={v.iconColor} />
                </div>
                <div>
                  <h3 className="font-extrabold text-duo-text mb-1">{v.title}</h3>
                  <p className="text-duo-muted text-sm font-semibold leading-relaxed">{v.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Story */}
      <section className="bg-slate-50 py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-black text-duo-text text-center mb-10">Notre histoire</h2>
          <div className="space-y-6 text-duo-muted font-semibold text-base leading-relaxed">
            <p>
              Lingua est né en 2023 à Paris, dans un appartement partagé entre deux passionnés de langues et de technologie. Sophie et Lucas avaient tous les deux vécu l'expérience frustrante d'apprendre une langue avec des applications qui semblaient faites pour des robots.
            </p>
            <p>
              Leur idée : et si l'IA pouvait remplacer le prof particulier ? Pas pour imiter la relation humaine, mais pour offrir quelque chose d'unique — un interlocuteur disponible 24h/24, infiniment patient, capable d'adapter chaque réponse au niveau exact de l'apprenant.
            </p>
            <p>
              Quelques mois plus tard, Lingua voyait le jour. Aujourd'hui, plus de 10 000 personnes l'utilisent chaque jour pour progresser en anglais, espagnol, allemand, arabe et bien d'autres langues.
            </p>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 px-4 max-w-5xl mx-auto">
        <h2 className="text-3xl font-black text-duo-text text-center mb-12">L'équipe</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {TEAM.map(member => (
            <div key={member.name} className="text-center duo-card hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-full bg-duo-green-bg flex items-center justify-center mx-auto mb-3">
                <member.icon size={24} className="text-duo-green" />
              </div>
              <h3 className="font-extrabold text-duo-text text-sm">{member.name}</h3>
              <p className="text-duo-muted text-xs font-semibold mt-1">{member.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-duo-green py-16 px-4 text-center text-duo-black">
        <h2 className="text-2xl font-black mb-3">Rejoignez l'aventure</h2>
        <p className="font-semibold opacity-80 mb-6">Commencez à apprendre gratuitement dès aujourd'hui.</p>
        <button onClick={() => navigate('/')}
          className="bg-duo-black text-duo-green font-extrabold px-10 py-3 rounded-duo-sm hover:bg-gray-900 transition-colors text-sm">
          COMMENCER GRATUITEMENT
        </button>
      </section>

      {/* Footer minimal */}
      <footer className="bg-white border-t-2 border-duo-border py-6 px-4 text-center">
        <p className="text-duo-muted text-xs font-bold">© 2025 Lingua. Tous droits réservés.</p>
      </footer>
    </div>
  )
}
