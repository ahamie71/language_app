import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'
import { NAV_ITEMS } from '../constants/nav'
import { useAuth } from '../contexts/AuthContext'
import LanguageSwitcher from './LanguageSwitcher'

/** Barre de navigation desktop — cachée sous md, remplacée par BottomNav. */
export default function TopNav({ active }) {
  const { user } = useAuth()
  const { t } = useTranslation('common')

  return (
    <header className="hidden md:block bg-white border-b-2 border-duo-border sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-8">
        <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-duo-green flex items-center justify-center">
            <Languages size={16} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-black text-duo-green tracking-tight">duolingua</span>
        </Link>

        <nav className="flex items-center gap-1 flex-1">
          {NAV_ITEMS.map(item => {
            const isActive = item.id === active
            return (
              <Link key={item.id} to={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-extrabold uppercase tracking-wide transition-colors ${
                  isActive ? 'bg-duo-green-bg text-duo-green-d' : 'text-duo-muted hover:bg-duo-gray hover:text-duo-text'
                }`}>
                <item.icon size={17} strokeWidth={isActive ? 2.5 : 2} />
                {t(`nav.${item.id}`)}
              </Link>
            )
          })}
        </nav>

        <LanguageSwitcher className="shrink-0" />

        <Link to="/profile"
          className="shrink-0 w-9 h-9 rounded-full bg-duo-blue-bg text-duo-blue flex items-center justify-center font-black text-sm hover:opacity-80 transition-opacity">
          {(user?.username || '?').charAt(0).toUpperCase()}
        </Link>
      </div>
    </header>
  )
}
