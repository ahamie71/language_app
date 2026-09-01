import { Home, BookOpen, User, PenLine, Layers } from 'lucide-react'

// Navigation partagée entre BottomNav (mobile) et TopNav (desktop).
// Le label affiché vient de i18n (common.json, clé nav.<id>), pas d'ici.
export const NAV_ITEMS = [
  { href: '/dashboard',  icon: Home,     id: 'learn'      },
  { href: '/exercises',  icon: PenLine,  id: 'exercises'  },
  { href: '/flashcards', icon: Layers,   id: 'flashcards' },
  { href: '/vocabulary', icon: BookOpen, id: 'vocabulary' },
  { href: '/profile',    icon: User,     id: 'profile'    },
]
