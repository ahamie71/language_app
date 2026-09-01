import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { NAV_ITEMS } from '../constants/nav'

/** Barre de navigation mobile — cachée à partir de md, remplacée par TopNav. */
export default function BottomNav({ active }) {
  const { t } = useTranslation('common')
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-duo-black z-30">
      <div className="max-w-lg mx-auto flex items-center justify-around px-1 py-2">
        {NAV_ITEMS.map(item => {
          const isActive = item.id === active
          return (
            <Link key={item.id} to={item.href}
              className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all ${
                isActive ? 'text-duo-green' : 'text-gray-500 hover:text-gray-300'
              }`}>
              <item.icon size={21} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-xs font-extrabold uppercase tracking-wide ${isActive ? 'text-duo-green' : ''}`}>
                {t(`nav.${item.id}`)}
              </span>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-duo-green mt-0.5" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
