import { Link, useLocation } from 'react-router-dom'
import { Home, BookOpen, User, PenLine, Layers } from 'lucide-react'

const NAV = [
  { href: '/dashboard',  icon: Home,     label: 'Apprendre',  id: 'learn'      },
  { href: '/exercises',  icon: PenLine,  label: 'Exercices',  id: 'exercises'  },
  { href: '/flashcards', icon: Layers,   label: 'Cartes',     id: 'flashcards' },
  { href: '/vocabulary', icon: BookOpen, label: 'Vocab',      id: 'vocabulary' },
  { href: '/profile',    icon: User,     label: 'Profil',     id: 'profile'    },
]

export default function BottomNav({ active }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-duo-border z-30">
      <div className="max-w-lg mx-auto flex items-center justify-around px-1 py-2">
        {NAV.map(item => {
          const isActive = item.id === active
          return (
            <Link key={item.id} to={item.href}
              className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all ${
                isActive ? 'text-duo-green' : 'text-duo-muted hover:text-duo-text'
              }`}>
              <item.icon size={21} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-xs font-extrabold uppercase tracking-wide ${isActive ? 'text-duo-green' : ''}`}>
                {item.label}
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
