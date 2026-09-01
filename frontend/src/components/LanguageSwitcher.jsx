import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'
import { setSiteLanguage } from '../i18n'

const SITE_LANGUAGES = [
  { code: 'fr', flagCode: 'fr' },
  { code: 'en', flagCode: 'gb' },
]

/** Change la langue de l'interface (pas la langue apprise) — menu déroulant
 * réutilisé dans le header/footer de la landing et dans TopNav. */
export default function LanguageSwitcher({ className = '' }) {
  const { t, i18n } = useTranslation('common')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const onClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const current = SITE_LANGUAGES.find(l => l.code === i18n.language) || SITE_LANGUAGES[0]

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-duo-muted hover:text-duo-text transition-colors">
        <span className={`fi fi-${current.flagCode} rounded-[2px]`} style={{ fontSize: '1.1em' }} />
        {t('language.site')} : {t(`language.${current.code}`)}
        <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 bg-white border-2 border-duo-border rounded-2xl shadow-lg overflow-hidden z-50 min-w-[160px]">
          {SITE_LANGUAGES.map(l => (
            <button key={l.code}
              onClick={() => { setSiteLanguage(l.code); setOpen(false) }}
              className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-left transition-colors ${
                l.code === current.code ? 'bg-duo-green-bg text-duo-green-d' : 'text-duo-text hover:bg-duo-gray'
              }`}>
              <span className={`fi fi-${l.flagCode} rounded-[2px]`} style={{ fontSize: '1.1em' }} />
              {t(`language.${l.code}`)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
