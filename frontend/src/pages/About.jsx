import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Target, Heart, Zap, Users, Languages, Globe2, Briefcase, Code2, Brain, Palette, Terminal } from 'lucide-react'

const VALUES = [
  {
    key: 'mission',
    icon: Target,
    color: 'bg-violet-100',
    iconColor: 'text-violet-600',
    accent: 'from-violet-500 to-purple-600',
  },
  {
    key: 'philosophy',
    icon: Heart,
    color: 'bg-rose-100',
    iconColor: 'text-rose-600',
    accent: 'from-rose-500 to-pink-600',
  },
  {
    key: 'technology',
    icon: Zap,
    color: 'bg-amber-100',
    iconColor: 'text-amber-600',
    accent: 'from-amber-500 to-orange-500',
  },
  {
    key: 'community',
    icon: Users,
    color: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    accent: 'from-emerald-500 to-teal-500',
  },
]

const STATS = [
  { key: 'founded',   value: '2023' },
  { key: 'learners',  value: '10K+' },
  { key: 'languages', value: '9'    },
]

const TEAM = [
  { key: 'sophie', name: 'Sophie Martin',  icon: Briefcase },
  { key: 'lucas',  name: 'Lucas Bernard',  icon: Code2 },
  { key: 'amina',  name: 'Amina Khalil',   icon: Brain },
  { key: 'thomas', name: 'Thomas Durand',  icon: Palette },
  { key: 'yuki',   name: 'Yuki Tanaka',    icon: Languages },
  { key: 'rayan',  name: 'Rayan Oussama',  icon: Terminal },
]

export default function About() {
  const navigate = useNavigate()
  const { t } = useTranslation('about')

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
            {t('hero.titlePrefix')} <span className="text-duo-green">Lingua</span>
          </h1>
          <p className="text-duo-muted font-semibold text-lg leading-relaxed">
            {t('hero.text')}
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-duo-green py-10">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-3 gap-4 text-center text-duo-black">
          {STATS.map(s => (
            <div key={s.key}>
              <div className="text-3xl md:text-4xl font-black">{s.value}</div>
              <div className="text-sm font-bold opacity-80 mt-1">{t(`stats.${s.key}`)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-4 max-w-5xl mx-auto">
        <h2 className="text-3xl font-black text-duo-text text-center mb-12">{t('values.heading')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {VALUES.map((v, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className={`h-1.5 bg-gradient-to-r ${v.accent}`} />
              <div className="p-6 flex gap-4">
                <div className={`w-12 h-12 rounded-xl ${v.color} flex items-center justify-center shrink-0`}>
                  <v.icon size={22} className={v.iconColor} />
                </div>
                <div>
                  <h3 className="font-extrabold text-duo-text mb-1">{t(`values.${v.key}.title`)}</h3>
                  <p className="text-duo-muted text-sm font-semibold leading-relaxed">{t(`values.${v.key}.desc`)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Story */}
      <section className="bg-slate-50 py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-black text-duo-text text-center mb-10">{t('story.heading')}</h2>
          <div className="space-y-6 text-duo-muted font-semibold text-base leading-relaxed">
            <p>
              {t('story.p1')}
            </p>
            <p>
              {t('story.p2')}
            </p>
            <p>
              {t('story.p3')}
            </p>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 px-4 max-w-5xl mx-auto">
        <h2 className="text-3xl font-black text-duo-text text-center mb-12">{t('team.heading')}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {TEAM.map(member => (
            <div key={member.name} className="text-center duo-card hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-full bg-duo-green-bg flex items-center justify-center mx-auto mb-3">
                <member.icon size={24} className="text-duo-green" />
              </div>
              <h3 className="font-extrabold text-duo-text text-sm">{member.name}</h3>
              <p className="text-duo-muted text-xs font-semibold mt-1">{t(`team.roles.${member.key}`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-duo-green py-16 px-4 text-center text-duo-black">
        <h2 className="text-2xl font-black mb-3">{t('cta.heading')}</h2>
        <p className="font-semibold opacity-80 mb-6">{t('cta.text')}</p>
        <button onClick={() => navigate('/')}
          className="bg-duo-black text-duo-green font-extrabold px-10 py-3 rounded-duo-sm hover:bg-gray-900 transition-colors text-sm">
          {t('cta.button')}
        </button>
      </section>

      {/* Footer minimal */}
      <footer className="bg-white border-t-2 border-duo-border py-6 px-4 text-center">
        <p className="text-duo-muted text-xs font-bold">{t('footer.copyright')}</p>
      </footer>
    </div>
  )
}
