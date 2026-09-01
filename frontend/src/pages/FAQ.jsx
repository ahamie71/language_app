import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ChevronDown, Languages } from 'lucide-react'

const FAQS = [
  { key: 'general',     items: ['free', 'languages', 'account'] },
  { key: 'ai',           items: ['howItWorks', 'adaptsLevel', 'correctionsReliable', 'privacy'] },
  { key: 'vocabulary',   items: ['autoVocabulary', 'streakXp', 'offline'] },
  { key: 'accountTech',  items: ['editProfile', 'mobileApp', 'contactSupport'] },
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
  const { t } = useTranslation('faq')

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
          <h1 className="text-4xl font-black text-duo-text mb-3">{t('hero.title')}</h1>
          <p className="text-duo-muted font-semibold text-lg">
            {t('hero.subtitle')}
          </p>
        </div>
      </section>

      {/* FAQ content */}
      <section className="py-12 px-4 max-w-3xl mx-auto">
        <div className="space-y-10">
          {FAQS.map(section => (
            <div key={section.key}>
              <h2 className="text-xs font-extrabold text-duo-muted uppercase tracking-widest mb-4 border-b-2 border-duo-border pb-2">
                {t(`categories.${section.key}`)}
              </h2>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6">
                {section.items.map(itemKey => (
                  <FAQItem key={itemKey}
                    q={t(`questions.${section.key}.${itemKey}.q`)}
                    a={t(`questions.${section.key}.${itemKey}.a`)} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-14 text-center bg-duo-green-bg border-2 border-green-200 rounded-2xl p-8">
          <p className="font-extrabold text-duo-text text-lg mb-2">{t('contact.heading')}</p>
          <p className="text-duo-muted font-semibold text-sm mb-5">{t('contact.text')}</p>
          <a href="mailto:support@lingua.app"
            className="duo-btn duo-btn-green text-sm px-8 py-3 inline-block">
            {t('contact.button')}
          </a>
        </div>
      </section>

      {/* Footer minimal */}
      <footer className="bg-white border-t-2 border-duo-border py-6 px-4 text-center mt-10">
        <p className="text-duo-muted text-xs font-bold">{t('footer.copyright')}</p>
      </footer>
    </div>
  )
}
